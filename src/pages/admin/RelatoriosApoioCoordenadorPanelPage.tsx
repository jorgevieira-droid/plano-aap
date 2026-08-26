import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { Loader2, Download, FileText, Users, Star, Gauge, Building2, ChevronDown } from 'lucide-react';
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
import { APOIO_COORDENADOR_FOCO_OPTIONS } from '@/components/formularios/ApoioCoordenadorContent';

const sortPt = (a: string, b: string) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' });

const CHART_COLORS = ['#1a3a5c', '#059669', '#d97706', '#7c3aed', '#dc2626'];

const monthLabel = (iso: string) => format(parseISO(iso + (iso.length === 7 ? '-01' : '')), 'MM/yyyy');

const num = (v: any): number | null => {
  const n = Number(v);
  return Number.isFinite(n) && v !== '' && v !== null && v !== undefined ? n : null;
};

const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);
// NPS = % promotores (9-10) - % detratores (0-6)
const calcNps = (notas: number[]): number | null => {
  if (!notas.length) return null;
  const promotores = notas.filter((n) => n >= 9).length;
  const detratores = notas.filter((n) => n <= 6).length;
  return Math.round(((promotores - detratores) / notas.length) * 100);
};
const fmtNps = (v: number | null) => (v === null ? '—' : `${v > 0 ? '+' : ''}${v}`);
const fmt = (v: number | null, digits = 1) => (v === null ? '—' : v.toFixed(digits).replace('.', ','));

interface Row {
  id: string;
  data?: string;
  aapId?: string;
  escolaId?: string;
  consultor: string;
  escola: string;
  coordenador: string;
  resp: Record<string, any>;
}

const focosOf = (resp: Record<string, any>): string[] =>
  Array.isArray(resp?.foco) ? resp.foco.map((f: any) => String(f)) : [];

export default function RelatoriosApoioCoordenadorPanelPage() {
  const { profile, isAdmin, hasRole, effectiveProgramas } = useAuth();
  const navigate = useNavigate();

  const isGestorOrN3 = hasRole('gestor') || hasRole('n3_coordenador_programa');
  const hasEscolas = (effectiveProgramas || []).includes('escolas' as any);
  const allowed = isAdmin || (isGestorOrN3 && hasEscolas);

  useEffect(() => {
    if (profile && !allowed) navigate('/unauthorized', { replace: true });
  }, [profile, allowed, navigate]);

  const [dataInicio, setDataInicio] = usePersistedState('relatorios-apoio-coordenador:dataInicio', '');
  const [dataFim, setDataFim] = usePersistedState('relatorios-apoio-coordenador:dataFim', '');
  const [consultorIds, setConsultorIds] = usePersistedState<string[]>('relatorios-apoio-coordenador:consultorIds', []);
  const [escolaIds, setEscolaIds] = usePersistedState<string[]>('relatorios-apoio-coordenador:escolaIds', []);
  const [exporting, setExporting] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: rows, isLoading } = useQuery({
    queryKey: ['relatorios-apoio-coordenador'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('instrument_responses')
        .select(`
          id, responses, registro_acao_id,
          registros_acao:registro_acao_id (
            id, data, aap_id, escola_id, programa, status,
            profiles:aap_id ( id, nome ),
            escolas:escola_id ( id, nome ),
            programacoes:programacao_id ( id, coord_nome )
          )
        `)
        .eq('form_type', 'registro_apoio_coordenador');
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
            coordenador: reg?.programacoes?.coord_nome || '—',
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

  const kpis = useMemo(() => {
    const notas = filtered.map((r) => num(r.resp.nps)).filter((n): n is number => n !== null);
    const escolasSet = new Set(filtered.map((r) => r.escola));
    const coordSet = new Set(
      filtered.map((r) => r.coordenador.trim()).filter((c) => c && c !== '—'),
    );
    return {
      total: filtered.length,
      escolas: escolasSet.size,
      coordenadores: coordSet.size,
      npsMedio: avg(notas),
      npsScore: calcNps(notas),
    };
  }, [filtered]);

  const porFoco = useMemo(() => APOIO_COORDENADOR_FOCO_OPTIONS.map((opt) => ({
    nome: opt,
    qtd: filtered.filter((r) => focosOf(r.resp).includes(opt)).length,
  })).sort((a, b) => b.qtd - a.qtd || sortPt(a.nome, b.nome)), [filtered]);

  const porNota = useMemo(() => Array.from({ length: 10 }, (_, i) => i + 1).map((n) => ({
    nome: `Nota ${n}`,
    qtd: filtered.filter((r) => num(r.resp.nps) === n).length,
  })), [filtered]);

  const porEscola = useMemo(() => {
    const m = new Map<string, { qtd: number; coords: Set<string>; notas: number[] }>();
    filtered.forEach((r) => {
      const cur = m.get(r.escola) || { qtd: 0, coords: new Set<string>(), notas: [] };
      cur.qtd += 1;
      if (r.coordenador && r.coordenador !== '—') cur.coords.add(r.coordenador.trim());
      const n = num(r.resp.nps);
      if (n !== null) cur.notas.push(n);
      m.set(r.escola, cur);
    });
    return Array.from(m, ([nome, v]) => ({
      nome,
      qtd: v.qtd,
      extra: v.coords.size,
      media: avg(v.notas),
    })).sort((a, b) => b.qtd - a.qtd || sortPt(a.nome, b.nome));
  }, [filtered]);

  const porConsultor = useMemo(() => {
    const m = new Map<string, { qtd: number; escolas: Set<string>; notas: number[] }>();
    filtered.forEach((r) => {
      const cur = m.get(r.consultor) || { qtd: 0, escolas: new Set<string>(), notas: [] };
      cur.qtd += 1;
      cur.escolas.add(r.escola);
      const n = num(r.resp.nps);
      if (n !== null) cur.notas.push(n);
      m.set(r.consultor, cur);
    });
    return Array.from(m, ([nome, v]) => ({
      nome,
      qtd: v.qtd,
      extra: v.escolas.size,
      media: avg(v.notas),
    })).sort((a, b) => b.qtd - a.qtd || sortPt(a.nome, b.nome));
  }, [filtered]);

  const meses = useMemo(() => {
    const set = new Set<string>();
    filtered.forEach((r) => { if (r.data) set.add(r.data.slice(0, 7)); });
    return Array.from(set).sort();
  }, [filtered]);

  const LINHAS_EVOLUCAO = [
    { key: 'apoios', label: 'Apoios no mês' },
    { key: 'escolas', label: 'Escolas atendidas' },
    { key: 'nota_nps', label: 'Nota média de NPS' },
    { key: 'nps', label: 'NPS' },
  ];

  const evolucaoData = useMemo(() => meses.map((m) => {
    const doMes = filtered.filter((r) => (r.data || '').slice(0, 7) === m);
    const notas = doMes.map((r) => num(r.resp.nps)).filter((n): n is number => n !== null);
    const round1 = (v: number | null) => (v === null ? 0 : Math.round(v * 10) / 10);
    return {
      mes: monthLabel(m),
      'Apoios no mês': doMes.length,
      'Escolas atendidas': new Set(doMes.map((r) => r.escola)).size,
      'Nota média de NPS': round1(avg(notas)),
      'NPS': calcNps(notas) ?? 0,
    };
  }), [filtered, meses]);

  const registros = useMemo(() => filtered
    .map((r) => ({
      id: r.id,
      escola: r.escola,
      consultor: r.consultor,
      coordenador: r.coordenador,
      data: r.data ? format(parseISO(r.data), 'dd/MM/yyyy') : '—',
      dataIso: r.data || '',
      foco: focosOf(r.resp),
      focoOutros: String(r.resp.foco_outros || '').trim(),
      nps: num(r.resp.nps),
      tema: String(r.resp.tema_apoio || '').trim(),
      anotacoes: String(r.resp.anotacoes || '').trim(),
    }))
    .sort((a, b) => (b.dataIso || '').localeCompare(a.dataIso || '') || sortPt(a.escola, b.escola)),
  [filtered]);

  const totalConsultores = consultorIds.length > 0 ? consultorIds.length : porConsultor.length;
  const totalEscolas = escolaIds.length > 0 ? escolaIds.length : porEscola.length;
  const periodoLabel = `${dataInicio ? format(parseISO(dataInicio), 'dd/MM/yyyy') : '—'} a ${dataFim ? format(parseISO(dataFim), 'dd/MM/yyyy') : '—'}`;

  // ---------- PDF ----------
  const handleExport = async () => {
    setExporting(true);
    try {
      const pdfKpis = [
        { label: 'Apoios registrados', value: String(kpis.total).padStart(2, '0'), color: '#1a3a5c', bg: '#eef2f7' },
        { label: 'Escolas atendidas', value: String(kpis.escolas).padStart(2, '0'), color: '#0891b2', bg: '#ecfeff' },
        { label: 'Coordenadores atendidos', value: String(kpis.coordenadores).padStart(2, '0'), color: '#7c3aed', bg: '#f5f3ff' },
        { label: 'Nota média de NPS', value: fmt(kpis.npsMedio), color: '#059669', bg: '#ecfdf5' },
        { label: 'NPS', value: fmtNps(kpis.npsScore), color: '#d97706', bg: '#fffbeb' },
      ];

      const cardStyle: React.CSSProperties = { border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', background: '#fff' };
      const cardHeader: React.CSSProperties = { background: '#f5f7fa', borderBottom: '1px solid #e5e7eb', padding: '10px 16px', fontSize: 13, fontWeight: 700, color: '#1a3a5c' };
      const thStyle: React.CSSProperties = { textAlign: 'left', padding: '8px 16px', fontSize: 9, letterSpacing: 0.6, textTransform: 'uppercase', color: '#6b7280', borderBottom: '1px solid #e5e7eb' };
      const tdStyle: React.CSSProperties = { padding: '7px 16px', borderBottom: '1px solid #eef0f3', color: '#111827', fontSize: 11 };

      const renderRank = (
        titulo: string,
        colLabel: string,
        extraLabel: string,
        linhas: { nome: string; qtd: number; extra: number; media: number | null }[],
      ) => (
        <div style={{ ...cardStyle, flex: 1 }}>
          <div style={cardHeader}>{titulo}</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>{colLabel}</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Apoios</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>{extraLabel}</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Nota NPS</th>
              </tr>
            </thead>
            <tbody>
              {linhas.length === 0 ? (
                <tr><td colSpan={4} style={{ ...tdStyle, textAlign: 'center', color: '#6b7280' }}>Nenhum registro no período.</td></tr>
              ) : linhas.map((l, i) => (
                <tr key={l.nome} style={{ background: i % 2 === 1 ? '#fafbfc' : '#fff' }}>
                  <td style={{ ...tdStyle, fontWeight: 500 }}>{l.nome}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>{l.qtd}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>{l.extra}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>{fmt(l.media)}</td>
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
            {linhas.map((l) => (
              <div key={l.nome} style={{ flex: '1 1 110px', border: '1px solid #eef0f3', borderRadius: 6, padding: 12, background: '#fafbfc' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#1a3a5c' }}>{String(l.qtd).padStart(2, '0')}</div>
                <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>{l.nome}</div>
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
                <div style={{ display: 'inline-block', background: bg, color, borderRadius: 6, padding: '2px 8px', fontSize: 9, fontWeight: 700 }}>APOIO AO COORDENADOR</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#111827', lineHeight: 1.2, marginTop: 6 }}>{value}</div>
                <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', color: '#6b7280' }}>{label}</div>
              </div>
            ))}
          </div>

          <div data-pdf-section style={{ marginBottom: 16 }}>
            {renderCounters('Foco dos apoios', porFoco)}
          </div>

          <div data-pdf-section style={{ marginBottom: 16 }}>
            {renderCounters('Distribuição das notas (NPS)', porNota)}
          </div>

          <div data-pdf-section style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 16 }}>
            {renderRank('Apoios por Escola', 'Escola', 'Coord.', porEscola)}
            {renderRank('Apoios por Consultor(a)', 'Consultor(a)', 'Escolas', porConsultor)}
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

          <div data-pdf-section>
            <div style={cardStyle}>
              <div style={cardHeader}>Registros detalhados</div>
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {registros.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#6b7280', fontSize: 11 }}>Nenhum registro no período.</div>
                ) : registros.map((it) => (
                  <div key={it.id} style={{ border: '1px solid #eef0f3', borderRadius: 6, padding: 12, background: '#fafbfc' }}>
                    <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 4 }}>
                      {it.data} · {it.escola} · Coord.: {it.coordenador} · {it.consultor} · NPS: {it.nps ?? '—'}
                    </div>
                    {it.foco.length > 0 && (
                      <div style={{ fontSize: 10, color: '#1a3a5c', marginBottom: 4 }}>
                        Foco: {it.foco.join(' · ')}{it.focoOutros ? ` (${it.focoOutros})` : ''}
                      </div>
                    )}
                    {it.tema && <div style={{ fontSize: 11, color: '#111827', whiteSpace: 'pre-wrap', marginBottom: 4 }}><strong>Tema:</strong> {it.tema}</div>}
                    {it.anotacoes && <div style={{ fontSize: 11, color: '#111827', whiteSpace: 'pre-wrap' }}><strong>Conquistas e desafios:</strong> {it.anotacoes}</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );

      await exportSectionsToPdf(
        [{ node }],
        `relatorio-apoio-coordenador-${new Date().toISOString().split('T')[0]}.pdf`,
        { title: 'Relatório - Registro de Apoio ao Coordenador', subtitle: `Período: ${periodoLabel}` },
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
    { label: 'Apoios registrados', value: String(kpis.total).padStart(2, '0'), icon: FileText, iconColor: 'text-primary', bgColor: 'bg-primary/10', accent: 'bg-primary' },
    { label: 'Escolas atendidas', value: String(kpis.escolas).padStart(2, '0'), icon: Building2, iconColor: 'text-cyan-600', bgColor: 'bg-cyan-50', accent: 'bg-cyan-500' },
    { label: 'Coordenadores atendidos', value: String(kpis.coordenadores).padStart(2, '0'), icon: Users, iconColor: 'text-violet-600', bgColor: 'bg-violet-50', accent: 'bg-violet-500' },
    { label: 'Nota média de NPS', value: fmt(kpis.npsMedio), icon: Star, iconColor: 'text-emerald-600', bgColor: 'bg-emerald-50', accent: 'bg-emerald-500' },
    { label: 'NPS', value: fmtNps(kpis.npsScore), icon: Gauge, iconColor: 'text-amber-600', bgColor: 'bg-amber-50', accent: 'bg-amber-500' },
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
          {linhas.map((l) => (
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

  const RankTable = ({
    titulo,
    colLabel,
    extraLabel,
    linhas,
  }: {
    titulo: string;
    colLabel: string;
    extraLabel: string;
    linhas: { nome: string; qtd: number; extra: number; media: number | null }[];
  }) => {
    const max = Math.max(1, ...linhas.map((l) => l.qtd));
    const soma = linhas.reduce((a, l) => a + l.qtd, 0);
    return (
      <Card className="border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-3 border-b bg-muted/30 px-6 py-4">
          <CardTitle className="text-base font-semibold text-foreground">{titulo}</CardTitle>
          <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
            {linhas.length} · {soma} apoios
          </span>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[60vh] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">{colLabel}</th>
                  <th className="px-3 py-3 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">{extraLabel}</th>
                  <th className="px-3 py-3 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">Nota NPS</th>
                  <th className="w-[26%] px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">Apoios</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {linhas.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">Nenhum registro no período.</td></tr>
                ) : linhas.map((l, i) => (
                  <tr key={l.nome} className={cn('transition-colors hover:bg-muted/40', i % 2 === 1 && 'bg-muted/10')}>
                    <td className="min-w-0 max-w-xs break-words px-6 py-3 font-medium text-foreground">{l.nome}</td>
                    <td className="px-3 py-3 text-right text-muted-foreground">{l.extra}</td>
                    <td className="px-3 py-3 text-right text-muted-foreground">{fmt(l.media)}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center justify-end gap-3">
                        <div className="hidden h-2 w-full max-w-[100px] overflow-hidden rounded-full bg-border sm:block">
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

  return (
    <div className="min-w-0 space-y-8 overflow-x-hidden p-6 md:p-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Relatório - Registro de Apoio ao Coordenador
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Programa Escolas — foco, temas, avaliação e relatos dos apoios ao coordenador.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
              Período: {periodoLabel}
            </span>
            <span className="rounded-full border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
              {filtered.length} apoios
            </span>
            <span className="rounded-full border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
              {totalEscolas} escolas · {totalConsultores} consultores(as)
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

          <SectionTitle numero="2">Distribuições</SectionTitle>
          <CountersCard titulo="Foco dos apoios" linhas={porFoco} cols="sm:grid-cols-4" />
          <CountersCard titulo="Distribuição das notas (NPS)" linhas={porNota} cols="sm:grid-cols-5" />

          <SectionTitle numero="3">Escolas e Consultores</SectionTitle>
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <RankTable titulo="Apoios por Escola" colLabel="Escola" extraLabel="Coord." linhas={porEscola} />
            <RankTable titulo="Apoios por Consultor(a)" colLabel="Consultor(a)" extraLabel="Escolas" linhas={porConsultor} />
          </div>

          <SectionTitle numero="4">Evolução mensal</SectionTitle>
          <Card className="border shadow-sm">
            <CardHeader className="border-b bg-muted/30 px-6 py-4">
              <CardTitle className="text-base font-semibold text-foreground">
                Volume, alcance e NPS por mês
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

          <SectionTitle numero="5">Registros detalhados</SectionTitle>
          <Card className="border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between gap-3 border-b bg-muted/30 px-6 py-4">
              <CardTitle className="text-base font-semibold text-foreground">Apoios registrados</CardTitle>
              <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">{registros.length}</span>
            </CardHeader>
            <CardContent className="p-0">
              {registros.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="max-h-[70vh] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-muted">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Data</th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Escola</th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Coordenador</th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Consultor(a)</th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Foco</th>
                        <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">NPS</th>
                        <th className="w-10" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {registros.map((it, i) => (
                        <>
                          <tr
                            key={it.id}
                            onClick={() => setExpanded(expanded === it.id ? null : it.id)}
                            className={cn('cursor-pointer transition-colors hover:bg-muted/40', i % 2 === 1 && 'bg-muted/10')}
                          >
                            <td className="whitespace-nowrap px-4 py-3 text-foreground">{it.data}</td>
                            <td className="min-w-0 max-w-[200px] break-words px-4 py-3 font-medium text-foreground">{it.escola}</td>
                            <td className="min-w-0 max-w-[160px] break-words px-4 py-3 text-muted-foreground">{it.coordenador}</td>
                            <td className="min-w-0 max-w-[160px] break-words px-4 py-3 text-muted-foreground">{it.consultor}</td>
                            <td className="min-w-0 max-w-[260px] break-words px-4 py-3 text-xs text-muted-foreground">
                              {it.foco.length ? it.foco.join(' · ') : '—'}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-foreground">{it.nps ?? '—'}</td>
                            <td className="px-2 py-3 text-muted-foreground">
                              <ChevronDown className={cn('h-4 w-4 transition-transform', expanded === it.id && 'rotate-180')} />
                            </td>
                          </tr>
                          {expanded === it.id && (
                            <tr key={`${it.id}-detail`} className="bg-muted/20">
                              <td colSpan={7} className="space-y-3 px-4 py-4">
                                {it.focoOutros && (
                                  <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Outro foco</p>
                                    <p className="mt-1 whitespace-pre-wrap break-words text-sm text-foreground">{it.focoOutros}</p>
                                  </div>
                                )}
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tema do apoio</p>
                                  <p className="mt-1 whitespace-pre-wrap break-words text-sm text-foreground">{it.tema || '—'}</p>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Conquistas e desafios</p>
                                  <p className="mt-1 whitespace-pre-wrap break-words text-sm text-foreground">{it.anotacoes || '—'}</p>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
