import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { Loader2, Download, FileText, MessageSquare, Sparkles, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { BarChart, Bar, LineChart, Line, Legend, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';

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
import {
  RUBRICAS,
  PRATICAS_ESSENCIAIS,
  DIFERENCA_HORARIO_OPTIONS,
  APOIO_SEGMENTO_OPTIONS,
  AVALIACAO_APOIO_OPTIONS,
} from '@/components/formularios/apoioPresencialShared';

const sortPt = (a: string, b: string) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' });

const CHART_COLORS = [
  '#1a3a5c', '#059669', '#d97706', '#7c3aed', '#dc2626', '#0891b2', '#c026d3',
  '#65a30d', '#ea580c', '#4f46e5', '#0f766e', '#b91c1c', '#9333ea', '#0369a1',
];

const monthLabel = (iso: string) => format(parseISO(iso + (iso.length === 7 ? '-01' : '')), 'MM/yyyy');

interface Row {
  id: string;
  data?: string;
  aapId?: string;
  escolaId?: string;
  consultor: string;
  escola: string;
  segmento: string;
  resp: Record<string, any>;
}

export default function RelatoriosApoioPresencialPanelPage() {
  const { profile, isAdmin, hasRole, effectiveProgramas } = useAuth();
  const navigate = useNavigate();

  const isGestorOrN3 = hasRole('gestor') || hasRole('n3_coordenador_programa');
  const hasEscolas = (effectiveProgramas || []).includes('escolas' as any);
  const allowed = isAdmin || (isGestorOrN3 && hasEscolas);

  useEffect(() => {
    if (profile && !allowed) navigate('/unauthorized', { replace: true });
  }, [profile, allowed, navigate]);

  const [dataInicio, setDataInicio] = usePersistedState('relatorios-apoio-presencial:dataInicio', '');
  const [dataFim, setDataFim] = usePersistedState('relatorios-apoio-presencial:dataFim', '');
  const [consultorIds, setConsultorIds] = usePersistedState<string[]>('relatorios-apoio-presencial:consultorIds', []);
  const [escolaIds, setEscolaIds] = usePersistedState<string[]>('relatorios-apoio-presencial:escolaIds', []);
  const [exporting, setExporting] = useState(false);

  const { data: rows, isLoading } = useQuery({
    queryKey: ['relatorios-apoio-presencial'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('instrument_responses')
        .select(`
          id, responses, registro_acao_id,
          registros_acao:registro_acao_id (
            id, data, aap_id, escola_id, programa, status, programacao_id,
            profiles:aap_id ( id, nome ),
            escolas:escola_id ( id, nome ),
            programacoes:programacao_id ( id, apoio_etapa, apoio_turma_voar, apoio_escola_voar )
          )
        `)
        .eq('form_type', 'registro_apoio_presencial');
      if (error) throw error;
      return (data || [])
        .filter((r: any) => r.registros_acao?.status === 'realizada' && (r.registros_acao?.programa || []).includes('escolas'))
        .map((r: any): Row => {
          const reg = r.registros_acao;
          const prog = reg?.programacoes || {};
          return {
            id: r.id,
            data: reg?.data,
            aapId: reg?.aap_id,
            escolaId: reg?.escola_id,
            consultor: reg?.profiles?.nome || 'Sem consultor(a)',
            escola: reg?.escolas?.nome || 'Sem entidade',
            segmento: (prog.apoio_etapa || '').toString().trim().toUpperCase(),
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

  // ---------- KPIs ----------
  const kpis = useMemo(() => {
    let devolutivas = 0;
    let voarAdaptada = 0;
    let outrosObservadores = 0;
    filtered.forEach((r) => {
      if (r.resp.devolutiva_realizada === 'Sim') devolutivas++;
      if (r.resp.turma_voar === 'Sim') voarAdaptada++;
      if (Array.isArray(r.resp.outros_observadores) && r.resp.outros_observadores.length > 0) outrosObservadores++;
    });
    return { total: filtered.length, devolutivas, voarAdaptada, outrosObservadores };
  }, [filtered]);

  const porEscola = useMemo(() => {
    const m = new Map<string, number>();
    filtered.forEach((r) => m.set(r.escola, (m.get(r.escola) || 0) + 1));
    return Array.from(m, ([nome, qtd]) => ({ nome, qtd })).sort((a, b) => sortPt(a.nome, b.nome));
  }, [filtered]);

  const porConsultor = useMemo(() => {
    const m = new Map<string, number>();
    filtered.forEach((r) => m.set(r.consultor, (m.get(r.consultor) || 0) + 1));
    return Array.from(m, ([nome, qtd]) => ({ nome, qtd })).sort((a, b) => sortPt(a.nome, b.nome));
  }, [filtered]);


  const porSegmento = useMemo(() => APOIO_SEGMENTO_OPTIONS.map((seg) => ({
    nome: seg,
    qtd: filtered.filter((r) => r.segmento === seg).length,
  })), [filtered]);

  const porDiferencaHorario = useMemo(() => DIFERENCA_HORARIO_OPTIONS.map((opt) => ({
    nome: opt,
    qtd: filtered.filter((r) => r.resp.diferenca_horario === opt).length,
  })), [filtered]);

  // ---------- Meses presentes ----------
  const meses = useMemo(() => {
    const set = new Set<string>();
    filtered.forEach((r) => { if (r.data) set.add(r.data.slice(0, 7)); });
    return Array.from(set).sort();
  }, [filtered]);

  // ---------- Evolução das rubricas de observação ----------
  const rubricaEvolucao = useMemo(() => {
    // acc[rubricaKey][mes] = { soma, n }
    const acc = new Map<string, Map<string, { soma: number; n: number }>>();
    const totalPorRubrica = new Map<string, number>();
    filtered.forEach((r) => {
      const mes = (r.data || '').slice(0, 7);
      [['rubrica_1_key', 'rubrica_1_nota'], ['rubrica_2_key', 'rubrica_2_nota']].forEach(([kKey, nKey]) => {
        const key = r.resp[kKey];
        const nota = r.resp[nKey];
        if (!key || typeof nota !== 'number') return;
        if (!acc.has(key)) acc.set(key, new Map());
        const byMes = acc.get(key)!;
        const cur = byMes.get(mes) || { soma: 0, n: 0 };
        cur.soma += nota;
        cur.n += 1;
        byMes.set(mes, cur);
        totalPorRubrica.set(key, (totalPorRubrica.get(key) || 0) + 1);
      });
    });
    return RUBRICAS.filter((rb) => acc.has(rb.key)).map((rb) => ({
      key: rb.key,
      label: `${rb.numero}. ${rb.titulo}`,
      total: totalPorRubrica.get(rb.key) || 0,
      valores: meses.map((m) => {
        const cell = acc.get(rb.key)?.get(m);
        return cell && cell.n > 0 ? cell.soma / cell.n : null;
      }),
      contagens: meses.map((m) => {
        const cell = acc.get(rb.key)?.get(m);
        return cell && cell.n > 0 ? cell.n : null;
      }),
    }));
  }, [filtered, meses]);

  // ---------- Práticas essenciais ----------
  const praticasContagem = useMemo(() => PRATICAS_ESSENCIAIS.map((p, i) => ({
    key: p.key,
    label: p.titulo,
    qtd: filtered.filter((r) => typeof r.resp[`pratica_${i + 1}_nota`] === 'number').length,
  })), [filtered]);

  const praticasEvolucao = useMemo(() => PRATICAS_ESSENCIAIS.map((p, i) => {
    const valores = meses.map((m) => {
      const notas = filtered
        .filter((r) => (r.data || '').slice(0, 7) === m && typeof r.resp[`pratica_${i + 1}_nota`] === 'number')
        .map((r) => r.resp[`pratica_${i + 1}_nota`] as number);
      return notas.length ? notas.reduce((a, b) => a + b, 0) / notas.length : null;
    });
    const contagens = meses.map((m) => filtered.filter((r) => (r.data || '').slice(0, 7) === m && typeof r.resp[`pratica_${i + 1}_nota`] === 'number').length || null);
    return {
      key: p.key,
      label: p.titulo,
      valores,
      contagens,
    };
  }).filter((p) => p.valores.some((v) => v !== null)), [filtered, meses]);

  // ---------- Séries para os gráficos de linha ----------
  const toChartData = (linhas: { label: string; valores: (number | null)[] }[]) =>
    meses.map((m, i) => {
      const row: Record<string, any> = { mes: monthLabel(m) };
      linhas.forEach((l) => {
        const v = l.valores[i];
        row[l.label] = v === null ? null : Number(v.toFixed(2));
      });
      return row;
    });

  const rubricaChartData = useMemo(() => toChartData(rubricaEvolucao), [rubricaEvolucao, meses]);
  const praticasChartData = useMemo(() => toChartData(praticasEvolucao), [praticasEvolucao, meses]);



  // ---------- Autoavaliação do consultor ----------
  const autoavaliacao = useMemo(() => {
    const m = new Map<string, { soma: number; n: number }>();
    filtered.forEach((r) => {
      const v = Number(r.resp.avaliacao_apoio);
      if (!v) return;
      const cur = m.get(r.consultor) || { soma: 0, n: 0 };
      cur.soma += v;
      cur.n += 1;
      m.set(r.consultor, cur);
    });
    return Array.from(m, ([nome, { soma, n }]) => ({ name: nome, media: Number((soma / n).toFixed(2)), avaliacoes: n }))
      .sort((a, b) => sortPt(a.name, b.name));
  }, [filtered]);

  const totalConsultores = consultorIds.length > 0 ? consultorIds.length : porConsultor.length;
  const totalEscolas = escolaIds.length > 0 ? escolaIds.length : porEscola.length;

  const periodoLabel = `${dataInicio ? format(parseISO(dataInicio), 'dd/MM/yyyy') : '—'} a ${dataFim ? format(parseISO(dataFim), 'dd/MM/yyyy') : '—'}`;

  const fmt = (v: number | null) => (v === null ? '—' : v.toFixed(1).replace('.', ','));

  // ---------- PDF ----------
  const handleExport = async () => {
    setExporting(true);
    try {
      const pdfKpis = [
        { label: 'Total de apoios realizados', value: kpis.total, color: '#1a3a5c', bg: '#eef2f7' },
        { label: 'Total de devolutivas realizadas', value: kpis.devolutivas, color: '#059669', bg: '#ecfdf5' },
        { label: 'Apoios em turmas adaptadas VOAR', value: kpis.voarAdaptada, color: '#d97706', bg: '#fffbeb' },
        { label: 'Apoios com outros observadores', value: kpis.outrosObservadores, color: '#7c3aed', bg: '#f5f3ff' },
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
                <th style={{ ...thStyle, textAlign: 'right' }}>Apoios</th>
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

      const renderMatriz = (titulo: string, linhas: { key: string; label: string; valores: (number | null)[] }[]) => (
        <div style={cardStyle}>
          <div style={cardHeader}>{titulo}</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Rubrica</th>
                {meses.map((m) => (
                  <th key={m} style={{ ...thStyle, textAlign: 'center', width: 70 }}>{monthLabel(m)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {linhas.length === 0 ? (
                <tr><td colSpan={meses.length + 1} style={{ ...tdStyle, textAlign: 'center', color: '#6b7280' }}>Nenhum registro no período.</td></tr>
              ) : linhas.map((l, i) => (
                <tr key={l.key} style={{ background: i % 2 === 1 ? '#fafbfc' : '#fff' }}>
                  <td style={{ ...tdStyle, fontWeight: 500 }}>{l.label}</td>
                  {l.valores.map((v, j) => (
                    <td key={j} style={{ ...tdStyle, textAlign: 'center', fontWeight: 700 }}>{fmt(v)}</td>
                  ))}
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
              <div key={l.nome} style={{ flex: '1 1 120px', border: '1px solid #eef0f3', borderRadius: 6, padding: 12, background: '#fafbfc' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#1a3a5c' }}>{String(l.qtd).padStart(2, '0')}</div>
                <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>{l.nome}</div>
              </div>
            ))}
          </div>
        </div>
      );

      const renderLines = (
        titulo: string,
        linhas: { key: string; label: string }[],
        data: Record<string, any>[],
      ) => (
        <div style={cardStyle}>
          <div style={cardHeader}>{titulo}</div>
          <div style={{ padding: 12 }}>
            {linhas.length === 0 || data.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#6b7280', fontSize: 11 }}>Nenhum registro no período.</div>
            ) : (
              <LineChart width={920} height={320} data={data} margin={{ top: 8, right: 24, bottom: 8, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" fontSize={10} />
                <YAxis domain={[0, 4]} ticks={[0, 1, 2, 3, 4]} fontSize={10} />
                <Legend wrapperStyle={{ fontSize: 9 }} />
                {linhas.map((l, i) => (
                  <Line
                    key={l.key}
                    type="monotone"
                    dataKey={l.label}
                    stroke={CHART_COLORS[i % CHART_COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    connectNulls={false}
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            )}
          </div>
        </div>
      );

      const node = (
        <div style={{ padding: 24, fontFamily: 'Helvetica, Arial, sans-serif', width: 1000, background: '#fff' }}>
          <div data-pdf-section style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            {pdfKpis.map(({ label, value, color, bg }) => (
              <div key={label} style={{ flex: 1, border: '1px solid #e5e7eb', borderRadius: 8, padding: 14, background: '#fff' }}>
                <div style={{ display: 'inline-block', background: bg, color, borderRadius: 6, padding: '2px 8px', fontSize: 9, fontWeight: 700 }}>APOIO PRESENCIAL</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#111827', lineHeight: 1.2, marginTop: 6 }}>{String(value).padStart(2, '0')}</div>
                <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', color: '#6b7280' }}>{label}</div>
              </div>
            ))}
          </div>

          <div data-pdf-section style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 16 }}>
            {renderCounters('Quantidade de apoio por segmento', porSegmento)}
            {renderCounters('Apoios em que a aula inicia em', porDiferencaHorario)}
          </div>

          <div data-pdf-section style={{ marginBottom: 16 }}>
            {renderCounters('Quantidade de rubricas de práticas essenciais', praticasContagem.map((p) => ({ nome: p.label, qtd: p.qtd })))}
          </div>

          <div data-pdf-section style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 16 }}>
            {renderTable('Apoios por Escola', 'Escola', porEscola)}
            {renderTable('Apoios por Consultor(a)', 'Consultor(a)', porConsultor)}
          </div>

          <div data-pdf-section style={{ marginBottom: 16 }}>
            {renderLines('Evolução das rubricas de observação (média mensal, 0 a 4)', rubricaEvolucao, rubricaChartData)}
          </div>

          <div data-pdf-section style={{ marginBottom: 16 }}>
            {renderLines('Evolução das rubricas de práticas essenciais (média mensal, 0 a 4)', praticasEvolucao, praticasChartData)}
          </div>


          <div data-pdf-section>
            <div style={cardStyle}>
              <div style={cardHeader}>Autoavaliação — Consultor(a)</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Consultor(a)</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>Avaliações</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>Média (1 a 4)</th>
                  </tr>
                </thead>
                <tbody>
                  {autoavaliacao.length === 0 ? (
                    <tr><td colSpan={3} style={{ ...tdStyle, textAlign: 'center', color: '#6b7280' }}>Nenhuma autoavaliação no período.</td></tr>
                  ) : autoavaliacao.map((a, i) => (
                    <tr key={a.name} style={{ background: i % 2 === 1 ? '#fafbfc' : '#fff' }}>
                      <td style={{ ...tdStyle, fontWeight: 500 }}>{a.name}</td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>{a.avaliacoes}</td>
                      <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700 }}>{a.media.toFixed(2).replace('.', ',')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ padding: '8px 16px', fontSize: 9, color: '#6b7280', borderTop: '1px solid #eef0f3' }}>
                {AVALIACAO_APOIO_OPTIONS.map((o) => `${o.value} - ${o.label}`).join('   |   ')}
              </div>
            </div>
          </div>

          <div data-pdf-section style={{ marginTop: 16 }}>
            {renderMatriz('Evolução das rubricas de observação (média por mês)', rubricaEvolucao)}
          </div>

          <div data-pdf-section style={{ marginTop: 16 }}>
            {renderMatriz('Evolução das rubricas de práticas essenciais (média por mês)', praticasEvolucao)}
          </div>

        </div>

      );

      await exportSectionsToPdf(
        [{ node }],
        `relatorios-apoio-presencial-${new Date().toISOString().split('T')[0]}.pdf`,
        { title: 'Relatórios - Registro de Apoio Presencial', subtitle: `Período: ${periodoLabel}` },
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
    { label: 'Total de apoios realizados', value: kpis.total, icon: FileText, iconColor: 'text-primary', bgColor: 'bg-primary/10', accent: 'bg-primary' },
    { label: 'Total de devolutivas realizadas', value: kpis.devolutivas, icon: MessageSquare, iconColor: 'text-emerald-600', bgColor: 'bg-emerald-50', accent: 'bg-emerald-500' },
    { label: 'Apoios em turmas adaptadas VOAR', value: kpis.voarAdaptada, icon: Sparkles, iconColor: 'text-amber-600', bgColor: 'bg-amber-50', accent: 'bg-amber-500' },
    { label: 'Apoios com outros observadores', value: kpis.outrosObservadores, icon: Eye, iconColor: 'text-violet-600', bgColor: 'bg-violet-50', accent: 'bg-violet-500' },
  ];

  const EmptyState = ({ label = 'Nenhum registro no período.' }: { label?: string }) => (
    <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
      <FileText className="h-6 w-6 opacity-40" />
      <p className="text-sm">{label}</p>
    </div>
  );

  const MatrizCard = ({ titulo, linhas }: { titulo: string; linhas: { key: string; label: string; valores: (number | null)[]; contagens?: (number | null)[] }[] }) => (
    <Card className="border shadow-sm">
      <CardHeader className="border-b bg-muted/30 px-6 py-4">
        <CardTitle className="text-base font-semibold text-foreground">{titulo}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[70vh] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Rubrica</th>
                {meses.map((m) => (
                  <th key={m} className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">{monthLabel(m)}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {linhas.length === 0 ? (
                <tr>
                  <td colSpan={meses.length + 1} className="px-6 py-8 text-center text-muted-foreground">Nenhum registro no período.</td>
                </tr>
              ) : linhas.map((l) => (
                <tr key={l.key} className="transition-colors hover:bg-muted/40">
                  <td className="min-w-0 max-w-md break-words px-6 py-3 text-sm font-medium text-foreground">{l.label}</td>
                  {l.valores.map((v, j) => {
                    const cont = l.contagens?.[j] ?? null;
                    return (
                      <td key={j} className="px-3 py-3 text-center text-foreground">
                        {v === null || cont === null ? (
                          <span className="font-semibold text-muted-foreground">—</span>
                        ) : (
                          <div className="flex flex-col items-center leading-tight">
                            <span className="text-[10px] font-medium text-muted-foreground">Qtd: {cont}</span>
                            <span className="text-sm font-semibold">{fmt(v)}</span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );

  const CountersCard = ({ titulo, linhas }: { titulo: string; linhas: { nome: string; qtd: number }[] }) => {
    const max = Math.max(1, ...linhas.map((l) => l.qtd));
    const soma = linhas.reduce((a, l) => a + l.qtd, 0);
    return (
      <Card className="border shadow-sm">
        <CardHeader className="border-b bg-muted/30 px-6 py-4">
          <CardTitle className="text-base font-semibold text-foreground">{titulo}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 p-6 sm:grid-cols-3">
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

  const RankTable = ({ titulo, colLabel, linhas }: { titulo: string; colLabel: string; linhas: { nome: string; qtd: number }[] }) => {
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
                  <th className="w-[38%] px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">Apoios</th>
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

  const LinesCard = ({
    titulo,
    linhas,
    data,
    height = 340,
  }: {
    titulo: string;
    linhas: { key: string; label: string }[];
    data: Record<string, any>[];
    height?: number;
  }) => (
    <Card className="border shadow-sm">
      <CardHeader className="border-b bg-muted/30 px-6 py-4">
        <CardTitle className="text-base font-semibold text-foreground">{titulo}</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {linhas.length === 0 || data.length === 0 ? (
          <EmptyState />
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data} margin={{ top: 8, right: 24, bottom: 8, left: 0 }}>
              <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
              <XAxis dataKey="mes" fontSize={11} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" />
              <YAxis domain={[0, 4]} ticks={[0, 1, 2, 3, 4]} fontSize={11} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 8,
                  fontSize: 11,
                }}
                formatter={(v: any) => (v === null ? '—' : String(v).replace('.', ','))}
              />
              <Legend wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
              {linhas.map((l, i) => (
                <Line
                  key={l.key}
                  type="monotone"
                  dataKey={l.label}
                  stroke={CHART_COLORS[i % CHART_COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );

  const mediaGeralAuto = autoavaliacao.length
    ? autoavaliacao.reduce((a, b) => a + b.media, 0) / autoavaliacao.length
    : 0;

  return (
    <div className="min-w-0 space-y-8 overflow-x-hidden p-6 md:p-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Relatórios - Registro de Apoio Presencial
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Programa Escolas — indicadores, rubricas e autoavaliação no período selecionado.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
              Período: {periodoLabel}
            </span>
            <span className="rounded-full border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
              {filtered.length} registros
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
          <SectionTitle numero="1">Indicadores</SectionTitle>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {kpiCards.map((c) => (
              <Card key={c.label} className="relative overflow-hidden border shadow-sm transition-shadow hover:shadow-md">
                <div className={cn('absolute inset-x-0 top-0 h-1', c.accent)} />
                <CardContent className="flex items-center gap-4 p-6">
                  <div className={cn('rounded-full p-3', c.bgColor)}>
                    <c.icon className={cn('h-6 w-6', c.iconColor)} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-medium uppercase leading-tight tracking-tight text-muted-foreground">{c.label}</p>
                    <p className="text-3xl font-bold text-foreground">{String(c.value).padStart(2, '0')}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <SectionTitle numero="2">Números complementares</SectionTitle>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <CountersCard titulo="Quantidade de apoio por segmento" linhas={porSegmento} />
            <CountersCard titulo="Apoios em que a aula inicia em" linhas={porDiferencaHorario} />
          </div>

          <CountersCard
            titulo="Quantidade de rubricas de práticas essenciais"
            linhas={praticasContagem.map((p) => ({ nome: p.label, qtd: p.qtd }))}
          />

          <SectionTitle numero="3">Detalhamento por escola e consultor(a)</SectionTitle>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <RankTable titulo="Apoios por Escola" colLabel="Escola" linhas={porEscola} />
            <RankTable titulo="Apoios por Consultor(a)" colLabel="Consultor(a)" linhas={porConsultor} />
          </div>

          <SectionTitle numero="4">Gráficos de evolução</SectionTitle>

          <LinesCard
            titulo="Evolução das rubricas de observação (média mensal, 0 a 4)"
            linhas={rubricaEvolucao}
            data={rubricaChartData}
            height={400}
          />

          <LinesCard
            titulo="Evolução das rubricas de práticas essenciais (média mensal, 0 a 4)"
            linhas={praticasEvolucao}
            data={praticasChartData}
          />

          <Card className="border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between gap-3 border-b bg-muted/30 px-6 py-4">
              <CardTitle className="text-base font-semibold text-foreground">Autoavaliação — Consultor(a)</CardTitle>
              {autoavaliacao.length > 0 && (
                <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                  Média geral {mediaGeralAuto.toFixed(2).replace('.', ',')}
                </span>
              )}
            </CardHeader>
            <CardContent className="p-6">
              {autoavaliacao.length === 0 ? (
                <EmptyState label="Nenhuma autoavaliação no período." />
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={Math.max(260, autoavaliacao.length * 40)}>
                    <BarChart data={autoavaliacao} layout="vertical" margin={{ left: 10 }}>
                      <CartesianGrid horizontal={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 4]} ticks={[0, 1, 2, 3, 4]} fontSize={11} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" />
                      <YAxis dataKey="name" type="category" width={200} fontSize={11} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          background: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: 8,
                          fontSize: 11,
                        }}
                        formatter={(v: number, _n, p: any) => [`${v} (${p.payload.avaliacoes} avaliações)`, 'Média']}
                      />
                      <Bar dataKey="media" fill="#1a3a5c" name="Média" radius={[0, 4, 4, 0]}>
                        <LabelList dataKey="media" position="right" style={{ fontSize: '10px', fill: 'hsl(var(--foreground))' }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {AVALIACAO_APOIO_OPTIONS.map((o) => `${o.value} - ${o.label}`).join('   |   ')}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <SectionTitle numero="5">Matrizes mensais</SectionTitle>

          <MatrizCard titulo="Evolução das rubricas de observação (média por mês)" linhas={rubricaEvolucao} />

          <MatrizCard titulo="Evolução das rubricas de práticas essenciais (média por mês)" linhas={praticasEvolucao} />
        </>

      )}
    </div>
  );
}

