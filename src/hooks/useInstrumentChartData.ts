import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getViewableAcoes, ACAO_TYPE_INFO, AcaoTipo } from '@/config/acaoPermissions';
import { INSTRUMENT_FORM_TYPES } from '@/hooks/useInstrumentFields';
import { useAcoesByPrograma } from '@/hooks/useAcoesByPrograma';

export interface DimensionAverage {
  dimension: string;
  fieldKey: string;
  label: string;
  average: number;
  count: number;
  scaleMax: number;
}

export interface InstrumentChartData {
  formType: string;
  formLabel: string;
  dimensions: DimensionAverage[];
  totalResponses: number;
}

// Set of form_types that have instrument fields
const INSTRUMENT_FORM_TYPE_VALUES = new Set<string>(INSTRUMENT_FORM_TYPES.map(t => t.value));

// Form types whose responses live in dedicated tables (not in instrument_responses).
// Rows are flattened to the same shape as instrument_responses so downstream logic is unchanged.
// When the same registro_acao_id exists in both the dedicated table and instrument_responses,
// the dedicated-table row is the canonical source and the instrument_responses row is dropped.
const DEDICATED_TABLES: Record<string, string> = {
  visita_tecnica_tarl: 'relatorios_visita_tecnica_tarl',
  visita_tecnica_alfabetizacao: 'relatorios_visita_tecnica_alfabetizacao',
  observacao_aula_redes: 'observacoes_aula_redes',
  observacao_aula_gpa: 'observacoes_aula_gpa',
  encontro_eteg_redes: 'relatorios_eteg_redes',
  encontro_professor_redes: 'relatorios_professor_redes',
  encontro_microciclos_recomposicao: 'relatorios_microciclos_recomposicao',
  reuniao_acomp_alfabetizacao: 'relatorios_reuniao_acomp_alfabetizacao',
};

// Form types that have a dedicated visualization block in Relatórios — skip them in InstrumentDimensionCharts to avoid duplication
const FORM_TYPES_WITH_DEDICATED_BLOCK = new Set<string>([
  'visita_tecnica_alfabetizacao_redes',
  'visita_tecnica_alfabetizacao',
  'visita_tecnica_tarl',
]);


export function useInstrumentChartData(filters?: {
  programaFilter?: string;
  escolaFilter?: string;
  mesFilter?: number | 'todos';
  anoFilter?: number;
  aapFilter?: string;
  componenteFilter?: string;
  entidadeFilhoEscolaId?: string;
}) {
  const { profile } = useAuth();
  const { getInstrumentFormTypesByPrograma } = useAcoesByPrograma();

  // Determine which instrument types the user can view
  const viewableAcoes = getViewableAcoes(profile?.role);
  let viewableInstrumentTypes = viewableAcoes.filter(tipo => INSTRUMENT_FORM_TYPE_VALUES.has(tipo)) as string[];

  // Hide types that have a dedicated visualization block (avoids duplicate charts)
  viewableInstrumentTypes = viewableInstrumentTypes.filter(t => !FORM_TYPES_WITH_DEDICATED_BLOCK.has(t));

  // Intersect with instruments enabled for the selected programa
  const programaForInstruments = (filters?.programaFilter || 'todos') as any;
  if (programaForInstruments !== 'todos') {
    const enabledForPrograma = new Set(getInstrumentFormTypesByPrograma(programaForInstruments));
    viewableInstrumentTypes = viewableInstrumentTypes.filter(t => enabledForPrograma.has(t));
  }


  const { data, isLoading } = useQuery({
    queryKey: ['instrument_chart_data', viewableInstrumentTypes, filters],
    queryFn: async () => {
      if (viewableInstrumentTypes.length === 0) return [];

      // 1) Fetch instrument_fields for all viewable types
      const { data: fields, error: fieldsError } = await (supabase as any)
        .from('instrument_fields')
        .select('form_type, field_key, label, dimension, field_type, scale_max')
        .in('form_type', viewableInstrumentTypes)
        .eq('field_type', 'rating')
        .order('sort_order', { ascending: true });

      if (fieldsError) throw fieldsError;

      // 2) Fetch instrument_responses for ALL viewable types. We keep dedicated types
      //    here too so legacy rows that exist only in instrument_responses still count.
      let responses: any[] = [];
      if (viewableInstrumentTypes.length > 0) {
        const { data: stdResponses, error: responsesError } = await (supabase as any)
          .from('instrument_responses')
          .select('form_type, responses, registro_acao_id, escola_id, aap_id, created_at')
          .in('form_type', viewableInstrumentTypes);
        if (responsesError) throw responsesError;
        responses = stdResponses || [];
      }

      // 2a) Fetch from dedicated tables (one per type) and flatten into the same shape.
      // Some aggregated dedicated tables (e.g. relatorios_eteg_redes, relatorios_professor_redes)
      // do NOT expose a registro_acao_id column — selecting it crashes the whole query, so we
      // use an allowlist and also wrap each fetch in try/catch to keep one bad table from
      // taking down all charts.
      const TABLES_WITHOUT_REGISTRO_ID = new Set<string>([
        'relatorios_eteg_redes',
        'relatorios_professor_redes',
      ]);
      const dedicatedTypes = viewableInstrumentTypes.filter(t => DEDICATED_TABLES[t]);
      for (const dedType of dedicatedTypes) {
        const tableName = DEDICATED_TABLES[dedType];
        const ratingKeys = (fields || [])
          .filter((f: any) => f.form_type === dedType)
          .map((f: any) => f.field_key);
        if (ratingKeys.length === 0) continue;
        const hasRegistroId = !TABLES_WITHOUT_REGISTRO_ID.has(tableName);
        const baseCols = hasRegistroId
          ? ['registro_acao_id', 'created_at', 'status']
          : ['created_at', 'status'];
        const cols = [...baseCols, ...ratingKeys].join(', ');
        try {
          const { data: dedRows, error: dedErr } = await (supabase as any)
            .from(tableName)
            .select(cols)
            .eq('status', 'enviado');
          if (dedErr) {
            console.warn(`[useInstrumentChartData] Skipping ${tableName}:`, dedErr.message);
            continue;
          }
          for (const row of dedRows || []) {
            const flat: Record<string, any> = {};
            for (const k of ratingKeys) flat[k] = row[k];
            responses.push({
              form_type: dedType,
              responses: flat,
              registro_acao_id: hasRegistroId ? row.registro_acao_id : null,
              escola_id: null,
              aap_id: null,
              created_at: row.created_at,
              _fromDedicated: true,
            });
          }
        } catch (e: any) {
          console.warn(`[useInstrumentChartData] Failed to fetch ${tableName}:`, e?.message || e);
        }
      }


      // 2b) Dedupe by (form_type, registro_acao_id): prefer dedicated-table rows over instrument_responses.
      if (dedicatedTypes.length > 0) {
        const dedicatedKeys = new Set<string>();
        for (const r of responses) {
          if (r._fromDedicated && r.registro_acao_id) {
            dedicatedKeys.add(`${r.form_type}::${r.registro_acao_id}`);
          }
        }
        responses = responses.filter((r: any) => {
          if (r._fromDedicated) return true;
          if (!DEDICATED_TABLES[r.form_type] || !r.registro_acao_id) return true;
          return !dedicatedKeys.has(`${r.form_type}::${r.registro_acao_id}`);
        });
      }


      // 2b) Fetch registros_acao for date/programa/componente/escola filtering
      let registrosMap: Record<string, { data: string; programa: string[] | null; componente: string | null; escola_id: string | null; aap_id: string | null }> = {};
      const registroIds = [...new Set((responses || []).map((r: any) => r.registro_acao_id))];
      if (registroIds.length > 0) {
        for (let i = 0; i < registroIds.length; i += 500) {
          const chunk = registroIds.slice(i, i + 500) as string[];
          const { data: regs } = await supabase
            .from('registros_acao')
            .select('id, data, programa, componente, escola_id, aap_id')
            .in('id', chunk);
          for (const reg of regs || []) {
            registrosMap[reg.id] = {
              data: reg.data,
              programa: reg.programa,
              componente: (reg as any).componente ?? null,
              escola_id: (reg as any).escola_id ?? null,
              aap_id: (reg as any).aap_id ?? null,
            };
          }
        }
      }

      // 3) Apply temporal/escola/programa/aap/componente/entidade filters
      let filteredResponses = responses || [];

      if (filters?.anoFilter) {
        filteredResponses = filteredResponses.filter((r: any) => {
          const reg = registrosMap[r.registro_acao_id];
          const dateStr = reg?.data || r.created_at;
          return new Date(dateStr).getFullYear() === filters.anoFilter;
        });
      }
      if (filters?.mesFilter && filters.mesFilter !== 'todos') {
        filteredResponses = filteredResponses.filter((r: any) => {
          const reg = registrosMap[r.registro_acao_id];
          const dateStr = reg?.data || r.created_at;
          return new Date(dateStr).getMonth() + 1 === filters.mesFilter;
        });
      }
      if (filters?.escolaFilter && filters.escolaFilter !== 'todos') {
        filteredResponses = filteredResponses.filter((r: any) => (r.escola_id ?? registrosMap[r.registro_acao_id]?.escola_id) === filters.escolaFilter);
      }
      if (filters?.programaFilter && filters.programaFilter !== 'todos') {
        filteredResponses = filteredResponses.filter((r: any) => {
          const reg = registrosMap[r.registro_acao_id];
          return reg?.programa?.includes(filters.programaFilter!);
        });
      }
      if (filters?.aapFilter && filters.aapFilter !== 'todos') {
        filteredResponses = filteredResponses.filter((r: any) => (r.aap_id ?? registrosMap[r.registro_acao_id]?.aap_id) === filters.aapFilter);
      }
      if (filters?.componenteFilter && filters.componenteFilter !== 'todos') {
        filteredResponses = filteredResponses.filter((r: any) => {
          const reg = registrosMap[r.registro_acao_id];
          return reg?.componente === filters.componenteFilter;
        });
      }
      if (filters?.entidadeFilhoEscolaId) {
        filteredResponses = filteredResponses.filter((r: any) => {
          const reg = registrosMap[r.registro_acao_id];
          return (reg?.escola_id || r.escola_id) === filters.entidadeFilhoEscolaId;
        });
      }

      // 4) Group fields by form_type
      const fieldsByType: Record<string, typeof fields> = {};
      for (const f of fields || []) {
        if (!fieldsByType[f.form_type]) fieldsByType[f.form_type] = [];
        fieldsByType[f.form_type].push(f);
      }

      // 5) Calculate averages per form_type per field
      const chartDataList: InstrumentChartData[] = [];

      for (const formType of viewableInstrumentTypes) {
        const typeFields = fieldsByType[formType] || [];
        if (typeFields.length === 0) continue;

        const typeResponses = filteredResponses.filter((r: any) => r.form_type === formType);
        if (typeResponses.length === 0) continue;

        const dimensions: DimensionAverage[] = typeFields.map((field: any) => {
          let sum = 0;
          let count = 0;
          for (const resp of typeResponses) {
            const val = resp.responses?.[field.field_key];
            if (typeof val === 'number') {
              sum += val;
              count++;
            }
          }
          return {
            dimension: field.dimension || '',
            fieldKey: field.field_key,
            label: field.label,
            average: count > 0 ? Number((sum / count).toFixed(2)) : 0,
            count,
            scaleMax: field.scale_max || 5,
          };
        }).filter((d: DimensionAverage) => d.count > 0);

        if (dimensions.length === 0) continue;

        const formInfo = INSTRUMENT_FORM_TYPES.find(t => t.value === formType);
        const acaoInfo = ACAO_TYPE_INFO[formType as AcaoTipo];

        chartDataList.push({
          formType,
          formLabel: acaoInfo?.label || formInfo?.label || formType,
          dimensions,
          totalResponses: typeResponses.length,
        });
      }

      return chartDataList;
    },
    enabled: viewableInstrumentTypes.length > 0,
  });

  return {
    chartData: data || [],
    isLoading,
    viewableInstrumentTypes,
  };
}
