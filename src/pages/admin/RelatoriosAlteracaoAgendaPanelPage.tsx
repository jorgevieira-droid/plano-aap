import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { Loader2, Download, FileText, Building2, Users, CalendarClock, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';

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

const sortPt = (a: string, b: string) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' });

const CONTEXTO_OPTIONS = [
  'Feriado',
  'Reunião de Pais',
  'Conselho de Classe',
  'Evento na escola',
  'Convocação do profissional',
  'Ausência do profissional',
  'Outros',
];

const monthLabel = (iso: string) => format(parseISO(`${iso}-01`), 'MM/yyyy');

interface Row {
  id: string;
  data?: string;
  aapId?: string;
  escolaId?: string;
  consultor: string;
  escola: string;
  contextos: string[];
  impacto: string;
}

export default function RelatoriosAlteracaoAgendaPanelPage() {
  const { profile, isAdmin, hasRole, effectiveProgramas } = useAuth();
  const navigate = useNavigate();

  const isGestorOrN3 = hasRole('gestor') || hasRole('n3_coordenador_programa');
  const hasEscolas = (effectiveProgramas || []).includes('escolas' as any);
  const allowed = isAdmin || (isGestorOrN3 && hasEscolas);

  useEffect(() => {
    if (profile && !allowed) navigate('/unauthorized', { replace: true });
  }, [profile, allowed, navigate]);

  const [dataInicio, setDataInicio] = usePersistedState('relatorios-alteracao-agenda:dataInicio', '');
  const [dataFim, setDataFim] = usePersistedState('relatorios-alteracao-agenda:dataFim', '');
  const [consultorIds, setConsultorIds] = usePersistedState<string[]>('relatorios-alteracao-agenda:consultorIds', []);
  const [escolaIds, setEscolaIds] = usePersistedState<string[]>('relatorios-alteracao-agenda:escolaIds', []);
  const [exporting, setExporting] = useState(false);

  const { data: rows, isLoading } = useQuery({
    queryKey: ['relatorios-alteracao-agenda'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('instrument_responses')
        .select(`
          id, responses, registro_acao_id,
          registros_acao:registro_acao_id (
            id, data, aap_id, escola_id, programa, status,
            profiles:aap_id ( id, nome ),
            escolas:escola_id ( id, nome )
          )
        `)
        .eq('form_type', 'alteracao_agenda_visita');
      if (error) throw error;
      return (data || [])
        .filter((r: any) => r.registros_acao?.status === 'realizada' && (r.registros_acao?.programa || []).includes('escolas'))
        .map((r: any): Row => {
          const reg = r.registros_acao;
          const resp = r.responses || {};
          const raw = resp.contexto_alteracao;
          const contextos = (Array.isArray(raw) ? raw : raw ? [raw] : [])
            .map((c: any) => String(c || '').trim())
            .filter(Boolean);
          return {
            id: r.id,
            data: reg?.data,
            aapId: reg?.aap_id,
            escolaId: reg?.escola_id,
            consultor: reg?.profiles?.nome || 'Sem consultor(a)',
            escola: reg?.escolas?.nome || 'Sem entidade',
            contextos,
            impacto: String(resp.impacto_agenda || '').trim(),
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

  const porContexto = useMemo(() => {
    const m = new Map<string, number>();
    CONTEXTO_OPTIONS.forEach((c) => m.set(c, 0));
    filtered.forEach((r) => r.contextos.forEach((c) => m.set(c, (m.get(c) || 0) + 1)));
    return Array.from(m, ([nome, qtd]) => ({ nome, qtd })).filter((c) => c.qtd > 0 || CONTEXTO_OPTIONS.includes(c.nome));
  }, [filtered]);

  const contextoTop = useMemo(() => {
    const ordenado = [...porContexto].sort((a, b) => b.qtd - a.qtd);
    return ordenado.length > 0 && ordenado[0].qtd > 0 ? ordenado[0] : null;
  }, [porContexto]);

  const porEscola = useMemo(() => {
    const m = new Map<string, number>();
    filtered.forEach((r) => m.set(r.escola, (m.get(r.escola) || 0) + 1));
    return Array.from(m, ([nome, qtd]) => ({ nome, qtd })).sort((a, b) => b.qtd - a.qtd || sortPt(a.nome, b.nome));
  }, [filtered]);

  const porConsultor = useMemo(() => {
    const m = new Map<string, number>();
    filtered.forEach((r) => m.set(r.consultor, (m.get(r.consultor) || 0) + 1));
    return Array.from(m, ([nome, qtd]) => ({ nome, qtd })).sort((a, b) => b.qtd - a.qtd || sortPt(a.nome, b.nome));
  }, [filtered]);

  const evolucaoMensal = useMemo(() => {
    const m = new Map<string, number>();
    filtered.forEach((r) => {
      if (!r.data) return;
      const mes = r.data.slice(0, 7);
      m.set(mes, (m.get(mes) || 0) + 1);
    });
    return Array.from(m, ([mes, qtd]) => ({ mes: monthLabel(mes), raw: mes, qtd }))
      .sort((a, b) => a.raw.localeCompare(b.raw));
  }, [filtered]);

  const detalhes = useMemo(
    () => [...filtered].sort((a, b) => (b.data || '').localeCompare(a.data || '') || sortPt(a.consultor, b.consultor)),
    [filtered],
  );

  const kpis = useMemo(() => ({
    total: filtered.length,
    escolas: new Set(filtered.map((r) => r.escolaId || r.escola)).size,
    consultores: new Set(filtered.map((r) => r.aapId || r.consultor)).size,
    contexto: contextoTop ? `${contextoTop.nome} (${contextoTop.qtd})` : '—',
  }), [filtered, contextoTop]);

  const periodoLabel = `${dataInicio ? format(parseISO(dataInicio), 'dd/MM/yyyy') : '—'} a ${dataFim ? format(parseISO(dataFim), 'dd/MM/yyyy') : '—'}`;

  const exportDetalhesExcel = () => {
    const rows = detalhes.map((d) => ({
      Data: d.data ? format(parseISO(d.data), 'dd/MM/yyyy') : '—',
      'Consultor(a)': d.consultor,
      Escola: d.escola,
      Contexto: d.contextos.join(', ') || '—',
      'Impacto na agenda': d.impacto || '—',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [12, 32, 38, 32, 60].map((wch) => ({ wch }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Alterações registradas');
    XLSX.writeFile(wb, `alteracoes-agenda-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const pdfKpis = [
        { label: 'Total de alterações registradas', value: String(kpis.total), color: '#1a3a5c', bg: '#eef2f7' },
        { label: 'Escolas impactadas', value: String(kpis.escolas), color: '#059669', bg: '#ecfdf5' },
        { label: 'Consultores(as) com alterações', value: String(kpis.consultores), color: '#7c3aed', bg: '#f5f3ff' },
        { label: 'Contexto mais frequente', value: kpis.contexto, color: '#d97706', bg: '#fffbeb' },
      ];

      const cardStyle: React.CSSProperties = {
        border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', background: '#fff',
      };
      const cardHeader: React.CSSProperties = {
        background: '#f5f7fa', borderBottom: '1px solid #e5e7eb', padding: '10px 16px',
        fontSize: 13, fontWeight: 700, color: '#1a3a5c',
      };
      const thStyle: React.CSSProperties = {
        textAlign: 'left', padding: '8px 16px', fontSize: 9, letterSpacing: 0.6,
        textTransform: 'uppercase', color: '#6b7280', borderBottom: '1px solid #e5e7eb',
      };
      const tdStyle: React.CSSProperties = {
        padding: '7px 16px', borderBottom: '1px solid #eef0f3', color: '#111827', fontSize: 11,
      };

      const renderTable = (titulo: string, colLabel: string, linhas: { nome: string; qtd: number }[]) => (
        <div style={{ ...cardStyle, flex: 1 }}>
          <div style={cardHeader}>{titulo}</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>{colLabel}</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Alterações</th>
              </tr>
            </thead>
            <tbody>
              {linhas.length === 0 ? (
                <tr><td colSpan={2} style={{ ...tdStyle, textAlign: 'center', color: '#6b7280' }}>Nenhum registro no período.</td></tr>
              ) : linhas.map((l, i) => (
                <tr key={l.nome} style={{ background: i % 2 === 1 ? '#fafbfc' : '#fff' }}>
                  <td style={{ ...tdStyle, fontWeight: 500 }}>{l.nome}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>{l.qtd}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

      const node = (
        <div style={{ fontFamily: 'Arial, sans-serif', color: '#111827' }}>
          <div data-pdf-section>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
              {pdfKpis.map((k) => (
                <div key={k.label} style={{ flex: '1 1 180px', border: '1px solid #e5e7eb', borderRadius: 8, padding: '12px 14px', background: k.bg }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: k.color }}>{k.value}</div>
                  <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.6, color: '#6b7280', marginTop: 4 }}>{k.label}</div>
                </div>
              ))}
            </div>
            {renderTable('Alterações por contexto', 'Contexto da alteração', porContexto.filter((c) => c.qtd > 0))}
          </div>

          <div data-pdf-section style={{ marginTop: 16, display: 'flex', gap: 12 }}>
            {renderTable('Alterações por escola', 'Escola', porEscola)}
            {renderTable('Alterações por consultor(a)', 'Consultor(a)', porConsultor)}
          </div>

          <div data-pdf-section style={{ marginTop: 16 }}>
            {renderTable('Evolução mensal', 'Mês', evolucaoMensal.map((e) => ({ nome: e.mes, qtd: e.qtd })))}
          </div>

          <div data-pdf-section style={{ marginTop: 16 }}>
            <div style={cardStyle}>
              <div style={cardHeader}>Alterações registradas</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Data</th>
                    <th style={thStyle}>Consultor(a)</th>
                    <th style={thStyle}>Escola</th>
                    <th style={thStyle}>Contexto</th>
                    <th style={thStyle}>Impacto na agenda</th>
                  </tr>
                </thead>
                <tbody>
                  {detalhes.length === 0 ? (
                    <tr><td colSpan={5} style={{ ...tdStyle, textAlign: 'center', color: '#6b7280' }}>Nenhum registro no período.</td></tr>
                  ) : detalhes.map((d, i) => (
                    <tr key={d.id} style={{ background: i % 2 === 1 ? '#fafbfc' : '#fff' }}>
                      <td style={tdStyle}>{d.data ? format(parseISO(d.data), 'dd/MM/yyyy') : '—'}</td>
                      <td style={{ ...tdStyle, fontWeight: 500 }}>{d.consultor}</td>
                      <td style={tdStyle}>{d.escola}</td>
                      <td style={tdStyle}>{d.contextos.join(', ') || '—'}</td>
                      <td style={{ ...tdStyle, whiteSpace: 'pre-wrap' }}>{d.impacto || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );

      await exportSectionsToPdf(
        [{ node }],
        `relatorio-alteracao-agenda-${new Date().toISOString().split('T')[0]}.pdf`,
        { title: 'Relatório - Alterações de agenda da visita', subtitle: `Período: ${periodoLabel}` },
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
    { label: 'Total de alterações registradas', value: String(kpis.total).padStart(2, '0'), icon: FileText, iconColor: 'text-primary', bgColor: 'bg-primary/10', accent: 'bg-primary' },
    { label: 'Escolas impactadas', value: String(kpis.escolas).padStart(2, '0'), icon: Building2, iconColor: 'text-emerald-600', bgColor: 'bg-emerald-50', accent: 'bg-emerald-500' },
    { label: 'Consultores(as) com alterações', value: String(kpis.consultores).padStart(2, '0'), icon: Users, iconColor: 'text-violet-600', bgColor: 'bg-violet-50', accent: 'bg-violet-500' },
    { label: 'Contexto mais frequente', value: kpis.contexto, icon: CalendarClock, iconColor: 'text-amber-600', bgColor: 'bg-amber-50', accent: 'bg-amber-500' },
  ];

  const EmptyState = ({ label = 'Nenhum registro no período.' }: { label?: string }) => (
    <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
      <FileText className="h-6 w-6 opacity-40" />
      <p className="text-sm">{label}</p>
    </div>
  );

  const RankTable = ({ titulo, colLabel, linhas }: { titulo: string; colLabel: string; linhas: { nome: string; qtd: number }[] }) => {
    const max = Math.max(1, ...linhas.map((l) => l.qtd));
    const soma = linhas.reduce((a, l) => a + l.qtd, 0);
    return (
      <Card className="border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-3 border-b bg-muted/30 px-6 py-4">
          <CardTitle className="text-base font-semibold text-foreground">{titulo}</CardTitle>
          <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
            {linhas.length} · {soma} alterações
          </span>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[60vh] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-muted">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">{colLabel}</th>
                  <th className="w-[38%] px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">Alterações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {linhas.length === 0 ? (
                  <tr><td colSpan={2} className="px-6 py-8 text-center text-muted-foreground">Nenhum registro no período.</td></tr>
                ) : linhas.map((l, i) => (
                  <tr key={l.nome} className={cn('transition-colors hover:bg-muted/40', i % 2 === 1 && 'bg-muted/10')}>
                    <td className="min-w-0 max-w-xs break-words px-6 py-3 font-medium text-foreground">{l.nome}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center justify-end gap-3">
                        <div className="hidden h-2 w-full max-w-[120px] overflow-hidden rounded-full bg-border sm:block">
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

  const contextoChart = porContexto.filter((c) => c.qtd > 0);

  return (
    <div className="min-w-0 space-y-8 overflow-x-hidden p-6 md:p-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Relatório - Alterações de agenda da visita
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Programa Escolas — contextos das alterações e impacto na agenda no período selecionado.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
              Período: {periodoLabel}
            </span>
            <span className="rounded-full border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
              {filtered.length} registros
            </span>
            <span className="rounded-full border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
              {porEscola.length} escolas · {porConsultor.length} consultores(as)
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
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Escola</Label>
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {kpiCards.map((c) => (
              <Card key={c.label} className="relative overflow-hidden border shadow-sm">
                <div className={cn('absolute inset-x-0 top-0 h-1', c.accent)} />
                <CardContent className="flex items-center gap-4 p-5">
                  <div className={cn('rounded-full p-2.5', c.bgColor)}>
                    <c.icon className={cn('h-5 w-5', c.iconColor)} />
                  </div>
                  <div className="min-w-0">
                    <p className="break-words text-xl font-bold leading-tight text-foreground">{c.value}</p>
                    <p className="mt-1 break-words text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {c.label}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-4">
            <SectionTitle numero="1">Contexto das alterações</SectionTitle>
            <Card className="border shadow-sm">
              <CardHeader className="border-b bg-muted/30 px-6 py-4">
                <CardTitle className="text-base font-semibold text-foreground">Alterações por contexto</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {contextoChart.length === 0 ? (
                  <EmptyState />
                ) : (
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={contextoChart} margin={{ top: 16, right: 16, bottom: 40, left: 0 }}>
                      <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                      <XAxis dataKey="nome" fontSize={10} tickLine={false} axisLine={false} interval={0} angle={-20} textAnchor="end" height={60} stroke="hsl(var(--muted-foreground))" />
                      <YAxis allowDecimals={false} fontSize={11} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          background: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: 8,
                          fontSize: 11,
                        }}
                      />
                      <Bar dataKey="qtd" name="Alterações" fill="#1a3a5c" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                        <LabelList dataKey="qtd" position="top" fontSize={11} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <SectionTitle numero="2">Distribuição por escola e consultor(a)</SectionTitle>
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <RankTable titulo="Alterações por escola" colLabel="Escola" linhas={porEscola} />
              <RankTable titulo="Alterações por consultor(a)" colLabel="Consultor(a)" linhas={porConsultor} />
            </div>
          </div>

          <div className="space-y-4">
            <SectionTitle numero="3">Evolução mensal</SectionTitle>
            <Card className="border shadow-sm">
              <CardHeader className="border-b bg-muted/30 px-6 py-4">
                <CardTitle className="text-base font-semibold text-foreground">Alterações por mês</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {evolucaoMensal.length === 0 ? (
                  <EmptyState />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={evolucaoMensal} margin={{ top: 16, right: 24, bottom: 8, left: 0 }}>
                      <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                      <XAxis dataKey="mes" fontSize={11} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" />
                      <YAxis allowDecimals={false} fontSize={11} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          background: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: 8,
                          fontSize: 11,
                        }}
                      />
                      <Bar dataKey="qtd" name="Alterações" fill="#1a3a5c" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                        <LabelList dataKey="qtd" position="top" fontSize={11} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <SectionTitle numero="4">Alterações registradas</SectionTitle>
            <Card className="border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between gap-3 border-b bg-muted/30 px-6 py-4">
                <CardTitle className="text-base font-semibold text-foreground">Detalhamento</CardTitle>
                <Button variant="outline" size="sm" onClick={exportDetalhesExcel} disabled={detalhes.length === 0}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Exportar Excel
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {detalhes.length === 0 ? (
                  <EmptyState />
                ) : (
                  <div className="max-h-[70vh] overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 z-10 bg-muted">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Data</th>
                          <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Consultor(a)</th>
                          <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Escola</th>
                          <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Contexto</th>
                          <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Impacto na agenda</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {detalhes.map((d, i) => (
                          <tr key={d.id} className={cn('align-top transition-colors hover:bg-muted/40', i % 2 === 1 && 'bg-muted/10')}>
                            <td className="whitespace-nowrap px-6 py-3 text-foreground">{d.data ? format(parseISO(d.data), 'dd/MM/yyyy') : '—'}</td>
                            <td className="min-w-0 max-w-[180px] break-words px-6 py-3 font-medium text-foreground">{d.consultor}</td>
                            <td className="min-w-0 max-w-[200px] break-words px-6 py-3 text-foreground">{d.escola}</td>
                            <td className="min-w-0 max-w-[220px] px-6 py-3">
                              <div className="flex flex-wrap gap-1">
                                {d.contextos.length === 0 ? (
                                  <span className="text-muted-foreground">—</span>
                                ) : d.contextos.map((c) => (
                                  <span key={c} className="rounded-full border bg-muted/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                    {c}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="min-w-0 whitespace-pre-wrap break-words px-6 py-3 text-foreground">{d.impacto || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
