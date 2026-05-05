import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2, Download, Printer, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { exportSectionsToPdf } from '@/lib/pdfExport';
import { AcaoPrintDialog } from '@/components/print/AcaoPrintDialog';

export default function RelatorioApoioPresencialPage() {
  const { profile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const isGestorOrN3 = profile?.role === 'gestor' || profile?.role === 'n3_coordenador_programa';
  const hasEscolas = (profile?.programas || []).includes('escolas' as any);
  const allowed = isAdmin || (isGestorOrN3 && hasEscolas);

  useEffect(() => {
    if (profile && !allowed) navigate('/unauthorized', { replace: true });
  }, [profile, allowed, navigate]);

  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [consultorId, setConsultorId] = useState('todos');
  const [escolaId, setEscolaId] = useState('todos');
  const [exporting, setExporting] = useState(false);
  const [printId, setPrintId] = useState<string | null>(null);

  const { data: rows, isLoading } = useQuery({
    queryKey: ['apoio-visualizacao'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('instrument_responses')
        .select(`
          id, responses, registro_acao_id,
          registros_acao:registro_acao_id (
            id, data, aap_id, escola_id, programa, status, programacao_id,
            profiles:aap_id ( id, nome ),
            escolas:escola_id ( id, nome ),
            programacoes:programacao_id ( id, apoio_componente, apoio_etapa, apoio_devolutiva, apoio_obs_planejada, apoio_turma_voar, apoio_escola_voar )
          )
        `)
        .eq('form_type', 'registro_apoio_presencial');
      if (error) throw error;
      return (data || []).filter((r: any) => r.registros_acao?.status === 'realizada' && (r.registros_acao?.programa || []).includes('escolas'));
    },
    enabled: allowed,
  });

  const consultores = useMemo(() => {
    const m = new Map<string, string>();
    (rows || []).forEach((r: any) => { const p = r.registros_acao?.profiles; if (p?.id) m.set(p.id, p.nome); });
    return Array.from(m, ([id, nome]) => ({ id, nome })).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }, [rows]);

  const escolas = useMemo(() => {
    const m = new Map<string, string>();
    (rows || []).forEach((r: any) => { const e = r.registros_acao?.escolas; if (e?.id) m.set(e.id, e.nome); });
    return Array.from(m, ([id, nome]) => ({ id, nome })).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }, [rows]);

  const filtered = useMemo(() => (rows || []).filter((r: any) => {
    const reg = r.registros_acao;
    if (!reg) return false;
    if (consultorId !== 'todos' && reg.aap_id !== consultorId) return false;
    if (escolaId !== 'todos' && reg.escola_id !== escolaId) return false;
    if (dataInicio && reg.data < dataInicio) return false;
    if (dataFim && reg.data > dataFim) return false;
    return true;
  }), [rows, consultorId, escolaId, dataInicio, dataFim]);

  const totals = useMemo(() => {
    const t = { totalMat: 0, totalLP: 0, totalOEMat: 0, totalOELP: 0, total: 0, devMesmoDia: 0, dev7Dias: 0, obsCoord: 0, voarPadrao: 0, voarAdaptada: 0 };
    filtered.forEach((r: any) => {
      const p = r.registros_acao?.programacoes || {};
      const comp = (p.apoio_componente || '').toLowerCase();
      const etapa = (p.apoio_etapa || '').toLowerCase();
      const isOE = etapa.includes('oe') || etapa.includes('orient');
      if (comp.includes('mat')) { isOE ? t.totalOEMat++ : t.totalMat++; }
      if (comp.includes('port') || comp.includes('lp') || comp.includes('lingua')) { isOE ? t.totalOELP++ : t.totalLP++; }
      t.total++;
      if (p.apoio_devolutiva === 'mesmo_dia') t.devMesmoDia++;
      if (p.apoio_devolutiva === 'ate_7_dias') t.dev7Dias++;
      if (p.apoio_obs_planejada === true) t.obsCoord++;
      if (p.apoio_escola_voar === true && (p.apoio_turma_voar || '').toLowerCase().includes('padr')) t.voarPadrao++;
      if ((p.apoio_turma_voar || '').toLowerCase().includes('adapt')) t.voarAdaptada++;
    });
    return t;
  }, [filtered]);

  // Compute averages for top/bottom 3
  const withAverage = useMemo(() => {
    return filtered.map((r: any) => {
      const resp = r.responses || {};
      const nums = Object.values(resp).filter((v: any) => typeof v === 'number' && v > 0) as number[];
      const avg = nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
      return { id: r.id, registroId: r.registro_acao_id, programacaoId: r.registros_acao?.programacao_id, data: r.registros_acao?.data, escola: r.registros_acao?.escolas?.nome, consultor: r.registros_acao?.profiles?.nome, avg };
    }).filter(x => x.avg > 0);
  }, [filtered]);

  const top3 = useMemo(() => [...withAverage].sort((a, b) => b.avg - a.avg).slice(0, 3), [withAverage]);
  const bottom3 = useMemo(() => [...withAverage].sort((a, b) => a.avg - b.avg).slice(0, 3), [withAverage]);

  const chartData = [
    { name: 'MAT', value: totals.totalMat },
    { name: 'LP', value: totals.totalLP },
    { name: 'OE MAT', value: totals.totalOEMat },
    { name: 'OE LP', value: totals.totalOELP },
    { name: 'Total', value: totals.total },
    { name: 'Devol. mesmo dia', value: totals.devMesmoDia },
    { name: 'Devol. 7 dias', value: totals.dev7Dias },
    { name: 'Obs c/ coord.', value: totals.obsCoord },
    { name: 'VOAR padrão', value: totals.voarPadrao },
    { name: 'VOAR adaptada', value: totals.voarAdaptada },
  ];

  const handleExport = async () => {
    setExporting(true);
    try {
      const node = (
        <div style={{ padding: 24, fontFamily: 'Helvetica, Arial, sans-serif', width: 1000 }}>
          <h2 style={{ color: '#1a3a5c', borderBottom: '2px solid #1a3a5c', paddingBottom: 6 }}>Visualização — Registro de Apoio Presencial</h2>
          <p style={{ fontSize: 12, color: '#555' }}>Período: {dataInicio || '—'} a {dataFim || '—'}</p>
          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse', marginTop: 12 }}>
            <tbody>
              {chartData.map(s => (
                <tr key={s.name}><td style={{ padding: 6, border: '1px solid #ddd' }}>{s.name}</td><td style={{ padding: 6, border: '1px solid #ddd', textAlign: 'right' }}>{s.value}</td></tr>
              ))}
            </tbody>
          </table>
          <h3 style={{ color: '#1a3a5c', marginTop: 18 }}>3 ações com menor média geral</h3>
          <ul style={{ fontSize: 12 }}>{bottom3.map(x => <li key={x.id}>{x.data} — {x.escola} — {x.consultor} — média {x.avg.toFixed(2)}</li>)}</ul>
          <h3 style={{ color: '#1a3a5c', marginTop: 12 }}>3 ações com maior média geral</h3>
          <ul style={{ fontSize: 12 }}>{top3.map(x => <li key={x.id}>{x.data} — {x.escola} — {x.consultor} — média {x.avg.toFixed(2)}</li>)}</ul>
        </div>
      );
      await exportSectionsToPdf([{ node }], `relatorio-apoio-presencial-${new Date().toISOString().split('T')[0]}.pdf`, { title: 'Visualização Apoio Presencial' });
      toast.success('PDF gerado');
    } catch (e) { console.error(e); toast.error('Erro ao gerar PDF'); }
    finally { setExporting(false); }
  };

  if (!allowed || isLoading) return <div className="flex items-center justify-center min-h-[300px]"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Visualização — Registro de Apoio Presencial</h1>
          <p className="text-sm text-muted-foreground">Programa Escolas</p>
        </div>
        <Button onClick={handleExport} disabled={exporting}>
          {exporting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
          Baixar PDF
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div><Label>Data início</Label><Input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} /></div>
          <div><Label>Data fim</Label><Input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} /></div>
          <div>
            <Label>Consultor Pedagógico</Label>
            <Select value={consultorId} onValueChange={setConsultorId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="todos">Todos</SelectItem>{consultores.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Escola</Label>
            <Select value={escolaId} onValueChange={setEscolaId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="todos">Todas</SelectItem>{escolas.map(e => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {chartData.map(s => (
          <Card key={s.name}><CardContent className="pt-4"><div className="text-xs text-muted-foreground">{s.name}</div><div className="text-2xl font-bold">{s.value}</div></CardContent></Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Resumo gráfico</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={11} interval={0} angle={-20} textAnchor="end" height={70} />
              <YAxis fontSize={11} />
              <Tooltip /><Legend />
              <Bar dataKey="value" fill="#1a3a5c" name="Quantidade" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>3 ações com menor média geral</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead><tr className="border-b"><th className="text-left p-2">Data</th><th className="text-left p-2">Escola</th><th className="text-left p-2">Média</th><th></th></tr></thead>
              <tbody>
                {bottom3.map(x => (
                  <tr key={x.id} className="border-b">
                    <td className="p-2">{x.data ? format(parseISO(x.data), 'dd/MM/yyyy') : '-'}</td>
                    <td className="p-2">{x.escola}</td>
                    <td className="p-2 font-semibold">{x.avg.toFixed(2)}</td>
                    <td className="p-2"><Button size="sm" variant="ghost" onClick={() => x.programacaoId && setPrintId(x.programacaoId)}><Printer className="w-4 h-4" /></Button></td>
                  </tr>
                ))}
                {bottom3.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">—</td></tr>}
              </tbody>
            </table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>3 ações com maior média geral</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead><tr className="border-b"><th className="text-left p-2">Data</th><th className="text-left p-2">Escola</th><th className="text-left p-2">Média</th><th></th></tr></thead>
              <tbody>
                {top3.map(x => (
                  <tr key={x.id} className="border-b">
                    <td className="p-2">{x.data ? format(parseISO(x.data), 'dd/MM/yyyy') : '-'}</td>
                    <td className="p-2">{x.escola}</td>
                    <td className="p-2 font-semibold">{x.avg.toFixed(2)}</td>
                    <td className="p-2"><Button size="sm" variant="ghost" onClick={() => x.programacaoId && setPrintId(x.programacaoId)}><Printer className="w-4 h-4" /></Button></td>
                  </tr>
                ))}
                {top3.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">—</td></tr>}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      <AcaoPrintDialog open={!!printId} onOpenChange={(v) => !v && setPrintId(null)} programacaoId={printId} />
    </div>
  );
}
