import { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Download, Eye, FileText, Calendar, Loader2, Mail, Send } from 'lucide-react';
import { FilterBar } from '@/components/forms/FilterBar';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { segmentoLabels } from '@/data/mockData';
import { FilterOptions, Segmento } from '@/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { PdfReportContent } from '@/components/reports/PdfReportContent';

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

interface ProgramacaoDB {
  id: string;
  tipo: string;
  status: string;
  data: string;
  escola_id: string;
  aap_id: string;
  segmento: string;
  componente: string;
  programa: string[] | null;
}

interface RegistroAcaoDB {
  id: string;
  tipo: string;
  data: string;
  escola_id: string;
  aap_id: string;
  segmento: string;
  componente: string;
  programa: string[] | null;
}

interface PresencaDB {
  id: string;
  registro_acao_id: string;
  professor_id: string;
  presente: boolean;
}

interface AvaliacaoAulaDB {
  id: string;
  registro_acao_id: string;
  professor_id: string;
  escola_id: string;
  aap_id: string;
  clareza_objetivos: number;
  dominio_conteudo: number;
  estrategias_didaticas: number;
  engajamento_turma: number;
  gestao_tempo: number;
}

interface Escola {
  id: string;
  nome: string;
}

interface Profile {
  id: string;
  nome: string;
}

export default function RelatoriosPage() {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingNotifications, setIsSendingNotifications] = useState(false);
  const [isSendingMonthlyReport, setIsSendingMonthlyReport] = useState(false);
  const { isAdmin, isGestor, isAAP, profile } = useAuth();
  
  // Data from database
  const [programacoes, setProgramacoes] = useState<ProgramacaoDB[]>([]);
  const [registros, setRegistros] = useState<RegistroAcaoDB[]>([]);
  const [presencas, setPresencas] = useState<PresencaDB[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoAulaDB[]>([]);
  const [escolas, setEscolas] = useState<Escola[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [professoresCount, setProfessoresCount] = useState(0);
  
  // User-specific filters
  const [userProgramas, setUserProgramas] = useState<ProgramaTypeDB[]>([]);
  const [userEscolaIds, setUserEscolaIds] = useState<string[]>([]);
  
  // Filters
  const [programaFilter, setProgramaFilter] = useState<ProgramaTypeDB | 'todos'>('todos');
  const [mesFilter, setMesFilter] = useState<number | 'todos'>('todos');
  const [componenteFilter, setComponenteFilter] = useState<string>('todos');
  const [filters, setFilters] = useState<FilterOptions>({
    segmento: 'todos',
    componente: 'todos',
    escolaId: 'todos',
    aapId: 'todos',
  });

  const handleSendPendingNotifications = async () => {
    setIsSendingNotifications(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-pending-notifications');
      
      if (error) throw error;
      
      if (data.total_pendentes === 0) {
        toast.info('Nenhuma ação pendente encontrada');
      } else {
        toast.success(`Notificações enviadas para ${data.total_aaps} AAPs`);
      }
    } catch (error: any) {
      console.error('Error sending notifications:', error);
      toast.error('Erro ao enviar notificações');
    } finally {
      setIsSendingNotifications(false);
    }
  };

  const handleSendMonthlyReport = async () => {
    setIsSendingMonthlyReport(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-monthly-report');
      
      if (error) throw error;
      
      toast.success(`Relatório mensal de ${data.month} enviado para ${data.total_admins} administradores`);
    } catch (error: any) {
      console.error('Error sending monthly report:', error);
      toast.error('Erro ao enviar relatório mensal');
    } finally {
      setIsSendingMonthlyReport(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch user-specific data for filtering
        let userPrograms: ProgramaTypeDB[] = [];
        let userSchoolIds: string[] = [];
        
        if (profile?.id) {
          if (isGestor) {
            // Fetch gestor's programs
            const { data: gestorProgramas } = await supabase
              .from('gestor_programas')
              .select('programa')
              .eq('gestor_user_id', profile.id);
            userPrograms = (gestorProgramas || []).map(p => p.programa as ProgramaTypeDB);
          } else if (isAAP) {
            // Fetch AAP's schools
            const { data: aapEscolas } = await supabase
              .from('aap_escolas')
              .select('escola_id')
              .eq('aap_user_id', profile.id);
            userSchoolIds = (aapEscolas || []).map(e => e.escola_id);
            
            // Fetch AAP's programs
            const { data: aapProgramas } = await supabase
              .from('aap_programas')
              .select('programa')
              .eq('aap_user_id', profile.id);
            userPrograms = (aapProgramas || []).map(p => p.programa as ProgramaTypeDB);
          }
        }
        
        setUserProgramas(userPrograms);
        setUserEscolaIds(userSchoolIds);
        
        const [programacoesRes, registrosRes, presencasRes, avaliacoesRes, escolasRes, profilesRes, professoresRes] = await Promise.all([
          supabase.from('programacoes').select('id, tipo, status, data, escola_id, aap_id, segmento, componente, programa'),
          supabase.from('registros_acao').select('id, tipo, data, escola_id, aap_id, segmento, componente, programa'),
          supabase.from('presencas').select('id, registro_acao_id, professor_id, presente'),
          supabase.from('avaliacoes_aula').select('id, registro_acao_id, professor_id, escola_id, aap_id, clareza_objetivos, dominio_conteudo, estrategias_didaticas, engajamento_turma, gestao_tempo'),
          supabase.from('escolas').select('id, nome').eq('ativa', true),
          supabase.from('profiles').select('id, nome'),
          supabase.from('professores').select('id', { count: 'exact' }).eq('ativo', true),
        ]);

        // Apply role-based filtering
        let filteredEscolasData = escolasRes.data || [];
        let filteredProgramacoesData = programacoesRes.data || [];
        let filteredRegistrosData = registrosRes.data || [];
        let filteredAvaliacoesData = avaliacoesRes.data || [];
        
        if (isGestor && userPrograms.length > 0) {
          // Filter by gestor's programs
          filteredProgramacoesData = filteredProgramacoesData.filter(p => 
            p.programa?.some(prog => userPrograms.includes(prog as ProgramaTypeDB))
          );
          filteredRegistrosData = filteredRegistrosData.filter(r => 
            r.programa?.some(prog => userPrograms.includes(prog as ProgramaTypeDB))
          );
          // Filter escolas that have registros or programacoes in gestor's programs
          const escolaIdsWithData = new Set([
            ...filteredProgramacoesData.map(p => p.escola_id),
            ...filteredRegistrosData.map(r => r.escola_id)
          ]);
          filteredEscolasData = filteredEscolasData.filter(e => escolaIdsWithData.has(e.id));
          filteredAvaliacoesData = filteredAvaliacoesData.filter(a => escolaIdsWithData.has(a.escola_id));
        } else if (isAAP && userSchoolIds.length > 0) {
          // Filter by AAP's schools
          filteredEscolasData = filteredEscolasData.filter(e => userSchoolIds.includes(e.id));
          filteredProgramacoesData = filteredProgramacoesData.filter(p => 
            userSchoolIds.includes(p.escola_id) || p.aap_id === profile?.id
          );
          filteredRegistrosData = filteredRegistrosData.filter(r => 
            userSchoolIds.includes(r.escola_id) || r.aap_id === profile?.id
          );
          filteredAvaliacoesData = filteredAvaliacoesData.filter(a => userSchoolIds.includes(a.escola_id));
        }

        setProgramacoes(filteredProgramacoesData);
        setRegistros(filteredRegistrosData);
        setPresencas(presencasRes.data || []);
        setAvaliacoes(filteredAvaliacoesData);
        setEscolas(filteredEscolasData);
        setProfiles(profilesRes.data || []);
        setProfessoresCount(professoresRes.count || 0);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Erro ao carregar dados');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [profile?.id, isAdmin, isGestor, isAAP]);

  // Filter data based on selections including programa, mes and componente
  const filteredProgramacoes = programacoes.filter(p => {
    if (filters.segmento !== 'todos' && p.segmento !== filters.segmento) return false;
    if (filters.componente !== 'todos' && p.componente !== filters.componente) return false;
    if (componenteFilter !== 'todos' && p.componente !== componenteFilter) return false;
    if (filters.escolaId !== 'todos' && p.escola_id !== filters.escolaId) return false;
    if (filters.aapId !== 'todos' && p.aap_id !== filters.aapId) return false;
    if (programaFilter !== 'todos' && (!p.programa || !p.programa.includes(programaFilter))) return false;
    if (mesFilter !== 'todos') {
      const dataMonth = new Date(p.data).getMonth() + 1;
      if (dataMonth !== mesFilter) return false;
    }
    return true;
  });

  const filteredRegistros = registros.filter(r => {
    if (filters.segmento !== 'todos' && r.segmento !== filters.segmento) return false;
    if (filters.componente !== 'todos' && r.componente !== filters.componente) return false;
    if (componenteFilter !== 'todos' && r.componente !== componenteFilter) return false;
    if (filters.escolaId !== 'todos' && r.escola_id !== filters.escolaId) return false;
    if (filters.aapId !== 'todos' && r.aap_id !== filters.aapId) return false;
    if (programaFilter !== 'todos' && (!r.programa || !r.programa.includes(programaFilter))) return false;
    if (mesFilter !== 'todos') {
      const dataMonth = new Date(r.data).getMonth() + 1;
      if (dataMonth !== mesFilter) return false;
    }
    return true;
  });

  // Calculate stats
  const formacoesPrevistas = filteredProgramacoes.filter(p => p.tipo === 'formacao').length;
  const formacoesRealizadas = filteredProgramacoes.filter(p => p.tipo === 'formacao' && p.status === 'realizada').length;
  const visitasPrevistas = filteredProgramacoes.filter(p => p.tipo === 'visita').length;
  const visitasRealizadas = filteredProgramacoes.filter(p => p.tipo === 'visita' && p.status === 'realizada').length;
  const acompanhamentosPrevistas = filteredProgramacoes.filter(p => p.tipo === 'acompanhamento_aula').length;
  const acompanhamentosRealizados = filteredProgramacoes.filter(p => p.tipo === 'acompanhamento_aula' && p.status === 'realizada').length;

  const registroIds = filteredRegistros.map(r => r.id);
  const filteredPresencas = presencas.filter(p => registroIds.includes(p.registro_acao_id));
  const totalPresentes = filteredPresencas.filter(p => p.presente).length;
  const totalPresencas = filteredPresencas.length;
  const percentualPresenca = totalPresencas > 0 ? (totalPresentes / totalPresencas) * 100 : 0;

  // Chart data
  const execucaoData = [
    { name: 'Formações', Previstas: formacoesPrevistas, Realizadas: formacoesRealizadas },
    { name: 'Visitas', Previstas: visitasPrevistas, Realizadas: visitasRealizadas },
    { name: 'Acompanhamentos', Previstas: acompanhamentosPrevistas, Realizadas: acompanhamentosRealizados },
  ];

  // Filter escolas based on program filter
  const filteredEscolas = programaFilter === 'todos' 
    ? escolas 
    : escolas.filter(e => {
        // Check if escola has programa array and includes the filter
        const escolaData = escolas.find(escola => escola.id === e.id);
        return escolaData;
      });

  const presencaPorEscola = filteredEscolas.map(escola => {
    const escolaRegistros = filteredRegistros.filter(r => r.escola_id === escola.id);
    const escolaRegistroIds = escolaRegistros.map(r => r.id);
    const escolaPresencas = presencas.filter(p => escolaRegistroIds.includes(p.registro_acao_id));
    const presentes = escolaPresencas.filter(p => p.presente).length;
    const total = escolaPresencas.length;
    
    return {
      id: escola.id,
      name: escola.nome,
      presenca: total > 0 ? Math.round((presentes / total) * 100) : 0,
      totalPresencas: total,
    };
  }).sort((a, b) => a.name.localeCompare(b.name));

  // Get AAPs from profiles that have registros
  const aapIds = [...new Set(registros.map(r => r.aap_id))];
  const aaps = profiles.filter(p => aapIds.includes(p.id));

  const presencaPorAAP = aaps.map(aap => {
    const aapRegistros = registros.filter(r => r.aap_id === aap.id);
    const aapRegistroIds = aapRegistros.map(r => r.id);
    const aapPresencas = presencas.filter(p => aapRegistroIds.includes(p.registro_acao_id));
    const presentes = aapPresencas.filter(p => p.presente).length;
    const total = aapPresencas.length;
    
    return {
      name: aap.nome.split(' ')[0],
      presenca: total > 0 ? Math.round((presentes / total) * 100) : 0,
      formacoes: programacoes.filter(p => p.aap_id === aap.id && p.tipo === 'formacao' && p.status === 'realizada').length,
      visitas: programacoes.filter(p => p.aap_id === aap.id && p.tipo === 'visita' && p.status === 'realizada').length,
    };
  });

  // Calculate segmento distribution with percentages
  const totalRegistros = filteredRegistros.length;
  const segmentoDistribuicao = [
    { 
      name: 'Anos Iniciais', 
      value: filteredRegistros.filter(r => r.segmento === 'anos_iniciais').length,
      percentual: totalRegistros > 0 ? Math.round((filteredRegistros.filter(r => r.segmento === 'anos_iniciais').length / totalRegistros) * 100) : 0,
      color: 'hsl(215, 70%, 35%)'
    },
    { 
      name: 'Anos Finais', 
      value: filteredRegistros.filter(r => r.segmento === 'anos_finais').length,
      percentual: totalRegistros > 0 ? Math.round((filteredRegistros.filter(r => r.segmento === 'anos_finais').length / totalRegistros) * 100) : 0,
      color: 'hsl(160, 60%, 45%)'
    },
    { 
      name: 'Ensino Médio', 
      value: filteredRegistros.filter(r => r.segmento === 'ensino_medio').length,
      percentual: totalRegistros > 0 ? Math.round((filteredRegistros.filter(r => r.segmento === 'ensino_medio').length / totalRegistros) * 100) : 0,
      color: 'hsl(38, 92%, 50%)'
    },
  ];

  const segmentoData = [
    { 
      name: 'Anos Iniciais', 
      value: registros.filter(r => r.segmento === 'anos_iniciais').length,
      color: 'hsl(215, 70%, 35%)'
    },
    { 
      name: 'Anos Finais', 
      value: registros.filter(r => r.segmento === 'anos_finais').length,
      color: 'hsl(160, 60%, 45%)'
    },
    { 
      name: 'Ensino Médio', 
      value: registros.filter(r => r.segmento === 'ensino_medio').length,
      color: 'hsl(38, 92%, 50%)'
    },
  ];

  // Acompanhamento de Aula - filtered data
  const filteredAvaliacoes = avaliacoes.filter(a => {
    const registro = registros.find(r => r.id === a.registro_acao_id);
    if (filters.segmento !== 'todos' && registro?.segmento !== filters.segmento) return false;
    if (filters.componente !== 'todos' && registro?.componente !== filters.componente) return false;
    if (filters.escolaId !== 'todos' && a.escola_id !== filters.escolaId) return false;
    if (filters.aapId !== 'todos' && a.aap_id !== filters.aapId) return false;
    return true;
  });

  const totalAvaliacoes = filteredAvaliacoes.length;

  // Calculate averages for each dimension
  const calcularMedia = (dimensao: keyof AvaliacaoAulaDB) => {
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
    { subject: 'Intencionalidade', value: mediasClareza, fullMark: 5 },
    { subject: 'Estratégias', value: mediasDominio, fullMark: 5 },
    { subject: 'Mediação', value: mediasEstrategias, fullMark: 5 },
    { subject: 'Engajamento', value: mediasEngajamento, fullMark: 5 },
    { subject: 'Avaliação', value: mediasGestao, fullMark: 5 },
  ];

  const satisfacaoData = [
    { name: 'Intencionalidade pedagógica', media: mediasClareza, cor: 'hsl(var(--primary))' },
    { name: 'Estratégias didáticas', media: mediasDominio, cor: 'hsl(var(--accent))' },
    { name: 'Mediação docente', media: mediasEstrategias, cor: 'hsl(var(--info))' },
    { name: 'Engajamento dos estudantes', media: mediasEngajamento, cor: 'hsl(var(--warning))' },
    { name: 'Avaliação durante a aula', media: mediasGestao, cor: 'hsl(var(--success))' },
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
        'Total Professores': professoresCount,
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
    setIsExportingPdf(true);
    toast.info('Gerando PDF...');
    
    try {
      // Create an offscreen container for PDF rendering with fixed desktop layout
      const pdfContainer = document.createElement('div');
      pdfContainer.style.position = 'absolute';
      pdfContainer.style.left = '-9999px';
      pdfContainer.style.top = '0';
      pdfContainer.style.width = '1200px';
      pdfContainer.style.minWidth = '1200px';
      pdfContainer.style.backgroundColor = '#ffffff';
      document.body.appendChild(pdfContainer);
      
      // Render the PDF-specific component into the offscreen container
      const root = createRoot(pdfContainer);
      root.render(
        <PdfReportContent
          formacoesRealizadas={formacoesRealizadas}
          formacoesPrevistas={formacoesPrevistas}
          visitasRealizadas={visitasRealizadas}
          visitasPrevistas={visitasPrevistas}
          acompanhamentosRealizados={acompanhamentosRealizados}
          acompanhamentosPrevistas={acompanhamentosPrevistas}
          totalPresentes={totalPresentes}
          totalPresencas={totalPresencas}
          percentualPresenca={percentualPresenca}
          segmentoDistribuicao={segmentoDistribuicao}
          execucaoData={execucaoData}
          presencaPorAAP={presencaPorAAP}
          presencaPorEscola={presencaPorEscola}
          radarData={radarData}
          satisfacaoData={satisfacaoData}
          totalAvaliacoes={totalAvaliacoes}
        />
      );
      
      // Wait for React to render and charts to initialize
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // A4 dimensions in mm
      const a4Width = 210;
      const a4Height = 297;
      const margin = 10;
      const headerHeight = 25;
      const contentWidth = a4Width - (margin * 2);
      
      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      // Add header with blue background
      pdf.setFillColor(0, 56, 117);
      pdf.rect(0, 0, a4Width, headerHeight, 'F');
      
      // Load and add logo
      const logoHeight = 10;
      const logoWidth = 25;
      const logoX = margin;
      const logoY = 3;
      
      try {
        const logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        const logoModule = await import('@/assets/pe-logo-branco.png');
        logoImg.src = logoModule.default;
        
        await new Promise((resolve, reject) => {
          logoImg.onload = resolve;
          logoImg.onerror = reject;
          setTimeout(reject, 3000);
        });
        
        pdf.addImage(logoImg, 'PNG', logoX, logoY, logoWidth, logoHeight);
      } catch (logoError) {
        console.warn('Could not load logo:', logoError);
      }
      
      // Add title
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Relatório de Acompanhamento - AAPs/Formadores', logoX + logoWidth + 5, logoY + 5);
      
      // Add subtitle
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      const programaText = programaFilter !== 'todos' ? programaLabels[programaFilter] : 'Todos os Programas';
      const mesText = mesFilter !== 'todos' ? mesesLabels[mesFilter] : 'Todos os Meses';
      const periodoText = `${programaText} - ${mesText}/${new Date().getFullYear()}`;
      pdf.text(periodoText, logoX + logoWidth + 5, logoY + 10);
      
      // Capture the offscreen container
      const canvas = await html2canvas(pdfContainer, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: 1200,
        windowWidth: 1200,
      });
      
      // Cleanup
      root.unmount();
      document.body.removeChild(pdfContainer);
      
      const imgData = canvas.toDataURL('image/png');
      
      // Calculate content dimensions
      const contentStartY = headerHeight + margin;
      const availableHeight = a4Height - contentStartY - margin;
      
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      const scale = contentWidth / (imgWidth / 2);
      const scaledHeight = (imgHeight / 2) * scale;
      
      // Add content image
      let currentY = contentStartY;
      let remainingHeight = scaledHeight;
      
      while (remainingHeight > 0) {
        const sliceHeight = Math.min(availableHeight, remainingHeight);
        
        if (currentY === contentStartY) {
          pdf.addImage(
            imgData, 
            'PNG', 
            margin, 
            currentY, 
            contentWidth, 
            scaledHeight,
            undefined,
            'FAST'
          );
        }
        
        remainingHeight -= sliceHeight;
        
        if (remainingHeight > 0) {
          pdf.addPage();
          
          pdf.setFillColor(0, 56, 117);
          pdf.rect(0, 0, a4Width, headerHeight, 'F');
          
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Relatório de Acompanhamento - AAPs/Formadores', margin, 18);
          
          currentY = contentStartY;
        }
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="page-header">Relatórios</h1>
          <p className="page-subtitle">Acompanhe os indicadores do programa</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
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

      {/* Email Notifications Section - Admin only */}
      {isAdmin && (
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Mail className="text-primary" size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Envio de E-mails</h3>
              <p className="text-sm text-muted-foreground">Envie notificações e relatórios por e-mail manualmente</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[250px] p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Notificações de Ações Pendentes</h4>
              <p className="text-xs text-muted-foreground mb-3">
                Envia e-mail para AAPs com ações agendadas há mais de 2 dias que ainda não foram atualizadas.
              </p>
              <button
                onClick={handleSendPendingNotifications}
                disabled={isSendingNotifications}
                className="btn-outline flex items-center gap-2 text-sm disabled:opacity-50"
              >
                {isSendingNotifications ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
                {isSendingNotifications ? 'Enviando...' : 'Enviar Notificações'}
              </button>
              <p className="text-xs text-muted-foreground mt-2">
                📅 Enviado automaticamente todos os dias às 8h
              </p>
            </div>
            
            <div className="flex-1 min-w-[250px] p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Relatório Mensal Executivo</h4>
              <p className="text-xs text-muted-foreground mb-3">
                Envia resumo do mês anterior para todos os administradores com estatísticas e indicadores.
              </p>
              <button
                onClick={handleSendMonthlyReport}
                disabled={isSendingMonthlyReport}
                className="btn-outline flex items-center gap-2 text-sm disabled:opacity-50"
              >
                {isSendingMonthlyReport ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
                {isSendingMonthlyReport ? 'Enviando...' : 'Enviar Relatório Mensal'}
              </button>
              <p className="text-xs text-muted-foreground mt-2">
                📅 Enviado automaticamente no dia 1º de cada mês às 9h
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex flex-wrap gap-3">
          <Select
            value={programaFilter}
            onValueChange={(value) => setProgramaFilter(value as ProgramaTypeDB | 'todos')}
          >
            <SelectTrigger className="w-[200px]">
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
            <SelectTrigger className="w-[150px]">
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

          <Select
            value={componenteFilter}
            onValueChange={setComponenteFilter}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por componente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Componentes</SelectItem>
              <SelectItem value="polivalente">Polivalente</SelectItem>
              <SelectItem value="lingua_portuguesa">Português</SelectItem>
              <SelectItem value="matematica">Matemática</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <FilterBar filters={filters} onFilterChange={setFilters} className="flex-1" />
      </div>

      {/* Empty state check */}
      {programacoes.length === 0 && registros.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-xl border border-border">
          <FileText size={48} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum dado disponível</h3>
          <p className="text-muted-foreground">Os relatórios serão gerados após cadastrar programações e registros.</p>
        </div>
      ) : (
        <>
          {/* Report Content - wrapped in ref for PDF export */}
          <div ref={reportRef} className="space-y-2 bg-background p-1">

            {/* Summary Cards - 6 columns including segment distribution */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
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
              <div className="stat-card">
                <p className="text-sm text-muted-foreground mb-2">Distribuição por Segmento</p>
                <div className="space-y-1">
                  {segmentoDistribuicao.map((seg) => (
                    <div key={seg.name} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground text-xs">{seg.name}</span>
                      <span className="font-semibold">{seg.percentual}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Charts Row 1 - Previsto vs Realizado + Desempenho por AAP */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
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
                    <Bar dataKey="Previstas" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Realizadas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* AAP Performance Chart (replacing Segmento Chart) */}
              <div className="bg-card rounded-xl border border-border p-6">
                <h3 className="card-title mb-6">Desempenho por AAP</h3>
                {presencaPorAAP.length > 0 ? (
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
                ) : (
                  <p className="text-center text-muted-foreground py-8">Nenhum dado disponível</p>
                )}
              </div>
            </div>

            {/* Charts Row 2 - Escola List (2 modules) + Acompanhamento de Aula */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
              {/* Presence by School - Extended Table (2 modules height) */}
              <div className="bg-card rounded-xl border border-border p-6 lg:row-span-2">
                <h3 className="card-title mb-2">Presença por Escola</h3>
                <div>
                  <table className="w-full text-[11px]">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        <th className="text-left py-1.5 px-2 font-medium text-muted-foreground border-b border-border">Escola</th>
                        <th className="text-right py-1.5 px-2 font-medium text-muted-foreground border-b border-border">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {presencaPorEscola.map((escola, index) => (
                        <tr 
                          key={escola.id} 
                          className={index % 2 === 0 ? 'bg-background' : 'bg-muted/30'}
                        >
                          <td className="py-1 px-2 text-foreground leading-normal">{escola.name}</td>
                          <td className="py-1 px-2 text-right">
                            <span className={`font-medium ${
                              escola.presenca >= 80 ? 'text-success' : 
                              escola.presenca >= 50 ? 'text-warning' : 
                              escola.presenca > 0 ? 'text-destructive' : 'text-muted-foreground'
                            }`}>
                              {escola.totalPresencas > 0 ? `${escola.presenca}%` : '-'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {presencaPorEscola.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">Nenhuma escola encontrada</p>
                  )}
                </div>
              </div>

              {/* Acompanhamento de Aula Column */}
              <div className="bg-card rounded-xl border border-border p-6">
                <h3 className="card-title mb-4 flex items-center gap-2">
                  <Eye size={20} className="text-warning" />
                  Acompanhamento de Aula ({totalAvaliacoes} avaliações)
                </h3>
                
                {totalAvaliacoes > 0 ? (
                  <div className="space-y-6">
                    {/* Radar Chart */}
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-3">Médias por Dimensão</h4>
                      <ResponsiveContainer width="100%" height={250}>
                        <RadarChart data={radarData}>
                          <PolarGrid stroke="hsl(var(--border))" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                          <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                          <Radar name="Média" dataKey="value" stroke="hsl(var(--warning))" fill="hsl(var(--warning))" fillOpacity={0.5} />
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

                    {/* Progress Rings - Média por Critério */}
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-3">Média por Critério (1-5)</h4>
                      <div className="grid grid-cols-1 gap-3">
                        {satisfacaoData.map(item => (
                          <div key={item.name} className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg">
                            <ProgressRing 
                              value={item.media} 
                              maxValue={5}
                              displayAsNumber
                              size={40} 
                              strokeWidth={4}
                            />
                            <div className="flex-1 flex items-center justify-between">
                              <p className="text-xs text-muted-foreground">{item.name}</p>
                              <p className="font-semibold">{item.media.toFixed(1)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">Nenhuma avaliação registrada</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}