import { useState, useRef, useEffect } from 'react';
import { Download, Eye, FileText, Calendar } from 'lucide-react';
import { FilterBar } from '@/components/forms/FilterBar';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { programacoes, registrosAcao, escolas, aaps, professores, presencas, segmentoLabels, avaliacoesAula } from '@/data/mockData';
import { FilterOptions, ProgramaType } from '@/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Database } from '@/integrations/supabase/types';

type ProgramaTypeDB = Database['public']['Enums']['programa_type'];

const programaLabels: Record<ProgramaTypeDB, string> = {
  escolas: 'Programa de Escolas',
  regionais: 'Programa de Regionais de Ensino',
  redes_municipais: 'Programa de Redes Municipais',
};

const mesesLabels: Record<number, string> = {
  1: 'Janeiro',
  2: 'Fevereiro',
  3: 'Março',
  4: 'Abril',
  5: 'Maio',
  6: 'Junho',
  7: 'Julho',
  8: 'Agosto',
  9: 'Setembro',
  10: 'Outubro',
  11: 'Novembro',
  12: 'Dezembro',
};

export default function RelatoriosPage() {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [programaFilter, setProgramaFilter] = useState<ProgramaTypeDB | 'todos'>('todos');
  const [mesFilter, setMesFilter] = useState<number | 'todos'>('todos');
  const [filters, setFilters] = useState<FilterOptions>({
    segmento: 'todos',
    componente: 'todos',
    escolaId: 'todos',
    aapId: 'todos',
  });

  // Filter data based on selections including programa and mes
  const filteredProgramacoes = programacoes.filter(p => {
    if (filters.segmento !== 'todos' && p.segmento !== filters.segmento) return false;
    if (filters.componente !== 'todos' && p.componente !== filters.componente) return false;
    if (filters.escolaId !== 'todos' && p.escolaId !== filters.escolaId) return false;
    if (filters.aapId !== 'todos' && p.aapId !== filters.aapId) return false;
    // Filter by month
    if (mesFilter !== 'todos') {
      const dataMonth = p.data.getMonth() + 1;
      if (dataMonth !== mesFilter) return false;
    }
    return true;
  });

  const filteredRegistros = registrosAcao.filter(r => {
    if (filters.segmento !== 'todos' && r.segmento !== filters.segmento) return false;
    if (filters.componente !== 'todos' && r.componente !== filters.componente) return false;
    if (filters.escolaId !== 'todos' && r.escolaId !== filters.escolaId) return false;
    if (filters.aapId !== 'todos' && r.aapId !== filters.aapId) return false;
    // Filter by month
    if (mesFilter !== 'todos') {
      const dataMonth = r.data.getMonth() + 1;
      if (dataMonth !== mesFilter) return false;
    }
    return true;
  });

  // Calculate stats
  const formacoesPrevistas = filteredProgramacoes.filter(p => p.tipo === 'formacao').length;
  const formacoesRealizadas = filteredProgramacoes.filter(p => p.tipo === 'formacao' && p.status === 'realizada').length;
  const visitasPrevistas = filteredProgramacoes.filter(p => p.tipo === 'visita').length;
  const visitasRealizadas = filteredProgramacoes.filter(p => p.tipo === 'visita' && p.status === 'realizada').length;

  const registroIds = filteredRegistros.map(r => r.id);
  const filteredPresencas = presencas.filter(p => registroIds.includes(p.registroAcaoId));
  const totalPresentes = filteredPresencas.filter(p => p.presente).length;
  const totalPresencas = filteredPresencas.length;
  const percentualPresenca = totalPresencas > 0 ? (totalPresentes / totalPresencas) * 100 : 0;

  // Chart data
  const execucaoData = [
    { name: 'Formações', Previstas: formacoesPrevistas, Realizadas: formacoesRealizadas },
    { name: 'Visitas', Previstas: visitasPrevistas, Realizadas: visitasRealizadas },
  ];

  const presencaPorEscola = escolas.map(escola => {
    const escolaRegistros = registrosAcao.filter(r => r.escolaId === escola.id);
    const escolaRegistroIds = escolaRegistros.map(r => r.id);
    const escolaPresencas = presencas.filter(p => escolaRegistroIds.includes(p.registroAcaoId));
    const presentes = escolaPresencas.filter(p => p.presente).length;
    const total = escolaPresencas.length;
    
    return {
      name: escola.nome.replace('E.M. ', ''),
      presenca: total > 0 ? Math.round((presentes / total) * 100) : 0,
    };
  });

  const presencaPorAAP = aaps.map(aap => {
    const aapRegistros = registrosAcao.filter(r => r.aapId === aap.id);
    const aapRegistroIds = aapRegistros.map(r => r.id);
    const aapPresencas = presencas.filter(p => aapRegistroIds.includes(p.registroAcaoId));
    const presentes = aapPresencas.filter(p => p.presente).length;
    const total = aapPresencas.length;
    
    return {
      name: aap.nome.split(' ')[0],
      presenca: total > 0 ? Math.round((presentes / total) * 100) : 0,
      formacoes: programacoes.filter(p => p.aapId === aap.id && p.tipo === 'formacao' && p.status === 'realizada').length,
      visitas: programacoes.filter(p => p.aapId === aap.id && p.tipo === 'visita' && p.status === 'realizada').length,
    };
  });

  const segmentoData = [
    { 
      name: 'Anos Iniciais', 
      value: registrosAcao.filter(r => r.segmento === 'anos_iniciais').length,
      color: 'hsl(215, 70%, 35%)'
    },
    { 
      name: 'Anos Finais', 
      value: registrosAcao.filter(r => r.segmento === 'anos_finais').length,
      color: 'hsl(160, 60%, 45%)'
    },
    { 
      name: 'Ensino Médio', 
      value: registrosAcao.filter(r => r.segmento === 'ensino_medio').length,
      color: 'hsl(38, 92%, 50%)'
    },
  ];

  // Acompanhamento de Aula - filtered data
  const filteredAvaliacoes = avaliacoesAula.filter(a => {
    const registro = registrosAcao.find(r => r.id === a.registroAcaoId);
    if (filters.segmento !== 'todos' && registro?.segmento !== filters.segmento) return false;
    if (filters.componente !== 'todos' && registro?.componente !== filters.componente) return false;
    if (filters.escolaId !== 'todos' && a.escolaId !== filters.escolaId) return false;
    if (filters.aapId !== 'todos' && a.aapId !== filters.aapId) return false;
    return true;
  });

  const acompanhamentosPrevistas = filteredProgramacoes.filter(p => p.tipo === 'acompanhamento_aula').length;
  const acompanhamentosRealizados = filteredProgramacoes.filter(p => p.tipo === 'acompanhamento_aula' && p.status === 'realizada').length;
  const totalAvaliacoes = filteredAvaliacoes.length;

  // Calculate averages for each dimension
  const calcularMedia = (dimensao: keyof typeof filteredAvaliacoes[0]) => {
    if (filteredAvaliacoes.length === 0) return 0;
    const soma = filteredAvaliacoes.reduce((acc, a) => acc + (Number(a[dimensao]) || 0), 0);
    return soma / filteredAvaliacoes.length;
  };

  const mediasClareza = calcularMedia('clareza_objetivos');
  const mediasDominio = calcularMedia('dominio_conteudo');
  const mediasEstrategias = calcularMedia('estrategias_didaticas');
  const mediasEngajamento = calcularMedia('engajamento_turma');
  const mediasGestao = calcularMedia('gestao_tempo');

  const radarData = [
    { subject: 'Clareza', value: mediasClareza, fullMark: 5 },
    { subject: 'Domínio', value: mediasDominio, fullMark: 5 },
    { subject: 'Estratégias', value: mediasEstrategias, fullMark: 5 },
    { subject: 'Engajamento', value: mediasEngajamento, fullMark: 5 },
    { subject: 'Gestão', value: mediasGestao, fullMark: 5 },
  ];

  const satisfacaoData = [
    { name: 'Clareza dos Objetivos', percentual: (mediasClareza / 5) * 100, cor: 'hsl(var(--primary))' },
    { name: 'Domínio do Conteúdo', percentual: (mediasDominio / 5) * 100, cor: 'hsl(var(--accent))' },
    { name: 'Estratégias Didáticas', percentual: (mediasEstrategias / 5) * 100, cor: 'hsl(var(--info))' },
    { name: 'Engajamento da Turma', percentual: (mediasEngajamento / 5) * 100, cor: 'hsl(var(--warning))' },
    { name: 'Gestão do Tempo', percentual: (mediasGestao / 5) * 100, cor: 'hsl(var(--success))' },
  ];

  const handleExport = () => {
    const reportData = {
      resumo: [{
        'Formações Previstas': formacoesPrevistas,
        'Formações Realizadas': formacoesRealizadas,
        'Visitas Previstas': visitasPrevistas,
        'Visitas Realizadas': visitasRealizadas,
        'Acompanhamentos Previstos': acompanhamentosPrevistas,
        'Acompanhamentos Realizados': acompanhamentosRealizados,
        'Total Professores': professores.length,
        '% Presença Geral': `${Math.round(percentualPresenca)}%`,
      }],
      porEscola: presencaPorEscola.map(e => ({
        'Escola': e.name,
        '% Presença': `${e.presenca}%`,
      })),
      porAAP: presencaPorAAP.map(a => ({
        'AAP': a.name,
        '% Presença': `${a.presenca}%`,
        'Formações': a.formacoes,
        'Visitas': a.visitas,
      })),
      acompanhamentoAula: [{
        'Total Avaliações': totalAvaliacoes,
        'Média Clareza Objetivos': mediasClareza.toFixed(2),
        'Média Domínio Conteúdo': mediasDominio.toFixed(2),
        'Média Estratégias Didáticas': mediasEstrategias.toFixed(2),
        'Média Engajamento Turma': mediasEngajamento.toFixed(2),
        'Média Gestão Tempo': mediasGestao.toFixed(2),
      }],
    };

    const wb = XLSX.utils.book_new();
    
    const wsResumo = XLSX.utils.json_to_sheet(reportData.resumo);
    XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo');
    
    const wsEscola = XLSX.utils.json_to_sheet(reportData.porEscola);
    XLSX.utils.book_append_sheet(wb, wsEscola, 'Por Escola');
    
    const wsAAP = XLSX.utils.json_to_sheet(reportData.porAAP);
    XLSX.utils.book_append_sheet(wb, wsAAP, 'Por AAP');

    const wsAcompanhamento = XLSX.utils.json_to_sheet(reportData.acompanhamentoAula);
    XLSX.utils.book_append_sheet(wb, wsAcompanhamento, 'Acompanhamento Aula');
    
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(data, `relatorio_programa_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Relatório Excel exportado com sucesso!');
  };

  const handleExportPdf = async () => {
    if (!reportRef.current) return;
    
    setIsExportingPdf(true);
    toast.info('Gerando PDF...');
    
    try {
      const element = reportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      
      let heightLeft = imgHeight * ratio;
      let position = 0;
      
      // Add first page
      pdf.addImage(imgData, 'PNG', imgX, position, imgWidth * ratio, imgHeight * ratio);
      heightLeft -= pdfHeight;
      
      // Add additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight * ratio;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', imgX, position, imgWidth * ratio, imgHeight * ratio);
        heightLeft -= pdfHeight;
      }
      
      pdf.save(`relatorio_programa_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF. Tente novamente.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="page-header">Relatórios</h1>
          <p className="page-subtitle">Acompanhe os indicadores do programa</p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={handleExportPdf} 
            disabled={isExportingPdf}
            className="btn-outline flex items-center gap-2 disabled:opacity-50"
          >
            <FileText size={18} />
            {isExportingPdf ? 'Gerando...' : 'Exportar PDF'}
          </button>
          <button onClick={handleExport} className="btn-primary flex items-center gap-2">
            <Download size={18} />
            Exportar Excel
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex gap-3">
          <Select
            value={programaFilter}
            onValueChange={(value) => setProgramaFilter(value as ProgramaTypeDB | 'todos')}
          >
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Filtrar por programa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Programas</SelectItem>
              {Object.entries(programaLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={mesFilter === 'todos' ? 'todos' : mesFilter.toString()}
            onValueChange={(value) => setMesFilter(value === 'todos' ? 'todos' : parseInt(value))}
          >
            <SelectTrigger className="w-[180px]">
              <Calendar size={16} className="mr-2" />
              <SelectValue placeholder="Filtrar por mês" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Meses</SelectItem>
              {Object.entries(mesesLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <FilterBar filters={filters} onFilterChange={setFilters} className="flex-1" />
      </div>

      {/* Report Content - wrapped in ref for PDF export */}
      <div ref={reportRef} className="space-y-6 bg-background p-1">

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Formações</p>
          <p className="text-2xl font-bold text-foreground">{formacoesRealizadas}/{formacoesPrevistas}</p>
          <div className="mt-2 progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${formacoesPrevistas > 0 ? (formacoesRealizadas/formacoesPrevistas) * 100 : 0}%` }}
            />
          </div>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Visitas</p>
          <p className="text-2xl font-bold text-foreground">{visitasRealizadas}/{visitasPrevistas}</p>
          <div className="mt-2 progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${visitasPrevistas > 0 ? (visitasRealizadas/visitasPrevistas) * 100 : 0}%` }}
            />
          </div>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <Eye size={14} />
            Acompanhamentos
          </p>
          <p className="text-2xl font-bold text-foreground">{acompanhamentosRealizados}/{acompanhamentosPrevistas}</p>
          <div className="mt-2 progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${acompanhamentosPrevistas > 0 ? (acompanhamentosRealizados/acompanhamentosPrevistas) * 100 : 0}%` }}
            />
          </div>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Professores Formados</p>
          <p className="text-2xl font-bold text-foreground">{totalPresentes}</p>
          <p className="text-xs text-muted-foreground mt-1">participações registradas</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Taxa de Presença</p>
          <p className="text-2xl font-bold text-accent">{Math.round(percentualPresenca)}%</p>
          <p className="text-xs text-muted-foreground mt-1">{totalPresentes} de {totalPresencas}</p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Execution Chart */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="card-title mb-6">Previsto vs Realizado</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={execucaoData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip 
                contentStyle={{ 
                  background: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Bar dataKey="Previstas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Realizadas" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Segment Distribution */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="card-title mb-6">Ações por Segmento</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={segmentoData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {segmentoData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  background: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Presence by School */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="card-title mb-6">Presença por Escola</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={presencaPorEscola} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))' }} unit="%" />
              <YAxis dataKey="name" type="category" tick={{ fill: 'hsl(var(--muted-foreground))' }} width={100} />
              <Tooltip 
                contentStyle={{ 
                  background: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                formatter={(value) => [`${value}%`, 'Presença']}
              />
              <Bar dataKey="presenca" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* AAP Performance */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="card-title mb-6">Desempenho por AAP</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={presencaPorAAP}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip 
                contentStyle={{ 
                  background: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Bar dataKey="formacoes" name="Formações" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="visitas" name="Visitas" fill="hsl(var(--info))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Presence Summary by Segment */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="card-title mb-6">Resumo de Presença</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(segmentoLabels).map(([key, label]) => {
            const segmentoRegistros = registrosAcao.filter(r => r.segmento === key);
            const segmentoIds = segmentoRegistros.map(r => r.id);
            const segmentoPresencas = presencas.filter(p => segmentoIds.includes(p.registroAcaoId));
            const presentes = segmentoPresencas.filter(p => p.presente).length;
            const total = segmentoPresencas.length;
            const percent = total > 0 ? (presentes / total) * 100 : 0;
            
            return (
              <div key={key} className="flex flex-col items-center">
                <ProgressRing value={percent} label={label} sublabel={`${presentes}/${total}`} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Acompanhamento de Aula Section */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center gap-2 mb-6">
          <Eye className="text-primary" size={20} />
          <h3 className="card-title">Acompanhamento de Aula</h3>
          <span className="ml-auto text-sm text-muted-foreground">{totalAvaliacoes} avaliações realizadas</span>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Radar Chart */}
          <div className="bg-muted/30 rounded-lg p-4">
            <h4 className="text-sm font-medium text-foreground mb-4">Média por Dimensão</h4>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Radar 
                  name="Média" 
                  dataKey="value" 
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary))" 
                  fillOpacity={0.5}
                />
                <Tooltip 
                  contentStyle={{ 
                    background: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [value.toFixed(2), 'Média']}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Satisfaction Bars */}
          <div className="bg-muted/30 rounded-lg p-4">
            <h4 className="text-sm font-medium text-foreground mb-4">Percentual de Satisfação por Item</h4>
            <div className="space-y-4">
              {satisfacaoData.map((item, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground">{item.name}</span>
                    <span className="font-medium text-foreground">{item.percentual.toFixed(0)}%</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${item.percentual}%`,
                        backgroundColor: item.cor
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
