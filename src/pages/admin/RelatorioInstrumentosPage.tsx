import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

import { supabase } from '@/integrations/supabase/client';
import { useAuth, ProgramaType } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { INSTRUMENT_FORM_TYPES, useInstrumentFields } from '@/hooks/useInstrumentFields';
import { useAcoesByPrograma } from '@/hooks/useAcoesByPrograma';
import { ACAO_TYPE_INFO, normalizeAcaoTipo } from '@/config/acaoPermissions';
import { programaLabels } from '@/config/roleConfig';
import { useInstrumentComparisonData, ComparisonPeriod } from '@/hooks/useInstrumentComparisonData';
import { InstrumentComparisonChart } from '@/components/charts/InstrumentComparisonChart';


const sortAZ = (a: string, b: string) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' });

const slugify = (s: string) =>
  (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase() || 'relatorio';

const PROGRAMAS: ProgramaType[] = ['escolas', 'regionais', 'redes_municipais'];

// Instrumentos cujos formulários gravam em tabela própria em vez de instrument_responses.
// Os field_keys de instrument_fields correspondem 1:1 aos nomes das colunas dessas tabelas.
const DEDICATED_TABLES: Record<string, string> = {
  registro_consultoria_pedagogica: 'consultoria_pedagogica_respostas',
  monitoramento_gestao: 'relatorios_monitoramento_gestao',
  monitoramento_acoes_formativas: 'relatorios_monit_acoes_formativas',
  observacao_aula_redes: 'relatorios_visita_tecnica_microciclos',
  visita_tecnica_alfabetizacao_redes: 'relatorios_visita_tecnica_alfabetizacao_redes',
  encontro_microciclos_recomposicao: 'relatorios_microciclos_recomposicao',
  encontro_eteg_redes: 'relatorios_eteg_redes',
  encontro_professor_redes: 'relatorios_professor_redes',
  observacao_aula: 'avaliacoes_aula',
  visita_tecnica_alfabetizacao: 'relatorios_visita_tecnica_alfabetizacao',
  visita_tecnica_tarl: 'relatorios_visita_tecnica_tarl',
  observacao_aula_gpa: 'observacoes_aula_gpa',
  reuniao_acomp_alfabetizacao: 'relatorios_reuniao_acomp_alfabetizacao',
};

// Colunas de metadados a serem excluídas ao listar dinamicamente todas as colunas de resposta.
const METADATA_COLUMNS = new Set<string>([
  'id', 'created_at', 'updated_at', 'created_by', 'updated_by',
  'registro_acao_id', 'status', 'aap_id', 'aap_email',
  'questoes_selecionadas',
]);

// Labels amigáveis por tabela dedicada. Quando ausente, usa humanizeKey como fallback.
const DEDICATED_TABLE_LABELS: Record<string, Record<string, string>> = {
  relatorios_visita_tecnica_microciclos: {
    municipio: 'Município',
    nome_escola: 'Escola',
    data: 'Data',
    formador: 'Formador',
    numero_visita: 'Nº da Visita',
    horario_inicio: 'Horário início',
    horario_fim: 'Horário fim',
    pessoa_acompanhou: 'Pessoa que acompanhou',
    professor_observado: 'Professor observado',
    partes_visita: 'Partes da visita',
    q1_organizacao_rotina: 'Q1. Escola organizada para rotina (3 encontros/semana)',
    q1_organizacao_rotina_outro: 'Q1. Outro',
    q2_inicio_aulas: 'Q2. Início das aulas de recomposição',
    q3_tres_encontros: 'Q3. Realiza 3 encontros semanais?',
    q4_modelos_agrupamento: 'Q4. Modelo(s) de agrupamento',
    q4_modelos_agrupamento_outro: 'Q4. Outro',
    q5_anos_escolares: 'Q5. Anos escolares contemplados',
    q6_num_turmas: 'Q6. Nº de turmas de recomposição',
    q7_num_estudantes: 'Q7. Nº de estudantes participantes',
    q8_material_didatico: 'Q8. Material didático',
    q8_material_suficiente: 'Q9. Material suficiente para todos?',
    q9_registros_avaliacao: 'Q10. Registros da avaliação de percurso',
    q10_tempo_formativo: 'Q11. Tempo formativo do CP',
    q11_estudantes_matriculados: 'Q12. Estudantes matriculados na turma observada',
    q12_estudantes_presentes: 'Q13. Estudantes presentes',
    q14_aulas_ultimos_30_dias: 'Q14. Aulas nos últimos 30 dias',
    q13_componente: 'Q15. Componente observado',
    q14_agrupamento_turma: 'Q16. Modelo de agrupamento observado',
    q14_agrupamento_turma_outro: 'Q16. Outro',
    q15_uso_material: 'Q17. Uso do material didático',
    q16_cadernos_uso: 'Q18. Cadernos em uso',
    nota_q17: 'Q19. Intervenções alinhadas ao caderno e à faixa de desempenho (nota)',
    evidencia_q17: 'Q19. Intervenções alinhadas (evidência)',
    nota_q18: 'Q20. Metodologias que favorecem a aprendizagem (nota)',
    evidencia_q18: 'Q20. Metodologias (evidência)',
    nota_q19: 'Q21. Objetivo de aprendizagem claro e comunicado (nota)',
    evidencia_q19: 'Q21. Objetivo de aprendizagem (evidência)',
    nota_q20: 'Q22. Verificação da compreensão dos estudantes (nota)',
    evidencia_q20: 'Q22. Verificação da compreensão (evidência)',
    nota_q21: 'Q23. Gestão do tempo para atividades e dúvidas (nota)',
    evidencia_q21: 'Q23. Gestão do tempo (evidência)',
    nota_q22: 'Q24. Clima da sala (colaboração e respeito) (nota)',
    evidencia_q22: 'Q24. Clima da sala (evidência)',
    enca_pontos_fortes: 'A. Pontos fortes',
    enca_aspectos_fortalecer: 'A. Aspectos a fortalecer',
    enca_encaminhamentos: 'A. Encaminhamentos',
    encb_pontos_fortes: 'B. Pontos fortes',
    encb_aspectos_fortalecer: 'B. Aspectos a fortalecer',
    encb_encaminhamentos: 'B. Encaminhamentos',
    encc_pontos_fortes: 'C. Pontos fortes',
    encc_aspectos_fortalecer: 'C. Aspectos a fortalecer',
    encc_encaminhamentos: 'C. Encaminhamentos',
    observacoes_gerais: 'Observações gerais',
  },
};

const humanizeKey = (k: string) =>
  k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
const hasDedicated = (ft: string) => !!DEDICATED_TABLES[ft];
const INSTRUMENT_FORM_TYPE_VALUES = new Set<string>(INSTRUMENT_FORM_TYPES.map(t => t.value as string));

const actionTypeAliases = (formType: string) => {
  const aliases = new Set<string>([formType]);
  if (formType === 'observacao_aula') {
    aliases.add('acompanhamento_aula');
    aliases.add('visita');
  }
  return Array.from(aliases);
};

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'prevista', label: 'Prevista' },
  { value: 'agendada', label: 'Agendada' },
  { value: 'realizada', label: 'Realizada' },
  { value: 'cancelada', label: 'Cancelada' },
  { value: 'reagendada', label: 'Reagendada' },
];

const statusLabel = (s?: string | null) => {
  if (!s) return '—';
  const found = STATUS_OPTIONS.find(o => o.value === s);
  return found ? found.label : s.charAt(0).toUpperCase() + s.slice(1);
};

const formatCell = (v: any): string => {
  if (v === null || v === undefined || v === '') return '';
  if (Array.isArray(v)) return v.map(formatCell).filter(Boolean).join(', ');
  if (typeof v === 'object') return JSON.stringify(v);
  if (typeof v === 'boolean') return v ? 'Sim' : 'Não';
  return String(v);
};

interface RegistroRow {
  id: string;
  created_at: string | null;
  responses: Record<string, any> | null;
  aap_id: string;
  registros_acao: {
    id?: string;
    programa: string[] | null;
    tipo: string;
    data: string;
    status: string | null;
  } | null;
}

export default function RelatorioInstrumentosPage() {
  const { profile, isAdmin, isManager, effectiveProgramas } = useAuth();
  const navigate = useNavigate();

  const allowed = isManager;

  useEffect(() => {
    if (profile && !allowed) navigate('/unauthorized', { replace: true });
  }, [profile, allowed, navigate]);

  const userProgramas = useMemo<ProgramaType[]>(() => {
    if (isAdmin) return PROGRAMAS;
    return (effectiveProgramas || []) as ProgramaType[];
  }, [isAdmin, effectiveProgramas]);

  const [programa, setPrograma] = useState<ProgramaType | ''>('');
  const [instrumento, setInstrumento] = useState<string>('');
  const [atorId, setAtorId] = useState<string>('todos');
  const [entidadeId, setEntidadeId] = useState<string>('todos');
  const [status, setStatus] = useState<string>('todos');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [shouldFetch, setShouldFetch] = useState(false);
  const [queryKeyTick, setQueryKeyTick] = useState(0);

  // --- Comparativo Temporal ---
  const nowYear = new Date().getFullYear();
  const nowMonth = new Date().getMonth() + 1;
  const [compMode, setCompMode] = useState<'mes' | 'ano'>('mes');
  // Mês x Mês: mesmo ano, dois meses
  const [mxmAno, setMxmAno] = useState<number>(nowYear);
  const [mxmMesA, setMxmMesA] = useState<number>(Math.max(1, nowMonth - 1));
  const [mxmMesB, setMxmMesB] = useState<number>(nowMonth);
  // Ano x Ano: mesmo mês, dois anos
  const [axaMes, setAxaMes] = useState<number>(nowMonth);
  const [axaAnoA, setAxaAnoA] = useState<number>(nowYear - 1);
  const [axaAnoB, setAxaAnoB] = useState<number>(nowYear);

  useEffect(() => {

    if (!programa && userProgramas.length === 1) setPrograma(userProgramas[0]);
  }, [userProgramas, programa]);

  const onChangePrograma = (v: string) => {
    setPrograma(v as ProgramaType);
    setInstrumento('');
    setAtorId('todos');
    setEntidadeId('todos');
    setStatus('todos');
    setDataInicio('');
    setDataFim('');
    setShouldFetch(false);
  };
  const onChangeInstrumento = (v: string) => {
    setInstrumento(v);
    setAtorId('todos');
    setEntidadeId('todos');
    setStatus('todos');
    setDataInicio('');
    setDataFim('');
    setShouldFetch(false);
  };

  // Instrumentos disponíveis no programa selecionado
  const { data: formTypesNoPrograma = [] } = useQuery({
    queryKey: ['rel-instr-formtypes', programa],
    queryFn: async () => {
      if (!programa) return [] as string[];
      const set = new Set<string>();
      const { data: registrosData, error: registrosError } = await (supabase as any)
        .from('registros_acao')
        .select('tipo')
        .contains('programa', [programa])
        .limit(5000);
      if (registrosError) throw registrosError;
      (registrosData || []).forEach((r: any) => {
        const normalized = normalizeAcaoTipo(r.tipo) as string;
        if (INSTRUMENT_FORM_TYPE_VALUES.has(normalized)) set.add(normalized);
      });

      const { data, error } = await (supabase as any)
        .from('instrument_responses')
        .select('form_type, registros_acao!inner(programa)')
        .contains('registros_acao.programa', [programa])
        .limit(5000);
      if (error) throw error;
      (data || []).forEach((r: any) => r.form_type && set.add(r.form_type));

      // Sondar tabelas dedicadas em paralelo
      const probes = await Promise.all(
        Object.entries(DEDICATED_TABLES).map(async ([formType, table]) => {
          const { data: d } = await (supabase as any)
            .from(table)
            .select('id, registros_acao!inner(programa)')
            .contains('registros_acao.programa', [programa])
            .limit(1);
          return (d || []).length > 0 ? formType : null;
        }),
      );
      probes.forEach(ft => { if (ft) set.add(ft); });
      return Array.from(set);
    },
    enabled: !!programa,
  });

  const { isAcaoEnabledForPrograma, isAcaoInativa } = useAcoesByPrograma();

  const instrumentosDisponiveis = useMemo(() => {
    const available = new Set<string>(formTypesNoPrograma as string[]);
    const known = new Set<string>(INSTRUMENT_FORM_TYPES.map(t => t.value as string));
    const isActive = (ft: string) =>
      !!programa && isAcaoEnabledForPrograma(ft, programa as ProgramaType) && !isAcaoInativa(ft);
    const items: { value: string; label: string }[] = INSTRUMENT_FORM_TYPES
      .filter(t => available.has(t.value as string) && isActive(t.value as string))
      .map(t => ({ value: t.value as string, label: t.label as string }));
    available.forEach(ft => {
      if (!known.has(ft) && isActive(ft)) items.push({ value: ft, label: ft });
    });
    return items.sort((a, b) => sortAZ(a.label, b.label));
  }, [formTypesNoPrograma, programa, isAcaoEnabledForPrograma, isAcaoInativa]);

  // Atores (sem join FK — busca aap_ids e depois nomes)
  const { data: atores = [] } = useQuery({
    queryKey: ['rel-instr-atores', programa, instrumento],
    queryFn: async () => {
      if (!programa || !instrumento) return [] as { id: string; nome: string }[];
      const { data, error } = await (supabase as any)
        .from('registros_acao')
        .select('aap_id')
        .in('tipo', actionTypeAliases(instrumento))
        .contains('programa', [programa])
        .limit(5000);
      if (error) throw error;
      const ids = Array.from(new Set((data || []).map((r: any) => r.aap_id).filter(Boolean))) as string[];
      if (ids.length === 0) return [];
      const { data: profs, error: pErr } = await supabase
        .from('profiles')
        .select('id, nome')
        .in('id', ids);
      if (pErr) throw pErr;
      return (profs || [])
        .map(p => ({ id: p.id, nome: p.nome || '—' }))
        .sort((a, b) => sortAZ(a.nome, b.nome));
    },
    enabled: !!programa && !!instrumento,
  });

  // Entidades (Escolas/Regionais/Redes) disponíveis no programa selecionado
  const { data: entidades = [] } = useQuery({
    queryKey: ['rel-instr-entidades', programa],
    queryFn: async () => {
      if (!programa) return [] as { id: string; nome: string }[];
      const { data, error } = await (supabase as any)
        .from('escolas')
        .select('id, nome')
        .eq('ativa', true)
        .contains('programa', [programa]);
      if (error) throw error;
      return (data || [])
        .map((e: any) => ({ id: e.id, nome: e.nome || '—' }))
        .sort((a: any, b: any) => sortAZ(a.nome, b.nome));
    },
    enabled: !!programa,
  });

  // Campos dinâmicos do instrumento
  const { fields } = useInstrumentFields(instrumento || undefined);
  const orderedFields = useMemo(
    () => [...fields].sort((a, b) => a.sort_order - b.sort_order),
    [fields],
  );

  // Relatório
  const fieldKeysSig = orderedFields.map(f => f.field_key).join(',');
  const { data: rowsResult, isFetching } = useQuery({
    queryKey: ['rel-instr-rows', programa, instrumento, atorId, entidadeId, status, dataInicio, dataFim, fieldKeysSig, queryKeyTick],
    queryFn: async () => {
      if (!programa || !instrumento) return { rows: [] as RegistroRow[], nomes: {} as Record<string, string> };
      const dedicated = DEDICATED_TABLES[instrumento];
      let rows: RegistroRow[] = [];

      let registrosQuery = (supabase as any)
        .from('registros_acao')
        .select('id, created_at, programa, tipo, data, status, aap_id')
        .in('tipo', actionTypeAliases(instrumento))
        .contains('programa', [programa])
        .order('data', { ascending: false })
        .limit(5000);
      if (atorId && atorId !== 'todos') registrosQuery = registrosQuery.eq('aap_id', atorId);
      if (entidadeId && entidadeId !== 'todos') registrosQuery = registrosQuery.eq('escola_id', entidadeId);
      if (status && status !== 'todos') registrosQuery = registrosQuery.eq('status', status);
      if (dataInicio) registrosQuery = registrosQuery.gte('data', dataInicio);
      if (dataFim) registrosQuery = registrosQuery.lte('data', dataFim);
      const { data: registrosData, error: registrosError } = await registrosQuery;
      if (registrosError) throw registrosError;

      const registros = registrosData || [];
      const registroIds = registros.map((r: any) => r.id).filter(Boolean);

      if (dedicated) {
        let responses: any[] = [];
        if (registroIds.length) {
          const { data, error } = await (supabase as any)
            .from(dedicated)
            .select('*')
            .in('registro_acao_id', registroIds)
            .order('created_at', { ascending: false })
            .limit(5000);
          if (error) throw error;
          responses = data || [];
        }
        const responseByRegistro = new Map<string, any>();
        responses.forEach((r: any) => {
          if (!responseByRegistro.has(r.registro_acao_id)) responseByRegistro.set(r.registro_acao_id, r);
        });
        rows = registros.map((reg: any) => {
          const r = responseByRegistro.get(reg.id);
          const respObj: Record<string, any> = {};
          if (r) {
            Object.keys(r).forEach(k => {
              if (!METADATA_COLUMNS.has(k)) respObj[k] = r[k];
            });
          }
          return {
            id: r?.id || reg.id,
            created_at: r?.created_at || reg.created_at,
            responses: respObj,
            aap_id: reg.aap_id,
            registros_acao: reg,
          } as RegistroRow;
        });
      } else {
        let responses: any[] = [];
        if (registroIds.length) {
          const { data, error } = await (supabase as any)
            .from('instrument_responses')
            .select('id, created_at, responses, aap_id, registro_acao_id')
            .eq('form_type', instrumento)
            .in('registro_acao_id', registroIds)
            .order('created_at', { ascending: false })
            .limit(5000);
          if (error) throw error;
          responses = data || [];
        }
        const responseByRegistro = new Map<string, any>();
        responses.forEach((r: any) => {
          if (!responseByRegistro.has(r.registro_acao_id)) responseByRegistro.set(r.registro_acao_id, r);
        });
        rows = registros.map((reg: any) => {
          const r = responseByRegistro.get(reg.id);
          const raw = r?.responses || {};
          const respObj: Record<string, any> = {};
          Object.keys(raw).forEach(k => {
            if (!METADATA_COLUMNS.has(k)) respObj[k] = raw[k];
          });
          return {
            id: r?.id || reg.id,
            created_at: r?.created_at || reg.created_at,
            responses: respObj,
            aap_id: reg.aap_id,
            registros_acao: reg,
          } as RegistroRow;
        });
      }

      const ids = Array.from(new Set(rows.map(r => r.aap_id).filter(Boolean)));
      const nomes: Record<string, string> = {};
      if (ids.length) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, nome')
          .in('id', ids);
        (profs || []).forEach(p => { nomes[p.id] = p.nome || '—'; });
      }
      return { rows, nomes };
    },
    enabled: shouldFetch && !!programa && !!instrumento,
  });

  const rows = rowsResult?.rows;
  const nomes = rowsResult?.nomes || {};

  // Une os campos cadastrados em instrument_fields com TODAS as chaves de resposta
  // descobertas nas linhas retornadas (excluindo metadados). Garante que toda coluna
  // de tabela dedicada ou chave do JSON `responses` apareça no relatório, mesmo
  // quando não está cadastrada em instrument_fields.
  const displayFields = useMemo(() => {
    const dedicated = DEDICATED_TABLES[instrumento];
    // Tabela dedicada: ignorar instrument_fields (que pode estar desatualizado em relação
    // ao schema real) e usar somente as chaves reais presentes nas linhas retornadas.
    // Labels saem do mapa DEDICATED_TABLE_LABELS; fallback para humanizeKey.
    if (dedicated) {
      const labelMap = DEDICATED_TABLE_LABELS[dedicated] || {};
      const seen = new Set<string>();
      const out: { field_key: string; label: string }[] = [];
      (rows || []).forEach(r => {
        Object.keys(r.responses || {}).forEach(k => {
          if (METADATA_COLUMNS.has(k) || seen.has(k)) return;
          seen.add(k);
          out.push({ field_key: k, label: labelMap[k] || humanizeKey(k) });
        });
      });
      // Ordena pela ordem do mapa de labels (que segue o PDF); chaves não mapeadas vão ao final.
      const labelOrder = Object.keys(labelMap);
      const orderIdx = (k: string) => {
        const i = labelOrder.indexOf(k);
        return i === -1 ? Number.MAX_SAFE_INTEGER : i;
      };
      return out.sort((a, b) => orderIdx(a.field_key) - orderIdx(b.field_key));
    }
    // Genérico (instrument_responses): comportamento atual — instrument_fields + extras.
    const known = orderedFields
      .filter(f => !METADATA_COLUMNS.has(f.field_key))
      .map(f => ({ field_key: f.field_key, label: f.label }));
    const knownSet = new Set(known.map(f => f.field_key));
    const extras: { field_key: string; label: string }[] = [];
    const seen = new Set<string>();
    (rows || []).forEach(r => {
      Object.keys(r.responses || {}).forEach(k => {
        if (METADATA_COLUMNS.has(k) || knownSet.has(k) || seen.has(k)) return;
        seen.add(k);
        extras.push({ field_key: k, label: humanizeKey(k) });
      });
    });
    return [...known, ...extras];
  }, [instrumento, orderedFields, rows]);

  const handleGerar = () => {
    if (!programa || !instrumento) return;
    setShouldFetch(true);
    setQueryKeyTick(t => t + 1);
  };

  const instrumentoLabel = useMemo(
    () => instrumentosDisponiveis.find(i => i.value === instrumento)?.label || instrumento,
    [instrumentosDisponiveis, instrumento],
  );

  const tableRows = useMemo(() => {
    if (!rows) return [];
    return rows.map(r => {
      const fixed = {
        programa: programaLabels[programa as ProgramaType] || '',
        ator: nomes[r.aap_id] || '—',
        acao: ACAO_TYPE_INFO[r.registros_acao?.tipo as keyof typeof ACAO_TYPE_INFO]?.label || r.registros_acao?.tipo || '—',
        data: r.registros_acao?.data ? format(parseISO(r.registros_acao.data), 'dd/MM/yyyy') : '—',
        status: statusLabel(r.registros_acao?.status),
      };
      const dyn: Record<string, string> = {};
      displayFields.forEach(f => {
        dyn[f.field_key] = formatCell(r.responses?.[f.field_key]);
      });
      return { ...fixed, dyn };
    });
  }, [rows, nomes, displayFields, programa]);

  const handleDownload = () => {
    if (!tableRows.length) return;
    const header = ['Programa', 'Ator', 'Ação', 'Data', 'Status', ...displayFields.map(f => f.label)];
    const aoa: any[][] = [header];
    tableRows.forEach(r => {
      aoa.push([r.programa, r.ator, r.acao, r.data, r.status, ...displayFields.map(f => r.dyn[f.field_key] || '')]);
    });
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Relatório');
    const filename = `${slugify(programaLabels[programa as ProgramaType] || '')}_${slugify(instrumentoLabel)}_relatorio.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  // --- Export do comparativo (XLS / PDF) ---
  const comparativoRef = useRef<HTMLDivElement>(null);
  const [pdfLoading, setPdfLoading] = useState(false);



  // --- Dados do comparativo temporal ---
  const MES_LABELS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const yearOptions = useMemo(() => {
    const arr: number[] = [];
    for (let y = nowYear + 1; y >= nowYear - 5; y--) arr.push(y);
    return arr;
  }, [nowYear]);

  const periodA: ComparisonPeriod = compMode === 'mes'
    ? { ano: mxmAno, mes: mxmMesA, label: `${MES_LABELS[mxmMesA - 1]}/${mxmAno}` }
    : { ano: axaAnoA, mes: axaMes, label: `${MES_LABELS[axaMes - 1]}/${axaAnoA}` };
  const periodB: ComparisonPeriod = compMode === 'mes'
    ? { ano: mxmAno, mes: mxmMesB, label: `${MES_LABELS[mxmMesB - 1]}/${mxmAno}` }
    : { ano: axaAnoB, mes: axaMes, label: `${MES_LABELS[axaMes - 1]}/${axaAnoB}` };

  const samePeriod = periodA.ano === periodB.ano && periodA.mes === periodB.mes;

  const { data: comparison, isLoading: compLoading, hasRatingFields } = useInstrumentComparisonData({
    programa: programa as string,
    instrumento,
    atorId,
    entidadeId,
    periodA,
    periodB,
    enabled: !!programa && !!instrumento && !samePeriod,
  });

  const atorLabel = atorId === 'todos' ? 'Todos' : (atores.find(a => a.id === atorId)?.nome || atorId);
  const entidadeLabel = entidadeId === 'todos' ? 'Todas' : ((entidades as any[]).find(e => e.id === entidadeId)?.nome || entidadeId);

  const handleDownloadComparativoXls = () => {
    if (!comparison || comparison.dimensions.length === 0) return;
    const wb = XLSX.utils.book_new();

    const resumo: any[][] = [
      ['Programa', programaLabels[programa as ProgramaType] || ''],
      ['Instrumento', instrumentoLabel],
      ['Ator', atorLabel],
      ['Entidade', entidadeLabel],
      [],
      ['Período', 'Registros'],
      [periodA.label, comparison.totalA],
      [periodB.label, comparison.totalB],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(resumo), 'Resumo');

    const header = ['Dimensão', periodA.label, `Qtd ${periodA.label}`, periodB.label, `Qtd ${periodB.label}`, 'Δ', 'Δ %'];
    const aoa: any[][] = [header];
    comparison.dimensions.forEach(d => {
      aoa.push([
        d.label,
        d.avgA !== null ? Number(d.avgA.toFixed(2)) : '',
        d.countA,
        d.avgB !== null ? Number(d.avgB.toFixed(2)) : '',
        d.countB,
        d.delta !== null ? Number(d.delta.toFixed(2)) : '',
        d.deltaPct !== null ? `${d.deltaPct.toFixed(1)}%` : '',
      ]);
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), 'Dimensões');

    const filename = `${slugify(programaLabels[programa as ProgramaType] || '')}_${slugify(instrumentoLabel)}_comparativo_${slugify(periodA.label)}_vs_${slugify(periodB.label)}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  const handleDownloadComparativoPdf = async () => {
    if (!comparativoRef.current || !comparison) return;
    setPdfLoading(true);
    try {
      const canvas = await html2canvas(comparativoRef.current, {
        scale: 1.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const a4Width = 210;
      const a4Height = 297;
      const margin = 8;
      const headerHeight = 20;
      const contentWidth = a4Width - margin * 2;
      const contentStartY = headerHeight + 4;
      const availableHeight = a4Height - contentStartY - margin;

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      const loadLogo = async (path: () => Promise<{ default: string }>) => {
        try {
          const mod = await path();
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = mod.default;
          await new Promise((res, rej) => { img.onload = res; img.onerror = rej; setTimeout(rej, 3000); });
          return img;
        } catch { return null; }
      };
      const logoImg = await loadLogo(() => import('@/assets/pe-logo-branco-horizontal.png'));
      const bussolaImg = await loadLogo(() => import('@/assets/logo-bussola-branco.png'));

      const addHeader = () => {
        pdf.setFillColor(26, 58, 92);
        pdf.rect(0, 0, a4Width, headerHeight, 'F');
        let logosEndX = margin;
        if (logoImg) {
          const ratio = logoImg.naturalWidth / logoImg.naturalHeight;
          const h = 8; const w = h * ratio;
          pdf.addImage(logoImg, 'PNG', margin, (headerHeight - h) / 2, w, h);
          logosEndX += w;
        }
        if (bussolaImg) {
          const ratio = bussolaImg.naturalWidth / bussolaImg.naturalHeight;
          const h = 8; const w = h * ratio;
          pdf.addImage(bussolaImg, 'PNG', logosEndX + 3, (headerHeight - h) / 2, w, h);
          logosEndX += 3 + w;
        }
        pdf.setTextColor(255, 255, 255);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.text(`Comparativo — ${instrumentoLabel}`, logosEndX + 4, 8);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7);
        pdf.text(`${programaLabels[programa as ProgramaType] || ''} • ${periodA.label} vs ${periodB.label}`, logosEndX + 4, 13);
        const dateStr = new Date().toLocaleDateString('pt-BR');
        const txt = `Gerado em ${dateStr}`;
        pdf.text(txt, a4Width - margin - pdf.getTextWidth(txt), 13);
      };

      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const scaleFactor = contentWidth / (imgWidth / 1.5);
      const sourceSliceHeight = (availableHeight / scaleFactor) * 1.5;

      let sourceY = 0;
      let firstPage = true;
      while (sourceY < imgHeight) {
        if (!firstPage) pdf.addPage();
        addHeader();
        firstPage = false;
        const slice = document.createElement('canvas');
        const ctx = slice.getContext('2d');
        const actualSliceHeight = Math.min(sourceSliceHeight, imgHeight - sourceY);
        slice.width = imgWidth;
        slice.height = actualSliceHeight;
        if (ctx) {
          ctx.drawImage(canvas, 0, sourceY, imgWidth, actualSliceHeight, 0, 0, imgWidth, actualSliceHeight);
          const sliceData = slice.toDataURL('image/jpeg', 0.9);
          const sliceScaledHeight = (actualSliceHeight / 1.5) * scaleFactor;
          pdf.addImage(sliceData, 'JPEG', margin, contentStartY, contentWidth, sliceScaledHeight);
        }
        sourceY += sourceSliceHeight;
      }

      const filename = `${slugify(programaLabels[programa as ProgramaType] || '')}_${slugify(instrumentoLabel)}_comparativo_${slugify(periodA.label)}_vs_${slugify(periodB.label)}.pdf`;
      pdf.save(filename);
    } finally {
      setPdfLoading(false);
    }
  };






  if (!profile) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Relatório de Instrumentos</h1>
        <p className="text-sm text-muted-foreground">
          Visualize e baixe em Excel os registros de instrumentos.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Programa *</Label>
              <Select value={programa} onValueChange={onChangePrograma}>
                <SelectTrigger><SelectValue placeholder="Selecione um programa" /></SelectTrigger>
                <SelectContent>
                  {userProgramas.map(p => (
                    <SelectItem key={p} value={p}>{programaLabels[p]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Instrumento *</Label>
              <Select value={instrumento} onValueChange={onChangeInstrumento} disabled={!programa}>
                <SelectTrigger>
                  <SelectValue placeholder={programa ? 'Selecione um instrumento' : 'Selecione o Programa primeiro'} />
                </SelectTrigger>
                <SelectContent>
                  {instrumentosDisponiveis.length === 0 && programa ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      Nenhum instrumento com registros neste programa.
                    </div>
                  ) : (
                    instrumentosDisponiveis.map(i => (
                      <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card className="border-dashed">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Filtros opcionais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
                <div className="space-y-2">
                  <Label>Ator</Label>
                  <Select value={atorId} onValueChange={setAtorId} disabled={!programa || !instrumento}>
                    <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      {atores.map(a => (
                        <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Entidade</Label>
                  <Select value={entidadeId} onValueChange={setEntidadeId} disabled={!programa}>
                    <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todas</SelectItem>
                      {entidades.map((e: any) => (
                        <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={setStatus} disabled={!programa || !instrumento}>
                    <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      {STATUS_OPTIONS.map(s => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Data início</Label>
                  <Input
                    type="date"
                    value={dataInicio}
                    onChange={e => setDataInicio(e.target.value)}
                    disabled={!programa || !instrumento}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data fim</Label>
                  <Input
                    type="date"
                    value={dataFim}
                    onChange={e => setDataFim(e.target.value)}
                    disabled={!programa || !instrumento}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

        </CardContent>
      </Card>

      <Tabs defaultValue="tabela" className="w-full">
        <TabsList>
          <TabsTrigger value="tabela">Tabela</TabsTrigger>
          <TabsTrigger value="comparativo">Comparativo Temporal</TabsTrigger>
        </TabsList>

        <TabsContent value="tabela" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={handleGerar} disabled={!programa || !instrumento || isFetching}>
              {isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Gerar Relatório
            </Button>
          </div>

          {shouldFetch && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <CardTitle>Resultados {rows ? `(${rows.length})` : ''}</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  disabled={!tableRows.length}
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Baixar XLS
                </Button>
              </CardHeader>
              <CardContent>
                {isFetching ? (
                  <div className="flex h-32 items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : !tableRows.length ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Nenhum registro encontrado para os filtros selecionados.
                  </p>
                ) : (
                  <div className="overflow-x-auto max-h-[70vh]">
                    <table className="min-w-max w-full border-collapse text-sm">
                      <thead className="sticky top-0 bg-background">
                        <tr className="border-b">
                          <th className="px-3 py-2 text-left font-medium">Programa</th>
                          <th className="px-3 py-2 text-left font-medium">Ator</th>
                          <th className="px-3 py-2 text-left font-medium">Ação</th>
                          <th className="px-3 py-2 text-left font-medium">Data</th>
                          <th className="px-3 py-2 text-left font-medium">Status</th>
                          {displayFields.map(f => (
                            <th key={f.field_key} className="px-3 py-2 text-left font-medium whitespace-nowrap">
                              {f.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {tableRows.map((r, idx) => (
                          <tr key={idx} className="border-b hover:bg-muted/40">
                            <td className="px-3 py-2">{r.programa}</td>
                            <td className="px-3 py-2">{r.ator}</td>
                            <td className="px-3 py-2">{r.acao}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{r.data}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{r.status}</td>
                            {displayFields.map(f => (
                              <td key={f.field_key} className="px-3 py-2 align-top">
                                <div className="max-w-md whitespace-pre-wrap break-words">
                                  {r.dyn[f.field_key]}
                                </div>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="comparativo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Comparar dimensões entre períodos</CardTitle>
              <p className="text-sm text-muted-foreground">
                Selecione Programa e Instrumento acima. As médias excluem zeros (N/A), exceto em escalas REDES (0–2).
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Modo de comparação</Label>
                  <Select value={compMode} onValueChange={(v) => setCompMode(v as 'mes' | 'ano')}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mes">Mês x Mês (mesmo ano)</SelectItem>
                      <SelectItem value="ano">Ano x Ano (mesmo mês)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {compMode === 'mes' ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Ano</Label>
                    <Select value={String(mxmAno)} onValueChange={(v) => setMxmAno(Number(v))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {yearOptions.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Período A (Mês)</Label>
                    <Select value={String(mxmMesA)} onValueChange={(v) => setMxmMesA(Number(v))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {MES_LABELS.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Período B (Mês)</Label>
                    <Select value={String(mxmMesB)} onValueChange={(v) => setMxmMesB(Number(v))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {MES_LABELS.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Mês</Label>
                    <Select value={String(axaMes)} onValueChange={(v) => setAxaMes(Number(v))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {MES_LABELS.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Período A (Ano)</Label>
                    <Select value={String(axaAnoA)} onValueChange={(v) => setAxaAnoA(Number(v))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {yearOptions.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Período B (Ano)</Label>
                    <Select value={String(axaAnoB)} onValueChange={(v) => setAxaAnoB(Number(v))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {yearOptions.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {!programa || !instrumento ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Selecione Programa e Instrumento nos filtros acima.
            </p>
          ) : !hasRatingFields ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Este instrumento não possui dimensões com escala numérica para comparar.
            </p>
          ) : samePeriod ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Selecione dois períodos diferentes para comparar.
            </p>
          ) : compLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !comparison || comparison.dimensions.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma avaliação encontrada para os períodos selecionados.
            </p>
          ) : (
            <>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={handleDownloadComparativoXls}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Baixar XLS
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownloadComparativoPdf} disabled={pdfLoading}>
                  {pdfLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                  Baixar PDF
                </Button>
              </div>

              <div ref={comparativoRef} className="space-y-4 bg-background">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {instrumentoLabel} — {periodA.label} vs {periodB.label}
                    </CardTitle>
                    <div className="flex flex-wrap gap-4 pt-2 text-sm text-muted-foreground">
                      <span><strong className="text-foreground">{periodA.label}:</strong> {comparison.totalA} registro(s)</span>
                      <span><strong className="text-foreground">{periodB.label}:</strong> {comparison.totalB} registro(s)</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <InstrumentComparisonChart
                      dimensions={comparison.dimensions}
                      labelA={periodA.label}
                      labelB={periodB.label}
                      scaleMax={comparison.scaleMax}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Detalhamento por dimensão</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="px-3 py-2 text-left font-medium">Dimensão</th>
                            <th className="px-3 py-2 text-right font-medium">{periodA.label}</th>
                            <th className="px-3 py-2 text-right font-medium">Qtd {periodA.label}</th>
                            <th className="px-3 py-2 text-right font-medium">{periodB.label}</th>
                            <th className="px-3 py-2 text-right font-medium">Qtd {periodB.label}</th>
                            <th className="px-3 py-2 text-right font-medium">Δ</th>
                            <th className="px-3 py-2 text-right font-medium">Δ %</th>
                          </tr>
                        </thead>
                        <tbody>
                          {comparison.dimensions.map(d => (
                            <tr key={d.fieldKey} className="border-b hover:bg-muted/40">
                              <td className="px-3 py-2">{d.label}</td>
                              <td className="px-3 py-2 text-right">
                                {d.avgA !== null ? d.avgA.toFixed(2) : '—'}
                              </td>
                              <td className="px-3 py-2 text-right text-muted-foreground">{d.countA}</td>
                              <td className="px-3 py-2 text-right">
                                {d.avgB !== null ? d.avgB.toFixed(2) : '—'}
                              </td>
                              <td className="px-3 py-2 text-right text-muted-foreground">{d.countB}</td>
                              <td className={`px-3 py-2 text-right ${d.delta !== null && d.delta > 0 ? 'text-emerald-600' : d.delta !== null && d.delta < 0 ? 'text-destructive' : ''}`}>
                                {d.delta !== null ? (d.delta > 0 ? '+' : '') + d.delta.toFixed(2) : '—'}
                              </td>
                              <td className={`px-3 py-2 text-right ${d.deltaPct !== null && d.deltaPct > 0 ? 'text-emerald-600' : d.deltaPct !== null && d.deltaPct < 0 ? 'text-destructive' : ''}`}>
                                {d.deltaPct !== null ? (d.deltaPct > 0 ? '+' : '') + d.deltaPct.toFixed(1) + '%' : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );

}
