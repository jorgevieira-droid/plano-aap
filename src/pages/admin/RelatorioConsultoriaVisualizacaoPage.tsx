import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2, Download, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
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

const consultorRoles = ['n4_1_cped', 'n5_formador'];

export default function RelatorioConsultoriaVisualizacaoPage() {
  const { profile, isAdmin } = useAuth();
  const navigate = useNavigate();

  const isGestorOrN3 =
    profile?.role === 'gestor' || profile?.role === 'n3_coordenador_programa';
  const hasEscolas = (profile?.programas || []).includes('escolas' as any);
  const allowed = isAdmin || (isGestorOrN3 && hasEscolas);

  useEffect(() => {
    if (profile && !allowed) navigate('/unauthorized', { replace: true });
  }, [profile, allowed, navigate]);

  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [consultorId, setConsultorId] = useState<string>('todos');
  const [escolaId, setEscolaId] = useState<string>('todos');
  const [exporting, setExporting] = useState(false);

  // Fetch consultorias (joined with registros)
  const { data: rows, isLoading } = useQuery({
    queryKey: ['consultoria-visualizacao'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consultoria_pedagogica_respostas')
        .select(`
          *,
          registros_acao:registro_acao_id (
            id, data, aap_id, escola_id, programa, status,
            profiles:aap_id ( id, nome ),
            escolas:escola_id ( id, nome )
          )
        `);
      if (error) throw error;
      return (data || []).filter((r: any) => r.registros_acao?.status === 'realizada' && (r.registros_acao?.programa || []).includes('escolas'));
    },
    enabled: allowed,
  });

  // Filters: consultores list
  const consultores = useMemo(() => {
    const map = new Map<string, string>();
    (rows || []).forEach((r: any) => {
      const p = r.registros_acao?.profiles;
      if (p?.id) map.set(p.id, p.nome);
    });
    return Array.from(map, ([id, nome]) => ({ id, nome }))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }, [rows]);

  const escolas = useMemo(() => {
    const map = new Map<string, string>();
    (rows || []).forEach((r: any) => {
      const e = r.registros_acao?.escolas;
      if (e?.id) map.set(e.id, e.nome);
    });
    return Array.from(map, ([id, nome]) => ({ id, nome }))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }, [rows]);

  const filtered = useMemo(() => {
    return (rows || []).filter((r: any) => {
      const reg = r.registros_acao;
      if (!reg) return false;
      if (consultorId !== 'todos' && reg.aap_id !== consultorId) return false;
      if (escolaId !== 'todos' && reg.escola_id !== escolaId) return false;
      if (dataInicio && reg.data < dataInicio) return false;
      if (dataFim && reg.data > dataFim) return false;
      return true;
    });
  }, [rows, consultorId, escolaId, dataInicio, dataFim]);

  const totals = useMemo(() => {
    const t = {
      count: filtered.length,
      aulasObs: 0,
      devolutivasProf: 0,
      aulasParceriaCoord: 0,
      devolutivasModel: 0,
      devolutivasAcomp: 0,
      atpcsMinist: 0,
      atpcsAcomp: 0,
      devolutivasATPC: 0,
    };
    filtered.forEach((c: any) => {
      t.aulasObs +=
        (c.aulas_obs_lp || 0) + (c.aulas_obs_mat || 0) +
        (c.aulas_obs_oe_lp || 0) + (c.aulas_obs_oe_mat || 0) +
        (c.aulas_obs_turma_padrao || 0) + (c.aulas_obs_turma_adaptada || 0) +
        (c.aulas_tutoria_obs || 0) + (c.aulas_obs_tutor_lp || 0) + (c.aulas_obs_tutor_mat || 0);
      t.devolutivasProf += c.devolutivas_professor || 0;
      t.aulasParceriaCoord += (c.aulas_obs_parceria_coord || 0) + (c.obs_aula_parceria_coord_extra || 0);
      t.devolutivasModel += c.devolutivas_model_coord || 0;
      t.devolutivasAcomp += c.acomp_devolutivas_coord || 0;
      t.atpcsMinist += c.atpcs_ministrados || 0;
      t.atpcsAcomp += c.atpcs_acomp_coord || 0;
      t.devolutivasATPC += c.devolutivas_coord_atpc || 0;
    });
    return t;
  }, [filtered]);

  const chartData = [
    { name: 'Aulas obs.', value: totals.aulasObs },
    { name: 'Devol. prof.', value: totals.devolutivasProf },
    { name: 'Parceria coord.', value: totals.aulasParceriaCoord },
    { name: 'Devol. modelizadas', value: totals.devolutivasModel },
    { name: 'Devol. acomp.', value: totals.devolutivasAcomp },
    { name: 'ATPCs minist.', value: totals.atpcsMinist },
    { name: 'ATPCs acomp.', value: totals.atpcsAcomp },
    { name: 'Devol. ATPC', value: totals.devolutivasATPC },
  ];

  const handleExport = async () => {
    setExporting(true);
    try {
      const node = (
        <div style={{ padding: 24, fontFamily: 'Helvetica, Arial, sans-serif', width: 1000 }}>
          <h2 style={{ color: '#1a3a5c', borderBottom: '2px solid #1a3a5c', paddingBottom: 6 }}>
            Visualização — Registro de Consultoria
          </h2>
          <p style={{ fontSize: 12, color: '#555' }}>
            Período: {dataInicio || '—'} a {dataFim || '—'} | Consultor: {consultorId === 'todos' ? 'Todos' : consultores.find(c => c.id === consultorId)?.nome} | Escola: {escolaId === 'todos' ? 'Todas' : escolas.find(e => e.id === escolaId)?.nome}
          </p>
          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse', marginTop: 12 }}>
            <tbody>
              <tr><td style={{ padding: 6, border: '1px solid #ddd' }}>Total de Registros realizados</td><td style={{ padding: 6, border: '1px solid #ddd', textAlign: 'right' }}>{totals.count}</td></tr>
              <tr><td style={{ padding: 6, border: '1px solid #ddd' }}>Aulas observadas</td><td style={{ padding: 6, border: '1px solid #ddd', textAlign: 'right' }}>{totals.aulasObs}</td></tr>
              <tr><td style={{ padding: 6, border: '1px solid #ddd' }}>Devolutivas realizadas</td><td style={{ padding: 6, border: '1px solid #ddd', textAlign: 'right' }}>{totals.devolutivasProf}</td></tr>
              <tr><td style={{ padding: 6, border: '1px solid #ddd' }}>Aulas em parceria com a coordenação</td><td style={{ padding: 6, border: '1px solid #ddd', textAlign: 'right' }}>{totals.aulasParceriaCoord}</td></tr>
              <tr><td style={{ padding: 6, border: '1px solid #ddd' }}>Devolutivas modelizadas à coordenação</td><td style={{ padding: 6, border: '1px solid #ddd', textAlign: 'right' }}>{totals.devolutivasModel}</td></tr>
              <tr><td style={{ padding: 6, border: '1px solid #ddd' }}>Devolutivas acompanhadas</td><td style={{ padding: 6, border: '1px solid #ddd', textAlign: 'right' }}>{totals.devolutivasAcomp}</td></tr>
              <tr><td style={{ padding: 6, border: '1px solid #ddd' }}>ATPCs ministrados</td><td style={{ padding: 6, border: '1px solid #ddd', textAlign: 'right' }}>{totals.atpcsMinist}</td></tr>
              <tr><td style={{ padding: 6, border: '1px solid #ddd' }}>ATPCs acompanhados</td><td style={{ padding: 6, border: '1px solid #ddd', textAlign: 'right' }}>{totals.atpcsAcomp}</td></tr>
              <tr><td style={{ padding: 6, border: '1px solid #ddd' }}>Devolutivas de ATPC</td><td style={{ padding: 6, border: '1px solid #ddd', textAlign: 'right' }}>{totals.devolutivasATPC}</td></tr>
            </tbody>
          </table>
        </div>
      );

      const textNode = (
        <div style={{ padding: 24, fontFamily: 'Helvetica, Arial, sans-serif', width: 1000, fontSize: 12 }}>
          <h2 style={{ color: '#1a3a5c' }}>Boas práticas, preocupações e encaminhamentos</h2>
          {filtered.map((c: any, i: number) => {
            const reg = c.registros_acao;
            const head = `${reg?.data ? format(parseISO(reg.data), 'dd/MM/yyyy') : '-'} — ${reg?.escolas?.nome || '-'} — ${reg?.profiles?.nome || '-'}`;
            return (
              <div key={i} style={{ marginBottom: 14, paddingBottom: 8, borderBottom: '1px solid #eee' }}>
                <div style={{ fontWeight: 700, color: '#1a3a5c' }}>{head}</div>
                {c.boas_praticas && <div><strong>Boas práticas:</strong> {c.boas_praticas}</div>}
                {c.pontos_preocupacao && <div><strong>Preocupações:</strong> {c.pontos_preocupacao}</div>}
                {c.encaminhamentos && <div><strong>Encaminhamentos:</strong> {c.encaminhamentos}</div>}
              </div>
            );
          })}
        </div>
      );

      await exportSectionsToPdf(
        [{ node }, { node: textNode }],
        `relatorio-consultoria-${new Date().toISOString().split('T')[0]}.pdf`,
        { title: 'Visualização Consultoria Pedagógica' },
      );
      toast.success('PDF gerado');
    } catch (e: any) {
      console.error(e);
      toast.error('Erro ao gerar PDF');
    } finally {
      setExporting(false);
    }
  };

  const handleExportExcel = () => {
    try {
      const wb = XLSX.utils.book_new();
      const resumo = [
        ['Métrica', 'Valor'],
        ['Registros realizados', totals.count],
        ['Aulas observadas', totals.aulasObs],
        ['Devolutivas realizadas', totals.devolutivasProf],
        ['Aulas em parceria com coordenação', totals.aulasParceriaCoord],
        ['Devolutivas modelizadas à coordenação', totals.devolutivasModel],
        ['Devolutivas acompanhadas', totals.devolutivasAcomp],
        ['ATPCs ministrados', totals.atpcsMinist],
        ['ATPCs acompanhados', totals.atpcsAcomp],
        ['Devolutivas de ATPC', totals.devolutivasATPC],
      ];
      const wsResumo = XLSX.utils.aoa_to_sheet(resumo);
      wsResumo['!cols'] = [{ wch: 42 }, { wch: 12 }];
      XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo');

      const registros = filtered.map((c: any) => {
        const reg = c.registros_acao;
        return {
          Data: reg?.data ? format(parseISO(reg.data), 'dd/MM/yyyy') : '',
          Consultor: reg?.profiles?.nome || '',
          Escola: reg?.escolas?.nome || '',
          'Aulas obs. LP': c.aulas_obs_lp || 0,
          'Aulas obs. MAT': c.aulas_obs_mat || 0,
          'Aulas obs. OE LP': c.aulas_obs_oe_lp || 0,
          'Aulas obs. OE MAT': c.aulas_obs_oe_mat || 0,
          'Aulas obs. turma padrão': c.aulas_obs_turma_padrao || 0,
          'Aulas obs. turma adaptada': c.aulas_obs_turma_adaptada || 0,
          'Aulas tutoria obs.': c.aulas_tutoria_obs || 0,
          'Devolutivas professor': c.devolutivas_professor || 0,
          'Aulas parceria coord.': (c.aulas_obs_parceria_coord || 0) + (c.obs_aula_parceria_coord_extra || 0),
          'Devolutivas modelizadas': c.devolutivas_model_coord || 0,
          'Devolutivas acompanhadas': c.acomp_devolutivas_coord || 0,
          'ATPCs ministrados': c.atpcs_ministrados || 0,
          'ATPCs acompanhados': c.atpcs_acomp_coord || 0,
          'Devolutivas ATPC': c.devolutivas_coord_atpc || 0,
        };
      });
      const wsReg = XLSX.utils.json_to_sheet(registros);
      XLSX.utils.book_append_sheet(wb, wsReg, 'Registros');

      const qual = filtered
        .filter((c: any) => c.boas_praticas || c.pontos_preocupacao || c.encaminhamentos)
        .map((c: any) => {
          const reg = c.registros_acao;
          return {
            Data: reg?.data ? format(parseISO(reg.data), 'dd/MM/yyyy') : '',
            Consultor: reg?.profiles?.nome || '',
            Escola: reg?.escolas?.nome || '',
            'Boas práticas': c.boas_praticas || '',
            'Preocupações': c.pontos_preocupacao || '',
            'Encaminhamentos': c.encaminhamentos || '',
          };
        });
      const wsQual = XLSX.utils.json_to_sheet(qual);
      XLSX.utils.book_append_sheet(wb, wsQual, 'Qualitativo');

      XLSX.writeFile(wb, `visualizacao-consultoria-${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Excel gerado');
    } catch (e) {
      console.error(e);
      toast.error('Erro ao gerar Excel');
    }
  };

  if (!allowed || isLoading) {
    return <div className="flex items-center justify-center min-h-[300px]"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  const stats = [
    { label: 'Registros realizados', value: totals.count },
    { label: 'Aulas observadas', value: totals.aulasObs },
    { label: 'Devolutivas realizadas', value: totals.devolutivasProf },
    { label: 'Parceria com coordenação', value: totals.aulasParceriaCoord },
    { label: 'Devol. modelizadas', value: totals.devolutivasModel },
    { label: 'Devol. acompanhadas', value: totals.devolutivasAcomp },
    { label: 'ATPCs ministrados', value: totals.atpcsMinist },
    { label: 'ATPCs acompanhados', value: totals.atpcsAcomp },
    { label: 'Devol. ATPC', value: totals.devolutivasATPC },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Visualização — Registro de Consultoria</h1>
          <p className="text-sm text-muted-foreground">Programa Escolas</p>
        </div>
        <Button onClick={handleExport} disabled={exporting}>
          {exporting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
          Baixar PDF
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label>Data início</Label>
            <Input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
          </div>
          <div>
            <Label>Data fim</Label>
            <Input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} />
          </div>
          <div>
            <Label>Consultor Pedagógico</Label>
            <Select value={consultorId} onValueChange={setConsultorId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {consultores.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Escola</Label>
            <Select value={escolaId} onValueChange={setEscolaId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas</SelectItem>
                {escolas.map(e => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {stats.map(s => (
          <Card key={s.label}>
            <CardContent className="pt-4">
              <div className="text-xs text-muted-foreground">{s.label}</div>
              <div className="text-2xl font-bold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Resumo gráfico</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={11} interval={0} angle={-15} textAnchor="end" height={60} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#1a3a5c" name="Quantidade" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Boas práticas, preocupações e encaminhamentos</CardTitle></CardHeader>
        <CardContent className="space-y-4 max-h-[60vh] overflow-y-auto">
          {filtered.length === 0 && <p className="text-sm text-muted-foreground">Sem registros para os filtros selecionados.</p>}
          {filtered.map((c: any) => {
            const reg = c.registros_acao;
            return (
              <div key={c.id} className="border-b pb-3">
                <div className="text-sm font-semibold text-primary">
                  {reg?.data ? format(parseISO(reg.data), 'dd/MM/yyyy', { locale: ptBR }) : '-'} — {reg?.escolas?.nome || '-'} — {reg?.profiles?.nome || '-'}
                </div>
                {c.boas_praticas && <p className="text-sm mt-1"><strong>Boas práticas:</strong> {c.boas_praticas}</p>}
                {c.pontos_preocupacao && <p className="text-sm mt-1"><strong>Preocupações:</strong> {c.pontos_preocupacao}</p>}
                {c.encaminhamentos && <p className="text-sm mt-1"><strong>Encaminhamentos:</strong> {c.encaminhamentos}</p>}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
