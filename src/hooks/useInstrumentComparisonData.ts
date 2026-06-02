import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useInstrumentFields } from '@/hooks/useInstrumentFields';

// Mantido em sincronia com RelatorioInstrumentosPage.tsx
const DEDICATED_TABLES: Record<string, string> = {
  registro_consultoria_pedagogica: 'consultoria_pedagogica_respostas',
  monitoramento_gestao: 'relatorios_monitoramento_gestao',
  monitoramento_acoes_formativas: 'relatorios_monit_acoes_formativas',
  observacao_aula_redes: 'observacoes_aula_redes',
  visita_tecnica_alfabetizacao_redes: 'relatorios_visita_tecnica_alfabetizacao_redes',
  encontro_microciclos_recomposicao: 'relatorios_microciclos_recomposicao',
  encontro_eteg_redes: 'relatorios_eteg_redes',
  encontro_professor_redes: 'relatorios_professor_redes',
  observacao_aula: 'avaliacoes_aula',
};

const actionTypeAliases = (formType: string) => {
  const aliases = new Set<string>([formType]);
  if (formType === 'observacao_aula') {
    aliases.add('acompanhamento_aula');
    aliases.add('visita');
  }
  return Array.from(aliases);
};

export interface ComparisonPeriod {
  ano: number;
  mes: number; // 1-12
  label: string; // e.g. "Mar/2025"
}

export interface DimensionComparison {
  fieldKey: string;
  label: string;
  dimension: string | null;
  scaleMax: number;
  avgA: number | null;
  countA: number;
  avgB: number | null;
  countB: number;
  delta: number | null; // avgB - avgA
  deltaPct: number | null; // % vs A
}

export interface InstrumentComparisonResult {
  dimensions: DimensionComparison[];
  totalA: number;
  totalB: number;
  scaleMax: number;
}

interface Params {
  programa: string;
  instrumento: string;
  atorId?: string; // 'todos' ou id
  entidadeId?: string; // 'todos' ou escola_id
  periodA: ComparisonPeriod;
  periodB: ComparisonPeriod;
  enabled?: boolean;
}

const isInPeriod = (dateStr: string | null | undefined, p: ComparisonPeriod) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return d.getFullYear() === p.ano && d.getMonth() + 1 === p.mes;
};

export function useInstrumentComparisonData(params: Params) {
  const { programa, instrumento, atorId, entidadeId, periodA, periodB, enabled = true } = params;
  const { fields } = useInstrumentFields(instrumento || undefined);

  const ratingFields = (fields || []).filter(f => f.field_type === 'rating');
  const fieldKeysSig = ratingFields.map(f => f.field_key).join(',');

  const query = useQuery({
    queryKey: [
      'instrument_comparison',
      programa, instrumento, atorId, entidadeId,
      periodA.ano, periodA.mes, periodB.ano, periodB.mes,
      fieldKeysSig,
    ],
    queryFn: async (): Promise<InstrumentComparisonResult> => {
      const empty: InstrumentComparisonResult = { dimensions: [], totalA: 0, totalB: 0, scaleMax: 5 };
      if (!programa || !instrumento || ratingFields.length === 0) return empty;

      // 1) Registros do programa/instrumento
      let registrosQuery = (supabase as any)
        .from('registros_acao')
        .select('id, data, aap_id, tipo')
        .in('tipo', actionTypeAliases(instrumento))
        .contains('programa', [programa])
        .limit(10000);
      if (atorId && atorId !== 'todos') registrosQuery = registrosQuery.eq('aap_id', atorId);
      const { data: registrosData, error: regErr } = await registrosQuery;
      if (regErr) throw regErr;

      const registros = registrosData || [];
      // 2) Particiona registros por período
      const periodMap = new Map<string, 'A' | 'B'>();
      for (const r of registros) {
        if (isInPeriod(r.data, periodA)) periodMap.set(r.id, 'A');
        else if (isInPeriod(r.data, periodB)) periodMap.set(r.id, 'B');
      }
      const relevantIds = Array.from(periodMap.keys());
      if (relevantIds.length === 0) {
        return { ...empty, scaleMax: ratingFields[0]?.scale_max || 5 };
      }

      // 3) Buscar respostas (tabela dedicada ou instrument_responses)
      const dedicated = DEDICATED_TABLES[instrumento];
      const responsesByRegistro = new Map<string, Record<string, any>>();

      if (dedicated) {
        const cols = ['registro_acao_id', ...ratingFields.map(f => f.field_key)].join(', ');
        const { data, error } = await (supabase as any)
          .from(dedicated)
          .select(cols)
          .in('registro_acao_id', relevantIds);
        if (error) throw error;
        (data || []).forEach((r: any) => {
          if (!responsesByRegistro.has(r.registro_acao_id)) {
            const flat: Record<string, any> = {};
            ratingFields.forEach(f => { flat[f.field_key] = r[f.field_key]; });
            responsesByRegistro.set(r.registro_acao_id, flat);
          }
        });
      } else {
        const { data, error } = await (supabase as any)
          .from('instrument_responses')
          .select('registro_acao_id, responses')
          .eq('form_type', instrumento)
          .in('registro_acao_id', relevantIds);
        if (error) throw error;
        (data || []).forEach((r: any) => {
          if (!responsesByRegistro.has(r.registro_acao_id)) {
            responsesByRegistro.set(r.registro_acao_id, r.responses || {});
          }
        });
      }

      // 4) Calcular médias por dimensão por período
      // Regra: excluir 0 (N/A) salvo em escala REDES (scale_max <= 2)
      let totalA = 0;
      let totalB = 0;
      const dimensions: DimensionComparison[] = ratingFields.map(f => {
        const scaleMax = f.scale_max || 5;
        const includeZero = scaleMax <= 2;
        let sumA = 0, countA = 0, sumB = 0, countB = 0;

        for (const [regId, period] of periodMap.entries()) {
          const resp = responsesByRegistro.get(regId);
          if (!resp) continue;
          const v = resp[f.field_key];
          if (typeof v !== 'number') continue;
          if (!includeZero && v === 0) continue;
          if (period === 'A') { sumA += v; countA++; }
          else { sumB += v; countB++; }
        }

        const avgA = countA > 0 ? Number((sumA / countA).toFixed(2)) : null;
        const avgB = countB > 0 ? Number((sumB / countB).toFixed(2)) : null;
        const delta = avgA !== null && avgB !== null ? Number((avgB - avgA).toFixed(2)) : null;
        const deltaPct = avgA !== null && avgB !== null && avgA !== 0
          ? Number((((avgB - avgA) / avgA) * 100).toFixed(1))
          : null;

        return {
          fieldKey: f.field_key,
          label: f.label,
          dimension: f.dimension,
          scaleMax,
          avgA, countA, avgB, countB, delta, deltaPct,
        };
      });

      // Conta totais (registros com pelo menos uma resposta)
      for (const [regId, period] of periodMap.entries()) {
        if (responsesByRegistro.has(regId)) {
          if (period === 'A') totalA++; else totalB++;
        }
      }

      const scaleMax = ratingFields[0]?.scale_max || 5;
      return { dimensions, totalA, totalB, scaleMax };
    },
    enabled: enabled && !!programa && !!instrumento && ratingFields.length > 0,
  });

  return {
    data: query.data,
    isLoading: query.isLoading || query.isFetching,
    hasRatingFields: ratingFields.length > 0,
  };
}
