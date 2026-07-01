import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';

import { supabase } from '@/integrations/supabase/client';
import { useAuth, ProgramaType } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAcoesByPrograma } from '@/hooks/useAcoesByPrograma';
import { ACAO_TYPE_INFO, AcaoTipo, normalizeAcaoTipo } from '@/config/acaoPermissions';
import { programaLabels } from '@/config/roleConfig';
import { INSTRUMENT_FORM_TYPES } from '@/hooks/useInstrumentFields';

const PROGRAMAS: ProgramaType[] = ['escolas', 'regionais', 'redes_municipais'];
const INSTRUMENT_FORM_TYPE_VALUES = new Set<string>(INSTRUMENT_FORM_TYPES.map(t => t.value as string));

const sortAZ = (a: string, b: string) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' });

const chunkArray = <T,>(items: T[], size = 500): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
};

const slugify = (s: string) =>
  (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase() || 'extracao';

// Mesma matriz de tabelas dedicadas usada em RelatorioInstrumentosPage
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

const UNLINKED_DEDICATED_TABLES = new Set<string>([
  'relatorios_eteg_redes',
  'relatorios_professor_redes',
]);

const UNLINKED_ACTOR_COLUMNS: Record<string, string> = {
  relatorios_eteg_redes: 'created_by, observador, equipe',
  relatorios_professor_redes: 'created_by, formador',
};

const hasRegistroAcaoLink = (table: string) => !UNLINKED_DEDICATED_TABLES.has(table);

const METADATA_COLUMNS = new Set<string>([
  'id', 'created_at', 'updated_at', 'created_by', 'updated_by',
  'registro_acao_id', 'aap_id', 'aap_email', 'questoes_selecionadas',
]);

const humanizeKey = (k: string) =>
  k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

const actionTypeAliases = (formType: string) => {
  const aliases = new Set<string>([formType]);
  if (formType === 'observacao_aula') {
    aliases.add('acompanhamento_aula');
    aliases.add('visita');
  }
  return Array.from(aliases);
};

const STATUS_OPTIONS = [
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

const REGISTRO_EXCLUDE = new Set<string>(['id', 'aap_id', 'escola_id', 'entidade_filho_id', 'professor_id', 'created_by', 'updated_by']);
const REGISTRO_LABELS: Record<string, string> = {
  data: 'Data',
  hora_inicio: 'Hora início',
  hora_fim: 'Hora fim',
  programa: 'Programa',
  tipo: 'Tipo',
  status: 'Status',
  observacoes: 'Observações',
  tags: 'Tags',
  created_at: 'Criado em',
  updated_at: 'Atualizado em',
  numero_visita: 'Nº da visita',
  publico: 'Público',
  projeto: 'Projeto',
  local: 'Local',
  segmento: 'Segmento',
  componente: 'Componente',
};

interface Row {
  registro: any;
  resposta: Record<string, any>;
  ator_nome: string;
  entidade_nome: string;
}

export default function ExtracaoBasesInstrumentosPage() {
  const { profile, isAdmin, isManager, isRealAdmin, isSimulating, effectiveProgramas } = useAuth();
  const navigate = useNavigate();
  const allowed = isManager || isRealAdmin;

  useEffect(() => {
    if (profile && !allowed) navigate('/unauthorized', { replace: true });
  }, [profile, allowed, navigate]);

  const userProgramas = useMemo<ProgramaType[]>(() => {
    if (isAdmin || (isRealAdmin && (!isSimulating || !effectiveProgramas?.length))) return PROGRAMAS;
    return (effectiveProgramas || []) as ProgramaType[];
  }, [isAdmin, isRealAdmin, isSimulating, effectiveProgramas]);

  const [programa, setPrograma] = useState<ProgramaType | ''>('');
  const [instrumento, setInstrumento] = useState<string>('');
  const [atorId, setAtorId] = useState<string>('todos');
  const [entidadeId, setEntidadeId] = useState<string>('todos');
  const [status, setStatus] = useState<string>('todos');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [shouldFetch, setShouldFetch] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!programa && userProgramas.length === 1) setPrograma(userProgramas[0]);
  }, [userProgramas, programa]);

  const { isAcaoEnabledForPrograma, isAcaoInativa } = useAcoesByPrograma();

  const onChangePrograma = (v: string) => {
    setPrograma(v as ProgramaType);
    setInstrumento('');
    setAtorId('todos'); setEntidadeId('todos'); setStatus('todos');
    setDataInicio(''); setDataFim('');
    setShouldFetch(false);
  };
  const onChangeInstrumento = (v: string) => {
    setInstrumento(v);
    setAtorId('todos'); setEntidadeId('todos'); setStatus('todos');
    setDataInicio(''); setDataFim('');
    setShouldFetch(false);
  };

  const { data: formTypesNoPrograma = [], isLoading: isLoadingInstrumentos, error: instrumentosError } = useQuery({
    queryKey: ['extr-formtypes', programa],
    queryFn: async () => {
      if (!programa) return [] as string[];
      const set = new Set<string>();

      const { data: registrosData, error: registrosError } = await (supabase as any)
        .from('registros_acao')
        .select('id, tipo')
        .contains('programa', [programa])
        .limit(5000);
      if (registrosError) throw registrosError;
      (registrosData || []).forEach((r: any) => {
        const normalized = normalizeAcaoTipo(r.tipo) as string;
        if (INSTRUMENT_FORM_TYPE_VALUES.has(normalized)) set.add(normalized);
      });

      const registroIds = Array.from(new Set((registrosData || []).map((r: any) => r.id).filter(Boolean))) as string[];

      for (const ids of chunkArray(registroIds)) {
        const { data: responsesData, error: responsesError } = await (supabase as any)
          .from('instrument_responses')
          .select('form_type, registro_acao_id')
          .in('registro_acao_id', ids)
          .limit(5000);
        if (responsesError) throw responsesError;
        (responsesData || []).forEach((r: any) => r.form_type && set.add(r.form_type));
      }

      const probes = await Promise.all(
        Object.entries(DEDICATED_TABLES).map(async ([formType, table]) => {
          if (!hasRegistroAcaoLink(table)) {
            if (programa !== 'redes_municipais') return null;
            const { data, error } = await (supabase as any).from(table).select('id').limit(1);
            if (error) return null;
            return (data || []).length > 0 ? formType : null;
          }

          for (const ids of chunkArray(registroIds)) {
            const { data, error } = await (supabase as any)
              .from(table)
              .select('id, registro_acao_id')
              .in('registro_acao_id', ids)
              .limit(1);
            if (error) return null;
            if ((data || []).length > 0) return formType;
          }
          return null;
        }),
      );
      probes.forEach(ft => { if (ft) set.add(ft); });

      return Array.from(set);
    },
    enabled: !!programa,
  });

  const instrumentosDisponiveis = useMemo(() => {
    if (!programa) return [];
    const available = new Set<string>(formTypesNoPrograma as string[]);
    const known = new Set<string>(INSTRUMENT_FORM_TYPES.map(t => t.value as string));
    const isActive = (ft: string) => isAcaoEnabledForPrograma(ft, programa) && !isAcaoInativa(ft);
    const items: { value: string; label: string }[] = INSTRUMENT_FORM_TYPES
      .filter(t => available.has(t.value as string) && isActive(t.value as string))
      .map(t => ({ value: t.value as string, label: t.label as string }));

    available.forEach(ft => {
      if (!known.has(ft) && isActive(ft)) items.push({ value: ft, label: ACAO_TYPE_INFO[ft as AcaoTipo]?.label || ft });
    });

    return items.sort((a, b) => sortAZ(a.label, b.label));
  }, [formTypesNoPrograma, programa, isAcaoEnabledForPrograma, isAcaoInativa]);

  // Atores
  const { data: atores = [], error: atoresError } = useQuery({
    queryKey: ['extr-atores', programa, instrumento],
    queryFn: async () => {
      if (!programa || !instrumento) return [] as { id: string; nome: string }[];
      const dedicated = DEDICATED_TABLES[instrumento];
      if (dedicated && !hasRegistroAcaoLink(dedicated)) {
        const { data, error } = await (supabase as any)
          .from(dedicated)
          .select(UNLINKED_ACTOR_COLUMNS[dedicated] || 'created_by')
          .limit(5000);
        if (error) throw error;

        const createdByIds = Array.from(new Set((data || []).map((r: any) => r.created_by).filter(Boolean))) as string[];
        const nomes: Record<string, string> = {};
        if (createdByIds.length) {
          const { data: profs, error: profsError } = await supabase.from('profiles').select('id, nome').in('id', createdByIds);
          if (!profsError) (profs || []).forEach(p => { nomes[p.id] = p.nome || '—'; });
        }

        return (data || [])
          .map((r: any) => {
            const id = r.created_by || r.formador || r.observador || r.equipe;
            const nome = nomes[r.created_by] || r.formador || r.observador || r.equipe || '—';
            return id ? { id: String(id), nome } : null;
          })
          .filter(Boolean)
          .filter((item: any, idx: number, arr: any[]) => arr.findIndex(a => a.id === item.id) === idx)
          .sort((a: any, b: any) => sortAZ(a.nome, b.nome));
      }

      const { data, error } = await (supabase as any)
        .from('registros_acao')
        .select('aap_id')
        .in('tipo', actionTypeAliases(instrumento))
        .contains('programa', [programa])
        .limit(5000);
      if (error) throw error;
      const ids = Array.from(new Set((data || []).map((r: any) => r.aap_id).filter(Boolean))) as string[];
      if (!ids.length) return [];
      const { data: profs, error: profsError } = await supabase.from('profiles').select('id, nome').in('id', ids);
      if (profsError) throw profsError;
      return (profs || [])
        .map(p => ({ id: p.id, nome: p.nome || '—' }))
        .sort((a, b) => sortAZ(a.nome, b.nome));
    },
    enabled: !!programa && !!instrumento,
  });

  // Entidades
  const { data: entidades = [], error: entidadesError } = useQuery({
    queryKey: ['extr-entidades', programa, instrumento],
    queryFn: async () => {
      if (!programa) return [] as { id: string; nome: string }[];
      const dedicated = instrumento ? DEDICATED_TABLES[instrumento] : undefined;
      if (dedicated && !hasRegistroAcaoLink(dedicated)) {
        const { data, error } = await (supabase as any)
          .from(dedicated)
          .select('municipio, local')
          .limit(5000);
        if (error) throw error;
        return (data || [])
          .map((r: any) => r.municipio || r.local)
          .filter(Boolean)
          .filter((nome: string, idx: number, arr: string[]) => arr.indexOf(nome) === idx)
          .map((nome: string) => ({ id: nome, nome }))
          .sort((a: any, b: any) => sortAZ(a.nome, b.nome));
      }

      const { data, error } = await (supabase as any)
        .from('escolas').select('id, nome').eq('ativa', true).contains('programa', [programa]);
      if (error) throw error;
      return (data || [])
        .map((e: any) => ({ id: e.id, nome: e.nome || '—' }))
        .sort((a: any, b: any) => sortAZ(a.nome, b.nome));
    },
    enabled: !!programa,
  });

  // Dados
  const { data: result, isFetching, error: resultError } = useQuery({
    queryKey: ['extr-rows', programa, instrumento, atorId, entidadeId, status, dataInicio, dataFim, tick],
    queryFn: async () => {
      if (!programa || !instrumento) return { rows: [] as Row[] };
      const dedicated = DEDICATED_TABLES[instrumento];

      if (dedicated && !hasRegistroAcaoLink(dedicated)) {
        let dedicatedQuery = (supabase as any)
          .from(dedicated)
          .select('*')
          .order('data', { ascending: false })
          .limit(10000);
        if (status !== 'todos') dedicatedQuery = dedicatedQuery.eq('status', status);
        if (dataInicio) dedicatedQuery = dedicatedQuery.gte('data', dataInicio);
        if (dataFim) dedicatedQuery = dedicatedQuery.lte('data', dataFim);
        const { data: dedicatedRows, error: dedicatedError } = await dedicatedQuery;
        if (dedicatedError) throw dedicatedError;

        const createdByIds = Array.from(new Set((dedicatedRows || []).map((r: any) => r.created_by).filter(Boolean))) as string[];
        const nomes: Record<string, string> = {};
        if (createdByIds.length) {
          const { data: profs, error: profsError } = await supabase.from('profiles').select('id, nome').in('id', createdByIds);
          if (profsError) throw profsError;
          (profs || []).forEach(p => { nomes[p.id] = p.nome || '—'; });
        }

        const rows: Row[] = (dedicatedRows || [])
          .filter((raw: any) => {
            if (atorId === 'todos') return true;
            return [raw.created_by, raw.formador, raw.observador, raw.equipe].filter(Boolean).map(String).includes(atorId);
          })
          .filter((raw: any) => {
            if (entidadeId === 'todos') return true;
            return [raw.municipio, raw.local].filter(Boolean).map(String).includes(entidadeId);
          })
          .map((raw: any) => {
          const resposta: Record<string, any> = {};
          Object.keys(raw || {}).forEach(k => { if (!METADATA_COLUMNS.has(k)) resposta[k] = raw[k]; });
          return {
            registro: {
              data: raw.data,
              status: raw.status,
              tipo: instrumento,
              programa: [programa],
              created_at: raw.created_at,
            },
            resposta,
            ator_nome: nomes[raw.created_by] || raw.observador || raw.formador || raw.equipe || '—',
            entidade_nome: raw.municipio || raw.local || '—',
          };
        });

        return { rows };
      }

      let q = (supabase as any).from('registros_acao').select('*')
        .in('tipo', actionTypeAliases(instrumento))
        .contains('programa', [programa])
        .order('data', { ascending: false })
        .limit(10000);
      if (atorId !== 'todos') q = q.eq('aap_id', atorId);
      if (entidadeId !== 'todos') q = q.eq('escola_id', entidadeId);
      if (status !== 'todos') q = q.eq('status', status);
      if (dataInicio) q = q.gte('data', dataInicio);
      if (dataFim) q = q.lte('data', dataFim);
      const { data: regs, error } = await q;
      if (error) throw error;
      const registros = regs || [];
      const registroIds = registros.map((r: any) => r.id);

      const respByReg = new Map<string, any>();
      if (registroIds.length && dedicated) {
        const { data, error: respError } = await (supabase as any).from(dedicated).select('*').in('registro_acao_id', registroIds).limit(10000);
        if (respError) throw respError;
        (data || []).forEach((r: any) => { if (!respByReg.has(r.registro_acao_id)) respByReg.set(r.registro_acao_id, r); });
      } else if (registroIds.length) {
        const { data, error: respError } = await (supabase as any).from('instrument_responses')
          .select('responses, registro_acao_id').eq('form_type', instrumento).in('registro_acao_id', registroIds).limit(10000);
        if (respError) throw respError;
        (data || []).forEach((r: any) => { if (!respByReg.has(r.registro_acao_id)) respByReg.set(r.registro_acao_id, r.responses || {}); });
      }

      const aapIds = Array.from(new Set(registros.map((r: any) => r.aap_id).filter(Boolean))) as string[];
      const escIds = Array.from(new Set(registros.map((r: any) => r.escola_id).filter(Boolean))) as string[];
      const nomes: Record<string, string> = {};
      const escolas: Record<string, string> = {};
      if (aapIds.length) {
        const { data: profs, error: profsError } = await supabase.from('profiles').select('id, nome').in('id', aapIds);
        if (profsError) throw profsError;
        (profs || []).forEach(p => { nomes[p.id] = p.nome || '—'; });
      }
      if (escIds.length) {
        const { data: escs, error: escsError } = await (supabase as any).from('escolas').select('id, nome').in('id', escIds);
        if (escsError) throw escsError;
        (escs || []).forEach((e: any) => { escolas[e.id] = e.nome || '—'; });
      }

      const rows: Row[] = registros.map((reg: any) => {
        const raw = respByReg.get(reg.id) || {};
        const resposta: Record<string, any> = {};
        if (dedicated) {
          Object.keys(raw).forEach(k => { if (!METADATA_COLUMNS.has(k)) resposta[k] = raw[k]; });
        } else {
          Object.keys(raw).forEach(k => { if (!METADATA_COLUMNS.has(k)) resposta[k] = raw[k]; });
        }
        return {
          registro: reg,
          resposta,
          ator_nome: nomes[reg.aap_id] || '—',
          entidade_nome: escolas[reg.escola_id] || '—',
        };
      });
      return { rows };
    },
    enabled: shouldFetch && !!programa && !!instrumento,
  });

  const rows = result?.rows || [];
  const blockingError = instrumentosError || atoresError || entidadesError;
  const queryError = blockingError || resultError;
  const queryErrorMessage = queryError instanceof Error
    ? queryError.message
    : queryError
      ? 'Não foi possível carregar os dados para este perfil.'
      : '';

  // Colunas do registro presentes nos dados (excluindo IDs internos)
  const registroFields = useMemo(() => {
    const seen = new Set<string>();
    const out: { key: string; label: string }[] = [];
    rows.forEach(r => {
      Object.keys(r.registro || {}).forEach(k => {
        if (REGISTRO_EXCLUDE.has(k) || seen.has(k)) return;
        seen.add(k);
        out.push({ key: k, label: REGISTRO_LABELS[k] || humanizeKey(k) });
      });
    });
    // Ordem amigável: campos comuns primeiro
    const priority = ['data', 'hora_inicio', 'hora_fim', 'status', 'tipo', 'programa'];
    out.sort((a, b) => {
      const ia = priority.indexOf(a.key); const ib = priority.indexOf(b.key);
      if (ia !== -1 || ib !== -1) return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
      return sortAZ(a.label, b.label);
    });
    return out;
  }, [rows]);

  const respostaFields = useMemo(() => {
    const seen = new Set<string>();
    const out: { key: string; label: string }[] = [];
    rows.forEach(r => {
      Object.keys(r.resposta || {}).forEach(k => {
        if (seen.has(k)) return;
        seen.add(k);
        out.push({ key: k, label: humanizeKey(k) });
      });
    });
    return out;
  }, [rows]);

  const instrumentoLabel = instrumentosDisponiveis.find(i => i.value === instrumento)?.label || instrumento;

  const formatRegistroValue = (key: string, v: any) => {
    if (key === 'data' && v) {
      try { return format(parseISO(v), 'dd/MM/yyyy'); } catch { return formatCell(v); }
    }
    if (key === 'status') return statusLabel(v);
    if (key === 'tipo') return ACAO_TYPE_INFO[v as AcaoTipo]?.label || formatCell(v);
    if (key === 'programa' && Array.isArray(v)) return v.map((p: string) => programaLabels[p as ProgramaType] || p).join(', ');
    if ((key === 'created_at' || key === 'updated_at') && v) {
      try { return format(parseISO(v), 'dd/MM/yyyy HH:mm'); } catch { return formatCell(v); }
    }
    return formatCell(v);
  };

  const handleGerar = () => {
    if (!programa || !instrumento) return;
    setShouldFetch(true);
    setTick(t => t + 1);
  };

  const handleDownload = () => {
    if (!rows.length) return;
    const header = [
      'Ator', 'Entidade',
      ...registroFields.map(f => f.label),
      ...respostaFields.map(f => f.label),
    ];
    const aoa: any[][] = [header];
    rows.forEach(r => {
      aoa.push([
        r.ator_nome,
        r.entidade_nome,
        ...registroFields.map(f => formatRegistroValue(f.key, r.registro?.[f.key])),
        ...respostaFields.map(f => formatCell(r.resposta?.[f.key])),
      ]);
    });
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Extração');
    const filename = `extracao_${slugify(programaLabels[programa as ProgramaType] || '')}_${slugify(instrumentoLabel)}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  const previewRows = rows.slice(0, 50);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Extração de Bases - Instrumentos</h1>
        <p className="text-muted-foreground mt-1">
          Exporte em Excel todos os registros das ações/eventos habilitados para o programa selecionado.
        </p>
      </div>

      {allowed && userProgramas.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Este perfil não possui programa vinculado. Vincule ao menos um programa ao usuário para liberar a extração de bases.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Programa *</Label>
              <Select value={programa} onValueChange={onChangePrograma} disabled={userProgramas.length === 0}>
                <SelectTrigger><SelectValue placeholder="Selecione o programa" /></SelectTrigger>
                <SelectContent>
                  {userProgramas.map(p => (
                    <SelectItem key={p} value={p}>{programaLabels[p]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Instrumento (Ação/Evento) *</Label>
              <Select value={instrumento} onValueChange={onChangeInstrumento} disabled={!programa || isLoadingInstrumentos || instrumentosDisponiveis.length === 0}>
                <SelectTrigger>
                  <SelectValue placeholder={
                    !programa
                      ? 'Selecione o programa primeiro'
                      : isLoadingInstrumentos
                        ? 'Carregando instrumentos...'
                        : instrumentosDisponiveis.length === 0
                          ? 'Nenhum instrumento disponível'
                          : 'Selecione o instrumento'
                  } />
                </SelectTrigger>
                <SelectContent>
                  {instrumentosDisponiveis.map(i => (
                    <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {programa && !isLoadingInstrumentos && instrumentosDisponiveis.length === 0 && !blockingError && (
            <div className="rounded-md border border-muted bg-muted/30 p-4 text-sm text-muted-foreground">
              Nenhum instrumento com registros encontrados para o programa selecionado.
            </div>
          )}

          {blockingError && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              Erro ao carregar dados: {queryErrorMessage}
            </div>
          )}

          {instrumento && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t">
              <div className="space-y-2">
                <Label>Ator</Label>
                <Select value={atorId} onValueChange={setAtorId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {atores.map(a => <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Entidade</Label>
                <Select value={entidadeId} onValueChange={setEntidadeId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas</SelectItem>
                    {(entidades as any[]).map(e => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Data início</Label>
                <Input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Data fim</Label>
                <Input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} />
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button onClick={handleGerar} disabled={!programa || !instrumento || isFetching || !!blockingError}>
              {isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSpreadsheet className="mr-2 h-4 w-4" />}
              Gerar Relatório
            </Button>
          </div>
        </CardContent>
      </Card>

      {shouldFetch && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              Prévia {rows.length > 0 && <span className="text-sm font-normal text-muted-foreground">({previewRows.length} de {rows.length} registros)</span>}
            </CardTitle>
            <Button onClick={handleDownload} disabled={!rows.length} variant="default">
              <Download className="mr-2 h-4 w-4" />
              Baixar Excel
            </Button>
          </CardHeader>
          <CardContent>
            {isFetching ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Carregando...
              </div>
            ) : resultError ? (
              <div className="text-center py-12 text-destructive">Erro ao gerar relatório: {queryErrorMessage}</div>
            ) : rows.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">Nenhum registro encontrado para os filtros selecionados.</div>
            ) : (
              <div className="max-h-[60vh] overflow-auto border rounded-md">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead className="whitespace-nowrap">Ator</TableHead>
                      <TableHead className="whitespace-nowrap">Entidade</TableHead>
                      {registroFields.map(f => <TableHead key={`r-${f.key}`} className="whitespace-nowrap">{f.label}</TableHead>)}
                      {respostaFields.map(f => <TableHead key={`q-${f.key}`} className="whitespace-nowrap">{f.label}</TableHead>)}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewRows.map((r, i) => (
                      <TableRow key={r.registro?.id || i}>
                        <TableCell className="whitespace-nowrap">{r.ator_nome}</TableCell>
                        <TableCell className="whitespace-nowrap">{r.entidade_nome}</TableCell>
                        {registroFields.map(f => (
                          <TableCell key={`r-${f.key}`} className="max-w-[300px] truncate" title={formatRegistroValue(f.key, r.registro?.[f.key])}>
                            {formatRegistroValue(f.key, r.registro?.[f.key])}
                          </TableCell>
                        ))}
                        {respostaFields.map(f => (
                          <TableCell key={`q-${f.key}`} className="max-w-[300px] truncate" title={formatCell(r.resposta?.[f.key])}>
                            {formatCell(r.resposta?.[f.key])}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
