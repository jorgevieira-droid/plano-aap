import { useState, useMemo, useEffect } from 'react';
import { Search, Eye, Calendar, MapPin, User, MessageSquare, TrendingUp, AlertCircle, Loader2, Edit, Star, History, Download, XCircle, CalendarClock, Check, X, Users, ClipboardCheck, ChevronRight, Trash2, GraduationCap, ClipboardList, Clock, CheckCircle2, LinkIcon } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { segmentoLabels, componenteLabels, tipoAcaoLabels, notaAvaliacaoLabels, cargoLabels } from '@/data/mockData';
import { canUserEditAcao, canUserDeleteAcao, canUserViewAcao, getAcaoLabel, getViewableAcoes, ACAO_TYPE_INFO, ACAO_TIPOS, normalizeAcaoTipo, ACAO_FORM_CONFIG, AcaoTipo } from '@/config/acaoPermissions';
import { Segmento, ComponenteCurricular, NotaAvaliacao } from '@/types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { InstrumentForm } from '@/components/instruments/InstrumentForm';
import { INSTRUMENT_FORM_TYPES } from '@/hooks/useInstrumentFields';
import { ScrollArea } from '@/components/ui/scroll-area';

type ProgramaType = 'escolas' | 'regionais' | 'redes_municipais';

interface RegistroAcaoDB {
  id: string;
  programacao_id: string | null;
  tipo: string;
  data: string;
  escola_id: string;
  aap_id: string;
  segmento: string;
  componente: string;
  ano_serie: string;
  turma: string | null;
  observacoes: string | null;
  avancos: string | null;
  dificuldades: string | null;
  programa: string[] | null;
  created_at: string;
  status: string;
  reagendada_para: string | null;
  is_reagendada: boolean;
  formacao_origem_id: string | null;
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
  clareza_objetivos: number;
  dominio_conteudo: number;
  estrategias_didaticas: number;
  engajamento_turma: number;
  gestao_tempo: number;
  observacoes: string | null;
}

interface Escola {
  id: string;
  nome: string;
}

interface Profile {
  id: string;
  nome: string;
}

interface Professor {
  id: string;
  nome: string;
  escola_id: string;
  segmento: string;
  componente: string;
  cargo: string;
  ano_serie: string; // ano/série do professor
}

interface ProgramacaoDB {
  id: string;
  motivo_cancelamento: string | null;
  titulo: string;
  tipo_ator_presenca: string | null;
}

interface AlteracaoLog {
  id: string;
  tabela: string;
  registro_id: string;
  usuario_id: string;
  alteracao: any;
  created_at: string;
}

interface PresencaItem {
  professorId: string;
  presente: boolean;
}

interface AvaliacaoAulaItem {
  professorId: string;
  clareza_objetivos: NotaAvaliacao;
  dominio_conteudo: NotaAvaliacao;
  estrategias_didaticas: NotaAvaliacao;
  engajamento_turma: NotaAvaliacao;
  gestao_tempo: NotaAvaliacao;
  observacoes: string;
}

const dimensoesAvaliacao = [
  { key: 'clareza_objetivos', label: 'Intencionalidade pedagógica', description: 'Objetivo de aprendizagem claro e comunicado aos estudantes, Alinhamento ao currículo/habilidades' },
  { key: 'dominio_conteudo', label: 'Estratégias didáticas', description: 'Estratégias adequadas ao objetivo da aula, Uso de metodologias que favorecem a aprendizagem' },
  { key: 'estrategias_didaticas', label: 'Mediação docente', description: 'Intervenções que apoiam a compreensão, Questionamentos que promovem reflexão' },
  { key: 'engajamento_turma', label: 'Engajamento dos estudantes', description: 'Participação ativa da maioria da turma, Clima favorável à aprendizagem' },
  { key: 'gestao_tempo', label: 'Avaliação durante a aula', description: 'Verificação de compreensão, Ajustes pedagógicos a partir das respostas dos estudantes' },
] as const;

const pontuacaoLegenda = [
  { nota: 1, titulo: 'Não observado', descricao: 'Não há evidências do critério avaliado.' },
  { nota: 2, titulo: 'Inicial', descricao: 'Há indícios pontuais ou informais, ainda pouco estruturados ou inconsistentes.' },
  { nota: 3, titulo: 'Parcial', descricao: 'O critério é atendido em parte, com aplicação irregular ou dependente de pessoas específicas.' },
  { nota: 4, titulo: 'Adequado', descricao: 'O critério está implementado de forma estruturada e atende ao esperado, com regularidade.' },
  { nota: 5, titulo: 'Consistente', descricao: 'O critério está plenamente incorporado à prática, é sustentável ao longo do tempo e apresenta evidências claras e recorrentes.' },
];

const statusLabels: Record<string, string> = {
  agendada: 'Agendada',
  prevista: 'Prevista',
  realizada: 'Realizada',
  cancelada: 'Cancelada',
  reagendada: 'Reagendada',
};

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
const months = [
  { value: '01', label: 'Janeiro' },
  { value: '02', label: 'Fevereiro' },
  { value: '03', label: 'Março' },
  { value: '04', label: 'Abril' },
  { value: '05', label: 'Maio' },
  { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' },
  { value: '08', label: 'Agosto' },
  { value: '09', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
];

export default function RegistrosPage() {
  const { user, profile, isAdmin, isAAP, isManager } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('todos');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [filterYear, setFilterYear] = useState<string>('todos');
  const [filterMonth, setFilterMonth] = useState<string>('todos');
  const [programaFilter, setProgramaFilter] = useState<ProgramaType | 'todos'>('todos');
  const [selectedRegistro, setSelectedRegistro] = useState<RegistroAcaoDB | null>(null);
  
  // Check URL params for status filter
  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam === 'pendentes') {
      setFilterStatus('pendentes');
    }
  }, [searchParams]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  
  // Edit form state
  const [editData, setEditData] = useState('');
  const [editTipo, setEditTipo] = useState('');
  const [editEscolaId, setEditEscolaId] = useState('');
  const [editSegmento, setEditSegmento] = useState('');
  const [editAnoSerie, setEditAnoSerie] = useState('');
  const [editTurma, setEditTurma] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editObservacoes, setEditObservacoes] = useState('');
  const [editAvancos, setEditAvancos] = useState('');
  const [editDificuldades, setEditDificuldades] = useState('');

  // Manage action state
  const [isManaging, setIsManaging] = useState(false);
  const [presencaList, setPresencaList] = useState<PresencaItem[]>([]);
  const [avaliacaoList, setAvaliacaoList] = useState<AvaliacaoAulaItem[]>([]);
  const [selectedProfessorAvaliacao, setSelectedProfessorAvaliacao] = useState<string | null>(null);
  
  // Estados para exclusão
  const [registroToDelete, setRegistroToDelete] = useState<RegistroAcaoDB | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Estados para exclusão em lote
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);
  const [isBatchDeleteDialogOpen, setIsBatchDeleteDialogOpen] = useState(false);
  
  // Estado para confirmação de realização de ação (acompanhamento)
  const [showConfirmRealizacao, setShowConfirmRealizacao] = useState(false);
  const [acaoRealizada, setAcaoRealizada] = useState<boolean | null>(null);

  // Estado para instrumento pedagógico no gerenciamento
  const [isInstrumentManaging, setIsInstrumentManaging] = useState(false);
  const [instrumentResponses, setInstrumentResponses] = useState<Record<string, any>>({});
  const [instrumentFormType, setInstrumentFormType] = useState<string | null>(null);

  // Set of form types that use instrument-based forms
  const INSTRUMENT_TYPE_SET = useMemo(() => new Set<string>(INSTRUMENT_FORM_TYPES.map(t => t.value)), []);
  // Types that use presence-based management
  const PRESENCE_TYPES = useMemo(() => new Set(['formacao', 'lista_presenca', 'participa_formacoes']), []);

  // Fetch programs for managers (N2 Gestor + N3 Coordenador)
  const { data: gestorProgramas = [] } = useQuery({
    queryKey: ['user_programas_registros', user?.id],
    queryFn: async () => {
      if (!user || !isManager) return [];
      const { data, error } = await supabase
        .from('user_programas')
        .select('programa')
        .eq('user_id', user.id);
      if (error) throw error;
      return data.map(p => p.programa as ProgramaType);
    },
    enabled: !!user && isManager,
  });

  // Fetch AAP programs if user is AAP
  const { data: aapProgramas = [] } = useQuery({
    queryKey: ['aap_programas', user?.id],
    queryFn: async () => {
      if (!user || !isAAP) return [];
      const { data, error } = await supabase
        .from('aap_programas')
        .select('programa')
        .eq('aap_user_id', user.id);
      if (error) throw error;
      return data.map(p => p.programa as ProgramaType);
    },
    enabled: !!user && isAAP,
  });

  const { data: registros = [], isLoading: isLoadingRegistros } = useQuery({
    queryKey: ['registros_acao', user?.id, isAdmin, isManager, gestorProgramas],
    queryFn: async () => {
      let query = supabase.from('registros_acao').select('*').order('data', { ascending: false });
      
      // Non-admin, non-manager: only sees their own actions
      if (!isAdmin && !isManager && user) {
        query = query.eq('aap_id', user.id);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      let result = data as RegistroAcaoDB[];
      
      // Manager (N2/N3): filter by their assigned programs (client-side since programa is an array)
      if (isManager && !isAdmin && gestorProgramas.length > 0) {
        result = result.filter(r => 
          r.programa && r.programa.some(p => gestorProgramas.includes(p as ProgramaType))
        );
      }
      
      return result;
    },
    enabled: !!user,
  });

  const { data: presencas = [] } = useQuery({
    queryKey: ['presencas'],
    queryFn: async () => {
      const { data, error } = await supabase.from('presencas').select('*');
      if (error) throw error;
      return data as PresencaDB[];
    },
  });

  const { data: avaliacoes = [], refetch: refetchAvaliacoes } = useQuery({
    queryKey: ['avaliacoes_aula'],
    queryFn: async () => {
      const { data, error } = await supabase.from('avaliacoes_aula').select('*');
      if (error) throw error;
      return data as AvaliacaoAulaDB[];
    },
    staleTime: 0, // Sempre considera os dados como stale para garantir atualização
  });

  const { data: escolas = [] } = useQuery({
    queryKey: ['escolas'],
    queryFn: async () => {
      const { data, error } = await supabase.from('escolas').select('id, nome');
      if (error) throw error;
      return data as Escola[];
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles_directory').select('id, nome').order('nome');
      if (error) throw error;
      return data as Profile[];
    },
  });

  const { data: professores = [] } = useQuery({
    queryKey: ['professores_all'],
    queryFn: async () => {
      const { data, error } = await supabase.from('professores').select('id, nome, escola_id, segmento, componente, cargo, ano_serie').eq('ativo', true).order('nome');
      if (error) throw error;
      return data as Professor[];
    },
  });

  const { data: alteracoes = [] } = useQuery({
    queryKey: ['registros_alteracoes', selectedRegistro?.id],
    queryFn: async () => {
      if (!selectedRegistro) return [];
      const { data, error } = await supabase
        .from('registros_alteracoes')
        .select('*')
        .eq('registro_id', selectedRegistro.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as AlteracaoLog[];
    },
    enabled: !!selectedRegistro,
  });

  const { data: programacoes = [] } = useQuery({
    queryKey: ['programacoes_for_registros'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('programacoes')
        .select('id, motivo_cancelamento, titulo, tipo_ator_presenca');
      if (error) throw error;
      return data as ProgramacaoDB[];
    },
  });

  const isLoading = isLoadingRegistros;

  const getEscolaNome = (escolaId: string) => escolas.find(e => e.id === escolaId)?.nome || '-';
  const getAapNome = (aapId: string) => profiles.find(p => p.id === aapId)?.nome || '-';
  const getProfessorNome = (professorId: string) => professores.find(p => p.id === professorId)?.nome || '-';
  const getMotivoCancelamento = (programacaoId: string | null) => {
    if (!programacaoId) return null;
    return programacoes.find(p => p.id === programacaoId)?.motivo_cancelamento || null;
  };

  // Limpar seleção ao mudar filtros
  useEffect(() => {
    setSelectedIds(new Set());
  }, [searchTerm, filterTipo, filterStatus, filterYear, filterMonth, programaFilter]);

  const filteredRegistros = registros.filter(registro => {
    const escola = escolas.find(e => e.id === registro.escola_id);
    const aap = profiles.find(a => a.id === registro.aap_id);
    
    const matchesSearch = 
      escola?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      aap?.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipo = filterTipo === 'todos' || registro.tipo === filterTipo;
    
    // Pendentes = agendada/reagendada com data > 2 dias no passado
    const isPendente = () => {
      if (registro.status !== 'agendada' && registro.status !== 'reagendada') return false;
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const registroDate = new Date(registro.data);
      return registroDate <= twoDaysAgo;
    };
    
    const matchesStatus = filterStatus === 'todos' || 
      (filterStatus === 'pendentes' ? isPendente() : registro.status === filterStatus);
    const matchesPrograma = programaFilter === 'todos' || (registro.programa && registro.programa.includes(programaFilter));
    
    // Filter by year
    const registroYear = registro.data.substring(0, 4);
    const matchesYear = filterYear === 'todos' || registroYear === filterYear;
    
    // Filter by month
    const registroMonth = registro.data.substring(5, 7);
    const matchesMonth = filterMonth === 'todos' || registroMonth === filterMonth;
    
    return matchesSearch && matchesTipo && matchesStatus && matchesPrograma && matchesYear && matchesMonth;
  });

  const getPresencasForRegistro = (registroId: string) => {
    return presencas.filter(p => p.registro_acao_id === registroId);
  };

  const getAvaliacoesForRegistro = (registroId: string) => {
    return avaliacoes.filter(a => a.registro_acao_id === registroId);
  };

  const canEdit = (registro: RegistroAcaoDB) => {
    if (!canUserEditAcao(profile?.role, registro.tipo)) return false;
    if (isAdmin || isManager) return true;
    return registro.aap_id === user?.id;
  };

  const canDelete = (registro: RegistroAcaoDB) => {
    if (!canUserDeleteAcao(profile?.role, registro.tipo)) return false;
    if (isAdmin || isManager) return true;
    return registro.aap_id === user?.id;
  };

  // Get available professors for a registro - filtrar por escola, segmento, ano_serie e componente
  const getAvailableProfessors = (registro: RegistroAcaoDB) => {
    // Para formação, verificar se segmento e ano_serie são "todos"
    if (registro.tipo === 'formacao') {
      const programacao = programacoes.find(prog => prog.id === registro.programacao_id);
      const tipoAtor = programacao?.tipo_ator_presenca;
      const isCargoAdministrativo = tipoAtor && tipoAtor !== 'todos' && tipoAtor !== 'professor';

      return professores.filter(p => {
        if (p.escola_id !== registro.escola_id) return false;
        // Filtro por componente: apenas se o alvo for professor (admins têm 'nao_se_aplica')
        if (!isCargoAdministrativo && p.componente !== registro.componente) return false;
        // Filtro por segmento: apenas se o alvo for professor
        if (!isCargoAdministrativo && registro.segmento !== 'todos' && p.segmento !== registro.segmento && p.segmento !== 'todos') return false;
        // Filtro por ano_serie: apenas se o alvo for professor
        if (!isCargoAdministrativo && registro.ano_serie !== 'todos' && p.ano_serie !== registro.ano_serie && p.ano_serie !== 'todos') return false;
        // Filtro por cargo
        if (tipoAtor && tipoAtor !== 'todos' && p.cargo !== tipoAtor) return false;
        return true;
      });
    }
    
    // Para acompanhamento_aula e visita, filtrar por todos os critérios
    return professores.filter(p => 
      p.escola_id === registro.escola_id &&
      (p.segmento === registro.segmento || p.segmento === 'todos') &&
      (p.ano_serie === registro.ano_serie || p.ano_serie === 'todos') &&
      p.componente === registro.componente
    );
  };

  const handleOpenEdit = (registro: RegistroAcaoDB) => {
    setSelectedRegistro(registro);
    setEditData(registro.data);
    setEditTipo(registro.tipo);
    setEditEscolaId(registro.escola_id);
    setEditSegmento(registro.segmento);
    setEditAnoSerie(registro.ano_serie);
    setEditTurma(registro.turma || '');
    setEditStatus(registro.status);
    setEditObservacoes(registro.observacoes || '');
    setEditAvancos(registro.avancos || '');
    setEditDificuldades(registro.dificuldades || '');
    setIsEditing(true);
  };

  const handleOpenManage = async (registro: RegistroAcaoDB) => {
    setSelectedRegistro(registro);
    const profs = getAvailableProfessors(registro);
    
    // Check if this type uses an instrument form (not acompanhamento_aula which uses legacy evaluation)
    const isInstrumentType = INSTRUMENT_TYPE_SET.has(registro.tipo) && registro.tipo !== 'acompanhamento_aula';
    
    if (isInstrumentType) {
      // Load existing instrument responses
      const { data: existingResponses } = await supabase
        .from('instrument_responses')
        .select('responses')
        .eq('registro_acao_id', registro.id)
        .eq('form_type', registro.tipo)
        .maybeSingle();
      
      setInstrumentFormType(registro.tipo);
      setInstrumentResponses(existingResponses?.responses as Record<string, any> || {});
      setIsInstrumentManaging(true);
      return;
    }
    
    if (registro.tipo === 'acompanhamento_aula') {
      // Verificar se já existem avaliações
      const existingAvaliacoes = getAvaliacoesForRegistro(registro.id);
      
      // Se status for agendada/reagendada e não há avaliações, perguntar se houve a visita
      const isPendingAction = registro.status === 'agendada' || registro.status === 'reagendada';
      if (isPendingAction && existingAvaliacoes.length === 0) {
        setShowConfirmRealizacao(true);
        setAcaoRealizada(null);
        return;
      }
      
      // Load existing avaliacoes
      const avaliacaoMap = new Map(existingAvaliacoes.map(a => [a.professor_id, a]));
      
      setAvaliacaoList(profs.map(p => {
        const existing = avaliacaoMap.get(p.id);
        return {
          professorId: p.id,
          clareza_objetivos: (existing?.clareza_objetivos || 3) as NotaAvaliacao,
          dominio_conteudo: (existing?.dominio_conteudo || 3) as NotaAvaliacao,
          estrategias_didaticas: (existing?.estrategias_didaticas || 3) as NotaAvaliacao,
          engajamento_turma: (existing?.engajamento_turma || 3) as NotaAvaliacao,
          gestao_tempo: (existing?.gestao_tempo || 3) as NotaAvaliacao,
          observacoes: existing?.observacoes || '',
        };
      }));
      setPresencaList([]);
    } else {
      // Load existing presencas
      const existingPresencas = getPresencasForRegistro(registro.id);
      const presencaMap = new Map(existingPresencas.map(p => [p.professor_id, p.presente]));
      
      setPresencaList(profs.map(p => ({
        professorId: p.id,
        presente: presencaMap.get(p.id) ?? false,
      })));
      setAvaliacaoList([]);
    }
    
    setSelectedProfessorAvaliacao(null);
    setIsManaging(true);
  };

  // Handler para confirmar se ação foi realizada
  const handleConfirmRealizacao = async (realizada: boolean) => {
    if (!selectedRegistro || !user) return;
    
    if (realizada) {
      // Atualizar status do registro para "realizada" e abrir formulário de avaliação
      try {
        const { error } = await supabase
          .from('registros_acao')
          .update({ status: 'realizada' })
          .eq('id', selectedRegistro.id);
        
        if (error) throw error;
        
        // Atualizar registro local
        const updatedRegistro = { ...selectedRegistro, status: 'realizada' };
        setSelectedRegistro(updatedRegistro);
        
        // Carregar professores para avaliação
        const profs = getAvailableProfessors(selectedRegistro);
        setAvaliacaoList(profs.map(p => ({
          professorId: p.id,
          clareza_objetivos: 3 as NotaAvaliacao,
          dominio_conteudo: 3 as NotaAvaliacao,
          estrategias_didaticas: 3 as NotaAvaliacao,
          engajamento_turma: 3 as NotaAvaliacao,
          gestao_tempo: 3 as NotaAvaliacao,
          observacoes: '',
        })));
        
        queryClient.invalidateQueries({ queryKey: ['registros_acao'] });
        setShowConfirmRealizacao(false);
        setIsManaging(true);
        toast.success('Ação marcada como realizada!');
      } catch (error) {
        console.error('Error updating registro:', error);
        toast.error('Erro ao atualizar registro');
      }
    } else {
      // Fechar diálogo sem fazer nada
      setShowConfirmRealizacao(false);
      setSelectedRegistro(null);
      toast.info('Ação mantida como pendente');
    }
  };

  const handleTogglePresenca = (professorId: string) => {
    setPresencaList(prev => 
      prev.map(item => 
        item.professorId === professorId 
          ? { ...item, presente: !item.presente }
          : item
      )
    );
  };

  const handleMarcarTodos = (presente: boolean) => {
    setPresencaList(prev => prev.map(item => ({ ...item, presente })));
  };

  const handleUpdateAvaliacao = (professorId: string, dimensao: keyof AvaliacaoAulaItem, valor: NotaAvaliacao | string) => {
    setAvaliacaoList(prev =>
      prev.map(item =>
        item.professorId === professorId
          ? { ...item, [dimensao]: valor }
          : item
      )
    );
  };

  const handleSaveManage = async () => {
    if (!selectedRegistro || !user) return;
    
    setIsSubmitting(true);
    try {
      if (selectedRegistro.tipo === 'acompanhamento_aula') {
        // Delete existing avaliacoes
        await supabase
          .from('avaliacoes_aula')
          .delete()
          .eq('registro_acao_id', selectedRegistro.id);
        
        // Insert new avaliacoes
        const avaliacoesToInsert = avaliacaoList.map(av => ({
          registro_acao_id: selectedRegistro.id,
          professor_id: av.professorId,
          escola_id: selectedRegistro.escola_id,
          aap_id: selectedRegistro.aap_id,
          clareza_objetivos: av.clareza_objetivos,
          dominio_conteudo: av.dominio_conteudo,
          estrategias_didaticas: av.estrategias_didaticas,
          engajamento_turma: av.engajamento_turma,
          gestao_tempo: av.gestao_tempo,
          observacoes: av.observacoes || null,
        }));
        
        const { error: avaliacoesError } = await supabase
          .from('avaliacoes_aula')
          .insert(avaliacoesToInsert);
        
        if (avaliacoesError) throw avaliacoesError;
        
        toast.success('Avaliações atualizadas com sucesso!');
      } else {
        // Delete existing presencas
        await supabase
          .from('presencas')
          .delete()
          .eq('registro_acao_id', selectedRegistro.id);
        
        // Insert new presencas
        const presencasToInsert = presencaList.map(p => ({
          registro_acao_id: selectedRegistro.id,
          professor_id: p.professorId,
          presente: p.presente,
        }));
        
        const { error: presencasError } = await supabase
          .from('presencas')
          .insert(presencasToInsert);
        
        if (presencasError) throw presencasError;
        
        const presentes = presencaList.filter(p => p.presente).length;
        toast.success(`Presenças atualizadas! ${presentes}/${presencaList.length} presentes`);
      }
      
      queryClient.invalidateQueries({ queryKey: ['presencas'] });
      queryClient.invalidateQueries({ queryKey: ['avaliacoes_aula'] });
      setIsManaging(false);
      setSelectedRegistro(null);
    } catch (error) {
      console.error('Error saving manage:', error);
      toast.error('Erro ao salvar alterações');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveInstrumentManage = async () => {
    if (!selectedRegistro || !user || !instrumentFormType) return;
    
    setIsSubmitting(true);
    try {
      // Upsert instrument response
      const { data: existing } = await supabase
        .from('instrument_responses')
        .select('id')
        .eq('registro_acao_id', selectedRegistro.id)
        .eq('form_type', instrumentFormType)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('instrument_responses')
          .update({ responses: instrumentResponses })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('instrument_responses')
          .insert({
            registro_acao_id: selectedRegistro.id,
            form_type: instrumentFormType,
            escola_id: selectedRegistro.escola_id,
            aap_id: user.id,
            responses: instrumentResponses,
          });
        if (error) throw error;
      }

      // Update status to realizada if still pending
      if (selectedRegistro.status === 'agendada' || selectedRegistro.status === 'prevista') {
        await supabase
          .from('registros_acao')
          .update({ status: 'realizada' })
          .eq('id', selectedRegistro.id);
        
        // Sync programacao status
        if (selectedRegistro.programacao_id) {
          await supabase
            .from('programacoes')
            .update({ status: 'realizada' })
            .eq('id', selectedRegistro.programacao_id);
        }
        queryClient.invalidateQueries({ queryKey: ['registros_acao'] });
      }

      toast.success('Instrumento salvo com sucesso!');
      setIsInstrumentManaging(false);
      setSelectedRegistro(null);
      setInstrumentFormType(null);
    } catch (error) {
      console.error('Error saving instrument:', error);
      toast.error('Erro ao salvar instrumento');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedRegistro || !user) return;
    
    setIsSubmitting(true);
    try {
      // Get old values for log
      const oldValues = {
        data: selectedRegistro.data,
        tipo: selectedRegistro.tipo,
        escola_id: selectedRegistro.escola_id,
        segmento: selectedRegistro.segmento,
        ano_serie: selectedRegistro.ano_serie,
        turma: selectedRegistro.turma,
        status: selectedRegistro.status,
        observacoes: selectedRegistro.observacoes,
        avancos: selectedRegistro.avancos,
        dificuldades: selectedRegistro.dificuldades,
      };
      
      const newValues = {
        data: editData,
        tipo: editTipo,
        escola_id: editEscolaId,
        segmento: editSegmento,
        ano_serie: editAnoSerie,
        turma: editTurma || null,
        status: editStatus,
        observacoes: editObservacoes || null,
        avancos: editAvancos || null,
        dificuldades: editDificuldades || null,
      };
      
      // Update registro
      const { error: updateError } = await supabase
        .from('registros_acao')
        .update(newValues)
        .eq('id', selectedRegistro.id);
      
      if (updateError) throw updateError;
      
      // Log the change
      const { error: logError } = await supabase
        .from('registros_alteracoes')
        .insert({
          tabela: 'registros_acao',
          registro_id: selectedRegistro.id,
          usuario_id: user.id,
          alteracao: {
            antes: oldValues,
            depois: newValues,
          },
        });
      
      if (logError) console.error('Error logging change:', logError);
      
      // Sync status change to linked programacao
      const statusChanged = oldValues.status !== newValues.status;
      if (statusChanged && selectedRegistro.programacao_id) {
        const statusMap: Record<string, string> = {
          realizada: 'realizada',
          agendada: 'prevista',
          prevista: 'prevista',
          cancelada: 'cancelada',
          reagendada: 'prevista',
        };
        const mappedStatus = statusMap[newValues.status] || 'prevista';
        const { error: syncError } = await supabase
          .from('programacoes')
          .update({ status: mappedStatus })
          .eq('id', selectedRegistro.programacao_id);
        if (syncError) {
          console.error('Error syncing programacao status:', syncError);
        }
      }

      toast.success('Registro atualizado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['registros_acao'] });
      queryClient.invalidateQueries({ queryKey: ['registros_alteracoes', selectedRegistro.id] });
      queryClient.invalidateQueries({ queryKey: ['programacoes'] });
      setIsEditing(false);
      setSelectedRegistro(null);
    } catch (error) {
      console.error('Error updating registro:', error);
      toast.error('Erro ao atualizar registro');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete registro
  const handleDeleteRegistro = async () => {
    if (!registroToDelete) return;
    
    setIsDeleting(true);
    try {
      // Delete related presencas first
      const { error: presencasDeleteError } = await supabase
        .from('presencas')
        .delete()
        .eq('registro_acao_id', registroToDelete.id);
      
      if (presencasDeleteError) throw presencasDeleteError;
      
      // Delete related avaliacoes_aula
      const { error: avaliacoesDeleteError } = await supabase
        .from('avaliacoes_aula')
        .delete()
        .eq('registro_acao_id', registroToDelete.id);
      
      if (avaliacoesDeleteError) throw avaliacoesDeleteError;
      
      // Delete related registros_alteracoes
      const { error: alteracoesDeleteError } = await supabase
        .from('registros_alteracoes')
        .delete()
        .eq('registro_id', registroToDelete.id);
      
      if (alteracoesDeleteError) throw alteracoesDeleteError;
      
      // Delete related instrument_responses
      await supabase.from('instrument_responses').delete().eq('registro_acao_id', registroToDelete.id);

      // Delete the registro itself
      const { error } = await supabase
        .from('registros_acao')
        .delete()
        .eq('id', registroToDelete.id);
      
      if (error) throw error;

      // Delete linked programacao if exists
      if (registroToDelete.programacao_id) {
        await supabase.from('programacoes').delete().eq('id', registroToDelete.programacao_id);
      }
      
      toast.success('Registro excluído com sucesso!');
      setIsDeleteDialogOpen(false);
      setRegistroToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['registros_acao'] });
      queryClient.invalidateQueries({ queryKey: ['presencas'] });
      queryClient.invalidateQueries({ queryKey: ['avaliacoes_aula'] });
      queryClient.invalidateQueries({ queryKey: ['programacoes'] });
    } catch (error) {
      console.error('Error deleting registro:', error);
      toast.error('Erro ao excluir registro');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle batch delete registros
  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    
    setIsBatchDeleting(true);
    let successCount = 0;
    let errorCount = 0;
    
    // Collect programacao_ids before deleting registros
    const registrosToDelete = registros.filter(r => selectedIds.has(r.id));
    const programacaoIds = registrosToDelete
      .map(r => r.programacao_id)
      .filter((id): id is string => !!id);

    for (const id of selectedIds) {
      try {
        // Delete related presencas
        await supabase.from('presencas').delete().eq('registro_acao_id', id);
        // Delete related avaliacoes_aula
        await supabase.from('avaliacoes_aula').delete().eq('registro_acao_id', id);
        // Delete related instrument_responses
        await supabase.from('instrument_responses').delete().eq('registro_acao_id', id);
        // Delete related registros_alteracoes
        await supabase.from('registros_alteracoes').delete().eq('registro_id', id);
        // Delete the registro itself
        const { error } = await supabase.from('registros_acao').delete().eq('id', id);
        if (error) throw error;
        successCount++;
      } catch (error) {
        console.error(`Error deleting registro ${id}:`, error);
        errorCount++;
      }
    }

    // Delete linked programacoes
    if (programacaoIds.length > 0) {
      await supabase.from('programacoes').delete().in('id', programacaoIds);
    }
    
    if (successCount > 0) {
      toast.success(`${successCount} registro(s) excluído(s) com sucesso!`);
    }
    if (errorCount > 0) {
      toast.error(`${errorCount} registro(s) não puderam ser excluídos.`);
    }
    
    setSelectedIds(new Set());
    setIsBatchDeleting(false);
    setIsBatchDeleteDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ['registros_acao'] });
    queryClient.invalidateQueries({ queryKey: ['presencas'] });
    queryClient.invalidateQueries({ queryKey: ['avaliacoes_aula'] });
    queryClient.invalidateQueries({ queryKey: ['programacoes'] });
  };

  const handleExportExcel = () => {
    const exportData = filteredRegistros.map(registro => ({
      'Data': format(parseISO(registro.data), "dd/MM/yyyy", { locale: ptBR }),
      'Tipo': tipoAcaoLabels[registro.tipo] || registro.tipo,
      'Escola': getEscolaNome(registro.escola_id),
      'AAP': getAapNome(registro.aap_id),
      'Segmento': segmentoLabels[registro.segmento as Segmento] || registro.segmento,
      'Ano/Série': registro.ano_serie,
      'Status': statusLabels[registro.status] || registro.status,
      'Reagendada': registro.is_reagendada ? 'Sim' : 'Não',
      'Data Reagendamento': registro.reagendada_para ? format(parseISO(registro.reagendada_para), "dd/MM/yyyy", { locale: ptBR }) : '',
      'Justificativa': getMotivoCancelamento(registro.programacao_id) || '',
      'Programa': registro.programa?.join(', ') || '',
      'Observações': registro.observacoes || '',
      'Avanços': registro.avancos || '',
      'Dificuldades': registro.dificuldades || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Registros');
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(data, `registros_acoes_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    
    toast.success('Arquivo exportado com sucesso!');
  };

  // Get selected professor data for avaliação
  const selectedProfessorData = selectedProfessorAvaliacao 
    ? professores.find(p => p.id === selectedProfessorAvaliacao)
    : null;

  const selectedAvaliacaoData = selectedProfessorAvaliacao
    ? avaliacaoList.find(a => a.professorId === selectedProfessorAvaliacao)
    : null;

  const presentes = presencaList.filter(p => p.presente).length;
  const totalProfessores = presencaList.length;

  // Batch selection helpers
  const deletableFilteredIds = (isAdmin || isManager)
    ? filteredRegistros.filter(r => canDelete(r)).map(r => r.id)
    : [];
  const allSelected = deletableFilteredIds.length > 0 && deletableFilteredIds.every(id => selectedIds.has(id));
  const someSelected = deletableFilteredIds.some(id => selectedIds.has(id));

  const handleToggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(deletableFilteredIds));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const columns = [
    // Checkbox column for batch selection (Admin/Gestor only)
    ...((isAdmin || isManager) ? [{
      key: 'select',
      header: () => (
        <Checkbox
          checked={allSelected ? true : (someSelected && !allSelected) ? 'indeterminate' : false}
          onCheckedChange={handleToggleSelectAll}
          aria-label="Selecionar todos"
        />
      ),
      className: 'w-10 min-w-[40px]',
      render: (registro: RegistroAcaoDB) => {
        const deletable = canDelete(registro);
        return (
          <Checkbox
            checked={selectedIds.has(registro.id)}
            onCheckedChange={() => handleToggleSelect(registro.id)}
            disabled={!deletable}
            aria-label={`Selecionar registro`}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          />
        );
      },
    }] : []),
    {
      key: 'data',
      header: 'Data',
      className: 'w-24 min-w-[96px]',
      render: (registro: RegistroAcaoDB) => (
        <div className="flex items-center gap-1.5">
          <Calendar size={14} className="text-muted-foreground flex-shrink-0" />
          <span className="text-[10px] whitespace-nowrap">{format(parseISO(registro.data), "dd/MM/yyyy", { locale: ptBR })}</span>
        </div>
      ),
    },
    {
      key: 'tipo',
      header: 'Tipo',
      className: 'w-12 min-w-[48px]',
      render: (registro: RegistroAcaoDB) => {
        const typeInfo = ACAO_TYPE_INFO[normalizeAcaoTipo(registro.tipo)];
        const Icon = typeInfo?.icon || Eye;
        const variant = registro.tipo === 'formacao' ? 'primary' : 
                       registro.tipo === 'acompanhamento_aula' || registro.tipo === 'observacao_aula' ? 'warning' : 'info';
        const label = typeInfo?.label || registro.tipo;
        const formacaoOrigem = registro.formacao_origem_id 
          ? programacoes.find(p => p.id === registro.formacao_origem_id) 
          : null;
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="space-y-0.5">
                <StatusBadge variant={variant} className="flex items-center justify-center p-1.5">
                  <Icon size={14} className="flex-shrink-0" />
                </StatusBadge>
                {formacaoOrigem && (
                  <div className="flex items-center gap-0.5 text-[9px] text-primary">
                    <LinkIcon size={8} />
                  </div>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{label}</p>
              {formacaoOrigem && <p className="text-xs opacity-80">Acompanhamento de: {formacaoOrigem.titulo}</p>}
            </TooltipContent>
          </Tooltip>
        );
      },
    },
    {
      key: 'escola',
      header: 'Escola / Regional / Rede',
      className: 'max-w-[180px]',
      render: (registro: RegistroAcaoDB) => (
        <div className="flex items-center gap-1.5">
          <MapPin size={14} className="text-muted-foreground flex-shrink-0" />
          <span className="text-[10px] leading-tight line-clamp-2">{getEscolaNome(registro.escola_id)}</span>
        </div>
      ),
    },
    {
      key: 'aap',
      header: 'Consultor / Gestor / Formador',
      className: 'max-w-[120px]',
      render: (registro: RegistroAcaoDB) => (
        <div className="flex items-center gap-1.5">
          <User size={14} className="text-muted-foreground flex-shrink-0" />
          <span className="text-[10px] line-clamp-2">{getAapNome(registro.aap_id)}</span>
        </div>
      ),
    },
    {
      key: 'segmento',
      header: 'Segmento',
      className: 'max-w-[100px]',
      render: (registro: RegistroAcaoDB) => (
        <span className="text-[10px] leading-tight line-clamp-2">{segmentoLabels[registro.segmento as Segmento]} - {registro.ano_serie}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      className: 'w-28 min-w-[112px]',
      render: (registro: RegistroAcaoDB) => {
        // Check if action is pending (agendada/reagendada with date > 2 days in past)
        const isPendente = () => {
          if (registro.status !== 'agendada' && registro.status !== 'reagendada') return false;
          const twoDaysAgo = new Date();
          twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
          const registroDate = new Date(registro.data);
          return registroDate <= twoDaysAgo;
        };
        const pendente = isPendente();
        
        const variant = registro.status === 'realizada' ? 'success' : 
                       registro.status === 'cancelada' ? 'error' : 
                       pendente ? 'error' :
                       registro.status === 'reagendada' ? 'warning' : 
                       registro.status === 'agendada' ? 'primary' : 'info';
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1">
              {pendente && (
                <Tooltip>
                  <TooltipTrigger>
                    <Clock size={14} className="text-destructive animate-pulse" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Ação pendente há mais de 2 dias</p>
                  </TooltipContent>
                </Tooltip>
              )}
              <StatusBadge variant={variant} className="text-[10px]">
                {registro.is_reagendada && '🔄 '}
                {pendente ? 'Pendente' : (statusLabels[registro.status] || registro.status)}
              </StatusBadge>
            </div>
            {registro.reagendada_para && (
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                → {format(parseISO(registro.reagendada_para), "dd/MM/yyyy", { locale: ptBR })}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'presenca',
      header: 'Presença/Avaliações',
      className: 'w-32 min-w-[128px]',
      render: (registro: RegistroAcaoDB) => {
        if (registro.tipo === 'acompanhamento_aula') {
          const avaliacoesRegistro = getAvaliacoesForRegistro(registro.id);
          const hasAvaliacoes = avaliacoesRegistro.length > 0;
          return (
            <span className="text-[10px] flex items-center gap-1">
              {hasAvaliacoes ? (
                <>
                  <CheckCircle2 size={14} className="text-success fill-success/20" />
                  <span className="text-success font-medium">{avaliacoesRegistro.length} avaliação(ões)</span>
                </>
              ) : (
                <>
                  <Star size={14} className="text-muted-foreground" />
                  <span className="text-muted-foreground">Pendente</span>
                </>
              )}
            </span>
          );
        }
        const presencasRegistro = getPresencasForRegistro(registro.id);
        const presentes = presencasRegistro.filter(p => p.presente).length;
        const total = presencasRegistro.length;
        
        return (
          <span className="text-[10px]">
            {presentes}/{total} ({total > 0 ? Math.round((presentes/total) * 100) : 0}%)
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: 'Ações',
      className: 'w-36',
      render: (registro: RegistroAcaoDB) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSelectedRegistro(registro)}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Visualizar"
          >
            <Eye size={16} />
          </button>
          {canEdit(registro) && (
            <>
              <button
                onClick={() => handleOpenManage(registro)}
                className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-warning transition-colors"
                title={registro.tipo === 'acompanhamento_aula' ? 'Gerenciar Avaliações' : 'Gerenciar Presenças'}
              >
                {registro.tipo === 'acompanhamento_aula' ? <ClipboardCheck size={16} /> : <Users size={16} />}
              </button>
              <button
                onClick={() => handleOpenEdit(registro)}
                className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                title="Editar Observações"
              >
                <Edit size={16} />
              </button>
              {(isAdmin || isManager) && (
                <button
                  onClick={() => {
                    setRegistroToDelete(registro);
                    setIsDeleteDialogOpen(true);
                  }}
                  className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-destructive transition-colors"
                  title="Excluir Registro"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </>
          )}
        </div>
      ),
    },
  ];

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4" data-tour="reg-header">
        <div>
          <h1 className="page-header">Registros de Ações</h1>
          <p className="page-subtitle">
            {isAdmin 
              ? 'Visualize todos os registros de ações' 
              : isManager 
                ? 'Visualize os registros dos seus programas' 
                : 'Visualize seus registros de ações'}
          </p>
        </div>
        <Button onClick={handleExportExcel} variant="outline" className="flex items-center gap-2" data-tour="reg-export-btn">
          <Download size={18} />
          Exportar Excel
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4" data-tour="reg-filters">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 max-w-md" data-tour="reg-search">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por escola ou AAP..."
              className="input-field pl-11"
            />
          </div>
        </div>
        
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-muted-foreground">Filtros</span>
          <div className="flex flex-wrap gap-2">
            <Select value={programaFilter} onValueChange={(v) => setProgramaFilter(v as ProgramaType | 'todos')}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Programa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Programa</SelectItem>
            {isAdmin ? (
              // Admin vê todos
              <>
                <SelectItem value="escolas">Programa de Escolas</SelectItem>
                <SelectItem value="regionais">Regionais de Ensino</SelectItem>
                <SelectItem value="redes_municipais">Redes Municipais</SelectItem>
              </>
            ) : isAAP ? (
              // AAP só vê seus programas
              aapProgramas.map(prog => (
                <SelectItem key={prog} value={prog}>
                  {prog === 'escolas' ? 'Programa de Escolas' : prog === 'regionais' ? 'Regionais de Ensino' : 'Redes Municipais'}
                </SelectItem>
              ))
            ) : isManager ? (
              // Gestor/Coordenador só vê seus programas
              gestorProgramas.map(prog => (
                <SelectItem key={prog} value={prog}>
                  {prog === 'escolas' ? 'Programa de Escolas' : prog === 'regionais' ? 'Regionais de Ensino' : 'Redes Municipais'}
                </SelectItem>
              ))
            ) : (
              // Outros perfis
              <>
                <SelectItem value="escolas">Programa de Escolas</SelectItem>
                <SelectItem value="regionais">Regionais de Ensino</SelectItem>
                <SelectItem value="redes_municipais">Redes Municipais</SelectItem>
              </>
            )}
          </SelectContent>
        </Select>
        
            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Tipos</SelectItem>
                {ACAO_TIPOS.map(tipo => (
                  <SelectItem key={tipo} value={tipo}>{ACAO_TYPE_INFO[tipo].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={filterStatus} onValueChange={(value) => {
              setFilterStatus(value);
              // Clear URL param when filter changes
              if (searchParams.has('status')) {
                searchParams.delete('status');
                setSearchParams(searchParams);
              }
            }}>
              <SelectTrigger className="w-[180px]" data-tour="reg-status-filter">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Status</SelectItem>
                <SelectItem value="pendentes">Pendentes</SelectItem>
                <SelectItem value="agendada">Agendada</SelectItem>
                <SelectItem value="realizada">Realizada</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
                <SelectItem value="reagendada">Reagendada</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Ano</SelectItem>
                {years.map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={filterMonth} onValueChange={setFilterMonth}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Mês" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Mês</SelectItem>
                {months.map(month => (
                  <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {registros.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-xl border border-border">
          <Calendar size={48} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum registro encontrado</h3>
          <p className="text-muted-foreground">Os registros de ações aparecerão aqui após serem criados.</p>
        </div>
      ) : (
        <div data-tour="reg-table">
          {/* Batch Action Bar */}
          {(isAdmin || isManager) && selectedIds.size > 0 && (
            <div className="flex items-center justify-between gap-4 p-3 mb-3 rounded-lg bg-primary/10 border border-primary/20">
              <span className="text-sm font-medium">
                {selectedIds.size} registro(s) selecionado(s)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedIds(new Set())}
                >
                  Limpar seleção
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setIsBatchDeleteDialogOpen(true)}
                  disabled={isBatchDeleting}
                >
                  {isBatchDeleting ? <Loader2 className="animate-spin mr-2" size={14} /> : <Trash2 size={14} className="mr-2" />}
                  Excluir selecionados
                </Button>
              </div>
            </div>
          )}
          <DataTable
            data={filteredRegistros}
            columns={columns}
            keyExtractor={(registro) => registro.id}
            emptyMessage="Nenhum registro encontrado"
          />
        </div>
      )}

      {/* Detail Modal */}
      <Dialog open={!!selectedRegistro && !isEditing && !isManaging} onOpenChange={() => setSelectedRegistro(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Detalhes do Registro</span>
              {selectedRegistro && alteracoes.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setShowHistoryDialog(true)}>
                  <History size={16} className="mr-2" />
                  Histórico ({alteracoes.length})
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {selectedRegistro && (
            <div className="space-y-6 mt-4">
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  <p className="font-medium">
                    {tipoAcaoLabels[selectedRegistro.tipo] || selectedRegistro.tipo}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Data</p>
                  <p className="font-medium">
                    {format(parseISO(selectedRegistro.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Escola</p>
                  <p className="font-medium">
                    {getEscolaNome(selectedRegistro.escola_id)}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">AAP</p>
                  <p className="font-medium">
                    {getAapNome(selectedRegistro.aap_id)}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Segmento</p>
                  <p className="font-medium">{segmentoLabels[selectedRegistro.segmento as Segmento]}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Ano/Série</p>
                  <p className="font-medium">{selectedRegistro.ano_serie}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 col-span-2">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div className="flex items-center gap-2 mt-1">
                    {(() => {
                      const isPendente = () => {
                        if (selectedRegistro.status !== 'agendada' && selectedRegistro.status !== 'reagendada') return false;
                        const twoDaysAgo = new Date();
                        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
                        const registroDate = new Date(selectedRegistro.data);
                        return registroDate <= twoDaysAgo;
                      };
                      const pendente = isPendente();
                      
                      return (
                        <>
                          {pendente && (
                            <Clock size={16} className="text-destructive animate-pulse" />
                          )}
                          <StatusBadge 
                            variant={
                              selectedRegistro.status === 'realizada' ? 'success' : 
                              selectedRegistro.status === 'cancelada' ? 'error' : 
                              pendente ? 'error' :
                              selectedRegistro.status === 'reagendada' ? 'warning' : 
                              selectedRegistro.status === 'agendada' ? 'primary' : 'info'
                            }
                          >
                            {selectedRegistro.is_reagendada && '🔄 '}
                            {pendente ? 'Pendente' : (statusLabels[selectedRegistro.status] || selectedRegistro.status)}
                          </StatusBadge>
                          {pendente && (
                            <span className="text-xs text-destructive font-medium">
                              Atrasada há mais de 2 dias
                            </span>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Cancelamento/Reagendamento Info */}
              {(selectedRegistro.status === 'cancelada' || selectedRegistro.status === 'reagendada') && (
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 space-y-3">
                  <div className="flex items-center gap-2 text-destructive">
                    <XCircle size={18} />
                    <h4 className="font-medium">Informações do Cancelamento</h4>
                  </div>
                  
                  {getMotivoCancelamento(selectedRegistro.programacao_id) && (
                    <div>
                      <p className="text-sm text-muted-foreground">Justificativa:</p>
                      <p className="text-sm mt-1">{getMotivoCancelamento(selectedRegistro.programacao_id)}</p>
                    </div>
                  )}
                  
                  {selectedRegistro.is_reagendada && selectedRegistro.reagendada_para ? (
                    <div className="flex items-center gap-2 p-3 bg-warning/10 rounded-lg border border-warning/20">
                      <CalendarClock size={18} className="text-warning" />
                      <div>
                        <p className="text-sm font-medium">Ação Reagendada</p>
                        <p className="text-sm text-muted-foreground">
                          Nova data: {format(parseISO(selectedRegistro.reagendada_para), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border border-border">
                      <XCircle size={18} className="text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Sem reagendamento</p>
                    </div>
                  )}
                </div>
              )}

              {/* Avaliações de Aula */}
              {selectedRegistro.tipo === 'acompanhamento_aula' && (
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Star size={18} className="text-warning" />
                    Avaliações de Acompanhamento de Aula
                  </h4>
                  <div className="space-y-4">
                    {getAvaliacoesForRegistro(selectedRegistro.id).map(avaliacao => (
                      <div key={avaliacao.id} className="border border-border rounded-lg p-4">
                        <div className="font-semibold text-base mb-3 text-foreground">{getProfessorNome(avaliacao.professor_id)}</div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                          {dimensoesAvaliacao.map(dim => (
                            <div key={dim.key} className="flex justify-between">
                              <span className="text-muted-foreground">{dim.label}:</span>
                              <span className="font-medium">
                                {avaliacao[dim.key as keyof typeof avaliacao]} - {notaAvaliacaoLabels[avaliacao[dim.key as keyof typeof avaliacao] as NotaAvaliacao]}
                              </span>
                            </div>
                          ))}
                        </div>
                        {avaliacao.observacoes && (
                          <p className="mt-3 text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                            {avaliacao.observacoes}
                          </p>
                        )}
                      </div>
                    ))}
                    {getAvaliacoesForRegistro(selectedRegistro.id).length === 0 && (
                      <p className="text-center text-muted-foreground py-4">
                        Nenhuma avaliação registrada
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Presence List */}
              {selectedRegistro.tipo !== 'acompanhamento_aula' && (
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <User size={18} className="text-primary" />
                    Lista de Presença
                  </h4>
                  <div className="border border-border rounded-lg overflow-hidden">
                    {getPresencasForRegistro(selectedRegistro.id).map(presenca => (
                      <div 
                        key={presenca.id}
                        className="flex items-center justify-between p-3 border-b border-border last:border-0"
                      >
                        <span className="text-sm">{getProfessorNome(presenca.professor_id)}</span>
                        <StatusBadge variant={presenca.presente ? 'success' : 'error'}>
                          {presenca.presente ? 'Presente' : 'Ausente'}
                        </StatusBadge>
                      </div>
                    ))}
                    {getPresencasForRegistro(selectedRegistro.id).length === 0 && (
                      <p className="p-4 text-center text-muted-foreground">
                        Nenhuma presença registrada
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Observations */}
              {selectedRegistro.observacoes && (
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <MessageSquare size={18} className="text-primary" />
                    Observações
                  </h4>
                  <p className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg">
                    {selectedRegistro.observacoes}
                  </p>
                </div>
              )}

              {/* Advances */}
              {selectedRegistro.avancos && (
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <TrendingUp size={18} className="text-success" />
                    Avanços
                  </h4>
                  <p className="text-sm text-muted-foreground p-4 bg-success/10 rounded-lg">
                    {selectedRegistro.avancos}
                  </p>
                </div>
              )}

              {/* Difficulties */}
              {selectedRegistro.dificuldades && (
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <AlertCircle size={18} className="text-warning" />
                    Dificuldades
                  </h4>
                  <p className="text-sm text-muted-foreground p-4 bg-warning/10 rounded-lg">
                    {selectedRegistro.dificuldades}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Manage Presença Modal */}
      <Dialog open={isManaging && selectedRegistro?.tipo !== 'acompanhamento_aula'} onOpenChange={(open) => { if (!open) { setIsManaging(false); setSelectedRegistro(null); } }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users size={20} className="text-primary" />
              Gerenciar Presenças
            </DialogTitle>
          </DialogHeader>
          
          {selectedRegistro && (
            <div className="space-y-6 mt-4">
              {/* Action Info */}
              <div className="p-4 rounded-xl bg-muted/50 space-y-2">
                <div className="flex items-center gap-2">
                  <StatusBadge variant={selectedRegistro.tipo === 'formacao' ? 'primary' : 'info'}>
                    {tipoAcaoLabels[selectedRegistro.tipo] || selectedRegistro.tipo}
                  </StatusBadge>
                </div>
                {selectedRegistro.formacao_origem_id && (() => {
                  const formacaoOrigem = programacoes.find(p => p.id === selectedRegistro.formacao_origem_id);
                  return formacaoOrigem ? (
                    <div className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-md flex items-center gap-1.5">
                      <LinkIcon size={12} />
                      <span>Acompanhamento de: <strong>{formacaoOrigem.titulo}</strong></span>
                    </div>
                  ) : null;
                })()}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span>{format(parseISO(selectedRegistro.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                  <span>•</span>
                  <span>{getEscolaNome(selectedRegistro.escola_id)}</span>
                  <span>•</span>
                  <span>{segmentoLabels[selectedRegistro.segmento as Segmento]} - {selectedRegistro.ano_serie}</span>
                </div>
              </div>

              {/* Presence List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Users size={18} className="text-primary" />
                    Lista de Presença ({presentes}/{totalProfessores})
                  </h4>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleMarcarTodos(true)}>
                      <Check size={14} className="mr-1" />
                      Marcar todos
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleMarcarTodos(false)}>
                      <X size={14} className="mr-1" />
                      Desmarcar todos
                    </Button>
                  </div>
                </div>
                
                {presencaList.length === 0 ? (
                  <p className="text-center py-4 text-muted-foreground">
                    Nenhum professor encontrado para este segmento
                  </p>
                ) : (
                  <div className="border border-border rounded-lg divide-y divide-border max-h-60 overflow-y-auto">
                    {presencaList.map(item => {
                      const professor = professores.find(p => p.id === item.professorId);
                      return (
                        <div 
                          key={item.professorId}
                          className="flex items-center justify-between p-3 hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={item.presente}
                              onCheckedChange={() => handleTogglePresenca(item.professorId)}
                            />
                            <div>
                              <span className="font-medium">{professor?.nome}</span>
                              <span className="text-sm text-muted-foreground ml-2">
                                ({cargoLabels[professor?.cargo || ''] || professor?.cargo} - {componenteLabels[professor?.componente as ComponenteCurricular] || professor?.componente})
                              </span>
                            </div>
                          </div>
                          <StatusBadge variant={item.presente ? 'success' : 'default'}>
                            {item.presente ? 'Presente' : 'Ausente'}
                          </StatusBadge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => { setIsManaging(false); setSelectedRegistro(null); }}>
              Cancelar
            </Button>
            <Button onClick={handleSaveManage} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
              Salvar Presenças
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Avaliação Modal */}
      <Dialog open={isManaging && selectedRegistro?.tipo === 'acompanhamento_aula'} onOpenChange={(open) => { if (!open) { setIsManaging(false); setSelectedRegistro(null); } }}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardCheck size={20} className="text-warning" />
              Gerenciar Avaliações de Aula
            </DialogTitle>
          </DialogHeader>
          
          {selectedRegistro && (
            <div className="space-y-6 mt-4">
              {/* Action Info */}
              <div className="p-4 rounded-xl bg-warning/10 border border-warning/30 space-y-2">
                <div className="flex items-center gap-2">
                  <StatusBadge variant="warning">Acompanhamento de Aula</StatusBadge>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span>{format(parseISO(selectedRegistro.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                  <span>•</span>
                  <span>{getEscolaNome(selectedRegistro.escola_id)}</span>
                  <span>•</span>
                  <span>{segmentoLabels[selectedRegistro.segmento as Segmento]} - {selectedRegistro.ano_serie}</span>
                </div>
              </div>

              {/* Evaluation Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Professor List */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Users size={18} className="text-primary" />
                    Professores/Coordenadores ({avaliacaoList.length})
                  </h4>
                  <div className="border border-border rounded-lg divide-y divide-border max-h-80 overflow-y-auto">
                    {avaliacaoList.length === 0 ? (
                      <p className="p-4 text-center text-muted-foreground">Nenhum professor encontrado</p>
                    ) : (
                      avaliacaoList.map(item => {
                        const professor = professores.find(p => p.id === item.professorId);
                        const isSelected = selectedProfessorAvaliacao === item.professorId;
                        
                        return (
                          <button
                            key={item.professorId}
                            onClick={() => setSelectedProfessorAvaliacao(item.professorId)}
                            className={`w-full flex items-center justify-between p-3 text-left transition-colors ${
                              isSelected ? 'bg-primary/10' : 'hover:bg-muted/30'
                            }`}
                          >
                            <div>
                              <span className="font-medium">{professor?.nome}</span>
                              <span className="text-sm text-muted-foreground block">
                                {cargoLabels[professor?.cargo || ''] || professor?.cargo}
                              </span>
                            </div>
                            <ChevronRight size={16} className={isSelected ? 'text-primary' : 'text-muted-foreground'} />
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Evaluation Form */}
                <div>
                  {selectedProfessorData && selectedAvaliacaoData ? (
                    <div className="space-y-4">
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <h4 className="font-medium">{selectedProfessorData.nome}</h4>
                        <p className="text-sm text-muted-foreground">
                          {cargoLabels[selectedProfessorData.cargo] || selectedProfessorData.cargo} - {componenteLabels[selectedProfessorData.componente as ComponenteCurricular] || selectedProfessorData.componente}
                        </p>
                      </div>

                      {/* Legenda de Pontuação */}
                      <div className="p-3 bg-muted/30 rounded-lg border border-border">
                        <h5 className="font-semibold text-sm mb-2">Pontuação:</h5>
                        <div className="space-y-1">
                          {pontuacaoLegenda.map(item => (
                            <div key={item.nota} className="flex items-start gap-1">
                              <span className="font-bold text-sm">{item.nota} = {item.titulo}</span>
                              <span className="text-[11px] text-muted-foreground">({item.descricao})</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-border pt-4">
                        <h5 className="font-semibold text-sm mb-3">Itens observados:</h5>
                        {dimensoesAvaliacao.map(dimensao => (
                          <div key={dimensao.key} className="space-y-2 mb-4">
                            <div>
                              <label className="block text-sm font-medium">{dimensao.label}</label>
                              <span className="text-[11px] text-muted-foreground">({dimensao.description})</span>
                            </div>
                            <div className="flex gap-2">
                              {([1, 2, 3, 4, 5] as NotaAvaliacao[]).map(nota => (
                                <button
                                  key={nota}
                                  type="button"
                                  onClick={() => handleUpdateAvaliacao(selectedProfessorAvaliacao!, dimensao.key, nota)}
                                  className={`flex-1 py-2 rounded-lg border-2 font-medium transition-all flex items-center justify-center gap-1 ${
                                    selectedAvaliacaoData[dimensao.key] === nota
                                      ? 'border-warning bg-warning/20 text-warning'
                                      : 'border-border hover:border-muted-foreground'
                                  }`}
                                >
                                  <Star size={14} className={selectedAvaliacaoData[dimensao.key] >= nota ? 'fill-current' : ''} />
                                  {nota}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Observações</label>
                        <Textarea
                          value={selectedAvaliacaoData.observacoes}
                          onChange={(e) => handleUpdateAvaliacao(selectedProfessorAvaliacao!, 'observacoes', e.target.value)}
                          placeholder="Observações sobre este professor..."
                          rows={3}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <p>Selecione um professor para avaliar</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => { setIsManaging(false); setSelectedRegistro(null); }}>
              Cancelar
            </Button>
            <Button onClick={handleSaveManage} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
              Salvar Avaliações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditing} onOpenChange={(open) => { if (!open) setIsEditing(false); }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Registro — {ACAO_TYPE_INFO[editTipo as AcaoTipo]?.label || editTipo}</DialogTitle>
          </DialogHeader>
          
          {(() => {
            const formConfig = ACAO_FORM_CONFIG[editTipo as AcaoTipo];
            const showSegmento = formConfig?.showSegmento ?? true;
            const showComponente = formConfig?.showComponente ?? true;
            const showAnoSerie = formConfig?.showAnoSerie ?? true;
            // Show avanços/dificuldades only for traditional types with segmento
            const showAvancoDificuldade = showSegmento;
            
            return (
              <div className="space-y-4 mt-4">
                {/* Row 1: Data and Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Data</label>
                    <input
                      type="date"
                      value={editData}
                      onChange={(e) => setEditData(e.target.value)}
                      className="input-field"
                    />
                  </div>
                  
                  <div>
                    <label className="form-label">Status</label>
                    <Select value={editStatus} onValueChange={setEditStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="prevista">Prevista</SelectItem>
                        <SelectItem value="realizada">Realizada</SelectItem>
                        <SelectItem value="cancelada">Cancelada</SelectItem>
                        <SelectItem value="reagendada">Reagendada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Row 2: Tipo and Escola */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Tipo</label>
                    <Select value={editTipo} onValueChange={setEditTipo}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {ACAO_TIPOS.map(tipo => (
                          <SelectItem key={tipo} value={tipo}>{ACAO_TYPE_INFO[tipo].label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="form-label">Escola / Regional / Rede</label>
                    <Select value={editEscolaId} onValueChange={setEditEscolaId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a escola" />
                      </SelectTrigger>
                      <SelectContent>
                        {escolas.map(escola => (
                          <SelectItem key={escola.id} value={escola.id}>{escola.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Row 3: Segmento and Ano/Série - conditional */}
                {(showSegmento || showAnoSerie) && (
                  <div className="grid grid-cols-2 gap-4">
                    {showSegmento && (
                      <div>
                        <label className="form-label">Segmento</label>
                        <Select value={editSegmento} onValueChange={setEditSegmento}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o segmento" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(segmentoLabels).map(([key, label]) => (
                              <SelectItem key={key} value={key}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    
                    {showAnoSerie && (
                      <div>
                        <label className="form-label">Ano/Série</label>
                        <input
                          type="text"
                          value={editAnoSerie}
                          onChange={(e) => setEditAnoSerie(e.target.value)}
                          placeholder="Ex: 1º Ano, 5º Ano..."
                          className="input-field"
                        />
                      </div>
                    )}
                  </div>
                )}
                
                {/* Row 4: Turma - conditional */}
                {showSegmento && (
                  <div>
                    <label className="form-label">Turma (opcional)</label>
                    <input
                      type="text"
                      value={editTurma}
                      onChange={(e) => setEditTurma(e.target.value)}
                      placeholder="Ex: A, B, C..."
                      className="input-field"
                    />
                  </div>
                )}
                
                {/* Observações */}
                <div>
                  <label className="form-label">Observações</label>
                  <Textarea
                    value={editObservacoes}
                    onChange={(e) => setEditObservacoes(e.target.value)}
                    placeholder="Observações gerais..."
                    rows={3}
                  />
                </div>
                
                {/* Avanços - conditional */}
                {showAvancoDificuldade && (
                  <div>
                    <label className="form-label">Avanços</label>
                    <Textarea
                      value={editAvancos}
                      onChange={(e) => setEditAvancos(e.target.value)}
                      placeholder="Principais avanços observados..."
                      rows={3}
                    />
                  </div>
                )}
                
                {/* Dificuldades - conditional */}
                {showAvancoDificuldade && (
                  <div>
                    <label className="form-label">Dificuldades</label>
                    <Textarea
                      value={editDificuldades}
                      onChange={(e) => setEditDificuldades(e.target.value)}
                      placeholder="Dificuldades encontradas..."
                      rows={3}
                    />
                  </div>
                )}
              </div>
            );
          })()}
          
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Modal */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History size={20} />
              Histórico de Alterações
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {alteracoes.map((alt) => (
              <div key={alt.id} className="border border-border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <span className="font-medium text-sm">{getAapNome(alt.usuario_id)}</span>
                  <span className="text-xs text-muted-foreground">
                    {format(parseISO(alt.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </span>
                </div>
                <div className="text-sm space-y-2">
                  {alt.alteracao.antes && alt.alteracao.depois && (
                    <>
                      {Object.keys(alt.alteracao.depois).map((campo) => {
                        const antes = alt.alteracao.antes[campo];
                        const depois = alt.alteracao.depois[campo];
                        if (antes === depois) return null;
                        return (
                          <div key={campo} className="bg-muted/50 p-2 rounded">
                            <span className="font-medium capitalize">{campo.replace('_', ' ')}:</span>
                            <div className="text-xs mt-1">
                              <span className="text-destructive line-through">{antes || '(vazio)'}</span>
                              <span className="mx-2">→</span>
                              <span className="text-success">{depois || '(vazio)'}</span>
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
              </div>
            ))}
            {alteracoes.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                Nenhuma alteração registrada
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este registro de ação?
              {registroToDelete && (
                <div className="mt-2 p-3 rounded-lg bg-muted text-foreground">
                  <p className="font-medium">{tipoAcaoLabels[registroToDelete.tipo] || registroToDelete.tipo}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(parseISO(registroToDelete.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    {' - '}
                    {getEscolaNome(registroToDelete.escola_id)}
                  </p>
                </div>
              )}
              <p className="mt-2 text-sm text-destructive">
                Esta ação não pode ser desfeita. Presenças, avaliações e alterações vinculadas também serão excluídas.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRegistro}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="animate-spin" size={16} /> : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Realização Dialog */}
      <AlertDialog open={showConfirmRealizacao} onOpenChange={(open) => { if (!open) { setShowConfirmRealizacao(false); setSelectedRegistro(null); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ClipboardCheck size={20} className="text-warning" />
              Confirmar Realização
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedRegistro && (
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                    <p className="font-medium text-foreground">Acompanhamento de Aula</p>
                    <p className="text-sm text-muted-foreground">
                      {format(parseISO(selectedRegistro.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      {' • '}
                      {getEscolaNome(selectedRegistro.escola_id)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {segmentoLabels[selectedRegistro.segmento as Segmento]} - {selectedRegistro.ano_serie}
                    </p>
                  </div>
                  <p className="text-center font-medium text-foreground">
                    A visita de acompanhamento foi realizada?
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel onClick={() => handleConfirmRealizacao(false)} className="flex items-center gap-2">
              <X size={16} />
              Não foi realizada
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => handleConfirmRealizacao(true)} className="flex items-center gap-2 bg-success text-success-foreground hover:bg-success/90">
              <Check size={16} />
              Sim, foi realizada
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Batch Delete Confirmation Dialog */}
      <AlertDialog open={isBatchDeleteDialogOpen} onOpenChange={setIsBatchDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão em Lote</AlertDialogTitle>
            <AlertDialogDescription>
              <p>Tem certeza que deseja excluir <strong>{selectedIds.size}</strong> registro(s) de ação?</p>
              <p className="mt-2 text-sm text-destructive">
                Esta ação não pode ser desfeita. Presenças, avaliações, respostas de instrumentos e alterações vinculadas também serão excluídas.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBatchDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBatchDelete}
              disabled={isBatchDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isBatchDeleting ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={16} />
                  Excluindo...
                </>
              ) : (
                `Excluir ${selectedIds.size} registro(s)`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
