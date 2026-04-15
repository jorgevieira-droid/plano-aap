import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/DataTable';
import { StatCard } from '@/components/ui/StatCard';
import { Loader2, FileText, Download, Mail, Filter, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type ProgramaType = 'escolas' | 'regionais' | 'redes_municipais';

const programaLabels: Record<string, string> = {
  escolas: 'Escolas',
  regionais: 'Regionais de Ensino',
  redes_municipais: 'Redes Municipais',
};

export default function RelatorioConsultoriaPage() {
  const { profile, roleTier, isAdmin } = useAuth();

  // Filters
  const [programaFilter, setProgramaFilter] = useState<string>('todos');
  const [atorFilter, setAtorFilter] = useState<string>('todos');
  const [entidadeFilter, setEntidadeFilter] = useState<string>('todos');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  // Email dialog
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  // Fetch consultorias
  const { data: consultorias, isLoading } = useQuery({
    queryKey: ['consultoria-relatorio'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consultoria_pedagogica_respostas')
        .select(`
          *,
          registros_acao:registro_acao_id (
            id, data, tipo, programa, aap_id, escola_id, segmento,
            profiles:aap_id ( id, nome ),
            escolas:escola_id ( id, nome )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch actors for filter
  const { data: actors } = useQuery({
    queryKey: ['consultoria-actors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nome')
        .order('nome');
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch entities for filter
  const { data: entidades } = useQuery({
    queryKey: ['consultoria-entidades'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('escolas')
        .select('id, nome')
        .eq('ativa', true)
        .order('nome');
      if (error) throw error;
      return data || [];
    },
  });

  // Filter data
  const filtered = useMemo(() => {
    if (!consultorias) return [];
    return consultorias.filter((c: any) => {
      const reg = c.registros_acao;
      if (!reg) return false;

      if (programaFilter !== 'todos') {
        if (!reg.programa || !reg.programa.includes(programaFilter)) return false;
      }
      if (atorFilter !== 'todos' && reg.aap_id !== atorFilter) return false;
      if (entidadeFilter !== 'todos' && reg.escola_id !== entidadeFilter) return false;
      if (dataInicio && reg.data < dataInicio) return false;
      if (dataFim && reg.data > dataFim) return false;
      return true;
    });
  }, [consultorias, programaFilter, atorFilter, entidadeFilter, dataInicio, dataFim]);

  // Aggregations
  const totals = useMemo(() => {
    const t = {
      count: filtered.length,
      aulasObsLP: 0,
      aulasObsMat: 0,
      devolutivasProf: 0,
      atpcsMinist: 0,
      agendaPlanejada: 0,
      agendaAlterada: 0,
      analiseDados: 0,
      pautaFormativa: 0,
    };
    filtered.forEach((c: any) => {
      t.aulasObsLP += c.aulas_obs_lp || 0;
      t.aulasObsMat += c.aulas_obs_mat || 0;
      t.devolutivasProf += c.devolutivas_professor || 0;
      t.atpcsMinist += c.atpcs_ministrados || 0;
      if (c.agenda_planejada) t.agendaPlanejada++;
      if (c.agenda_alterada) t.agendaAlterada++;
      if (c.analise_dados) t.analiseDados++;
      if (c.pauta_formativa) t.pautaFormativa++;
    });
    return t;
  }, [filtered]);

  const columns = [
    {
      key: 'data',
      header: 'Data',
      render: (row: any) => {
        const d = row.registros_acao?.data;
        return d ? format(parseISO(d), 'dd/MM/yyyy', { locale: ptBR }) : '-';
      },
    },
    {
      key: 'consultor',
      header: 'Consultor',
      render: (row: any) => row.registros_acao?.profiles?.nome || '-',
    },
    {
      key: 'escola',
      header: 'Entidade',
      render: (row: any) => row.registros_acao?.escolas?.nome || '-',
    },
    {
      key: 'etapa',
      header: 'Etapa',
      render: (row: any) => (row.etapa_ensino || []).join(', ') || '-',
    },
    {
      key: 'voar',
      header: 'VOAR',
      render: (row: any) => row.escola_voar ? 'Sim' : 'Não',
    },
    {
      key: 'programa',
      header: 'Programa',
      render: (row: any) => {
        const progs = row.registros_acao?.programa || [];
        return progs.map((p: string) => programaLabels[p] || p).join(', ') || '-';
      },
    },
  ];

  const handleExportPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      const doc = new jsPDF('landscape');

      doc.setFontSize(16);
      doc.text('Relatório de Consultoria Pedagógica', 14, 20);
      doc.setFontSize(10);
      doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 14, 28);

      // Summary
      doc.setFontSize(12);
      doc.text('Resumo', 14, 40);
      doc.setFontSize(9);
      doc.text(`Total de consultorias: ${totals.count}`, 14, 48);
      doc.text(`Aulas observadas LP: ${totals.aulasObsLP} | Mat: ${totals.aulasObsMat}`, 14, 54);
      doc.text(`Devolutivas: ${totals.devolutivasProf} | ATPCs: ${totals.atpcsMinist}`, 14, 60);

      // Table
      const tableData = filtered.map((c: any) => [
        c.registros_acao?.data ? format(parseISO(c.registros_acao.data), 'dd/MM/yyyy') : '-',
        c.registros_acao?.profiles?.nome || '-',
        c.registros_acao?.escolas?.nome || '-',
        (c.etapa_ensino || []).join(', '),
        c.escola_voar ? 'Sim' : 'Não',
        c.aulas_obs_lp || 0,
        c.aulas_obs_mat || 0,
        c.devolutivas_professor || 0,
      ]);

      autoTable(doc, {
        startY: 68,
        head: [['Data', 'Consultor', 'Entidade', 'Etapa', 'VOAR', 'Obs LP', 'Obs Mat', 'Devolutivas']],
        body: tableData,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [26, 58, 92] },
      });

      doc.save('relatorio-consultoria-pedagogica.pdf');
      toast.success('PDF exportado com sucesso!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao gerar PDF');
    }
  };

  const handleSendEmail = async () => {
    if (!emailTo.trim()) {
      toast.error('Informe o e-mail do destinatário');
      return;
    }
    setSendingEmail(true);
    try {
      // Build summary HTML
      const summaryHtml = `
        <h2>Relatório de Consultoria Pedagógica</h2>
        <p>Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
        <h3>Resumo</h3>
        <ul>
          <li>Total de consultorias: ${totals.count}</li>
          <li>Aulas observadas LP: ${totals.aulasObsLP}</li>
          <li>Aulas observadas Mat: ${totals.aulasObsMat}</li>
          <li>Devolutivas ao professor: ${totals.devolutivasProf}</li>
          <li>ATPCs ministrados: ${totals.atpcsMinist}</li>
          <li>Agenda planejada: ${totals.agendaPlanejada}/${totals.count}</li>
          <li>Análise de dados: ${totals.analiseDados}/${totals.count}</li>
        </ul>
        <h3>Detalhamento</h3>
        <table border="1" cellpadding="4" cellspacing="0" style="border-collapse:collapse;font-size:12px;">
          <tr style="background:#1a3a5c;color:white;">
            <th>Data</th><th>Consultor</th><th>Entidade</th><th>Etapa</th><th>VOAR</th>
          </tr>
          ${filtered.slice(0, 50).map((c: any) => `
            <tr>
              <td>${c.registros_acao?.data ? format(parseISO(c.registros_acao.data), 'dd/MM/yyyy') : '-'}</td>
              <td>${c.registros_acao?.profiles?.nome || '-'}</td>
              <td>${c.registros_acao?.escolas?.nome || '-'}</td>
              <td>${(c.etapa_ensino || []).join(', ')}</td>
              <td>${c.escola_voar ? 'Sim' : 'Não'}</td>
            </tr>
          `).join('')}
        </table>
      `;

      const { error } = await supabase.functions.invoke('send-transactional-email', {
        body: {
          templateName: 'consultoria-report',
          recipientEmail: emailTo,
          idempotencyKey: `consultoria-report-${Date.now()}`,
          templateData: { htmlContent: summaryHtml },
        },
      });

      if (error) throw error;
      toast.success('Relatório enviado por e-mail!');
      setEmailDialogOpen(false);
      setEmailTo('');
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Erro ao enviar e-mail');
    } finally {
      setSendingEmail(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-header flex items-center gap-2">
            <ClipboardList className="text-primary" size={24} />
            Relatório de Consultoria Pedagógica
          </h1>
          <p className="page-subtitle">Visualize, filtre e exporte dados de consultorias realizadas</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportPDF}>
            <Download size={16} className="mr-1" />
            PDF
          </Button>
          <Button variant="outline" onClick={() => setEmailDialogOpen(true)}>
            <Mail size={16} className="mr-1" />
            Enviar por E-mail
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter size={16} />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <Select value={programaFilter} onValueChange={setProgramaFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Programa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Programas</SelectItem>
                <SelectItem value="escolas">Escolas</SelectItem>
                <SelectItem value="regionais">Regionais de Ensino</SelectItem>
                <SelectItem value="redes_municipais">Redes Municipais</SelectItem>
              </SelectContent>
            </Select>

            <Select value={atorFilter} onValueChange={setAtorFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Ator do Programa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Atores</SelectItem>
                {(actors || []).map((a: any) => (
                  <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={entidadeFilter} onValueChange={setEntidadeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Entidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas as Entidades</SelectItem>
                {(entidades || []).map((e: any) => (
                  <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div>
              <Input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                placeholder="Data início"
              />
            </div>
            <div>
              <Input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                placeholder="Data fim"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Consultorias" value={totals.count} icon={<FileText size={20} />} />
        <StatCard title="Aulas Obs. LP" value={totals.aulasObsLP} icon={<ClipboardList size={20} />} />
        <StatCard title="Aulas Obs. Mat" value={totals.aulasObsMat} icon={<ClipboardList size={20} />} />
        <StatCard title="Devolutivas" value={totals.devolutivasProf} icon={<ClipboardList size={20} />} />
      </div>

      {/* Data Table */}
      <Card>
        <CardContent className="pt-6">
          <DataTable
            data={filtered}
            columns={columns}
            keyExtractor={(item: any) => item.id}
            emptyMessage="Nenhuma consultoria encontrada com os filtros aplicados"
          />
        </CardContent>
      </Card>

      {/* Email Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar Relatório por E-mail</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>E-mail do destinatário</Label>
              <Input
                type="email"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              O relatório será enviado com os filtros atualmente aplicados ({totals.count} consultorias).
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSendEmail} disabled={sendingEmail}>
              {sendingEmail ? <Loader2 className="animate-spin mr-1" size={16} /> : <Mail size={16} className="mr-1" />}
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
