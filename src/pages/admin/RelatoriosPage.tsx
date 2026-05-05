import { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { useInstrumentChartData } from '@/hooks/useInstrumentChartData';
import { InstrumentDimensionCharts } from '@/components/charts/InstrumentDimensionCharts';
import { Download, FileText, Calendar, Loader2, Mail, Send, Users, ChevronDown, ChevronUp } from 'lucide-react';
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
import { ACAO_TYPE_INFO } from '@/config/acaoPermissions';
import { useAcoesByPrograma } from '@/hooks/useAcoesByPrograma';

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

interface ObservacaoRedesDB {
  nota_criterio_1: number | null;
  nota_criterio_2: number | null;
  nota_criterio_3: number | null;
  nota_criterio_4: number | null;
  nota_criterio_5: number | null;
  nota_criterio_6: number | null;
  nota_criterio_7: number | null;
  nota_criterio_8: number | null;
  nota_criterio_9: number | null;
  status: string;
  data: string | null;
}

const REDES_CRITERIO_LABELS = [
  'Alinhamento caderno',
  'Objetivo claro',
  'Repertório explicação',
  'Metodologias',
  'Participação alunos',
  'Intervenções',
  'Verificação compreensão',
  'Clima sala',
  'Gestão tempo',
];

interface Escola {
  id: string;
  nome: string;
  programa: string[] | null;
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
  const [selectedReportMonth, setSelectedReportMonth] = useState<string>(() => {
    // Default to previous month
    const now = new Date();
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedReportRecipients, setSelectedReportRecipients] = useState<string>('todos');
  const [selectedGestorRecipients, setSelectedGestorRecipients] = useState<string[]>([]);
  const [adminUsers, setAdminUsers] = useState<{ id: string; nome: string; email: string }[]>([]);
  const [gestorUsers, setGestorUsers] = useState<{ id: string; nome: string; email: string; programas: string[] }[]>([]);
  const [isEmailSectionOpen, setIsEmailSectionOpen] = useState(false);
  const { isAdmin, isGestor, isAAP, profile } = useAuth();
  const { getAcoesByPrograma, getModuleVisibility } = useAcoesByPrograma();
  
  // Data from database
  const [programacoes, setProgramacoes] = useState<ProgramacaoDB[]>([]);
  const [registros, setRegistros] = useState<RegistroAcaoDB[]>([]);
  const [presencas, setPresencas] = useState<PresencaDB[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoAulaDB[]>([]);
  const [escolas, setEscolas] = useState<Escola[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [professoresCount, setProfessoresCount] = useState(0);
  const [observacoesRedes, setObservacoesRedes] = useState<ObservacaoRedesDB[]>([]);
  
  // User-specific filters
  const [userProgramas, setUserProgramas] = useState<ProgramaTypeDB[]>([]);
  const [userEscolaIds, setUserEscolaIds] = useState<string[]>([]);
  
  // Filters
  const [programaFilter, setProgramaFilter] = useState<ProgramaTypeDB | 'todos'>('todos');
  const [anoFilter, setAnoFilter] = useState<number>(new Date().getFullYear());
  const [mesFilter, setMesFilter] = useState<number | 'todos'>('todos');
  const [componenteFilter, setComponenteFilter] = useState<string>('todos');
  const [entidadeFilhoFilter, setEntidadeFilhoFilter] = useState<string>('todos');
  const [entidadesFilho, setEntidadesFilho] = useState<{id: string; nome: string; escola_id: string}[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({
    segmento: 'todos',
    componente: 'todos',
    escolaId: 'todos',
    aapId: 'todos',
  });

  const { chartData: instrumentChartData, isLoading: isInstrumentChartsLoading } = useInstrumentChartData({
    escolaFilter: filters.escolaId,
    aapFilter: filters.aapId,
    componenteFilter: componenteFilter !== 'todos'
      ? componenteFilter
      : (filters.componente !== 'todos' ? filters.componente : undefined),
    anoFilter,
    mesFilter,
    programaFilter,
    entidadeFilhoEscolaId: entidadeFilhoFilter !== 'todos'
      ? entidadesFilho.find(e => e.id === entidadeFilhoFilter)?.escola_id
      : undefined,
  });

  // Gerar lista de anos disponíveis (de 2024 até o ano atual + 1)
  const anosDisponiveis = Array.from(
    { length: new Date().getFullYear() - 2024 + 2 },
    (_, i) => 2024 + i
  );

  const handleSendPendingNotifications = async () => {
    setIsSendingNotifications(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-pending-notifications');

      if (error) {
        toast.error(error.message || 'Erro ao enviar notificações');
        return;
      }

      if (data?.success === false) {
        toast.error(data.error || 'Não autorizado');
        return;
      }

      if (data?.total_pendentes === 0) {
        toast.info('Nenhuma ação pendente encontrada');
      } else {
        toast.success(`Notificações enviadas para ${data?.total_aaps ?? 0} AAPs`);
      }
    } catch (error: any) {
      console.error('Error sending notifications:', error);
      toast.error('Erro ao enviar notificações');
    } finally {
      setIsSendingNotifications(false);
    }
  };

  const handleSendMonthlyReport = async () => {
    const { data: { session } } = await supabase.auth.refreshSession();
    if (!session?.access_token) {
      toast.error('Sessão expirada. Faça login novamente.');
      return;
    }

    setIsSendingMonthlyReport(true);
    try {
      const [year, month] = selectedReportMonth.split('-').map(Number);
      
      // Build recipient IDs: admins + selected gestors
      let recipientIds: string[] | undefined;
      if (selectedReportRecipients !== 'todos') {
        recipientIds = [selectedReportRecipients];
      }
      
      // Include selected gestors
      const gestorIds = selectedGestorRecipients.length > 0 ? selectedGestorRecipients : undefined;
      
      const { data, error } = await supabase.functions.invoke('send-monthly-report', {
        body: { year, month, recipientIds, gestorIds }
      });
      
      if (error) {
        const errorMsg = data?.error || error.message || 'Erro desconhecido';
        throw new Error(errorMsg);
      }
      
      const totalRecipients = (data.total_admins || 0) + (data.total_gestors || 0);
      toast.success(`Relatório mensal de ${data.month} enviado para ${totalRecipients} destinatário(s)`);
    } catch (error: any) {
      console.error('Error sending monthly report:', error);
      toast.error(error.message || 'Erro ao enviar relatório mensal');
    } finally {
      setIsSendingMonthlyReport(false);
    }
  };

  // Generate available months for report (last 12 months)
  const getAvailableReportMonths = () => {
    const months = [];
    const now = new Date();
    for (let i = 1; i <= 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      months.push({ value, label });
    }
    return months;
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
        
        const [programacoesRes, registrosRes, presencasRes, avaliacoesRes, escolasRes, profilesRes, professoresRes, observacoesRedesRes, entidadesFilhoRes] = await Promise.all([
          supabase.from('programacoes').select('id, tipo, status, data, escola_id, aap_id, segmento, componente, programa'),
          supabase.from('registros_acao').select('id, tipo, data, escola_id, aap_id, segmento, componente, programa'),
          supabase.from('presencas').select('id, registro_acao_id, professor_id, presente'),
          supabase.from('avaliacoes_aula').select('id, registro_acao_id, professor_id, escola_id, aap_id, clareza_objetivos, dominio_conteudo, estrategias_didaticas, engajamento_turma, gestao_tempo'),
          supabase.from('escolas').select('id, nome, programa').eq('ativa', true).order('nome'),
          supabase.from('profiles_directory').select('id, nome').order('nome'),
          supabase.from('professores').select('id', { count: 'exact' }).eq('ativo', true),
          supabase.from('observacoes_aula_redes').select('nota_criterio_1, nota_criterio_2, nota_criterio_3, nota_criterio_4, nota_criterio_5, nota_criterio_6, nota_criterio_7, nota_criterio_8, nota_criterio_9, status, data').eq('status', 'enviado'),
          supabase.from('entidades_filho').select('id, nome, escola_id').eq('ativa', true).order('nome'),
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
        setObservacoesRedes((observacoesRedesRes.data || []) as ObservacaoRedesDB[]);
        setEntidadesFilho((entidadesFilhoRes.data || []).map(e => ({ id: e.id, nome: e.nome, escola_id: e.escola_id })));

        // Fetch admin users for report recipient selector
        if (isAdmin) {
          const { data: adminRoles } = await supabase
            .from('user_roles')
            .select('user_id')
            .eq('role', 'admin');
          
          if (adminRoles && adminRoles.length > 0) {
            const adminIds = adminRoles.map(r => r.user_id);
            const { data: adminProfiles } = await supabase
              .from('profiles')
              .select('id, nome, email')
              .in('id', adminIds)
              .order('nome');
            setAdminUsers(adminProfiles || []);
          }

          // Fetch gestor users for report recipient selector
          const { data: gestorRoles } = await supabase
            .from('user_roles')
            .select('user_id')
            .eq('role', 'gestor');
          
          if (gestorRoles && gestorRoles.length > 0) {
            const gestorIds = gestorRoles.map(r => r.user_id);
            
            const { data: gestorProfiles } = await supabase
              .from('profiles')
              .select('id, nome, email')
              .in('id', gestorIds)
              .order('nome');
            
            const { data: gestorProgramas } = await supabase
              .from('gestor_programas')
              .select('gestor_user_id, programa')
              .in('gestor_user_id', gestorIds);
            
            const gestorsWithProgramas = (gestorProfiles || []).map(g => ({
              ...g,
              programas: (gestorProgramas || [])
                .filter(gp => gp.gestor_user_id === g.id)
                .map(gp => gp.programa)
            }));
            
            setGestorUsers(gestorsWithProgramas);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Erro ao carregar dados');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [profile?.id, isAdmin, isGestor, isAAP]);

  // Resolve entidade filho escola_id for filtering
  const entidadeFilhoEscolaId = entidadeFilhoFilter !== 'todos'
    ? entidadesFilho.find(e => e.id === entidadeFilhoFilter)?.escola_id
    : undefined;

  // Filter data based on selections including programa, mes, ano, componente and entidade filho
  const filteredProgramacoes = programacoes.filter(p => {
    if (filters.segmento !== 'todos' && p.segmento !== filters.segmento) return false;
    if (filters.componente !== 'todos' && p.componente !== filters.componente) return false;
    if (componenteFilter !== 'todos' && p.componente !== componenteFilter) return false;
    if (filters.escolaId !== 'todos' && p.escola_id !== filters.escolaId) return false;
    if (filters.aapId !== 'todos' && p.aap_id !== filters.aapId) return false;
    if (programaFilter !== 'todos' && (!p.programa || !p.programa.includes(programaFilter))) return false;
    if (entidadeFilhoEscolaId && p.escola_id !== entidadeFilhoEscolaId) return false;
    
    // Filtrar por ano
    const dataYear = new Date(p.data).getFullYear();
    if (dataYear !== anoFilter) return false;
    
    // Filtrar por mês
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
    if (entidadeFilhoEscolaId && r.escola_id !== entidadeFilhoEscolaId) return false;
    
    // Filtrar por ano
    const dataYear = new Date(r.data).getFullYear();
    if (dataYear !== anoFilter) return false;
    
    // Filtrar por mês
    if (mesFilter !== 'todos') {
      const dataMonth = new Date(r.data).getMonth() + 1;
      if (dataMonth !== mesFilter) return false;
    }
    return true;
  });

  // Calculate stats - dynamically based on enabled action types for the program
  const enabledTipos = getAcoesByPrograma(programaFilter);
  
  // Build dynamic execution data from enabled types that have programacoes
  const execucaoData = enabledTipos
    .map(tipo => ({
      name: ACAO_TYPE_INFO[tipo]?.label || tipo,
      Previstas: filteredProgramacoes.filter(p => p.tipo === tipo).length,
      Realizadas: filteredProgramacoes.filter(p => p.tipo === tipo && p.status === 'realizada').length,
    }));

  // Filter escolas based on program filter
  const filteredEscolas = programaFilter === 'todos' 
    ? escolas 
    : escolas.filter(e => e.programa?.includes(programaFilter));

  // Dynamic title for attendance section based on programa filter
  const presencaTitulo = programaFilter === 'todos'
    ? 'Presença por Escola / Regional / Rede'
    : `Presença por ${programaLabels[programaFilter] || 'Escola'}`;

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

  // Get AAPs from profiles that have programacoes or registros
  const aapIdsFromProg = [...new Set(filteredProgramacoes.map(p => p.aap_id))];
  const aapIdsFromReg = [...new Set(filteredRegistros.map(r => r.aap_id))];
  const allAapIds = [...new Set([...aapIdsFromProg, ...aapIdsFromReg])];
  const aaps = profiles.filter(p => allAapIds.includes(p.id));



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
    if (!registro) return false;
    if (filters.segmento !== 'todos' && registro.segmento !== filters.segmento) return false;
    if (filters.componente !== 'todos' && registro.componente !== filters.componente) return false;
    if (filters.escolaId !== 'todos' && a.escola_id !== filters.escolaId) return false;
    if (filters.aapId !== 'todos' && a.aap_id !== filters.aapId) return false;
    if (programaFilter !== 'todos' && (!registro.programa || !registro.programa.includes(programaFilter))) return false;
    if (entidadeFilhoEscolaId && a.escola_id !== entidadeFilhoEscolaId) return false;
    // Filter by ano/mes
    const d = new Date(registro.data);
    if (d.getFullYear() !== anoFilter) return false;
    if (mesFilter !== 'todos' && d.getMonth() + 1 !== mesFilter) return false;
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

  const moduleVisibility = getModuleVisibility(programaFilter);
  const showStandardModule = moduleVisibility.showStandardAcompanhamento;
  const showRedesModule = moduleVisibility.showRedesAcompanhamento;

  // Filter REDES observations by ano/mes
  const filteredObservacoesRedes = observacoesRedes.filter(obs => {
    if (!obs.data) return false;
    const d = new Date(obs.data);
    if (d.getFullYear() !== anoFilter) return false;
    if (mesFilter !== 'todos' && d.getMonth() + 1 !== mesFilter) return false;
    return true;
  });

  // REDES observation averages (using filtered data)
  const calcularMediaRedesCriterio = (criterioKey: keyof ObservacaoRedesDB) => {
    const validRecords = filteredObservacoesRedes.filter(r => r[criterioKey] != null && (r[criterioKey] as number) > 0);
    if (validRecords.length === 0) return 0;
    const soma = validRecords.reduce((acc, r) => acc + ((r[criterioKey] as number) || 0), 0);
    return Number((soma / validRecords.length).toFixed(2));
  };

  const redesRadarData = REDES_CRITERIO_LABELS.map((label, i) => ({
    subject: label,
    value: calcularMediaRedesCriterio(`nota_criterio_${i + 1}` as keyof ObservacaoRedesDB),
    fullMark: 4,
  }));

  const redesSatisfacaoData = REDES_CRITERIO_LABELS.map((label, i) => ({
    name: label,
    media: calcularMediaRedesCriterio(`nota_criterio_${i + 1}` as keyof ObservacaoRedesDB),
  }));

  const handleExport = () => {
    const reportData = {
      resumo: [Object.fromEntries(
        execucaoData.flatMap(item => [
          [`${item.name} Previstas`, item.Previstas],
          [`${item.name} Realizadas`, item.Realizadas],
        ])
      )],
      porEscola: presencaPorEscola.map(e => ({
        'Escola': e.name,
        '% Presença': `${e.presenca}%`,
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
    

    const wsAcompanhamento = XLSX.utils.json_to_sheet(reportData.acompanhamentoAula);
    XLSX.utils.book_append_sheet(wb, wsAcompanhamento, 'Acompanhamento Aula');

    // REDES observation sheet
    if (observacoesRedes.length > 0) {
      const redesExportData = [{
        'Total Observações': observacoesRedes.length,
        ...Object.fromEntries(REDES_CRITERIO_LABELS.map((label, i) => {
          const key = `nota_criterio_${i + 1}` as keyof ObservacaoRedesDB;
          const validRecords = observacoesRedes.filter(r => r[key] != null && (r[key] as number) > 0);
          const avg = validRecords.length > 0 ? validRecords.reduce((acc, r) => acc + ((r[key] as number) || 0), 0) / validRecords.length : 0;
          return [`Média ${label}`, avg.toFixed(2)];
        }))
      }];
      const wsRedes = XLSX.utils.json_to_sheet(redesExportData);
      XLSX.utils.book_append_sheet(wb, wsRedes, 'Observação Redes');
    }
    
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
      pdfContainer.style.overflow = 'visible';
      pdfContainer.style.height = 'auto';
      document.body.appendChild(pdfContainer);
      
      // Render the PDF-specific component into the offscreen container
      const root = createRoot(pdfContainer);
      root.render(
        <PdfReportContent
          execucaoData={execucaoData}
          presencaPorEscola={presencaPorEscola}
          radarData={radarData}
          satisfacaoData={satisfacaoData}
          totalAvaliacoes={totalAvaliacoes}
          instrumentChartData={instrumentChartData}
        />
      );
      
      // Wait for React + Recharts to render
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // A4 dimensions in mm
      const a4Width = 210;
      const a4Height = 297;
      const margin = 10;
      const headerHeight = 25;
      const contentWidth = a4Width - (margin * 2);
      const sectionGap = 3;
      
      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Helper to draw the header on current page
      let logoImgCached: HTMLImageElement | null = null;
      let bussolaImgCached: HTMLImageElement | null = null;
      try {
        logoImgCached = new Image();
        logoImgCached.crossOrigin = 'anonymous';
        const logoModule = await import('@/assets/pe-logo-branco-horizontal.png');
        logoImgCached.src = logoModule.default;
        await new Promise((resolve, reject) => {
          logoImgCached!.onload = resolve;
          logoImgCached!.onerror = reject;
          setTimeout(reject, 3000);
        });
      } catch (e) {
        console.warn('Could not load logo:', e);
        logoImgCached = null;
      }
      try {
        bussolaImgCached = new Image();
        bussolaImgCached.crossOrigin = 'anonymous';
        const bussolaModule = await import('@/assets/logo-bussola-branco.png');
        bussolaImgCached.src = bussolaModule.default;
        await new Promise((resolve, reject) => {
          bussolaImgCached!.onload = resolve;
          bussolaImgCached!.onerror = reject;
          setTimeout(reject, 3000);
        });
      } catch (e) {
        console.warn('Could not load bussola logo:', e);
        bussolaImgCached = null;
      }

      const programaText = programaFilter !== 'todos' ? programaLabels[programaFilter] : 'Todos os Programas';
      const mesText = mesFilter !== 'todos' ? mesesLabels[mesFilter] : 'Todos os Meses';

      const drawHeader = (isFirst: boolean) => {
        const hdrH = headerHeight;
        // Rounded rect background
        pdf.setFillColor(26, 58, 92);
        pdf.roundedRect(margin, 4, a4Width - margin * 2, hdrH - 4, 4, 4, 'F');
        
        // Logo on left – keep proportional (horizontal logo ~5:1 ratio)
        const logoH = 9;
        const logoW = 45;
        const logoX = margin + 6;
        const logoY = 4 + (hdrH - 4 - logoH) / 2;
        if (logoImgCached) {
          pdf.addImage(logoImgCached, 'PNG', logoX, logoY, logoW, logoH);
        }
        let bussolaX = logoX + logoW + 3;
        if (bussolaImgCached) {
          const bRatio = bussolaImgCached.naturalWidth / bussolaImgCached.naturalHeight;
          const bH = logoH;
          const bW = bH * bRatio;
          pdf.addImage(bussolaImgCached, 'PNG', bussolaX, logoY, bW, bH);
          bussolaX += bW;
        }
        
        // Title block – vertically centred
        const titleX = bussolaImgCached ? bussolaX + 6 : logoX + logoW + 6;
        const midY = 4 + (hdrH - 4) / 2;
        pdf.setTextColor(255, 255, 255);

        if (isFirst) {
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Relatório de Acompanhamento', titleX, midY - 3);
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'normal');
          pdf.text('Olhar Parceiro — Relatório de Acompanhamento', titleX, midY + 2);
          pdf.setFontSize(7);
          pdf.setTextColor(180, 200, 220);
          pdf.text(`${programaText} • ${mesText}/${anoFilter}`, titleX, midY + 6.5);
        } else {
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Relatório de Acompanhamento', titleX, midY + 1);
        }
        
        // Date on right
        pdf.setTextColor(255, 255, 255);
        const dateStr = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        const dateW = pdf.getTextWidth(dateStr);
        pdf.text(dateStr, a4Width - margin - 6 - dateW, midY + 1);
      };

      // Draw first page header
      drawHeader(true);
      
      // Get all sections marked with data-pdf-section
      const sections = Array.from(
        pdfContainer.querySelectorAll('[data-pdf-section]')
      ) as HTMLElement[];
      
      const contentStartY = headerHeight + margin;
      let currentY = contentStartY;
      
      for (const section of sections) {
        const canvas = await html2canvas(section, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: 1200,
        });
        
        const widthPx = canvas.width / 2;
        const heightPx = canvas.height / 2;
        const scaleFactor = contentWidth / widthPx;
        const heightMM = heightPx * scaleFactor;
        
        const remainingSpace = a4Height - margin - currentY;
        
        // If section won't fit, start new page
        if (heightMM > remainingSpace && currentY > contentStartY) {
          pdf.addPage();
          drawHeader(false);
          currentY = contentStartY;
        }
        
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', margin, currentY, contentWidth, heightMM, undefined, 'FAST');
        currentY += heightMM + sectionGap;
      }
      
      // Cleanup
      root.unmount();
      document.body.removeChild(pdfContainer);
      
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4" data-tour="rel-header">
        <div>
          <h1 className="page-header">Relatórios</h1>
          <p className="page-subtitle">Acompanhe os indicadores do programa</p>
        </div>
        
        <div className="flex flex-wrap gap-3" data-tour="rel-export-btns">
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

      {/* Email Notifications Section - Collapsible */}
      {isAdmin && (
        <div className="bg-card rounded-xl border border-border overflow-hidden" data-tour="rel-email-section">
          <button
            onClick={() => setIsEmailSectionOpen(!isEmailSectionOpen)}
            className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Mail className="text-primary" size={20} />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-foreground">Envio de E-mails</h3>
                <p className="text-sm text-muted-foreground">Envie notificações e relatórios por e-mail manualmente</p>
              </div>
            </div>
            {isEmailSectionOpen ? (
              <ChevronUp className="text-muted-foreground" size={20} />
            ) : (
              <ChevronDown className="text-muted-foreground" size={20} />
            )}
          </button>
          
          {isEmailSectionOpen && (
            <div className="px-6 pb-6 pt-2">
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
                
                <div className="flex-1 min-w-[300px] p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">Relatório Mensal Executivo</h4>
                  <p className="text-xs text-muted-foreground mb-3">
                    Envia resumo do mês selecionado para administradores e gestores.
                  </p>
                  <div className="flex flex-col gap-3">
                    <Select
                      value={selectedReportMonth}
                      onValueChange={setSelectedReportMonth}
                    >
                      <SelectTrigger className="w-full">
                        <Calendar size={16} className="mr-2" />
                        <SelectValue placeholder="Selecionar mês" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableReportMonths().map(({ value, label }) => (
                          <SelectItem key={value} value={value} className="capitalize">
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">Administradores</label>
                      <Select
                        value={selectedReportRecipients}
                        onValueChange={setSelectedReportRecipients}
                      >
                        <SelectTrigger className="w-full">
                          <Mail size={16} className="mr-2" />
                          <SelectValue placeholder="Selecionar administrador" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos os administradores</SelectItem>
                          {adminUsers.map((admin) => (
                            <SelectItem key={admin.id} value={admin.id}>
                              {admin.nome} ({admin.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {gestorUsers.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">Gestores (opcional)</label>
                        <div className="max-h-32 overflow-y-auto border border-border rounded-lg p-2 space-y-1 bg-background">
                          {gestorUsers.map((gestor) => {
                            const programaLabelsMap: Record<string, string> = {
                              escolas: 'Escolas',
                              regionais: 'Regionais',
                              redes_municipais: 'Redes Municipais'
                            };
                            const programasStr = gestor.programas.map(p => programaLabelsMap[p] || p).join(', ');
                            return (
                              <label
                                key={gestor.id}
                                className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer text-sm"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedGestorRecipients.includes(gestor.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedGestorRecipients([...selectedGestorRecipients, gestor.id]);
                                    } else {
                                      setSelectedGestorRecipients(selectedGestorRecipients.filter(id => id !== gestor.id));
                                    }
                                  }}
                                  className="h-4 w-4 rounded border-border"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium truncate">{gestor.nome}</div>
                                  <div className="text-xs text-muted-foreground truncate">{programasStr}</div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                        {selectedGestorRecipients.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {selectedGestorRecipients.length} gestor(es) selecionado(s)
                          </p>
                        )}
                      </div>
                    )}
                    
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
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    📅 Enviado automaticamente no dia 1º de cada mês às 9h (mês anterior)
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-4" data-tour="rel-filters">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-muted-foreground">Filtros</span>
          <div className="flex flex-wrap gap-3">
            <Select
              value={programaFilter}
              onValueChange={(value) => setProgramaFilter(value as ProgramaTypeDB | 'todos')}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Programa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Programa</SelectItem>
                {Object.entries(programaLabels)
                  .filter(([value]) => isAdmin || userProgramas.length === 0 || userProgramas.includes(value as ProgramaTypeDB))
                  .map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
              </SelectContent>
            </Select>

            <Select
              value={anoFilter.toString()}
              onValueChange={(value) => setAnoFilter(parseInt(value))}
            >
              <SelectTrigger className="w-[110px]">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                {anosDisponiveis.map(ano => (
                  <SelectItem key={ano} value={ano.toString()}>{ano}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={mesFilter === 'todos' ? 'todos' : mesFilter.toString()}
              onValueChange={(value) => setMesFilter(value === 'todos' ? 'todos' : parseInt(value))}
            >
              <SelectTrigger className="w-[150px]">
                <Calendar size={16} className="mr-2" />
                <SelectValue placeholder="Mês" />
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
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Componente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Componente</SelectItem>
                <SelectItem value="polivalente">Polivalente</SelectItem>
                <SelectItem value="lingua_portuguesa">Português</SelectItem>
                <SelectItem value="matematica">Matemática</SelectItem>
              </SelectContent>
            </Select>

            {entidadesFilho.length > 0 && (
              <Select
                value={entidadeFilhoFilter}
                onValueChange={(value) => setEntidadeFilhoFilter(value)}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Entidade Filho" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Entidade Filho</SelectItem>
                  {entidadesFilho
                    .filter(ef => filters.escolaId === 'todos' || ef.escola_id === filters.escolaId)
                    .map(ef => (
                      <SelectItem key={ef.id} value={ef.id}>{ef.nome}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
        
        <FilterBar filters={filters} onFilterChange={setFilters} className="flex-1" />
      </div>

      {/* Empty state check - based on FILTERED data */}
      {filteredProgramacoes.length === 0 && filteredRegistros.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-xl border border-border">
          <FileText size={48} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum dado disponível</h3>
          <p className="text-muted-foreground">Não há programações ou registros para os filtros selecionados.</p>
        </div>
      ) : (
        <>
          {/* Report Content - wrapped in ref for PDF export */}
          <div ref={reportRef} className="space-y-2 bg-background p-1">

            {/* Summary Cards - hide tipos sem dados */}
            {execucaoData.some(item => item.Previstas > 0 || item.Realizadas > 0) && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2" data-tour="rel-stats">
                {execucaoData
                  .filter(item => item.Previstas > 0 || item.Realizadas > 0)
                  .map((item) => {
                    const pct = item.Previstas > 0 ? (item.Realizadas / item.Previstas) * 100 : 0;
                    return (
                      <div key={item.name} className="stat-card">
                        <p className="text-sm text-muted-foreground">{item.name}</p>
                        <p className="text-2xl font-bold text-foreground">{item.Realizadas}/{item.Previstas}</p>
                        <div className="mt-2 progress-bar">
                          <div
                            className="progress-fill"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

            {/* Charts Row - Previsto vs Realizado */}
            {execucaoData.some(item => item.Previstas > 0 || item.Realizadas > 0) && (
            <div data-tour="rel-charts">
              <div className="bg-card rounded-xl border border-border p-6">
                <h3 className="card-title mb-6">Previsto vs Realizado</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={execucaoData.filter(i => i.Previstas > 0 || i.Realizadas > 0)}>
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
            </div>
            )}

            {/* Instrumentos Pedagógicos */}
            <InstrumentDimensionCharts chartData={instrumentChartData} isLoading={isInstrumentChartsLoading} />

            {/* Presence by School */}
            {presencaPorEscola.some(e => e.totalPresencas > 0) && (
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="card-title mb-2">{presencaTitulo}</h3>
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
              </div>
            </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}