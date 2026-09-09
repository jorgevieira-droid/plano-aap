import { useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import {
  Loader2, FileText, Users, Star, Gauge, Building2, Eye, MessageSquare, Sparkles,
  ClipboardList, Target, Clock, Link2, GraduationCap, ArrowRight, XCircle, CalendarCheck,
  Download,
} from 'lucide-react';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { MultiSelectFilter } from '@/components/forms/MultiSelectFilter';
import { cn } from '@/lib/utils';
import { usePersistedState, writePersistedFilters } from '@/hooks/usePersistedState';
import { componenteLabels } from '@/data/mockData';
import { APOIO_COMPONENTE_OPTIONS_NEW } from '@/components/formularios/apoioPresencialShared';

const sortPt = (a: string, b: string) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' });

const num = (v: any): number | null => {
  const n = Number(v);
  return Number.isFinite(n) && v !== '' && v !== null && v !== undefined ? n : null;
};
const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);
const calcNps = (notas: number[]): number | null => {
  if (!notas.length) return null;
  const promotores = notas.filter((n) => n >= 9).length;
  const detratores = notas.filter((n) => n <= 6).length;
  return Math.round(((promotores - detratores) / notas.length) * 100);
};
const fmtNps = (v: number | null) => (v === null ? '—' : `${v > 0 ? '+' : ''}${v}`);
const fmt = (v: number | null, digits = 1) => (v === null ? '—' : v.toFixed(digits).replace('.', ','));
const pad = (n: number) => String(n).padStart(2, '0');
const pct = (part: number, total: number) => (total ? `${Math.round((part / total) * 100)}%` : '0%');

type CaeCounts = { apoio: number; planejamento: number; aula: number; total: number };

const CAE_SERIES = [
  { key: 'apoio' as const, label: 'Apoio Presencial', dot: 'bg-[#1a3a5c]', bar: 'bg-[#1a3a5c]' },
  { key: 'planejamento' as const, label: 'Planejamento Conjunto', dot: 'bg-emerald-600', bar: 'bg-emerald-600' },
  { key: 'aula' as const, label: 'Aula Compartilhada', dot: 'bg-amber-500', bar: 'bg-amber-500' },
];

function CaeDistItem({ item, max }: { item: CaeCounts & { nome: string }; max: number }) {
  return (
    <div>
      <div className="mb-1 flex items-start justify-between gap-2 text-xs">
        <span className="font-medium text-foreground/80">{item.nome}</span>
        <span className="font-semibold text-foreground">{item.total}</span>
      </div>
      <div className="mb-1 flex h-1.5 w-full overflow-hidden rounded-full bg-muted">
        {CAE_SERIES.map((s) => (
          <div
            key={s.key}
            className={cn('h-1.5', s.bar)}
            style={{ width: `${Math.round((item[s.key] / max) * 100)}%` }}
          />
        ))}
      </div>
      <p className="text-[9px] text-muted-foreground">
        AP {item.apoio} · PC {item.planejamento} · AC {item.aula}
      </p>
    </div>
  );
}

const FORM_TYPES = [
  'registro_apoio_presencial',
  'registro_consultoria_pedagogica',
  'registro_apoio_coordenador',
  'registro_planejamento_conjunto',
  'registro_formacao_coletiva',
  'registro_aula_compartilhada',
  'registro_encaminhamentos_internos',
] as const;

type FormType = (typeof FORM_TYPES)[number];

interface Row {
  id: string;
  formType: FormType;
  data?: string;
  aapId?: string;
  escolaId?: string;
  consultor: string;
  escola: string;
  coordenador: string;
  componente?: string;
  anoSerie?: string;
  professor?: string;
  resp: Record<string, any>;
}

interface Kpi {
  label: string;
  value: string;
  icon: typeof FileText;
  accent: string;
  bgColor: string;
  iconColor: string;
}

interface Bloco {
  formType: FormType;
  titulo: string;
  descricao: string;
  path: string;
  prefix: string;
  kpis: Kpi[];
}

const palette = [
  { accent: 'bg-[#1a3a5c]', bgColor: 'bg-[#1a3a5c]/10', iconColor: 'text-[#1a3a5c]' },
  { accent: 'bg-emerald-600', bgColor: 'bg-emerald-600/10', iconColor: 'text-emerald-600' },
  { accent: 'bg-violet-600', bgColor: 'bg-violet-600/10', iconColor: 'text-violet-600' },
  { accent: 'bg-amber-600', bgColor: 'bg-amber-600/10', iconColor: 'text-amber-600' },
  { accent: 'bg-cyan-600', bgColor: 'bg-cyan-600/10', iconColor: 'text-cyan-600' },
  { accent: 'bg-rose-600', bgColor: 'bg-rose-600/10', iconColor: 'text-rose-600' },
];

const kpi = (label: string, value: string, icon: typeof FileText, i: number): Kpi => ({
  label,
  value,
  icon,
  ...palette[i % palette.length],
});

export default function RelatoriosGestaoEscolasPage() {
  const { profile, isAdmin, hasRole, effectiveProgramas } = useAuth();
  const navigate = useNavigate();

  const isGestorOrN3 = hasRole('gestor') || hasRole('n3_coordenador_programa');
  const hasEscolas = (effectiveProgramas || []).includes('escolas' as any);
  const allowed = isAdmin || (isGestorOrN3 && hasEscolas);

  useEffect(() => {
    if (profile && !allowed) navigate('/unauthorized', { replace: true });
  }, [profile, allowed, navigate]);

  const [dataInicio, setDataInicio] = usePersistedState('relatorios-gestao-escolas:dataInicio', '');
  const [dataFim, setDataFim] = usePersistedState('relatorios-gestao-escolas:dataFim', '');
  const [consultorIds, setConsultorIds] = usePersistedState<string[]>('relatorios-gestao-escolas:consultorIds', []);
  const [escolaIds, setEscolaIds] = usePersistedState<string[]>('relatorios-gestao-escolas:escolaIds', []);

  const { data: rows, isLoading } = useQuery({
    queryKey: ['relatorios-gestao-escolas'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('instrument_responses')
        .select(`
          id, responses, form_type, registro_acao_id,
          registros_acao:registro_acao_id (
            id, data, aap_id, escola_id, programa, status, componente, ano_serie, segmento,
            profiles:aap_id ( id, nome ),
            escolas:escola_id ( id, nome ),
            programacoes:programacao_id ( id, coord_nome, apoio_professor_nome, apoio_componente, apoio_ano_serie )
          )
        `)
        .in('form_type', FORM_TYPES as unknown as string[]);
      if (error) throw error;
      return (data || [])
        .filter(
          (r: any) =>
            r.registros_acao?.status === 'realizada' &&
            (r.registros_acao?.programa || []).includes('escolas'),
        )
        .map((r: any): Row => {
          const reg = r.registros_acao;
          return {
            id: r.id,
            formType: r.form_type,
            data: reg?.data,
            aapId: reg?.aap_id,
            escolaId: reg?.escola_id,
            consultor: reg?.profiles?.nome || 'Sem consultor(a)',
            escola: reg?.escolas?.nome || 'Sem entidade',
            coordenador: reg?.programacoes?.coord_nome || '—',
            professor: (reg?.programacoes?.apoio_professor_nome || '').toString().trim() || undefined,
            componente:
              (reg?.programacoes?.apoio_componente || '').toString().trim() ||
              (reg?.componente && reg.componente !== 'todos' ? reg.componente : undefined),
            anoSerie:
              (reg?.programacoes?.apoio_ano_serie || '').toString().trim() ||
              (reg?.ano_serie && reg.ano_serie !== 'todos' ? reg.ano_serie : undefined),
            resp: r.responses || {},
          };
        });
    },
    enabled: allowed,
  });

  const consultores = useMemo(() => {
    const m = new Map<string, string>();
    (rows || []).forEach((r) => { if (r.aapId) m.set(r.aapId, r.consultor); });
    return Array.from(m, ([value, label]) => ({ value, label })).sort((a, b) => sortPt(a.label, b.label));
  }, [rows]);

  const escolas = useMemo(() => {
    const m = new Map<string, string>();
    (rows || []).forEach((r) => { if (r.escolaId) m.set(r.escolaId, r.escola); });
    return Array.from(m, ([value, label]) => ({ value, label })).sort((a, b) => sortPt(a.label, b.label));
  }, [rows]);

  const filtered = useMemo(() => (rows || []).filter((r) => {
    if (consultorIds.length > 0 && !consultorIds.includes(r.aapId || '')) return false;
    if (escolaIds.length > 0 && !escolaIds.includes(r.escolaId || '')) return false;
    if (dataInicio && (r.data || '') < dataInicio) return false;
    if (dataFim && (r.data || '') > dataFim) return false;
    return true;
  }), [rows, consultorIds, escolaIds, dataInicio, dataFim]);

  const byType = useMemo(() => {
    const m = new Map<FormType, Row[]>();
    FORM_TYPES.forEach((t) => m.set(t, []));
    filtered.forEach((r) => m.get(r.formType)?.push(r));
    return m;
  }, [filtered]);

  const blocos = useMemo<Bloco[]>(() => {
    const get = (t: FormType) => byType.get(t) || [];
    const nums = (list: Row[], key: string) =>
      list.map((r) => num(r.resp[key])).filter((n): n is number => n !== null);
    const count = (list: Row[], fn: (r: Row) => boolean) => list.filter(fn).length;

    const apoio = get('registro_apoio_presencial');
    const coordenacao = get('registro_consultoria_pedagogica');
    const apoioCoord = get('registro_apoio_coordenador');
    const planejamento = get('registro_planejamento_conjunto');
    const coletiva = get('registro_formacao_coletiva');
    const aula = get('registro_aula_compartilhada');
    const rei = get('registro_encaminhamentos_internos');

    
    
    const profsColetiva = nums(coletiva, 'qtd_professores');
    const elegiveis = nums(planejamento, 'estudantes_elegiveis');
    const abaixoBasico = nums(planejamento, 'estudantes_abaixo_basico');
    const planejadoSim = count(aula, (r) => r.resp.ocorreu_planejado === 'Sim');

    return [
      {
        formType: 'registro_apoio_presencial',
        titulo: 'Relatórios – Apoio Presencial',
        descricao: 'Programa Escolas — indicadores, rubricas e autoavaliação no período selecionado.',
        path: '/relatorios-apoio-presencial',
        prefix: 'relatorios-apoio-presencial',
        kpis: [
          kpi('Total de apoios realizados', pad(apoio.length), FileText, 0),
          kpi('Total de devolutivas realizadas', pad(count(apoio, (r) => r.resp.devolutiva_realizada === 'Sim')), MessageSquare, 1),
          kpi('Apoios em turmas adaptadas VOAR', pad(count(apoio, (r) => r.resp.turma_voar === 'Sim')), Sparkles, 3),
          kpi('Apoios com outros observadores', pad(count(apoio, (r) => Array.isArray(r.resp.outros_observadores) && r.resp.outros_observadores.length > 0)), Eye, 2),
        ],
      },
      {
        formType: 'registro_consultoria_pedagogica',
        titulo: 'Relatório – Apoio Presencial com a Coordenação',
        descricao: 'Programa Escolas — indicadores da parceria com a coordenação no período selecionado.',
        path: '/relatorios-apoio-coordenacao',
        prefix: 'relatorios-apoio-coordenacao',
        kpis: [
          kpi('Total de registros realizados', pad(coordenacao.length), FileText, 0),
          kpi('Observou a aula do início ao fim', pad(count(coordenacao, (r) => r.resp.observou_inicio_fim === 'Sim')), Eye, 4),
          kpi('Devolutivas planejadas', pad(count(coordenacao, (r) => r.resp.devolutiva_planejada === 'Sim')), ClipboardList, 2),
          kpi('Devolutivas realizadas', pad(count(coordenacao, (r) => r.resp.devolutiva_realizada === 'Sim')), MessageSquare, 1),
          kpi('Registros em turma do VOAR', pad(count(coordenacao, (r) => r.resp.turma_voar === 'Sim')), Sparkles, 3),
          kpi('Tematização posterior', pad(count(coordenacao, (r) => r.resp.tematizacao_posterior === 'Sim')), XCircle, 5),
        ],
      },
      {
        formType: 'registro_apoio_coordenador',
        titulo: 'Relatório – Reunião com a coordenação',
        descricao: 'Programa Escolas — foco, temas, participação do coordenador e encaminhamentos das reuniões.',
        path: '/relatorios-apoio-coordenador',
        prefix: 'relatorios-apoio-coordenador',
        kpis: [
          kpi('Apoios registrados', pad(apoioCoord.length), FileText, 0),
          kpi('Escolas atendidas', pad(new Set(apoioCoord.map((r) => r.escola)).size), Building2, 4),
          kpi('Coordenadores atendidos', pad(new Set(apoioCoord.map((r) => r.coordenador.trim()).filter((c) => c && c !== '—')).size), Users, 2),
          kpi('Reuniões com encaminhamentos', pad(count(apoioCoord, (r) => r.resp.encaminhamentos === 'Sim')), ClipboardList, 1),
        ],
      },
      {
        formType: 'registro_planejamento_conjunto',
        titulo: 'Relatório – Planejamento conjunto com prof.',
        descricao: 'Programa Escolas — planejamentos conjuntos com o professor, perfil das turmas e acompanhamento das aulas.',
        path: '/relatorios-planejamento-conjunto',
        prefix: 'relatorios-planejamento-conjunto',
        kpis: [
          kpi('Planejamentos registrados', pad(planejamento.length), FileText, 0),
          kpi('Escolas atendidas', pad(new Set(planejamento.map((r) => r.escola)).size), Building2, 4),
          kpi('Consultores(as) envolvidos', pad(new Set(planejamento.map((r) => r.consultor)).size), Users, 2),
          kpi('Média de estudantes elegíveis', fmt(avg(elegiveis)), Target, 3),
          kpi('Média abaixo do básico', fmt(avg(abaixoBasico)), Gauge, 5),
          kpi('Com desafios na elaboração', pad(count(planejamento, (r) => r.resp.houve_desafios === 'Sim')), Sparkles, 1),
        ],
      },
      {
        formType: 'registro_formacao_coletiva',
        titulo: 'Relatório – Formação Coletiva',
        descricao: 'Programa Escolas — participação, avaliação e destaques das formações coletivas.',
        path: '/relatorios-formacao-coletiva',
        prefix: 'relatorios-formacao-coletiva',
        kpis: [
          kpi('Formações coletivas realizadas', pad(coletiva.length), FileText, 0),
          kpi('Professores participantes', pad(profsColetiva.reduce((a, b) => a + b, 0)), Users, 2),
          kpi('Média de professores por formação', fmt(avg(profsColetiva)), GraduationCap, 4),
          kpi('Formações conforme planejado', pad(count(coletiva, (r) => r.resp.conforme_planejado === 'Sim')), Star, 1),
          kpi('Formações com link da pauta', pad(count(coletiva, (r) => String(r.resp.link_pauta || '').trim() !== '')), Link2, 5),
        ],
      },
      {
        formType: 'registro_aula_compartilhada',
        titulo: 'Relatório – Aula compartilhada com prof.',
        descricao: 'Programa Escolas — temas, planejamento prévio, aderência ao planejado e tematização posterior.',
        path: '/relatorios-aula-compartilhada',
        prefix: 'relatorios-aula-compartilhada',
        kpis: [
          kpi('Aulas compartilhadas', pad(aula.length), FileText, 0),
          kpi('Planejadas previamente com prof.', pad(count(aula, (r) => r.resp.planejada_previamente === 'Sim')), Sparkles, 1),
          kpi('Escolas atendidas', pad(new Set(aula.map((r) => r.escola)).size), Building2, 4),
          kpi('Consultores(as) envolvidos', pad(new Set(aula.map((r) => r.consultor)).size), Users, 2),
          kpi('Com tematização posterior', pad(count(aula, (r) => r.resp.tematizacao_posterior === 'Sim')), MessageSquare, 3),
          kpi('% aulas como planejado', pct(planejadoSim, aula.length), CalendarCheck, 5),
        ],
      },
      {
        formType: 'registro_encaminhamentos_internos',
        titulo: 'Painel – Registro de Encaminhamentos Internos',
        descricao: 'Acompanhe os registros por consultor(a) e escola no período selecionado.',
        path: '/painel-encaminhamentos-internos',
        prefix: 'painel-encaminhamentos-internos',
        kpis: [
          kpi('Total de registros no período', pad(rei.length), FileText, 0),
          kpi('Consultores(as) selecionados', pad(new Set(rei.map((r) => r.consultor)).size), Users, 2),
          kpi('Escolas selecionadas', pad(new Set(rei.map((r) => r.escola)).size), Building2, 4),
        ],
      },
    ];
  }, [byType]);

  const cae = useMemo(() => {
    const apoio = [
      ...(byType.get('registro_apoio_presencial') || []),
      ...(byType.get('registro_planejamento_conjunto') || []),
      ...(byType.get('registro_aula_compartilhada') || []),
    ];


    const normComponente = (v: string): string | null => {
      const raw = String(v).trim();
      if (!raw) return null;
      // Legado: rótulo anterior que agora se chama "COLABORATIVO EFAI"
      if (raw.toUpperCase() === 'COLABORATIVO TUTOR EFAI') return 'COLABORATIVO EFAI';
      // Valores da lista oficial do campo "Componente" (Apoio Presencial)
      const fromList = APOIO_COMPONENTE_OPTIONS_NEW.find(
        (opt) => opt.toUpperCase() === raw.toUpperCase()
      );
      if (fromList) return fromList;
      // Valores legados/enumerados: usar o rótulo amigável
      const enumLabel = (componenteLabels as any)[raw];
      if (enumLabel) return String(enumLabel);
      return 'Outros';
    };
    const normAnoSerie = (v: string): string | null => {
      const m = String(v).match(/(\d)/);
      if (!m) return null;
      const n = Number(m[1]);
      return n >= 1 && n <= 9 ? `${n}º Ano` : 'Outros';
    };

    const bucketOf = (r: Row): 'apoio' | 'planejamento' | 'aula' =>
      r.formType === 'registro_planejamento_conjunto'
        ? 'planejamento'
        : r.formType === 'registro_aula_compartilhada'
          ? 'aula'
          : 'apoio';

    type Counts = { apoio: number; planejamento: number; aula: number; total: number };
    const zero = (): Counts => ({ apoio: 0, planejamento: 0, aula: 0, total: 0 });

    const profMap = new Map<string, { professor: string; escola: string; componente: string } & Counts>();
    apoio.forEach((r) => {
      const prof = String(r.professor || r.resp.professor || '').trim();
      if (!prof || prof === 'Sem professor') return;
      const comp = r.componente ? normComponente(r.componente) || '—' : '—';
      const key = `${prof.toLowerCase()}|${r.escola}|${comp}`;
      let cur = profMap.get(key);
      if (!cur) {
        cur = { professor: prof, escola: r.escola, componente: comp, ...zero() };
        profMap.set(key, cur);
      }
      cur[bucketOf(r)] += 1;
      cur.total += 1;
    });
    const professores = Array.from(profMap.values()).sort(
      (a, b) => sortPt(a.professor, b.professor) || sortPt(a.escola, b.escola) || sortPt(a.componente, b.componente),
    );
    const profsDistintos = new Set(professores.map((p) => p.professor.toLowerCase())).size;

    const dist = (getLabel: (r: Row) => string | null | undefined) => {
      const m = new Map<string, Counts>();
      apoio.forEach((r) => {
        const label = getLabel(r);
        if (!label) return;
        let cur = m.get(label);
        if (!cur) {
          cur = zero();
          m.set(label, cur);
        }
        cur[bucketOf(r)] += 1;
        cur.total += 1;
      });
      const arr = Array.from(m, ([nome, c]) => ({ nome, ...c })).sort((a, b) => sortPt(a.nome, b.nome));
      const max = Math.max(1, ...arr.map((i) => i.total));
      return { arr, max };
    };

    return {
      professores,
      profsDistintos,
      porComponente: dist((r) => (r.componente ? normComponente(r.componente) : null)),
      porAnoSerie: dist((r) => (r.anoSerie ? normAnoSerie(r.anoSerie) : null)),
    };
  }, [byType]);

  const periodoLabel = `${dataInicio ? format(parseISO(dataInicio), 'dd/MM/yyyy') : '—'} a ${dataFim ? format(parseISO(dataFim), 'dd/MM/yyyy') : '—'}`;

  return (
    <div className="min-w-0 space-y-8 overflow-x-hidden p-6 md:p-8">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Relatórios de Gestão - Programa Escolas
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Visão consolidada dos relatórios do Programa Escolas. Use os filtros para ajustar o período e abra cada relatório para o detalhamento completo.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
            Período: {periodoLabel}
          </span>
          <span className="rounded-full border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
            {filtered.length} registros realizados
          </span>
        </div>
      </div>

      <Card className="border shadow-sm">
        <CardContent className="grid grid-cols-1 gap-4 p-5 md:grid-cols-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Consultor(a)</Label>
            <MultiSelectFilter
              options={consultores}
              selected={consultorIds}
              onChange={setConsultorIds}
              allLabel="Todos(as)"
              itemNoun="Consultor(a)"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Escola</Label>
            <MultiSelectFilter
              options={escolas}
              selected={escolaIds}
              onChange={setEscolaIds}
              allLabel="Todas"
              itemNoun="Escola"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Data Início</Label>
            <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Data Fim</Label>
            <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {blocos.map((bloco) => (
            <Card key={bloco.formType} className="flex flex-col border shadow-sm">
              <CardContent className="flex flex-1 flex-col gap-4 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="break-words text-base font-semibold text-foreground">{bloco.titulo}</h2>
                    <p className="mt-1 break-words text-xs text-muted-foreground">{bloco.descricao}</p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="shrink-0"
                    onClick={() => {
                      writePersistedFilters(bloco.prefix, { dataInicio, dataFim, consultorIds, escolaIds });
                      navigate(bloco.path);
                    }}
                  >
                    Visualizar Relatório
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {bloco.kpis.map((c) => (
                    <div
                      key={c.label}
                      className="relative overflow-hidden rounded-lg border bg-card p-4 shadow-sm"
                    >
                      <div className={cn('absolute inset-x-0 top-0 h-1', c.accent)} />
                      <div className="flex items-center gap-3">
                        <div className={cn('rounded-full p-2', c.bgColor)}>
                          <c.icon className={cn('h-5 w-5', c.iconColor)} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-2xl font-bold leading-none text-foreground">{c.value}</p>
                          <p className="mt-1 break-words text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            {c.label}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && (
        <Card className="overflow-hidden border shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-4">
            <h2 className="text-sm font-bold uppercase tracking-wide text-foreground">Indicadores - Caê</h2>
            <div className="flex flex-wrap items-center gap-3">
              {CAE_SERIES.map((s) => (
                <span key={s.key} className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
                  <span className={cn('h-2 w-2 rounded-sm', s.dot)} />
                  {s.label}
                </span>
              ))}
            </div>
          </div>

          <CardContent className="p-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              {/* Esquerda: KPI + Apoios por Componente */}
              <div className="space-y-6 lg:col-span-3">
                <div className="relative overflow-hidden rounded-lg border bg-card p-5 shadow-sm">
                  <div className="absolute inset-x-0 top-0 h-1 bg-[#1a3a5c]" />
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Professores Atendidos
                  </p>
                  <span className="text-4xl font-bold text-foreground">{cae.profsDistintos}</span>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Apoios por Componente
                  </p>
                  <div className="space-y-3">
                    {cae.porComponente.arr.map((item) => (
                      <CaeDistItem key={item.nome} item={item} max={cae.porComponente.max} />
                    ))}
                    {cae.porComponente.arr.length === 0 && (
                      <p className="text-xs text-muted-foreground">Sem registros no período.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Centro: Apoios por Ano/Série */}
              <div className="space-y-4 lg:col-span-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Apoios por Ano/Série
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {cae.porAnoSerie.arr.map((item) => (
                    <div key={item.nome} className="rounded-lg border bg-muted/40 p-3">
                      <CaeDistItem item={item} max={cae.porAnoSerie.max} />
                    </div>
                  ))}
                  {cae.porAnoSerie.arr.length === 0 && (
                    <p className="text-xs text-muted-foreground">Sem registros no período.</p>
                  )}
                </div>
              </div>

              {/* Direita: Professores Apoiados */}
              <div className="flex flex-col lg:col-span-6 lg:h-0 lg:min-h-full">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Professores Apoiados
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1.5 text-[11px]"
                    onClick={exportProfessoresExcel}
                    disabled={cae.professores.length === 0}
                  >
                    <Download className="h-3.5 w-3.5" />
                    Exportar Excel
                  </Button>
                </div>
                <div className="flex flex-1 flex-col overflow-hidden rounded-lg border">
                  <div className="min-h-0 flex-1 overflow-auto">
                    <table className="w-full text-left">
                      <thead className="sticky top-0 z-10 bg-card shadow-[0_1px_0_0_hsl(var(--border))]">
                        <tr>
                          <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">
                            Professor
                          </th>
                          <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">
                            Escola
                          </th>
                          <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">
                            Componente
                          </th>
                          <th className="px-2 py-2 text-right text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">
                            Apoio Presencial
                          </th>
                          <th className="px-2 py-2 text-right text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">
                            Planej. Conjunto
                          </th>
                          <th className="px-2 py-2 text-right text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">
                            Aula Compart.
                          </th>
                          <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {cae.professores.map((p) => (
                          <tr key={`${p.professor}-${p.escola}-${p.componente}`} className="hover:bg-muted/40">
                            <td className="px-3 py-3 text-xs font-semibold text-foreground">{p.professor}</td>
                            <td className="px-3 py-3 text-xs text-muted-foreground">{p.escola}</td>
                            <td className="px-3 py-3 text-xs text-muted-foreground">{p.componente}</td>
                            <td className="px-2 py-3 text-right text-xs text-muted-foreground">{p.apoio}</td>
                            <td className="px-2 py-3 text-right text-xs text-muted-foreground">{p.planejamento}</td>
                            <td className="px-2 py-3 text-right text-xs text-muted-foreground">{p.aula}</td>
                            <td className="px-3 py-3 text-right text-xs font-semibold text-foreground">{p.total}</td>
                          </tr>
                        ))}
                        {cae.professores.length === 0 && (
                          <tr>
                            <td colSpan={7} className="px-4 py-6 text-center text-xs text-muted-foreground">
                              Sem professores apoiados no período.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="border-t bg-muted/40 px-4 py-2">
                    <p className="text-[9px] text-muted-foreground">
                      Exibindo {cae.professores.length} registros
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
