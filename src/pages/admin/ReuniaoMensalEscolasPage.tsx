import { cloneElement, useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { format, parseISO, startOfWeek, addDays, subMonths } from 'date-fns';
import { Loader2, Download, Pencil } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer, LabelList,
} from 'recharts';
import { toast } from 'sonner';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { MultiSelectFilter } from '@/components/forms/MultiSelectFilter';
import { usePersistedState } from '@/hooks/usePersistedState';
import { exportSectionsToPdf } from '@/lib/pdfExport';
import { COBERTURA_GRUPOS, grupoCobertura, PROFESSOR_CATEGORIAS } from '@/config/entidadeCategorias';
import { FORMACAO_COLETIVA_PARTICIPACAO_OPTIONS, normalizeParticipacaoPauta } from '@/components/formularios/OlharParceiroContents';

const sortPt = (a: string, b: string) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' });
const pctN = (p: number, t: number) => (t ? Math.round((p / t) * 100) : 0);
const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const C = { a: '#1a3a5c', b: '#0891b2', c: '#f59e0b', d: '#dc2626', e: '#16a34a' };

const FORM_TYPES = [
  'registro_apoio_presencial', 'registro_consultoria_pedagogica', 'registro_apoio_coordenador',
  'registro_planejamento_conjunto', 'registro_formacao_coletiva', 'registro_aula_compartilhada',
];

const PART_LABEL: Record<string, string> = {
  'Trouxe sugestões à pauta elaborada pelo consultor': 'Trouxe sugestões',
  'Apenas validou': 'Apenas validou',
  'Participou ativamente na ideação, construção e validação da pauta': 'Participou ativamente',
  'Não participou': 'Não participou',
};
const PART_COLORS = [C.d, C.b, C.a, C.e];

interface Row {
  id: string; formType: string; data: string; aapId?: string; escolaId?: string;
  consultor: string; escola: string; professor?: string; componente?: string; anoSerie?: string;
  resp: Record<string, any>;
}

const etapaDeAno = (a?: string): 'EFAI' | 'EFAF' | 'EM' | null => {
  const s = (a || '').toLowerCase();
  if (s.includes('série') || s.includes('serie')) return 'EM';
  const n = parseInt(s, 10);
  if (n >= 1 && n <= 5) return 'EFAI';
  if (n >= 6 && n <= 9) return 'EFAF';
  return null;
};

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} data-pdf-section className="rounded-lg border bg-card p-4 space-y-3" style={{ breakInside: 'avoid' }}>
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  );
}

function Chart({ pdf, height = 280, children }: { pdf?: boolean; height?: number; children: React.ReactElement }) {
  if (pdf) return <div style={{ width: 760, height }}>{cloneElement(children, { width: 760, height } as any)}</div>;
  return <ResponsiveContainer width="100%" height={height}>{children}</ResponsiveContainer>;
}

function Tbl({ head, rows, foot }: { head: string[]; rows: (string | number)[][]; foot?: (string | number)[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead><tr>{head.map((h) => <th key={h} className="border-b bg-muted px-2 py-1.5 text-left font-semibold">{h}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className="border-b px-2 py-1">{c}</td>)}</tr>)}</tbody>
        {foot && <tfoot><tr>{foot.map((c, j) => <td key={j} className="px-2 py-1.5 font-semibold">{c}</td>)}</tr></tfoot>}
      </table>
    </div>
  );
}

export default function ReuniaoMensalEscolasPage() {
  const { profile, isAdmin, isGestor, hasRole, effectiveProgramas } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const hasEscolas = (effectiveProgramas || []).includes('escolas' as any);
  const allowed = isAdmin || ((isGestor || hasRole('n3_coordenador_programa')) && hasEscolas);
  const canEditManual = isAdmin || isGestor;

  useEffect(() => { if (profile && !allowed) navigate('/unauthorized', { replace: true }); }, [profile, allowed, navigate]);

  const [mes, setMes] = usePersistedState('reuniao-mensal:mes', format(subMonths(new Date(), 1), 'yyyy-MM'));
  const [escolaIds, setEscolaIds] = usePersistedState<string[]>('reuniao-mensal:escolaIds', []);
  const [consultorIds, setConsultorIds] = usePersistedState<string[]>('reuniao-mensal:consultorIds', []);
  const [exporting, setExporting] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const ano = mes.slice(0, 4);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['reuniao-mensal-escolas'],
    enabled: allowed,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('instrument_responses')
        .select(`id, responses, form_type,
          registros_acao:registro_acao_id ( id, data, aap_id, escola_id, programa, status, componente, ano_serie,
            profiles:aap_id ( nome ), escolas:escola_id ( nome ),
            programacoes:programacao_id ( apoio_professor_nome, apoio_componente, apoio_ano_serie ) )`)
        .in('form_type', FORM_TYPES);
      if (error) throw error;
      return (data || [])
        .filter((r: any) => r.registros_acao?.status === 'realizada' && (r.registros_acao?.programa || []).includes('escolas'))
        .map((r: any): Row => {
          const g = r.registros_acao;
          return {
            id: r.id, formType: r.form_type, data: g.data, aapId: g.aap_id, escolaId: g.escola_id,
            consultor: g.profiles?.nome || 'Sem consultor(a)', escola: g.escolas?.nome || 'Sem entidade',
            professor: (g.programacoes?.apoio_professor_nome || '').trim() || undefined,
            componente: (g.programacoes?.apoio_componente || '').trim() || (g.componente !== 'todos' ? g.componente : undefined),
            anoSerie: (g.programacoes?.apoio_ano_serie || '').trim() || (g.ano_serie !== 'todos' ? g.ano_serie : undefined),
            resp: r.responses || {},
          };
        });
    },
  });

  const { data: escolasDb = [] } = useQuery({
    queryKey: ['reuniao-mensal-escolas:entidades'],
    enabled: allowed,
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('escolas')
        .select('id, nome, tipo, qtd_professores_categoria, programa, ativa, uso_interno');
      if (error) throw error;
      return (data || []).filter((e: any) => e.ativa && !e.uso_interno && (e.programa || []).includes('escolas'));
    },
  });

  const { data: manuais = [] } = useQuery({
    queryKey: ['consultoria_valores_manuais', ano],
    enabled: allowed,
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('consultoria_valores_manuais')
        .select('mes, metrica, valor').eq('programa', 'escolas').gte('mes', `${ano}-01-01`).lte('mes', `${ano}-12-31`);
      if (error) throw error;
      return data || [];
    },
  });

  const tipoPorEscola = useMemo(() => new Map<string, string | null>(escolasDb.map((e: any) => [e.id, e.tipo])), [escolasDb]);

  const consultores = useMemo(() => {
    const m = new Map<string, string>(); rows.forEach((r) => r.aapId && m.set(r.aapId, r.consultor));
    return [...m].map(([value, label]) => ({ value, label })).sort((a, b) => sortPt(a.label, b.label));
  }, [rows]);
  const escolasOpts = useMemo(() => {
    const m = new Map<string, string>(); rows.forEach((r) => r.escolaId && m.set(r.escolaId, r.escola));
    return [...m].map(([value, label]) => ({ value, label })).sort((a, b) => sortPt(a.label, b.label));
  }, [rows]);

  const base = useMemo(() => rows.filter((r) =>
    (!escolaIds.length || escolaIds.includes(r.escolaId || '')) &&
    (!consultorIds.length || consultorIds.includes(r.aapId || ''))), [rows, escolaIds, consultorIds]);
  const doMes = useMemo(() => base.filter((r) => (r.data || '').slice(0, 7) === mes), [base, mes]);
  const of = (t: string) => doMes.filter((r) => r.formType === t);
  const apoios = useMemo(() => of('registro_apoio_presencial'), [doMes]);

  const profKey = (r: Row) => r.professor ? `${r.escolaId}|${r.professor.toLowerCase()}` : null;
  const profsApoiados = useMemo(() => {
    const m = new Map<string, Row[]>();
    apoios.forEach((r) => { const k = profKey(r); if (k) m.set(k, [...(m.get(k) || []), r]); });
    return m;
  }, [apoios]);

  // 1. Painel geral
  const geral = [
    ['escolas atendidas', new Set(doMes.map((r) => r.escolaId).filter(Boolean)).size],
    ['professores apoiados', profsApoiados.size],
    ['apoios presenciais', apoios.length],
    ['devolutivas', apoios.filter((r) => r.resp.devolutiva_realizada === 'Sim').length],
    ['formações coletivas', of('registro_formacao_coletiva').length],
    ['reuniões coordenação', of('registro_apoio_coordenador').length],
    ['planejam. conjuntos', of('registro_planejamento_conjunto').length],
    ['aulas compartilhadas', of('registro_aula_compartilhada').length],
  ] as [string, number][];

  // 2. Prática essencial
  const pratica = useMemo(() => {
    const cls = (r: Row) => r.resp.observou_praticas === 'Sim' ? 'obs' : r.resp.observou_praticas === 'Não' ? 'nao' : 'sem';
    const obs = apoios.filter((r) => cls(r) === 'obs');
    const semanas = new Map<string, { periodo: string; Observou: number; 'Não observou': number; 'Sem informação': number }>();
    [...apoios].sort((a, b) => a.data.localeCompare(b.data)).forEach((r) => {
      const ini = startOfWeek(parseISO(r.data), { weekStartsOn: 1 });
      const k = format(ini, 'yyyy-MM-dd');
      if (!semanas.has(k)) semanas.set(k, { periodo: `${format(ini, 'dd/MM')} a ${format(addDays(ini, 4), 'dd/MM')}`, Observou: 0, 'Não observou': 0, 'Sem informação': 0 });
      const s = semanas.get(k)!; const c = cls(r);
      if (c === 'obs') s.Observou++; else if (c === 'nao') s['Não observou']++; else s['Sem informação']++;
    });
    return {
      escolas: new Set(obs.map((r) => r.escolaId)).size, apoios: obs.length,
      profs: new Set(obs.map(profKey).filter(Boolean)).size,
      obs: obs.length, nao: apoios.filter((r) => cls(r) === 'nao').length, sem: apoios.filter((r) => cls(r) === 'sem').length,
      semanas: [...semanas.values()],
    };
  }, [apoios]);

  // 3. Rubrica PEI x Parcial
  const rubrica = useMemo(() => {
    const labels = ['0 - Nada efetivo', '1 - Pouco efetivo', '2 - Efetivo', '3 - Muito efetivo'];
    const data = labels.map((l) => ({ categoria: l, PEI: 0, Parcial: 0, 'Sem tipo': 0 }));
    const notas: Record<string, number[]> = { PEI: [], Parcial: [], 'Sem tipo': [], Geral: [] };
    apoios.forEach((r) => {
      const n = r.resp.pratica_1_nota;
      if (typeof n !== 'number' || n < 0 || n > 3) return;
      const t = (tipoPorEscola.get(r.escolaId || '') || 'Sem tipo') as 'PEI' | 'Parcial' | 'Sem tipo';
      (data[n] as any)[t]++; notas[t].push(n); notas.Geral.push(n);
    });
    const media = (a: number[]) => (a.length ? (a.reduce((x, y) => x + y, 0) / a.length).toFixed(2).replace('.', ',') : '—');
    return { data, temSemTipo: notas['Sem tipo'].length > 0, medias: { PEI: media(notas.PEI), Parcial: media(notas.Parcial), Geral: media(notas.Geral) }, n: notas };
  }, [apoios, tipoPorEscola]);

  // 4. Apoios x devolutivas (ano)
  const anual = useMemo(() => MESES.map((m, i) => {
    const key = `${ano}-${String(i + 1).padStart(2, '0')}`;
    const ap = base.filter((r) => r.formType === 'registro_apoio_presencial' && r.data.slice(0, 7) === key);
    const man = (met: string) => manuais.find((x: any) => x.mes.slice(0, 7) === key && x.metrica === met)?.valor;
    const ma = man('apoios'); const md = man('devolutivas');
    return {
      mes: m, manual: ma != null || md != null,
      'Apoios Presenciais': ma ?? ap.length,
      'Devolutivas Pedagógicas': md ?? ap.filter((r) => r.resp.devolutiva_realizada === 'Sim').length,
    };
  }).filter((d, i) => i + 1 <= Number(mes.slice(5, 7)) || d['Apoios Presenciais'] > 0), [base, manuais, ano, mes]);

  // 5. Cobertura
  const cobertura = useMemo(() => {
    const escolasAlvo = escolasDb.filter((e: any) => !escolaIds.length || escolaIds.includes(e.id));
    const totais = new Map<string, number>(COBERTURA_GRUPOS.map((g) => [g, 0]));
    escolasAlvo.forEach((e: any) => PROFESSOR_CATEGORIAS.forEach((c) => {
      const g = grupoCobertura(c); const v = Number(e.qtd_professores_categoria?.[c] || 0);
      if (g) totais.set(g, (totais.get(g) || 0) + v);
    }));
    const apoiadosPorGrupo = new Map<string, Set<string>>(COBERTURA_GRUPOS.map((g) => [g, new Set()]));
    profsApoiados.forEach((list, k) => { const g = grupoCobertura(list[0].componente); if (g) apoiadosPorGrupo.get(g)!.add(k); });
    const linhas = COBERTURA_GRUPOS.map((g) => {
      const t = totais.get(g) || 0; const a = apoiadosPorGrupo.get(g)!.size;
      return [g, t, a, t ? `${pctN(a, t)}%` : '—'];
    });
    const totalGeral = [...totais.values()].reduce((a, b) => a + b, 0);
    return { linhas, totalGeral, apoiados: profsApoiados.size };
  }, [escolasDb, escolaIds, profsApoiados]);

  // 6. Componente / etapa
  const etapa = useMemo(() => {
    const recorrentes = [...profsApoiados.values()].filter((l) => l.length >= 2).length;
    const porEtapa = (e: string) => {
      const list = apoios.filter((r) => etapaDeAno(r.anoSerie) === e);
      const m = new Map<string, number>(); list.forEach((r) => m.set(r.anoSerie!, (m.get(r.anoSerie!) || 0) + 1));
      const max = Math.max(0, ...m.values());
      const tops = [...m].filter(([, v]) => v === max && max > 0).map(([k]) => k).sort(sortPt);
      return { total: list.length, top: tops.length ? `${tops.join(' e ')} (${max} apoios${tops.length > 1 ? ' cada' : ''})` : '—' };
    };
    return { recorrentes, EFAI: porEtapa('EFAI'), EFAF: porEtapa('EFAF'), EM: porEtapa('EM') };
  }, [profsApoiados, apoios]);

  // 7. Professores por escola
  const porEscola = useMemo(() => {
    const m = new Map<string, { escola: string; 'Com 1 AP': number; 'Com 2+ APs': number }>();
    profsApoiados.forEach((list) => {
      const e = list[0].escola; if (!m.has(e)) m.set(e, { escola: e, 'Com 1 AP': 0, 'Com 2+ APs': 0 });
      m.get(e)![list.length >= 2 ? 'Com 2+ APs' : 'Com 1 AP']++;
    });
    return [...m.values()].sort((a, b) => sortPt(a.escola, b.escola));
  }, [profsApoiados]);

  // 8. Formações coletivas
  const coletivas = useMemo(() => {
    const m = new Map<string, any>();
    of('registro_formacao_coletiva').forEach((r) => {
      if (!m.has(r.escola)) m.set(r.escola, { escola: r.escola, ...Object.fromEntries(Object.values(PART_LABEL).map((l) => [l, 0])), Total: 0 });
      const lab = PART_LABEL[normalizeParticipacaoPauta(r.resp.participacao_pauta)];
      const o = m.get(r.escola); if (lab) o[lab]++; o.Total++;
    });
    return [...m.values()].sort((a, b) => sortPt(a.escola, b.escola));
  }, [doMes]);

  // 9. Aulas compartilhadas
  const aulas = useMemo(() => {
    const m = new Map<string, { n: number; anos: Set<string>; comps: Set<string> }>();
    of('registro_aula_compartilhada').forEach((r) => {
      if (!m.has(r.escola)) m.set(r.escola, { n: 0, anos: new Set(), comps: new Set() });
      const o = m.get(r.escola)!; o.n++; r.anoSerie && o.anos.add(r.anoSerie); r.componente && o.comps.add(r.componente);
    });
    return [...m].sort((a, b) => b[1].n - a[1].n || sortPt(a[0], b[0]))
      .map(([e, o]) => [e, o.n, [...o.anos].sort(sortPt).join(', ') || '—', [...o.comps].sort(sortPt).join(', ') || '—']);
  }, [doMes]);

  const mesLabel = `${MESES[Number(mes.slice(5, 7)) - 1]}/${ano}`;

  const renderSections = (pdf = false) => [
    <Section key="s1" id="rm-geral" title={`1. Painel Geral — ${mesLabel}`}>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {geral.map(([l, v]) => (
          <div key={l} className="rounded-md border p-3 text-center">
            <p className="text-2xl font-bold text-primary">{v}</p><p className="text-xs text-muted-foreground">{l}</p>
          </div>
        ))}
      </div>
    </Section>,
    <Section key="s2" id="rm-pratica" title="2. Prática essencial 1 — Retomada">
      <p className="text-sm"><b>{pratica.escolas}</b> escolas · <b>{pratica.apoios}</b> apoios · <b>{pratica.profs}</b> professores com prática observada</p>
      <Tbl head={['Observou prática 1', 'Não observou', 'Sem informação', 'Total']}
        rows={[[`${pratica.obs} (${pctN(pratica.obs, apoios.length)}%)`, `${pratica.nao} (${pctN(pratica.nao, apoios.length)}%)`, `${pratica.sem} (${pctN(pratica.sem, apoios.length)}%)`, apoios.length]]} />
      <Chart pdf={pdf}><BarChart data={pratica.semanas}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="periodo" fontSize={11} /><YAxis allowDecimals={false} /><Tooltip /><Legend />
        <Bar dataKey="Observou" stackId="a" fill={C.e} isAnimationActive={!pdf} /><Bar dataKey="Não observou" stackId="a" fill={C.d} isAnimationActive={!pdf} /><Bar dataKey="Sem informação" stackId="a" fill="#94a3b8" isAnimationActive={!pdf} />
      </BarChart></Chart>
    </Section>,
    <Section key="s3" id="rm-rubrica" title="3. Rubrica: efetividade da Prática 1 (PEI x Parcial)">
      <Chart pdf={pdf}><BarChart data={rubrica.data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="categoria" fontSize={11} /><YAxis allowDecimals={false} /><Tooltip /><Legend />
        <Bar dataKey="PEI" stackId="a" fill={C.a} isAnimationActive={!pdf} /><Bar dataKey="Parcial" stackId="a" fill={C.c} isAnimationActive={!pdf} />
        {rubrica.temSemTipo && <Bar dataKey="Sem tipo" stackId="a" fill="#94a3b8" isAnimationActive={!pdf} />}
      </BarChart></Chart>
      <p className="text-sm">Média geral: <b>{rubrica.medias.Geral}</b> · PEI: <b>{rubrica.medias.PEI}</b> · Parcial: <b>{rubrica.medias.Parcial}</b></p>
      <p className="text-xs text-muted-foreground">Cálculo: soma das notas (0 a 3) dadas à Prática 1 nos apoios do mês ÷ quantidade de apoios com nota. O tipo (PEI/Parcial) vem do cadastro da Entidade; escolas sem tipo aparecem como "Sem tipo".</p>
    </Section>,
    <Section key="s4" id="rm-anual" title={`4. Apoios x Devolutivas — ${ano}`}>
      {!pdf && canEditManual && <Button size="sm" variant="outline" onClick={() => setManualOpen(true)}><Pencil className="mr-2 h-4 w-4" />Valores manuais</Button>}
      <Chart pdf={pdf}><BarChart data={anual}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="mes" /><YAxis allowDecimals={false} /><Tooltip /><Legend />
        <Bar dataKey="Apoios Presenciais" fill={C.a} isAnimationActive={!pdf}><LabelList dataKey="Apoios Presenciais" position="top" fontSize={10} /></Bar>
        <Bar dataKey="Devolutivas Pedagógicas" fill={C.b} isAnimationActive={!pdf}><LabelList dataKey="Devolutivas Pedagógicas" position="top" fontSize={10} /></Bar>
      </BarChart></Chart>
      {anual.some((a) => a.manual) && <p className="text-xs text-muted-foreground">Meses com valores lançados manualmente: {anual.filter((a) => a.manual).map((a) => a.mes).join(', ')}.</p>}
    </Section>,
    <Section key="s5" id="rm-cobertura" title="5. Abrangência da consultoria">
      <Tbl head={['Categoria', 'Total de professores', `Professores únicos apoiados (${mesLabel})`, 'Cobertura']} rows={cobertura.linhas} />
      <p className="text-sm">Total geral de professores: <b>{cobertura.totalGeral}</b> · Professores apoiados: <b>{cobertura.apoiados} ({pctN(cobertura.apoiados, cobertura.totalGeral)}%)</b></p>
      <p className="text-xs text-muted-foreground">Cobertura = professores apoiados no mês ÷ total de professores informado no cadastro das Entidades. VOAR é somado ao componente (LP ou MAT).</p>
    </Section>,
    <Section key="s6" id="rm-componente" title="6. Professores apoiados por componente">
      <Tbl head={['Indicador', 'Valor', 'Descrição']} rows={[
        ['Recorrência', etapa.recorrentes, `professores apoiados 2 ou + vezes de um total de ${profsApoiados.size} (${pctN(etapa.recorrentes, profsApoiados.size)}%)`],
        ['EFAI — Anos Iniciais', etapa.EFAI.total, `Maior concentração: ${etapa.EFAI.top}`],
        ['EFAF — Anos Finais', etapa.EFAF.total, `Maior concentração: ${etapa.EFAF.top}`],
        ['EM — Ensino Médio', etapa.EM.total, `Maior concentração: ${etapa.EM.top}`],
      ]} />
    </Section>,
    <Section key="s7" id="rm-escola" title="7. Professores apoiados por escola segundo a frequência de apoio presencial">
      <Chart pdf={pdf} height={Math.max(240, porEscola.length * 38)}><BarChart data={porEscola} layout="vertical" margin={{ left: 40 }}>
        <CartesianGrid strokeDasharray="3 3" /><XAxis type="number" allowDecimals={false} /><YAxis type="category" dataKey="escola" width={170} fontSize={11} /><Tooltip /><Legend />
        <Bar dataKey="Com 1 AP" stackId="a" fill={C.b} isAnimationActive={!pdf} /><Bar dataKey="Com 2+ APs" stackId="a" fill={C.a} isAnimationActive={!pdf} />
      </BarChart></Chart>
    </Section>,
    <Section key="s8" id="rm-coletivas" title="8. Formações coletivas — participação do coordenador">
      <Chart pdf={pdf} height={Math.max(220, coletivas.length * 38)}><BarChart data={coletivas} layout="vertical" margin={{ left: 40 }}>
        <CartesianGrid strokeDasharray="3 3" /><XAxis type="number" allowDecimals={false} /><YAxis type="category" dataKey="escola" width={170} fontSize={11} /><Tooltip /><Legend />
        {FORMACAO_COLETIVA_PARTICIPACAO_OPTIONS.map((o, i) => <Bar key={o} dataKey={PART_LABEL[o]} stackId="a" fill={PART_COLORS[i]} isAnimationActive={!pdf} />)}
      </BarChart></Chart>
      <Tbl head={['Escola', ...Object.values(PART_LABEL), 'Total']} rows={coletivas.map((c) => [c.escola, ...Object.values(PART_LABEL).map((l) => c[l] || ''), c.Total])}
        foot={['TOTAL', ...Object.values(PART_LABEL).map((l) => coletivas.reduce((a, c) => a + c[l], 0)), coletivas.reduce((a, c) => a + c.Total, 0)]} />
    </Section>,
    <Section key="s9" id="rm-aulas" title="9. Aulas compartilhadas">
      <Tbl head={['Escola', 'Aulas compartilhadas', 'Ano/série', 'Componente']} rows={aulas} foot={['TOTAL', aulas.reduce((a, r) => a + (r[1] as number), 0), '', '']} />
    </Section>,
  ];

  const exportPdf = async () => {
    setExporting(true);
    try {
      await exportSectionsToPdf(renderSections(true).map((node) => ({ node: <div style={{ width: 794, padding: 8 }}>{node}</div> })),
        `reuniao-mensal-escolas-${mes}.pdf`, { title: 'Reunião Mensal N1 (PRG Escolas)', subtitle: mesLabel });
    } catch (e: any) { toast.error(e?.message || 'Erro ao gerar PDF'); } finally { setExporting(false); }
  };

  if (!allowed) return null;
  return (
    <div className="space-y-6 min-w-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reunião Mensal N1 (PRG Escolas)</h1>
          <p className="text-sm text-muted-foreground">Dados da Olhar Parceiro para a reunião mensal da consultoria</p>
        </div>
        <Button onClick={exportPdf} disabled={exporting || isLoading}>
          {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}Exportar PDF
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div><Label>Mês</Label><Input type="month" value={mes} onChange={(e) => e.target.value && setMes(e.target.value)} /></div>
        <div><Label>Escola</Label><MultiSelectFilter options={escolasOpts} selected={escolaIds} onChange={setEscolaIds} allLabel="Todas as escolas" /></div>
        <div><Label>Consultor(a)</Label><MultiSelectFilter options={consultores} selected={consultorIds} onChange={setConsultorIds} allLabel="Todos(as)" /></div>
      </div>
      <nav className="flex flex-wrap gap-2 text-sm">
        {[['rm-pratica', 'Prática essencial 1'], ['rm-rubrica', 'Rubrica'], ['rm-anual', 'Evolução mensal'], ['rm-cobertura', 'Abrangência'], ['rm-componente', 'Componentes'], ['rm-escola', 'Por escola'], ['rm-coletivas', 'Formações coletivas'], ['rm-aulas', 'Aulas compartilhadas']].map(([id, l]) => (
          <a key={id} href={`#${id}`} className="text-primary underline underline-offset-2">{l}</a>
        ))}
      </nav>
      {isLoading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div> : <div className="space-y-4">{renderSections()}</div>}
      <ManualDialog open={manualOpen} onOpenChange={setManualOpen} ano={ano} manuais={manuais}
        onSaved={() => qc.invalidateQueries({ queryKey: ['consultoria_valores_manuais', ano] })} userId={profile?.id} />
    </div>
  );
}

function ManualDialog({ open, onOpenChange, ano, manuais, onSaved, userId }: {
  open: boolean; onOpenChange: (o: boolean) => void; ano: string; manuais: any[]; onSaved: () => void; userId?: string;
}) {
  const [vals, setVals] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!open) return;
    const v: Record<string, string> = {};
    manuais.forEach((m) => { v[`${m.mes.slice(0, 7)}|${m.metrica}`] = String(m.valor); });
    setVals(v);
  }, [open, manuais]);

  const save = async () => {
    setSaving(true);
    try {
      const up: any[] = []; const del: { mes: string; metrica: string }[] = [];
      MESES.forEach((_, i) => ['apoios', 'devolutivas'].forEach((met) => {
        const mesKey = `${ano}-${String(i + 1).padStart(2, '0')}`; const raw = vals[`${mesKey}|${met}`];
        if (raw === undefined || raw === '') del.push({ mes: `${mesKey}-01`, metrica: met });
        else up.push({ programa: 'escolas', mes: `${mesKey}-01`, metrica: met, valor: Math.max(0, Math.floor(Number(raw))), updated_by: userId, updated_at: new Date().toISOString() });
      }));
      if (up.length) {
        const { error } = await (supabase as any).from('consultoria_valores_manuais').upsert(up, { onConflict: 'programa,mes,metrica' });
        if (error) throw error;
      }
      for (const d of del) {
        if (manuais.some((m) => m.mes === d.mes && m.metrica === d.metrica)) {
          const { error } = await (supabase as any).from('consultoria_valores_manuais').delete().eq('programa', 'escolas').eq('mes', d.mes).eq('metrica', d.metrica);
          if (error) throw error;
        }
      }
      toast.success('Valores salvos'); onSaved(); onOpenChange(false);
    } catch (e: any) { toast.error(e?.message || 'Erro ao salvar'); } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto w-[95vw] sm:max-w-lg">
        <DialogHeader><DialogTitle>Valores manuais — {ano}</DialogTitle></DialogHeader>
        <p className="text-xs text-muted-foreground">Preencha só os meses cujos dados não estão no sistema. Campo vazio = usa o dado do sistema.</p>
        <div className="grid grid-cols-[1fr_1fr_1fr] gap-2 text-sm items-center">
          <span className="font-semibold">Mês</span><span className="font-semibold">Apoios</span><span className="font-semibold">Devolutivas</span>
          {MESES.map((m, i) => {
            const k = `${ano}-${String(i + 1).padStart(2, '0')}`;
            return [<span key={m}>{m}</span>, ...['apoios', 'devolutivas'].map((met) => (
              <Input key={met + m} type="number" min={0} value={vals[`${k}|${met}`] ?? ''} onChange={(e) => setVals({ ...vals, [`${k}|${met}`]: e.target.value })} />
            ))];
          })}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={save} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
