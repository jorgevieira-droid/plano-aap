import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import {
  Loader2, Download, FileText, Users, GraduationCap, Gauge, Sparkles, Target,
} from 'lucide-react';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { MultiSelectFilter } from '@/components/forms/MultiSelectFilter';
import { exportSectionsToPdf } from '@/lib/pdfExport';
import { cn } from '@/lib/utils';
import { usePersistedState } from '@/hooks/usePersistedState';
import { segmentoLabels, componenteLabels } from '@/data/mockData';

const sortPt = (a: string, b: string) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' });

const CHART_COLORS = ['#1a3a5c', '#059669', '#d97706', '#7c3aed', '#dc2626'];

const monthLabel = (iso: string) => format(parseISO(iso + (iso.length === 7 ? '-01' : '')), 'MM/yyyy');

const num = (v: any): number | null => {
  const n = Number(v);
  return Number.isFinite(n) && v !== '' && v !== null && v !== undefined ? n : null;
};

const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
const avg = (arr: number[]) => (arr.length ? sum(arr) / arr.length : null);
const fmt = (v: number | null, digits = 1) => (v === null ? '—' : v.toFixed(digits).replace('.', ','));

interface Row {
  id: string;
  data?: string;
  aapId?: string;
  escolaId?: string;
  consultor: string;
  escola: string;
  segmento?: string;
  componente?: string;
  anoSerie?: string;
  resp: Record<string, any>;
}

export default function RelatoriosPlanejamentoConjuntoPanelPage() {
  const { profile, isAdmin, hasRole, effectiveProgramas } = useAuth();
  const navigate = useNavigate();

  const isGestorOrN3 = hasRole('gestor') || hasRole('n3_coordenador_programa');
  const hasEscolas = (effectiveProgramas || []).includes('escolas' as any);
  const allowed = isAdmin || (isGestorOrN3 && hasEscolas);

  useEffect(() => {
    if (profile && !allowed) navigate('/unauthorized', { replace: true });
  }, [profile, allowed, navigate]);

  const [dataInicio, setDataInicio] = usePersistedState('relatorios-planejamento-conjunto:dataInicio', '');
  const [dataFim, setDataFim] = usePersistedState('relatorios-planejamento-conjunto:dataFim', '');
  const [consultorIds, setConsultorIds] = usePersistedState<string[]>('relatorios-planejamento-conjunto:consultorIds', []);
  const [escolaIds, setEscolaIds] = usePersistedState<string[]>('relatorios-planejamento-conjunto:escolaIds', []);
  const [exporting, setExporting] = useState(false);

  const { data: rows, isLoading } = useQuery({
    queryKey: ['relatorios-planejamento-conjunto'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('instrument_responses')
        .select(`
          id, responses, registro_acao_id,
          registros_acao:registro_acao_id (
            id, data, aap_id, escola_id, programa, status, segmento, componente, ano_serie,
            profiles:aap_id ( id, nome ),
            escolas:escola_id ( id, nome )
          )
        `)
        .eq('form_type', 'registro_planejamento_conjunto');
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
            data: reg?.data,
            aapId: reg?.aap_id,
            escolaId: reg?.escola_id,
            consultor: reg?.profiles?.nome || 'Sem consultor(a)',
            escola: reg?.escolas?.nome || 'Sem entidade',
            segmento: reg?.segmento || undefined,
            componente: reg?.componente || undefined,
            anoSerie: reg?.ano_serie || undefined,
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

  const nums = (key: string, src = filtered) =>
    src.map((r) => num(r.resp[key])).filter((n): n is number => n !== null);

  const kpis = useMemo(() => {
    const abaixo = nums('estudantes_abaixo_basico');
    const basico = nums('estudantes_basico');
    const elegiveis = nums('estudantes_elegiveis');
    const aulas = nums('numero_aula');
    return {
      total: filtered.length,
      voar: filtered.filter((r) => r.resp.turma_voar === 'Sim').length,
      escolas: new Set(filtered.map((r) => r.escola)).size,
      consultores: new Set(filtered.map((r) => r.consultor)).size,
      totalAbaixo: sum(abaixo),
      totalBasico: sum(basico),
      totalElegiveis: sum(elegiveis),
      mediaAbaixo: avg(abaixo),
      mediaBasico: avg(basico),
      mediaElegiveis: avg(elegiveis),
      mediaAula: avg(aulas),
    };
  }, [filtered]);

  const totalEstudantes = kpis.totalAbaixo + kpis.totalBasico + kpis.totalElegiveis;

  const numerosTurma = useMemo(() => ([
    { nome: 'Abaixo do básico (total)', qtd: kpis.totalAbaixo },
    { nome: 'No básico (total)', qtd: kpis.totalBasico },
    { nome: 'Elegíveis (total)', qtd: kpis.totalElegiveis },
  ]), [kpis]);

  const porVoar = useMemo(() => ['Sim', 'Não'].map((opt) => ({
    nome: `Turma do VOAR: ${opt}`,
    qtd: filtered.filter((r) => r.resp.turma_voar === opt).length,
  })), [filtered]);

  const byField = (get: (r: Row) => string | undefined, label: (v: string) => string) => {
    const m = new Map<string, number>();
    filtered.forEach((r) => {
      const v = get(r);
      if (!v) return;
      m.set(v, (m.get(v) || 0) + 1);
    });
    return Array.from(m, ([k, qtd]) => ({ nome: label(k), qtd })).sort((a, b) => sortPt(a.nome, b.nome));
  };

  const porSegmento = useMemo(
    () => byField((r) => r.segmento, (v) => (segmentoLabels as any)[v] || v),
    [filtered],
  );
  const porComponente = useMemo(
    () => byField((r) => r.componente, (v) => (componenteLabels as any)[v] || v),
    [filtered],
  );
  const porAnoSerie = useMemo(() => byField((r) => r.anoSerie, (v) => v), [filtered]);

  const rankRows = (get: (r: Row) => string) => {
    const m = new Map<string, Row[]>();
    filtered.forEach((r) => {
      const k = get(r);
      m.set(k, [...(m.get(k) || []), r]);
    });
    return Array.from(m, ([nome, list]) => ({
      nome,
      qtd: list.length,
      voar: list.filter((r) => r.resp.turma_voar === 'Sim').length,
      elegiveis: avg(nums('estudantes_elegiveis', list)),
    })).sort((a, b) => sortPt(a.nome, b.nome));
  };

  const porEscola = useMemo(() => rankRows((r) => r.escola), [filtered]);
  const porConsultor = useMemo(() => rankRows((r) => r.consultor), [filtered]);

  const meses = useMemo(() => {
    const set = new Set<string>();
    filtered.forEach((r) => { if (r.data) set.add(r.data.slice(0, 7)); });
    return Array.from(set).sort();
  }, [filtered]);

  const LINHAS_EVOLUCAO = [
    { key: 'registros', label: 'Planejamentos no mês' },
    { key: 'elegiveis', label: 'Média de elegíveis' },
    { key: 'abaixo', label: 'Média abaixo do básico' },
    { key: 'basico', label: 'Média no básico' },
  ];

  const evolucaoData = useMemo(() => meses.map((m) => {
    const doMes = filtered.filter((r) => (r.data || '').slice(0, 7) === m);
    const round1 = (v: number | null) => (v === null ? 0 : Math.round(v * 10) / 10);
    return {
      mes: monthLabel(m),
      'Planejamentos no mês': doMes.length,
      'Média de elegíveis': round1(avg(nums('estudantes_elegiveis', doMes))),
      'Média abaixo do básico': round1(avg(nums('estudantes_abaixo_basico', doMes))),
      'Média no básico': round1(avg(nums('estudantes_basico', doMes))),
    };
  }), [filtered, meses]);

  const textos = useMemo(() => {
    const build = (key: string) => filtered
      .filter((r) => String(r.resp[key] || '').trim() !== '')
      .map((r) => ({
        id: r.id + key,
        escola: r.escola,
        consultor: r.consultor,
        data: r.data ? format(parseISO(r.data), 'dd/MM/yyyy') : '—',
        tema: String(r.resp.tema_aula || '').trim(),
        aula: num(r.resp.numero_aula),
        texto: String(r.resp[key]),
      }))
      .sort((a, b) => sortPt(a.escola, b.escola) || sortPt(a.consultor, b.consultor));
    return {
      contribuicoes: build('contribuicoes_planejamento'),
      monitoramento: build('monitoramento_aula'),
    };
  }, [filtered]);

  const totalConsultores = consultorIds.length > 0 ? consultorIds.length : porConsultor.length;
  const totalEscolas = escolaIds.length > 0 ? escolaIds.length : porEscola.length;
  const periodoLabel = `${dataInicio ? format(parseISO(dataInicio), 'dd/MM/yyyy') : '—'} a ${dataFim ? format(parseISO(dataFim), 'dd/MM/yyyy') : '—'}`;

  // ---------- PDF ----------
  const handleExport = async () => {
    setExporting(true);
    try {
      const pdfKpis = [
        { label: 'Planejamentos registrados', value: String(kpis.total).padStart(2, '0'), color: '#1a3a5c', bg: '#eef2f7' },
        { label: 'Planejamentos em turmas do VOAR', value: String(kpis.voar).padStart(2, '0'), color: '#059669', bg: '#ecfdf5' },
        { label: 'Escolas atendidas', value: String(kpis.escolas).padStart(2, '0'), color: '#0891b2', bg: '#ecfeff' },
        { label: 'Consultores(as) envolvidos', value: String(kpis.consultores).padStart(2, '0'), color: '#7c3aed', bg: '#f5f3ff' },
        { label: 'Média de estudantes elegíveis', value: fmt(kpis.mediaElegiveis), color: '#d97706', bg: '#fffbeb' },
        { label: 'Média do nº da aula (MD/SP)', value: fmt(kpis.mediaAula), color: '#dc2626', bg: '#fef2f2' },
      ];

      const cardStyle: React.CSSProperties = { border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', background: '#fff' };
      const cardHeader: React.CSSProperties = { background: '#f5f7fa', borderBottom: '1px solid #e5e7eb', padding: '10px 16px', fontSize: 13, fontWeight: 700, color: '#1a3a5c' };
      const thStyle: React.CSSProperties = { textAlign: 'left', padding: '8px 16px', fontSize: 9, letterSpacing: 0.6, textTransform: 'uppercase', color: '#6b7280', borderBottom: '1px solid #e5e7eb' };
      const tdStyle: React.CSSProperties = { padding: '7px 16px', borderBottom: '1px solid #eef0f3', color: '#111827', fontSize: 11 };

      const renderRank = (titulo: string, colLabel: string, linhas: typeof porEscola) => (
        <div style={{ ...cardStyle, flex: 1 }}>
          <div style={cardHeader}>{titulo}</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>{colLabel}</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Registros</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>VOAR</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Média eleg.</th>
              </tr>
            </thead>
            <tbody>
              {linhas.length === 0 ? (
                <tr><td colSpan={4} style={{ ...tdStyle, textAlign: 'center', color: '#6b7280' }}>Nenhum registro no período.</td></tr>
              ) : linhas.map((l, i) => (
                <tr key={l.nome} style={{ background: i % 2 === 1 ? '#fafbfc' : '#fff' }}>
                  <td style={{ ...tdStyle, fontWeight: 500 }}>{l.nome}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>{l.qtd}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>{l.voar}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>{fmt(l.elegiveis)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

      const renderCounters = (titulo: string, linhas: { nome: string; qtd: number }[]) => (
        <div style={{ ...cardStyle, flex: 1 }}>
          <div style={cardHeader}>{titulo}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, padding: 16 }}>
            {linhas.length === 0 ? (
              <div style={{ fontSize: 11, color: '#6b7280' }}>Nenhum registro no período.</div>
            ) : linhas.map((l) => (
              <div key={l.nome} style={{ flex: '1 1 110px', border: '1px solid #eef0f3', borderRadius: 6, padding: 12, background: '#fafbfc' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#1a3a5c' }}>{String(l.qtd).padStart(2, '0')}</div>
                <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>{l.nome}</div>
              </div>
            ))}
          </div>
        </div>
      );

      const renderTextos = (titulo: string, itens: typeof textos.contribuicoes) => (
        <div style={cardStyle}>
          <div style={cardHeader}>{titulo}</div>
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {itens.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#6b7280', fontSize: 11 }}>Nenhum registro no período.</div>
            ) : itens.map((it) => (
              <div key={it.id} style={{ border: '1px solid #eef0f3', borderRadius: 6, padding: 12, background: '#fafbfc' }}>
                <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 4 }}>
                  {it.escola} · {it.consultor} · {it.data}
                  {it.tema ? ` · ${it.tema}` : ''}
                  {it.aula !== null ? ` · Aula ${it.aula}` : ''}
                </div>
                <div style={{ fontSize: 11, color: '#111827', whiteSpace: 'pre-wrap' }}>{it.texto}</div>
              </div>
            ))}
          </div>
        </div>
      );

      const node = (
        <div style={{ padding: 24, fontFamily: 'Helvetica, Arial, sans-serif', width: 1000, background: '#fff' }}>
          <div data-pdf-section style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
            {pdfKpis.map(({ label, value, color, bg }) => (
              <div key={label} style={{ flex: '1 1 150px', border: '1px solid #e5e7eb', borderRadius: 8, padding: 14, background: '#fff' }}>
                <div style={{ display: 'inline-block', background: bg, color, borderRadius: 6, padding: '2px 8px', fontSize: 9, fontWeight: 700 }}>PLANEJAMENTO CONJUNTO</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#111827', lineHeight: 1.2, marginTop: 6 }}>{value}</div>
                <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', color: '#6b7280' }}>{label}</div>
              </div>
            ))}
          </div>

          <div data-pdf-section style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 16 }}>
            {renderCounters('Números da turma (estudantes)', numerosTurma)}
            {renderCounters('Turmas do VOAR', porVoar)}
          </div>

          <div data-pdf-section style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 16 }}>
            {renderRank('Planejamentos por Escola', 'Escola', porEscola)}
            {renderRank('Planejamentos por Consultor(a)', 'Consultor(a)', porConsultor)}
          </div>

          <div data-pdf-section style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 16 }}>
            {renderCounters('Por Segmento', porSegmento)}
            {renderCounters('Por Componente', porComponente)}
            {renderCounters('Por Ano/Série', porAnoSerie)}
          </div>

          <div data-pdf-section style={{ marginBottom: 16 }}>
            <div style={cardStyle}>
              <div style={cardHeader}>Evolução mensal</div>
              <div style={{ padding: 12 }}>
                {evolucaoData.length === 0 ? (
                  <div style={{ padding: 20, textAlign: 'center', color: '#6b7280', fontSize: 11 }}>Nenhum registro no período.</div>
                ) : (
                  <LineChart width={920} height={320} data={evolucaoData} margin={{ top: 8, right: 24, bottom: 8, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" fontSize={10} />
                    <YAxis fontSize={10} />
                    <Legend wrapperStyle={{ fontSize: 9 }} />
                    {LINHAS_EVOLUCAO.map((l, i) => (
                      <Line key={l.key} type="monotone" dataKey={l.label} stroke={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
                    ))}
                  </LineChart>
                )}
              </div>
            </div>
          </div>

          <div data-pdf-section style={{ marginBottom: 16 }}>
            {renderTextos('Contribuições ao planejamento do professor', textos.contribuicoes)}
          </div>

          <div data-pdf-section>
            {renderTextos('Monitoramento das aulas pela consultoria', textos.monitoramento)}
          </div>
        </div>
      );

      await exportSectionsToPdf(
        [{ node }],
        `relatorio-planejamento-conjunto-${new Date().toISOString().split('T')[0]}.pdf`,
        { title: 'Relatório - Planejamento Conjunto', subtitle: `Período: ${periodoLabel}` },
      );
      toast.success('PDF gerado');
    } catch (e) {
      console.error(e);
      toast.error('Erro ao gerar PDF');
    } finally {
      setExporting(false);
    }
  };

  if (!allowed) return null;

  const kpiCards = [
    { label: 'Planejamentos registrados', value: String(kpis.total).padStart(2, '0'), icon: FileText, iconColor: 'text-primary', bgColor: 'bg-primary/10', accent: 'bg-primary' },
    { label: 'Planejamentos em turmas do VOAR', value: String(kpis.voar).padStart(2, '0'), icon: Sparkles, iconColor: 'text-emerald-600', bgColor: 'bg-emerald-50', accent: 'bg-emerald-500' },
    { label: 'Escolas atendidas', value: String(kpis.escolas).padStart(2, '0'), icon: GraduationCap, iconColor: 'text-cyan-600', bgColor: 'bg-cyan-50', accent: 'bg-cyan-500' },
    { label: 'Consultores(as) envolvidos', value: String(kpis.consultores).padStart(2, '0'), icon: Users, iconColor: 'text-violet-600', bgColor: 'bg-violet-50', accent: 'bg-violet-500' },
    { label: 'Média de estudantes elegíveis', value: fmt(kpis.mediaElegiveis), icon: Target, iconColor: 'text-amber-600', bgColor: 'bg-amber-50', accent: 'bg-amber-500' },
    { label: 'Média do nº da aula (MD/SP)', value: fmt(kpis.mediaAula), icon: Gauge, iconColor: 'text-rose-600', bgColor: 'bg-rose-50', accent: 'bg-rose-500' },
  ];

  const EmptyState = ({ label = 'Nenhum registro no período.' }: { label?: string }) => (
    <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
      <FileText className="h-6 w-6 opacity-40" />
      <p className="text-sm">{label}</p>
    </div>
  );

  const SectionTitle = ({ numero, children }: { numero?: string; children: React.ReactNode }) => (
    <div className="flex items-center gap-3">
      {numero && (
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-[11px] font-bold text-primary">
          {numero}
        </span>
      )}
      <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{children}</h2>
      <div className="h-px flex-1 bg-border" />
    </div>
  );

  const CountersCard = ({ titulo, linhas, cols = 'sm:grid-cols-3' }: { titulo: string; linhas: { nome: string; qtd: number }[]; cols?: string }) => {
    const max = Math.max(1, ...linhas.map((l) => l.qtd));
    const soma = linhas.reduce((a, l) => a + l.qtd, 0);
    return (
      <Card className="border shadow-sm">
        <CardHeader className="border-b bg-muted/30 px-6 py-4">
          <CardTitle className="text-base font-semibold text-foreground">{titulo}</CardTitle>
        </CardHeader>
        <CardContent className={cn('grid grid-cols-2 gap-3 p-6', cols)}>
          {linhas.length === 0 ? (
            <p className="col-span-full text-sm text-muted-foreground">Nenhum registro no período.</p>
          ) : linhas.map((l) => (
            <div key={l.nome} className="rounded-lg border bg-muted/20 p-3">
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-foreground">{String(l.qtd).padStart(2, '0')}</p>
                <span className="text-[10px] font-medium text-muted-foreground">
                  {soma > 0 ? `${Math.round((l.qtd / soma) * 100)}%` : '0%'}
                </span>
              </div>
              <p className="mt-0.5 break-words text-[11px] leading-tight text-muted-foreground">{l.nome}</p>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border">
                <div className="h-full rounded-full bg-primary/60" style={{ width: `${(l.qtd / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  };

  const RankTable = ({ titulo, colLabel, linhas }: { titulo: string; colLabel: string; linhas: typeof porEscola }) => {
    const max = Math.max(1, ...linhas.map((l) => l.qtd));
    const soma = linhas.reduce((a, l) => a + l.qtd, 0);
    return (
      <Card className="border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-3 border-b bg-muted/30 px-6 py-4">
          <CardTitle className="text-base font-semibold text-foreground">{titulo}</CardTitle>
          <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
            {linhas.length} · {soma} registros
          </span>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[60vh] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">{colLabel}</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">VOAR</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">Média eleg.</th>
                  <th className="w-[28%] px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">Registros</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {linhas.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">Nenhum registro no período.</td></tr>
                ) : linhas.map((l, i) => (
                  <tr key={l.nome} className={cn('transition-colors hover:bg-muted/40', i % 2 === 1 && 'bg-muted/10')}>
                    <td className="min-w-0 max-w-xs break-words px-6 py-3 font-medium text-foreground">{l.nome}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{l.voar}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{fmt(l.elegiveis)}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center justify-end gap-3">
                        <div className="hidden h-2 w-full max-w-[110px] overflow-hidden rounded-full bg-border sm:block">
                          <div className="h-full rounded-full bg-primary/60" style={{ width: `${(l.qtd / max) * 100}%` }} />
                        </div>
                        <span className="w-8 text-right font-semibold text-foreground">{l.qtd}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  };

  const TextosCard = ({ titulo, itens }: { titulo: string; itens: typeof textos.contribuicoes }) => (
    <Card className="border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-3 border-b bg-muted/30 px-6 py-4">
        <CardTitle className="text-base font-semibold text-foreground">{titulo}</CardTitle>
        <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">{itens.length}</span>
      </CardHeader>
      <CardContent className="p-6">
        {itens.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="max-h-[70vh] space-y-3 overflow-y-auto">
            {itens.map((it) => (
              <div key={it.id} className="rounded-lg border bg-muted/20 p-4">
                <p className="text-xs font-medium text-muted-foreground">
                  {it.escola} · {it.consultor} · {it.data}
                  {it.tema ? ` · ${it.tema}` : ''}
                  {it.aula !== null ? ` · Aula ${it.aula}` : ''}
                </p>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm text-foreground">{it.texto}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-w-0 space-y-8 overflow-x-hidden p-6 md:p-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Relatório - Planejamento Conjunto
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Programa Escolas — planejamentos conjuntos com o professor, perfil das turmas e monitoramento.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
              Período: {periodoLabel}
            </span>
            <span className="rounded-full border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
              {filtered.length} planejamentos
            </span>
            <span className="rounded-full border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
              {totalEscolas} escolas · {totalConsultores} consultores(as)
            </span>
            <span className="rounded-full border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
              {totalEstudantes} estudantes mapeados
            </span>
          </div>
        </div>
        <Button onClick={handleExport} disabled={exporting} className="shrink-0">
          {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
          Exportar PDF
        </Button>
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
              width={240}
              triggerClassName="w-full"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nome da Escola</Label>
            <MultiSelectFilter
              options={escolas}
              selected={escolaIds}
              onChange={setEscolaIds}
              allLabel="Todas"
              itemNoun="Escola"
              width={240}
              triggerClassName="w-full"
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
        <>
          <SectionTitle numero="1">Indicadores</SectionTitle>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {kpiCards.map((c) => (
              <Card key={c.label} className="relative overflow-hidden border shadow-sm transition-shadow hover:shadow-md">
                <div className={cn('absolute inset-x-0 top-0 h-1', c.accent)} />
                <CardContent className="flex items-center gap-4 p-6">
                  <div className={cn('rounded-full p-3', c.bgColor)}>
                    <c.icon className={cn('h-6 w-6', c.iconColor)} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-3xl font-bold leading-none text-foreground">{c.value}</p>
                    <p className="mt-1 break-words text-xs font-semibold uppercase tracking-wider text-muted-foreground">{c.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <SectionTitle numero="2">Números da turma</SectionTitle>
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <CountersCard titulo="Estudantes por faixa (total no período)" linhas={numerosTurma} cols="sm:grid-cols-3" />
            <CountersCard titulo="Turmas do VOAR" linhas={porVoar} cols="sm:grid-cols-2" />
          </div>
          <Card className="border shadow-sm">
            <CardHeader className="border-b bg-muted/30 px-6 py-4">
              <CardTitle className="text-base font-semibold text-foreground">Médias por turma</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-3">
              {[
                { label: 'Abaixo do básico', value: fmt(kpis.mediaAbaixo) },
                { label: 'No básico', value: fmt(kpis.mediaBasico) },
                { label: 'Elegíveis', value: fmt(kpis.mediaElegiveis) },
              ].map((m) => (
                <div key={m.label} className="rounded-lg border bg-muted/20 p-4">
                  <p className="text-2xl font-bold text-foreground">{m.value}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{m.label}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <SectionTitle numero="3">Escolas e Consultores</SectionTitle>
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <RankTable titulo="Planejamentos por Escola" colLabel="Escola" linhas={porEscola} />
            <RankTable titulo="Planejamentos por Consultor(a)" colLabel="Consultor(a)" linhas={porConsultor} />
          </div>

          <SectionTitle numero="4">Distribuições</SectionTitle>
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <CountersCard titulo="Por Segmento" linhas={porSegmento} cols="sm:grid-cols-2" />
            <CountersCard titulo="Por Componente" linhas={porComponente} cols="sm:grid-cols-2" />
            <CountersCard titulo="Por Ano/Série" linhas={porAnoSerie} cols="sm:grid-cols-2" />
          </div>

          <SectionTitle numero="5">Evolução mensal</SectionTitle>
          <Card className="border shadow-sm">
            <CardHeader className="border-b bg-muted/30 px-6 py-4">
              <CardTitle className="text-base font-semibold text-foreground">
                Volume de planejamentos e perfil das turmas por mês
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {evolucaoData.length === 0 ? (
                <EmptyState />
              ) : (
                <ResponsiveContainer width="100%" height={340}>
                  <LineChart data={evolucaoData} margin={{ top: 8, right: 24, bottom: 8, left: 0 }}>
                    <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                    <XAxis dataKey="mes" fontSize={11} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" />
                    <YAxis fontSize={11} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        background: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 8,
                        fontSize: 11,
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
                    {LINHAS_EVOLUCAO.map((l, i) => (
                      <Line
                        key={l.key}
                        type="monotone"
                        dataKey={l.label}
                        stroke={CHART_COLORS[i % CHART_COLORS.length]}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                        isAnimationActive={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <SectionTitle numero="6">Registros qualitativos</SectionTitle>
          <TextosCard titulo="Contribuições ao planejamento do professor" itens={textos.contribuicoes} />
          <TextosCard titulo="Monitoramento das aulas pela consultoria" itens={textos.monitoramento} />
        </>
      )}
    </div>
  );
}
