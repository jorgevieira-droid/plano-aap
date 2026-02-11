import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, CheckCircle2, XCircle, AlertCircle, CalendarPlus, Edit, Loader2, Upload, Trash2, Star, User, GraduationCap, Eye, ClipboardList, LinkIcon } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { segmentoLabels, componenteLabels, anoSerieOptions, tipoAcaoLabels, cargoLabels } from '@/data/mockData';
import { StatusAcao, Segmento, ComponenteCurricular, NotaAvaliacao, notaAvaliacaoLabels } from '@/types';
import { getCreatableAcoes, ACAO_TYPE_INFO, AcaoTipo, getAcaoLabel } from '@/config/acaoPermissions';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
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
import { ProgramacaoUploadDialog, ParsedProgramacao } from '@/components/forms/ProgramacaoUploadDialog';

type ProgramaType = 'escolas' | 'regionais' | 'redes_municipais';

const programaLabels: Record<ProgramaType, string> = {
  escolas: 'Escolas',
  regionais: 'Regionais',
  redes_municipais: 'Redes Mun.',
};

// Mapeamento de papel AAP para segmento e componente
const getAAPSegmentoComponente = (role: string | undefined) => {
  switch (role) {
    case 'aap_inicial':
      return { segmentos: ['anos_iniciais'], componentes: ['polivalente'] };
    case 'aap_portugues':
      return { segmentos: ['anos_finais', 'ensino_medio'], componentes: ['lingua_portuguesa'] };
    case 'aap_matematica':
      return { segmentos: ['anos_finais', 'ensino_medio'], componentes: ['matematica'] };
    default:
      return { segmentos: Object.keys(segmentoLabels), componentes: Object.keys(componenteLabels) };
  }
};

interface Escola {
  id: string;
  nome: string;
  codesc?: string;
}

interface AAPFormador {
  id: string;
  nome: string;
  role: string;
  programas: ProgramaType[];
  escolasIds: string[];
}

interface ProgramacaoDB {
  id: string;
  tipo: string;
  titulo: string;
  descricao: string | null;
  data: string;
  horario_inicio: string;
  horario_fim: string;
  escola_id: string;
  aap_id: string;
  segmento: string;
  componente: string;
  ano_serie: string;
  status: string;
  motivo_cancelamento: string | null;
  programa: string[] | null;
  tags: string[] | null;
  created_at: string;
}

interface ProfessorDB {
  id: string;
  nome: string;
  escola_id: string;
  segmento: string;
  componente: string;
  ano_serie: string;
  cargo: string;
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
  { key: 'clareza_objetivos', label: 'Intencionalidade pedagógica', description: 'Objetivo de aprendizagem claro e comunicado aos estudantes' },
  { key: 'dominio_conteudo', label: 'Estratégias didáticas', description: 'Estratégias adequadas ao objetivo da aula' },
  { key: 'estrategias_didaticas', label: 'Mediação docente', description: 'Intervenções que apoiam a compreensão' },
  { key: 'engajamento_turma', label: 'Engajamento dos estudantes', description: 'Participação ativa da maioria da turma' },
  { key: 'gestao_tempo', label: 'Avaliação durante a aula', description: 'Verificação de compreensão dos estudantes' },
] as const;

const pontuacaoLegenda = [
  { nota: 1, titulo: 'Não observado' },
  { nota: 2, titulo: 'Inicial' },
  { nota: 3, titulo: 'Parcial' },
  { nota: 4, titulo: 'Adequado' },
  { nota: 5, titulo: 'Consistente' },
];

export default function ProgramacaoPage() {
  const { user, isAdminOrGestor, isAdmin, isGestor, isAAP, profile } = useAuth();
  const queryClient = useQueryClient();
  const [programacoes, setProgramacoes] = useState<ProgramacaoDB[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [isLoading, setIsLoading] = useState(true);
  
  // Filter states
  const [programaFilter, setProgramaFilter] = useState<ProgramaType | 'todos'>('todos');
  const [tipoFilter, setTipoFilter] = useState<string>('todos');
  
  // Estados para dados do banco
  const [escolas, setEscolas] = useState<Escola[]>([]);
  const [aaps, setAaps] = useState<AAPFormador[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  // Programas do gestor ou AAP (se for gestor ou AAP)
  const [gestorProgramas, setGestorProgramas] = useState<ProgramaType[]>([]);
  const [aapProgramas, setAapProgramas] = useState<ProgramaType[]>([]);
  const [aapEscolasIds, setAapEscolasIds] = useState<string[]>([]);
  
  // Estado para gerenciamento de ação
  const [selectedProgramacao, setSelectedProgramacao] = useState<ProgramacaoDB | null>(null);
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [acaoRealizada, setAcaoRealizada] = useState<boolean | null>(null);
  const [motivoCancelamento, setMotivoCancelamento] = useState('');
  const [reagendar, setReagendar] = useState(false);
  const [novaData, setNovaData] = useState('');
  const [novoHorarioInicio, setNovoHorarioInicio] = useState('');
  const [novoHorarioFim, setNovoHorarioFim] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estados para exclusão
  const [programacaoToDelete, setProgramacaoToDelete] = useState<ProgramacaoDB | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Estados para avaliação de acompanhamento de aula
  const [isAvaliacaoDialogOpen, setIsAvaliacaoDialogOpen] = useState(false);
  const [professoresAvaliacao, setProfessoresAvaliacao] = useState<ProfessorDB[]>([]);
  const [avaliacaoList, setAvaliacaoList] = useState<AvaliacaoAulaItem[]>([]);
  const [selectedProfessorAvaliacao, setSelectedProfessorAvaliacao] = useState<string | null>(null);
  const [turma, setTurma] = useState('');
  const [observacoesAcompanhamento, setObservacoesAcompanhamento] = useState('');
  const [isLoadingProfessores, setIsLoadingProfessores] = useState(false);
  
  // Estados para presença de formação
  const [isPresencaDialogOpen, setIsPresencaDialogOpen] = useState(false);
  const [professoresPresenca, setProfessoresPresenca] = useState<ProfessorDB[]>([]);
  const [presencaList, setPresencaList] = useState<{ professorId: string; presente: boolean }[]>([]);
  const [observacoesFormacao, setObservacoesFormacao] = useState('');
  const [avancosFormacao, setAvancosFormacao] = useState('');
  const [dificuldadesFormacao, setDificuldadesFormacao] = useState('');
  
  const creatableAcoes = useMemo(() => {
    const role = profile?.role as import('@/contexts/AuthContext').AppRole | undefined;
    return getCreatableAcoes(role);
  }, [profile?.role]);

  // Estado para criar acompanhamento a partir de uma formação
  const [formacaoOrigemId, setFormacaoOrigemId] = useState<string | null>(null);

  const [formData, setFormData] = useState<{
    tipo: string;
    titulo: string;
    descricao: string;
    data: string;
    horarioInicio: string;
    horarioFim: string;
    escolaId: string;
    aapId: string;
    segmento: Segmento | 'todos';
    componente: ComponenteCurricular;
    anoSerie: string;
    programa: ProgramaType[];
    tags: string;
  }>({
    tipo: creatableAcoes.filter(t => t !== 'acompanhamento_formacoes')[0] || 'observacao_aula',
    titulo: '',
    descricao: '',
    data: '',
    horarioInicio: '',
    horarioFim: '',
    escolaId: '',
    aapId: '',
    segmento: 'anos_iniciais',
    componente: 'polivalente',
    anoSerie: '',
    programa: ['escolas'],
    tags: '',
  });

  // Fetch programacoes from database
  const fetchProgramacoes = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('programacoes')
        .select('*')
        .order('data', { ascending: true });
      
      if (error) throw error;
      setProgramacoes(data || []);
    } catch (error) {
      console.error('Error fetching programacoes:', error);
      toast.error('Erro ao carregar programações');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Carregar escolas e AAPs/Formadores do banco
  const fetchData = async () => {
    setIsLoadingData(true);
    try {
      // Fetch gestor programas if user is gestor
      let userGestorProgramas: ProgramaType[] = [];
      let userAapProgramas: ProgramaType[] = [];
      let userAapEscolasIds: string[] = [];
      
      if (isGestor && user) {
        const { data: gestorProgramasData } = await supabase
          .from('gestor_programas')
          .select('programa')
          .eq('gestor_user_id', user.id);
        
        userGestorProgramas = (gestorProgramasData || []).map(gp => gp.programa as ProgramaType);
        setGestorProgramas(userGestorProgramas);
        
        // Set default programa for form if gestor has only one programa
        if (userGestorProgramas.length === 1) {
          setFormData(prev => ({ ...prev, programa: [userGestorProgramas[0]] }));
          setProgramaFilter(userGestorProgramas[0]);
        } else if (userGestorProgramas.length > 1) {
          // Se tiver mais de um programa, ainda assim filtra pelo primeiro por padrão
          setProgramaFilter(userGestorProgramas[0]);
        }
      }
      
      // Fetch AAP programas and escolas if user is AAP
      if (isAAP && user) {
        const [aapProgramasRes, aapEscolasRes] = await Promise.all([
          supabase.from('aap_programas').select('programa').eq('aap_user_id', user.id),
          supabase.from('aap_escolas').select('escola_id').eq('aap_user_id', user.id),
        ]);
        
        userAapProgramas = (aapProgramasRes.data || []).map(ap => ap.programa as ProgramaType);
        userAapEscolasIds = (aapEscolasRes.data || []).map(ae => ae.escola_id);
        setAapProgramas(userAapProgramas);
        setAapEscolasIds(userAapEscolasIds);
        
        // Set default filter based on AAP programas
        if (userAapProgramas.length === 1) {
          setProgramaFilter(userAapProgramas[0]);
        } else if (userAapProgramas.length > 1) {
          // Se tiver mais de um programa, filtra pelo primeiro por padrão
          setProgramaFilter(userAapProgramas[0]);
        }
        
        // Set default values based on AAP role
        const aapConfig = getAAPSegmentoComponente(profile?.role);
        const defaultSegmento = aapConfig.segmentos[0] as Segmento;
        const defaultComponente = aapConfig.componentes[0] as ComponenteCurricular;
        
        setFormData(prev => ({ 
          ...prev, 
          programa: userAapProgramas.length === 1 ? [userAapProgramas[0]] : prev.programa,
          aapId: user.id,
          segmento: defaultSegmento,
          componente: defaultComponente,
        }));
      }
      
      // Fetch escolas - filter by gestor's programa if applicable
      const { data: escolasData } = await supabase
        .from('escolas')
        .select('id, nome, codesc, programa')
        .eq('ativa', true)
        .order('nome');
      
      // Filter escolas by gestor programa if user is gestor, or by AAP escolas if user is AAP
      let filteredEscolas = escolasData || [];
      if (isGestor && userGestorProgramas.length > 0) {
        filteredEscolas = filteredEscolas.filter(e => 
          e.programa && e.programa.some((p: string) => userGestorProgramas.includes(p as ProgramaType))
        );
      } else if (isAAP && userAapEscolasIds.length > 0) {
        filteredEscolas = filteredEscolas.filter(e => userAapEscolasIds.includes(e.id));
      }
      
      setEscolas(filteredEscolas);
      
      // Fetch AAPs/Formadores (users with aap_ roles) along with their escola assignments
      const [profilesRes, rolesRes, programasRes, aapEscolasRes] = await Promise.all([
        supabase.from('profiles').select('id, nome').order('nome'),
        supabase.from('user_roles').select('user_id, role'),
        supabase.from('aap_programas').select('aap_user_id, programa'),
        supabase.from('aap_escolas').select('aap_user_id, escola_id'),
      ]);
      
      // Filter for aap_ roles
      const aapRoles = (rolesRes.data || []).filter(r => r.role.startsWith('aap_'));
      
      let aapUsers: AAPFormador[] = aapRoles.map(roleData => {
        const profile = profilesRes.data?.find(p => p.id === roleData.user_id);
        const userProgramas = programasRes.data
          ?.filter(p => p.aap_user_id === roleData.user_id)
          .map(p => p.programa as ProgramaType) || [];
        const userEscolas = aapEscolasRes.data
          ?.filter(ae => ae.aap_user_id === roleData.user_id)
          .map(ae => ae.escola_id) || [];
        
        return {
          id: roleData.user_id,
          nome: profile?.nome || 'Sem nome',
          role: roleData.role,
          programas: userProgramas,
          escolasIds: userEscolas,
        };
      });
      
      // Filter AAPs by gestor's programa if user is gestor
      if (isGestor && userGestorProgramas.length > 0) {
        aapUsers = aapUsers.filter(aap => 
          aap.programas.some(p => userGestorProgramas.includes(p))
        );
      }
      
      setAaps(aapUsers);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoadingData(false);
    }
  };
  
  useEffect(() => {
    fetchProgramacoes();
    fetchData();
  }, [isGestor, isAAP, user]);

  // Filter AAPs based on selected escola
  const filteredAaps = useMemo(() => {
    if (!formData.escolaId) return aaps;
    return aaps.filter(aap => aap.escolasIds.includes(formData.escolaId));
  }, [aaps, formData.escolaId]);

  // Filter programacoes based on filters and user permissions
  const filteredProgramacoes = useMemo(() => {
    return programacoes.filter(p => {
      // AAP e Gestor só veem ações dos seus próprios programas
      if (isAAP && aapProgramas.length > 0) {
        if (!p.programa || !p.programa.some(prog => aapProgramas.includes(prog as ProgramaType))) {
          return false;
        }
      }
      if (isGestor && gestorProgramas.length > 0) {
        if (!p.programa || !p.programa.some(prog => gestorProgramas.includes(prog as ProgramaType))) {
          return false;
        }
      }
      
      // Aplicar filtro de programa selecionado
      if (programaFilter !== 'todos') {
        if (!p.programa || !p.programa.includes(programaFilter)) return false;
      }
      if (tipoFilter !== 'todos' && p.tipo !== tipoFilter) return false;
      return true;
    });
  }, [programacoes, programaFilter, tipoFilter, isAAP, isGestor, aapProgramas, gestorProgramas]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { locale: ptBR });
  const calendarEnd = endOfWeek(monthEnd, { locale: ptBR });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getEventsForDay = (date: Date) => {
    return filteredProgramacoes.filter(p => isSameDay(parseISO(p.data), date));
  };

  const selectedDayEvents = selectedDate ? getEventsForDay(selectedDate) : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('Você precisa estar logado para criar uma programação');
      return;
    }

    if (!isAdminOrGestor && !isAAP) {
      toast.error('Você não tem permissão para criar programações');
      return;
    }

    setIsSubmitting(true);

    try {
      // Tipos que não precisam de segmento/componente/ano_serie específico
      const isFormacao = ['formacao', 'acompanhamento_formacoes', 'lista_presenca', 'participa_formacoes'].includes(formData.tipo);
      const segmentoValue = formData.segmento;
      const componenteValue = formData.componente;
      const anoSerieValue = formData.anoSerie || (isFormacao ? 'todos' : '');
      
      // Inserir programação e obter o ID
      const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(Boolean);
      const insertData: any = {
        tipo: formData.tipo,
        titulo: formData.titulo,
        descricao: formData.descricao || null,
        data: formData.data,
        horario_inicio: formData.horarioInicio,
        horario_fim: formData.horarioFim,
        escola_id: formData.escolaId,
        aap_id: formData.aapId,
        segmento: segmentoValue,
        componente: componenteValue,
        ano_serie: anoSerieValue,
        status: 'prevista',
        programa: formData.programa,
        tags: tagsArray.length > 0 ? tagsArray : null,
        created_by: user.id,
      };
      if (formacaoOrigemId) {
        insertData.formacao_origem_id = formacaoOrigemId;
      }
      const { data: newProgramacao, error } = await supabase.from('programacoes').insert(insertData).select().single();
      
      if (error) throw error;
      
      // Criar registro_acao correspondente com status 'agendada'
      const registroInsertData: any = {
        aap_id: formData.aapId,
        ano_serie: anoSerieValue,
        componente: componenteValue,
        data: formData.data,
        escola_id: formData.escolaId,
        programa: formData.programa,
        tags: tagsArray.length > 0 ? tagsArray : null,
        programacao_id: newProgramacao.id,
        segmento: segmentoValue,
        tipo: formData.tipo,
        status: 'agendada',
      };
      if (formacaoOrigemId) {
        registroInsertData.formacao_origem_id = formacaoOrigemId;
      }
      const { error: registroError } = await supabase.from('registros_acao').insert(registroInsertData);
      
      if (registroError) {
        console.error('Error creating registro_acao:', registroError);
      }
      
      toast.success('Ação programada com sucesso!');
      setIsDialogOpen(false);
      setFormacaoOrigemId(null);
      setFormData({
        tipo: creatableAcoes.filter(t => t !== 'acompanhamento_formacoes')[0] || 'observacao_aula',
        titulo: '',
        descricao: '',
        data: '',
        horarioInicio: '',
        horarioFim: '',
        escolaId: '',
        aapId: '',
        segmento: 'anos_iniciais',
        componente: 'polivalente',
        anoSerie: '',
        programa: ['escolas'],
        tags: '',
      });
      fetchProgramacoes();
    } catch (error) {
      console.error('Error creating programacao:', error);
      toast.error('Erro ao criar programação');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler para criar acompanhamento a partir de uma formação realizada
  const handleCreateAcompanhamento = (formacao: ProgramacaoDB) => {
    setFormacaoOrigemId(formacao.id);
    setFormData({
      tipo: 'acompanhamento_formacoes',
      titulo: `Acompanhamento: ${formacao.titulo}`,
      descricao: '',
      data: '',
      horarioInicio: '',
      horarioFim: '',
      escolaId: formacao.escola_id,
      aapId: formacao.aap_id,
      segmento: formacao.segmento as Segmento | 'todos',
      componente: formacao.componente as ComponenteCurricular,
      anoSerie: formacao.ano_serie,
      programa: (formacao.programa || ['escolas']) as ProgramaType[],
      tags: '',
    });
    setIsDialogOpen(true);
  };

  const handleOpenManageDialog = (prog: ProgramacaoDB) => {
    setSelectedProgramacao(prog);
    setAcaoRealizada(null);
    setMotivoCancelamento('');
    setReagendar(false);
    setNovaData('');
    setNovoHorarioInicio('');
    setNovoHorarioFim('');
    setIsManageDialogOpen(true);
  };

  const handleManageSubmit = async () => {
    if (!selectedProgramacao || acaoRealizada === null) return;
    
    if (!acaoRealizada && !motivoCancelamento.trim()) {
      toast.error('Informe o motivo do cancelamento');
      return;
    }
    
    if (reagendar && (!novaData || !novoHorarioInicio || !novoHorarioFim)) {
      toast.error('Preencha os dados do reagendamento');
      return;
    }
    
    // Se for observação de aula e a ação foi realizada, abrir formulário de avaliação
    if ((selectedProgramacao.tipo === 'acompanhamento_aula' || selectedProgramacao.tipo === 'observacao_aula') && acaoRealizada) {
      setIsLoadingProfessores(true);
      try {
        // Buscar professores da mesma escola, segmento, ano/série e componente
        const { data: profs, error } = await supabase
          .from('professores')
          .select('id, nome, escola_id, segmento, componente, ano_serie, cargo')
          .eq('escola_id', selectedProgramacao.escola_id)
          .eq('segmento', selectedProgramacao.segmento)
          .eq('ano_serie', selectedProgramacao.ano_serie)
          .eq('componente', selectedProgramacao.componente)
          .eq('ativo', true)
          .order('nome');
        
        if (error) throw error;
        
        setProfessoresAvaliacao(profs || []);
        
        // Inicializar lista de avaliações
        setAvaliacaoList((profs || []).map(p => ({
          professorId: p.id,
          clareza_objetivos: 3,
          dominio_conteudo: 3,
          estrategias_didaticas: 3,
          engajamento_turma: 3,
          gestao_tempo: 3,
          observacoes: '',
        })));
        
        setSelectedProfessorAvaliacao(null);
        setTurma('');
        setObservacoesAcompanhamento('');
        setIsManageDialogOpen(false);
        setIsAvaliacaoDialogOpen(true);
      } catch (error) {
        console.error('Error fetching professores:', error);
        toast.error('Erro ao carregar professores');
      } finally {
        setIsLoadingProfessores(false);
      }
      return;
    }
    
    // Se for formação e a ação foi realizada, abrir formulário de presença
    if (['formacao', 'acompanhamento_formacoes', 'lista_presenca', 'participa_formacoes'].includes(selectedProgramacao.tipo) && acaoRealizada) {
      setIsLoadingProfessores(true);
      try {
        // Buscar professores da mesma escola e componente, filtrando por segmento e ano/série se não for "todos"
        let query = supabase
          .from('professores')
          .select('id, nome, escola_id, segmento, componente, ano_serie, cargo')
          .eq('escola_id', selectedProgramacao.escola_id)
          .eq('componente', selectedProgramacao.componente)
          .eq('ativo', true);
        
        if (selectedProgramacao.segmento !== 'todos') {
          query = query.eq('segmento', selectedProgramacao.segmento);
        }
        
        if (selectedProgramacao.ano_serie !== 'todos') {
          query = query.eq('ano_serie', selectedProgramacao.ano_serie);
        }
        
        const { data: profs, error } = await query.order('nome');
        
        if (error) throw error;
        
        setProfessoresPresenca(profs || []);
        
        // Inicializar lista de presenças (todos presentes por padrão)
        setPresencaList((profs || []).map(p => ({
          professorId: p.id,
          presente: true,
        })));
        
        setObservacoesFormacao('');
        setAvancosFormacao('');
        setDificuldadesFormacao('');
        setIsManageDialogOpen(false);
        setIsPresencaDialogOpen(true);
      } catch (error) {
        console.error('Error fetching professores:', error);
        toast.error('Erro ao carregar professores');
      } finally {
        setIsLoadingProfessores(false);
      }
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Determine status
      const newStatus = acaoRealizada ? 'realizada' : (reagendar ? 'reagendada' : 'cancelada');
      
      // Update programacao status
      const { error: updateError } = await supabase
        .from('programacoes')
        .update({
          status: newStatus,
          motivo_cancelamento: acaoRealizada ? null : motivoCancelamento,
        })
        .eq('id', selectedProgramacao.id);
      
      if (updateError) throw updateError;
      
      // Update existing registro_acao (created when programacao was created) or create new one
      // First, check if a registro already exists for this programacao
      const { data: existingRegistro } = await supabase
        .from('registros_acao')
        .select('id')
        .eq('programacao_id', selectedProgramacao.id)
        .maybeSingle();
      
      if (existingRegistro) {
        // Update existing registro
        const { error: updateRegistroError } = await supabase
          .from('registros_acao')
          .update({
            status: newStatus,
            is_reagendada: reagendar,
            reagendada_para: reagendar ? novaData : null,
          })
          .eq('id', existingRegistro.id);
        
        if (updateRegistroError) {
          console.error('Error updating registro:', updateRegistroError);
        }
      } else {
        // Create new registro (for backwards compatibility with old programacoes)
        const { error: registroError } = await supabase
          .from('registros_acao')
          .insert({
            aap_id: selectedProgramacao.aap_id,
            ano_serie: selectedProgramacao.ano_serie,
            componente: selectedProgramacao.componente,
            data: selectedProgramacao.data,
            escola_id: selectedProgramacao.escola_id,
            programa: selectedProgramacao.programa,
            programacao_id: selectedProgramacao.id,
            segmento: selectedProgramacao.segmento,
            tipo: selectedProgramacao.tipo,
            status: newStatus,
            is_reagendada: reagendar,
            reagendada_para: reagendar ? novaData : null,
          });
        
        if (registroError) {
          console.error('Error creating registro:', registroError);
        }
      }
      
      // If reagendar, create new programacao and corresponding registro_acao
      if (reagendar && !acaoRealizada) {
        const { data: newProg, error: insertError } = await supabase.from('programacoes').insert({
          tipo: selectedProgramacao.tipo,
          titulo: selectedProgramacao.titulo,
          descricao: selectedProgramacao.descricao,
          data: novaData,
          horario_inicio: novoHorarioInicio,
          horario_fim: novoHorarioFim,
          escola_id: selectedProgramacao.escola_id,
          aap_id: selectedProgramacao.aap_id,
          segmento: selectedProgramacao.segmento,
          componente: selectedProgramacao.componente,
          ano_serie: selectedProgramacao.ano_serie,
          status: 'prevista',
          programa: selectedProgramacao.programa,
          created_by: user?.id,
        }).select().single();
        
        if (insertError) throw insertError;
        
        // Create corresponding registro_acao for the new programacao
        if (newProg) {
          await supabase.from('registros_acao').insert({
            aap_id: selectedProgramacao.aap_id,
            ano_serie: selectedProgramacao.ano_serie,
            componente: selectedProgramacao.componente,
            data: novaData,
            escola_id: selectedProgramacao.escola_id,
            programa: selectedProgramacao.programa,
            programacao_id: newProg.id,
            segmento: selectedProgramacao.segmento,
            tipo: selectedProgramacao.tipo,
            status: 'agendada',
          });
        }
        
        toast.success('Ação cancelada e reagendada com sucesso!', {
          description: `Nova data: ${format(new Date(novaData), "dd/MM/yyyy", { locale: ptBR })}`
        });
      } else if (acaoRealizada) {
        toast.success('Ação marcada como realizada!');
      } else {
        toast.success('Ação marcada como cancelada');
      }
      
      setIsManageDialogOpen(false);
      setSelectedProgramacao(null);
      fetchProgramacoes();
    } catch (error) {
      console.error('Error updating programacao:', error);
      toast.error('Erro ao atualizar programação');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handler para atualizar avaliação de um professor
  const handleUpdateAvaliacao = (professorId: string, dimensao: keyof AvaliacaoAulaItem, valor: NotaAvaliacao | string) => {
    setAvaliacaoList(prev =>
      prev.map(item =>
        item.professorId === professorId
          ? { ...item, [dimensao]: valor }
          : item
      )
    );
  };
  
  // Handler para salvar avaliações de acompanhamento de aula
  const handleSaveAvaliacoes = async () => {
    if (!selectedProgramacao || !user) return;
    
    setIsSubmitting(true);
    
    try {
      // Atualizar status da programação
      const { error: updateProgError } = await supabase
        .from('programacoes')
        .update({ status: 'realizada' })
        .eq('id', selectedProgramacao.id);
      
      if (updateProgError) throw updateProgError;
      
      // Verificar se existe registro_acao
      const { data: existingRegistro } = await supabase
        .from('registros_acao')
        .select('id')
        .eq('programacao_id', selectedProgramacao.id)
        .maybeSingle();
      
      let registroId: string;
      
      if (existingRegistro) {
        // Atualizar registro existente
        const { error: updateRegistroError } = await supabase
          .from('registros_acao')
          .update({
            status: 'realizada',
            turma: turma || null,
            observacoes: observacoesAcompanhamento || null,
          })
          .eq('id', existingRegistro.id);
        
        if (updateRegistroError) throw updateRegistroError;
        registroId = existingRegistro.id;
      } else {
        // Criar novo registro
        const { data: newRegistro, error: insertRegistroError } = await supabase
          .from('registros_acao')
          .insert({
            aap_id: user.id,
            ano_serie: selectedProgramacao.ano_serie,
            componente: selectedProgramacao.componente,
            data: selectedProgramacao.data,
            escola_id: selectedProgramacao.escola_id,
            programa: selectedProgramacao.programa,
            programacao_id: selectedProgramacao.id,
            segmento: selectedProgramacao.segmento,
            tipo: selectedProgramacao.tipo,
            status: 'realizada',
            turma: turma || null,
            observacoes: observacoesAcompanhamento || null,
          })
          .select('id')
          .single();
        
        if (insertRegistroError) throw insertRegistroError;
        registroId = newRegistro.id;
      }
      
      // Inserir avaliações
      const avaliacoesToInsert = avaliacaoList.map(av => ({
        registro_acao_id: registroId,
        professor_id: av.professorId,
        escola_id: selectedProgramacao.escola_id,
        aap_id: user.id,
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
      
      toast.success('Avaliação de acompanhamento salva com sucesso!', {
        description: `${avaliacaoList.length} professor(es) avaliado(s)`
      });
      
      setIsAvaliacaoDialogOpen(false);
      setSelectedProgramacao(null);
      setAvaliacaoList([]);
      setProfessoresAvaliacao([]);
      
      // Invalidar queries para atualizar dados em outras páginas
      queryClient.invalidateQueries({ queryKey: ['registros_acao'] });
      queryClient.invalidateQueries({ queryKey: ['avaliacoes_aula'] });
      queryClient.invalidateQueries({ queryKey: ['programacoes'] });
      
      fetchProgramacoes();
    } catch (error) {
      console.error('Error saving avaliacoes:', error);
      toast.error('Erro ao salvar avaliações');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handler para toggle de presença
  const handleTogglePresenca = (professorId: string) => {
    setPresencaList(prev =>
      prev.map(item =>
        item.professorId === professorId
          ? { ...item, presente: !item.presente }
          : item
      )
    );
  };
  
  // Handler para marcar todos presentes ou ausentes
  const handleMarcarTodosPresenca = (presente: boolean) => {
    setPresencaList(prev => prev.map(item => ({ ...item, presente })));
  };
  
  // Handler para salvar presenças de formação
  const handleSavePresencas = async () => {
    if (!selectedProgramacao || !user) return;
    
    setIsSubmitting(true);
    
    try {
      // Atualizar status da programação
      const { error: updateProgError } = await supabase
        .from('programacoes')
        .update({ status: 'realizada' })
        .eq('id', selectedProgramacao.id);
      
      if (updateProgError) throw updateProgError;
      
      // Verificar se existe registro_acao
      const { data: existingRegistro } = await supabase
        .from('registros_acao')
        .select('id')
        .eq('programacao_id', selectedProgramacao.id)
        .maybeSingle();
      
      let registroId: string;
      
      if (existingRegistro) {
        // Atualizar registro existente
        const { error: updateRegistroError } = await supabase
          .from('registros_acao')
          .update({
            status: 'realizada',
            observacoes: observacoesFormacao || null,
            avancos: avancosFormacao || null,
            dificuldades: dificuldadesFormacao || null,
          })
          .eq('id', existingRegistro.id);
        
        if (updateRegistroError) throw updateRegistroError;
        registroId = existingRegistro.id;
      } else {
        // Criar novo registro
        const { data: newRegistro, error: insertRegistroError } = await supabase
          .from('registros_acao')
          .insert({
            aap_id: user.id,
            ano_serie: selectedProgramacao.ano_serie,
            componente: selectedProgramacao.componente,
            data: selectedProgramacao.data,
            escola_id: selectedProgramacao.escola_id,
            programa: selectedProgramacao.programa,
            programacao_id: selectedProgramacao.id,
            segmento: selectedProgramacao.segmento,
            tipo: selectedProgramacao.tipo,
            status: 'realizada',
            observacoes: observacoesFormacao || null,
            avancos: avancosFormacao || null,
            dificuldades: dificuldadesFormacao || null,
          })
          .select('id')
          .single();
        
        if (insertRegistroError) throw insertRegistroError;
        registroId = newRegistro.id;
      }
      
      // Inserir presenças
      const presencasToInsert = presencaList.map(p => ({
        registro_acao_id: registroId,
        professor_id: p.professorId,
        presente: p.presente,
      }));
      
      const { error: presencasError } = await supabase
        .from('presencas')
        .insert(presencasToInsert);
      
      if (presencasError) throw presencasError;
      
      const presentes = presencaList.filter(p => p.presente).length;
      toast.success('Presenças registradas com sucesso!', {
        description: `${presentes} de ${presencaList.length} professor(es) presente(s)`
      });
      
      setIsPresencaDialogOpen(false);
      setSelectedProgramacao(null);
      setPresencaList([]);
      setProfessoresPresenca([]);
      
      // Invalidar queries para atualizar dados em outras páginas
      queryClient.invalidateQueries({ queryKey: ['registros_acao'] });
      queryClient.invalidateQueries({ queryKey: ['presencas'] });
      queryClient.invalidateQueries({ queryKey: ['programacoes'] });
      
      fetchProgramacoes();
    } catch (error) {
      console.error('Error saving presencas:', error);
      toast.error('Erro ao salvar presenças');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle delete programacao
  const handleDeleteProgramacao = async () => {
    if (!programacaoToDelete) return;
    
    setIsDeleting(true);
    try {
      // Check if there's a registro_acao linked to this programacao
      const { data: registros, error: registroCheckError } = await supabase
        .from('registros_acao')
        .select('id')
        .eq('programacao_id', programacaoToDelete.id);
      
      if (registroCheckError) throw registroCheckError;
      
      if (registros && registros.length > 0) {
        // Delete linked registros first (if any)
        const { error: registroDeleteError } = await supabase
          .from('registros_acao')
          .delete()
          .eq('programacao_id', programacaoToDelete.id);
        
        if (registroDeleteError) throw registroDeleteError;
      }
      
      // Delete the programacao
      const { error } = await supabase
        .from('programacoes')
        .delete()
        .eq('id', programacaoToDelete.id);
      
      if (error) throw error;
      
      toast.success('Programação excluída com sucesso!');
      setIsDeleteDialogOpen(false);
      setProgramacaoToDelete(null);
      fetchProgramacoes();
    } catch (error) {
      console.error('Error deleting programacao:', error);
      toast.error('Erro ao excluir programação');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBatchUpload = async (programacoesData: ParsedProgramacao[], updateExisting: boolean) => {
    if (!user) {
      toast.error('Você precisa estar logado para importar programações');
      return;
    }

    try {
      let insertedCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;

      for (const prog of programacoesData) {
        // Check if programacao with same date, escola_id, aap_id and tipo exists
        const { data: existingProg } = await supabase
          .from('programacoes')
          .select('id')
          .eq('data', prog.data)
          .eq('escola_id', prog.escola_id)
          .eq('aap_id', prog.aap_id)
          .eq('tipo', prog.tipo)
          .eq('horario_inicio', prog.horario_inicio)
          .maybeSingle();

        if (existingProg) {
          if (updateExisting) {
            // Update existing programacao
            const { error } = await supabase
              .from('programacoes')
              .update({
                titulo: prog.titulo,
                descricao: prog.descricao || null,
                horario_fim: prog.horario_fim,
                segmento: prog.segmento,
                componente: prog.componente,
                ano_serie: prog.ano_serie,
                programa: prog.programa,
              })
              .eq('id', existingProg.id);

            if (error) throw error;
            updatedCount++;
          } else {
            skippedCount++;
          }
        } else {
          // Insert new programacao
          const { error } = await supabase.from('programacoes').insert({
            tipo: prog.tipo,
            titulo: prog.titulo,
            descricao: prog.descricao || null,
            data: prog.data,
            horario_inicio: prog.horario_inicio,
            horario_fim: prog.horario_fim,
            escola_id: prog.escola_id,
            aap_id: prog.aap_id,
            segmento: prog.segmento,
            componente: prog.componente,
            ano_serie: prog.ano_serie,
            programa: prog.programa,
            status: 'prevista',
            created_by: user.id,
          });

          if (error) throw error;
          insertedCount++;
        }
      }

      const messages = [];
      if (insertedCount > 0) messages.push(`${insertedCount} inserida(s)`);
      if (updatedCount > 0) messages.push(`${updatedCount} atualizada(s)`);
      if (skippedCount > 0) messages.push(`${skippedCount} ignorada(s) (duplicadas)`);
      
      toast.success(`Importação concluída: ${messages.join(', ')}`);
      fetchProgramacoes();
    } catch (error) {
      console.error('Error uploading programacoes:', error);
      toast.error('Erro ao importar programações');
    }
  };

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const getEscolaNome = (escolaId: string) => escolas.find(e => e.id === escolaId)?.nome || '-';
  const getAapNome = (aapId: string) => aaps.find(a => a.id === aapId)?.nome || '-';
  const getAapProgramas = (aapId: string) => aaps.find(a => a.id === aapId)?.programas || [];

  if (isLoading || isLoadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4" data-tour="prog-header">
        <div>
          <h1 className="page-header">Programação</h1>
          <p className="page-subtitle">Agende visitas e formações</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-border overflow-hidden" data-tour="prog-view-toggle">
            <button
              onClick={() => setViewMode('calendar')}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors",
                viewMode === 'calendar' ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              )}
            >
              Calendário
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors",
                viewMode === 'list' ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              )}
            >
              Lista
            </button>
          </div>
          
          <button
            onClick={() => setIsUploadDialogOpen(true)}
            className="btn-outline flex items-center gap-2"
            data-tour="prog-import-btn"
          >
            <Upload size={20} />
            Importar
          </button>
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setFormacaoOrigemId(null); }}>
            <DialogTrigger asChild>
              <button className="btn-primary flex items-center gap-2" data-tour="prog-new-btn">
                <Plus size={20} />
                Nova Ação
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Programar Nova Ação</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  {formacaoOrigemId && (
                    <div className="col-span-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
                      <p className="text-sm text-primary font-medium flex items-center gap-2">
                        <LinkIcon size={14} />
                        Criando Acompanhamento de Formação vinculado
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Campos herdados da formação original (somente leitura)</p>
                    </div>
                  )}
                  <div className="col-span-2">
                    <label className="form-label">Tipo de Ação *</label>
                    {formacaoOrigemId ? (
                      <div className="input-field bg-muted/50 cursor-not-allowed flex items-center gap-2">
                        {(() => { const info = ACAO_TYPE_INFO[formData.tipo as AcaoTipo]; const Icon = info?.icon; return Icon ? <><Icon className="w-4 h-4" /><span>{info.label}</span></> : <span>{formData.tipo}</span>; })()}
                      </div>
                    ) : (
                    <div className="flex flex-wrap gap-2">
                      {creatableAcoes.filter(t => t !== 'acompanhamento_formacoes').map(tipo => {
                        const info = ACAO_TYPE_INFO[tipo];
                        const Icon = info.icon;
                        const isSelected = formData.tipo === tipo;
                        return (
                          <button
                            key={tipo}
                            type="button"
                            onClick={() => setFormData({ ...formData, tipo })}
                            className={cn(
                              "min-w-[120px] py-2 px-3 rounded-lg border-2 font-medium transition-all flex items-center gap-2 text-xs",
                              isSelected
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border hover:border-muted-foreground"
                            )}
                          >
                            <Icon className="w-4 h-4 shrink-0" />
                            <span className="text-left leading-tight">{info.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    )}
                  </div>
                  
                  <div className="col-span-2">
                    <label className="form-label">Programa *</label>
                    <Select
                      value={formData.programa[0] || 'escolas'}
                      onValueChange={(value) => setFormData({ ...formData, programa: [value as ProgramaType] })}
                      disabled={!!formacaoOrigemId || (isGestor && gestorProgramas.length === 1) || (isAAP && aapProgramas.length === 1)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o programa" />
                      </SelectTrigger>
                      <SelectContent>
                        {isAAP ? (
                          // AAP só vê seus programas atribuídos
                          aapProgramas.map(prog => (
                            <SelectItem key={prog} value={prog}>
                              {programaLabels[prog]}
                            </SelectItem>
                          ))
                        ) : isGestor ? (
                          // Gestor só vê seus programas atribuídos
                          gestorProgramas.map(prog => (
                            <SelectItem key={prog} value={prog}>
                              {programaLabels[prog]}
                            </SelectItem>
                          ))
                        ) : (
                          // Admin vê todos os programas
                          <>
                            <SelectItem value="escolas">Programa de Escolas</SelectItem>
                            <SelectItem value="regionais">Regionais de Ensino</SelectItem>
                            <SelectItem value="redes_municipais">Redes Municipais</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                    {isGestor && gestorProgramas.length === 0 && (
                      <p className="text-xs text-warning mt-1">Você não possui nenhum programa atribuído</p>
                    )}
                    {isAAP && aapProgramas.length === 0 && (
                      <p className="text-xs text-warning mt-1">Você não possui nenhum programa atribuído</p>
                    )}
                  </div>
                  
                  <div className="col-span-2">
                    <label className="form-label">Título *</label>
                    <input
                      type="text"
                      value={formData.titulo}
                      onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                      className="input-field"
                      placeholder="Ex: Formação em Alfabetização"
                      required
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <label className="form-label">Descrição</label>
                    <textarea
                      value={formData.descricao}
                      onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                      className="input-field min-h-[80px]"
                      placeholder="Descreva a ação..."
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <label className="form-label">Tags</label>
                    <input
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      className="input-field"
                      placeholder="Separe as tags por vírgula (ex: leitura, escrita)"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Sincronizado com "Tag do Projeto" no Notion</p>
                  </div>
                  
                  <div>
                    <label className="form-label">Data *</label>
                    <input
                      type="date"
                      value={formData.data}
                      onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="form-label">Início *</label>
                      <input
                        type="time"
                        value={formData.horarioInicio}
                        onChange={(e) => setFormData({ ...formData, horarioInicio: e.target.value })}
                        className="input-field"
                        required
                      />
                    </div>
                    <div>
                      <label className="form-label">Fim *</label>
                      <input
                        type="time"
                        value={formData.horarioFim}
                        onChange={(e) => setFormData({ ...formData, horarioFim: e.target.value })}
                        className="input-field"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="form-label">Escola *</label>
                    <select
                      value={formData.escolaId}
                      onChange={(e) => setFormData({ ...formData, escolaId: e.target.value, aapId: isAAP ? user?.id || '' : '' })}
                      className="input-field"
                      required
                      disabled={!!formacaoOrigemId}
                    >
                      <option value="">Selecione</option>
                      {escolas.map(escola => (
                        <option key={escola.id} value={escola.id}>{escola.nome}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Campo AAP/Formador - oculto para AAPs pois já está preenchido automaticamente */}
                  {!isAAP && (
                    <div className="col-span-2">
                      <label className="form-label">AAP / Formador *</label>
                      <select
                        value={formData.aapId}
                        onChange={(e) => setFormData({ ...formData, aapId: e.target.value })}
                        className="input-field"
                        required
                        disabled={!!formacaoOrigemId || !formData.escolaId}
                      >
                        <option value="">{formData.escolaId ? 'Selecione' : 'Selecione uma escola primeiro'}</option>
                        {filteredAaps.map(aap => (
                          <option key={aap.id} value={aap.id}>
                            {aap.nome} {aap.programas.length > 0 ? `(${aap.programas.map(p => programaLabels[p]).join(', ')})` : ''}
                          </option>
                        ))}
                      </select>
                      {formData.escolaId && filteredAaps.length === 0 && (
                        <p className="text-xs text-warning mt-1">Nenhum AAP/Formador vinculado a esta escola</p>
                      )}
                    </div>
                  )}
                  
                  {(() => {
                    const isFormacaoType = ['formacao', 'acompanhamento_formacoes', 'lista_presenca', 'participa_formacoes'].includes(formData.tipo);
                    return (
                    <>
                      <div>
                        <label className="form-label">Segmento *</label>
                        <select
                          value={formData.segmento}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            segmento: e.target.value as Segmento,
                            anoSerie: isFormacaoType ? formData.anoSerie : ''
                          })}
                          className="input-field"
                          required={!isFormacaoType}
                          disabled={!!formacaoOrigemId || (isAAP && getAAPSegmentoComponente(profile?.role).segmentos.length === 1)}
                        >
                          {isFormacaoType && <option value="todos">Todos os Segmentos</option>}
                          {(() => {
                            const allowedSegmentos = isAAP 
                              ? getAAPSegmentoComponente(profile?.role).segmentos 
                              : Object.keys(segmentoLabels);
                            return allowedSegmentos.map(value => (
                              <option key={value} value={value}>{segmentoLabels[value as Segmento]}</option>
                            ));
                          })()}
                        </select>
                      </div>
                      
                      <div>
                        <label className="form-label">Componente *</label>
                        <select
                          value={formData.componente}
                          onChange={(e) => setFormData({ ...formData, componente: e.target.value as ComponenteCurricular })}
                          className="input-field"
                          required
                          disabled={!!formacaoOrigemId || (isAAP && getAAPSegmentoComponente(profile?.role).componentes.length === 1)}
                        >
                          {(() => {
                            const allowedComponentes = isAAP 
                              ? getAAPSegmentoComponente(profile?.role).componentes 
                              : Object.keys(componenteLabels);
                            return allowedComponentes.map(value => (
                              <option key={value} value={value}>{componenteLabels[value as ComponenteCurricular]}</option>
                            ));
                          })()}
                        </select>
                      </div>
                      
                      <div className="col-span-2">
                        <label className="form-label">Ano/Série *</label>
                        <select
                          value={formData.anoSerie}
                          onChange={(e) => setFormData({ ...formData, anoSerie: e.target.value })}
                          className="input-field"
                          required={!isFormacaoType}
                          disabled={!!formacaoOrigemId}
                        >
                          <option value="">Selecione</option>
                          {isFormacaoType && <option value="todos">Todos os Anos/Séries</option>}
                          {formData.segmento !== 'todos' && anoSerieOptions[formData.segmento]?.map(ano => (
                            <option key={ano} value={ano}>{ano}</option>
                          ))}
                          {formData.segmento === 'todos' && isFormacaoType && (
                            Object.values(anoSerieOptions).flat().filter((v, i, arr) => arr.indexOf(v) === i).map(ano => (
                              <option key={ano} value={ano}>{ano}</option>
                            ))
                          )}
                        </select>
                      </div>
                    </>
                    );
                  })()}
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsDialogOpen(false)}
                    className="btn-outline flex-1"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary flex-1" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Programar'}
                  </button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2" data-tour="prog-filters">
        <span className="text-sm font-medium text-muted-foreground">Filtros</span>
        <div className="flex flex-wrap gap-3">
          <Select
            value={programaFilter}
            onValueChange={(value) => setProgramaFilter(value as ProgramaType | 'todos')}
            disabled={(isAAP && aapProgramas.length <= 1) || (isGestor && gestorProgramas.length <= 1)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Programa" />
            </SelectTrigger>
            <SelectContent>
              {isAdmin ? (
                <>
                  <SelectItem value="todos">Programa</SelectItem>
                  <SelectItem value="escolas">Programa de Escolas</SelectItem>
                  <SelectItem value="regionais">Regionais de Ensino</SelectItem>
                  <SelectItem value="redes_municipais">Redes Municipais</SelectItem>
                </>
              ) : isGestor ? (
                <>
                  {gestorProgramas.length > 1 && <SelectItem value="todos">Todos os Programas</SelectItem>}
                  {gestorProgramas.map(prog => (
                    <SelectItem key={prog} value={prog}>
                      {programaLabels[prog]}
                    </SelectItem>
                  ))}
                </>
              ) : isAAP ? (
                <>
                  {aapProgramas.length > 1 && <SelectItem value="todos">Todos os Programas</SelectItem>}
                  {aapProgramas.map(prog => (
                    <SelectItem key={prog} value={prog}>
                      {programaLabels[prog]}
                    </SelectItem>
                  ))}
                </>
              ) : (
                <>
                  <SelectItem value="todos">Programa</SelectItem>
                  <SelectItem value="escolas">Programa de Escolas</SelectItem>
                  <SelectItem value="regionais">Regionais de Ensino</SelectItem>
                  <SelectItem value="redes_municipais">Redes Municipais</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>

          <Select
            value={tipoFilter}
            onValueChange={setTipoFilter}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Tipos</SelectItem>
              {creatableAcoes.map(tipo => (
                <SelectItem key={tipo} value={tipo}>{ACAO_TYPE_INFO[tipo].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2 bg-card rounded-xl border border-border p-6" data-tour="prog-calendar">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6" data-tour="prog-navigation">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <h3 className="text-lg font-semibold capitalize">
                {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
              </h3>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Week days */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {weekDays.map(day => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-2">
              {days.map(day => {
                const events = getEventsForDay(day);
                const isToday = isSameDay(day, new Date());
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isCurrentMonth = isSameMonth(day, currentMonth);

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    onDoubleClick={() => {
                      setSelectedDate(day);
                      setFormData(prev => ({ ...prev, data: format(day, 'yyyy-MM-dd') }));
                      setIsDialogOpen(true);
                    }}
                    className={cn(
                      "min-h-[80px] p-2 rounded-lg border transition-all text-left",
                      !isCurrentMonth && "opacity-30",
                      isSelected && "border-primary bg-primary/5",
                      !isSelected && "border-transparent hover:bg-muted",
                      isToday && "ring-2 ring-accent ring-offset-2"
                    )}
                  >
                    <span className={cn(
                      "text-sm font-medium",
                      isSelected && "text-primary"
                    )}>
                      {format(day, 'd')}
                    </span>
                    <div className="mt-1 space-y-1">
                      {events.slice(0, 2).map(event => (
                        <div
                          key={event.id}
                          className={cn(
                            "text-xs px-1.5 py-0.5 rounded truncate bg-primary/20 text-primary"
                          )}
                        >
                          {event.titulo}
                        </div>
                      ))}
                      {events.length > 2 && (
                        <div className="text-xs text-muted-foreground">
                          +{events.length - 2} mais
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected day events */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="card-title mb-4 flex items-center gap-2">
              <CalendarIcon size={20} className="text-primary" />
              {selectedDate 
                ? format(selectedDate, "d 'de' MMMM", { locale: ptBR })
                : 'Selecione um dia'
              }
            </h3>
            
            {selectedDate ? (
              <div className="space-y-3">
                {selectedDayEvents.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhuma ação programada
                  </p>
                ) : (
                  selectedDayEvents.map(event => (
                    <div
                      key={event.id}
                      className="p-4 rounded-lg bg-muted/50 space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium text-foreground">{event.titulo}</h4>
                        <StatusBadge variant="primary">
                          {getAcaoLabel(event.tipo)}
                        </StatusBadge>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p className="flex items-center gap-2">
                          <Clock size={14} />
                          {event.horario_inicio} - {event.horario_fim}
                        </p>
                        <p className="flex items-center gap-2">
                          <MapPin size={14} />
                          {getEscolaNome(event.escola_id)}
                        </p>
                        <div>
                          <span>AAP / Formador: {getAapNome(event.aap_id)}</span>
                        </div>
                        <p>{segmentoLabels[event.segmento as Segmento]} • {event.ano_serie}</p>
                        {event.tags && event.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {event.tags.map((tag, i) => (
                              <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-accent text-accent-foreground">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <StatusBadge 
                          variant={event.status === 'realizada' ? 'success' : event.status === 'prevista' ? 'warning' : 'error'}
                        >
                          {event.status === 'realizada' ? 'Realizada' : event.status === 'prevista' ? 'Prevista' : 'Cancelada'}
                        </StatusBadge>
                        <div className="flex items-center gap-1">
                          {event.tipo === 'formacao' && event.status === 'realizada' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCreateAcompanhamento(event)}
                            >
                              <LinkIcon size={14} className="mr-1" />
                              Acompanhamento
                            </Button>
                          )}
                          {event.status === 'prevista' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenManageDialog(event)}
                            >
                              <Edit size={14} className="mr-1" />
                              Gerenciar
                            </Button>
                          )}
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setProgramacaoToDelete(event);
                                setIsDeleteDialogOpen(true);
                              }}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 size={14} />
                            </Button>
                          )}
                        </div>
                      </div>
                      {event.motivo_cancelamento && (
                        <div className="text-xs text-muted-foreground bg-destructive/10 p-2 rounded">
                          <span className="font-medium">Motivo:</span> {event.motivo_cancelamento}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Clique em um dia para ver as ações
              </p>
            )}
          </div>
        </div>
      ) : (
        // List View
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Data</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Tipo</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Título</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Escola</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">AAP</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredProgramacoes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      Nenhuma programação encontrada
                    </td>
                  </tr>
                ) : (
                  filteredProgramacoes.map(prog => (
                    <tr key={prog.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-sm">
                        {format(parseISO(prog.data), "dd/MM/yyyy", { locale: ptBR })}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge variant="primary">
                          {getAcaoLabel(prog.tipo)}
                        </StatusBadge>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">{prog.titulo}</td>
                      <td className="px-4 py-3 text-sm">{getEscolaNome(prog.escola_id)}</td>
                      <td className="px-4 py-3 text-sm">{getAapNome(prog.aap_id)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge 
                          variant={prog.status === 'realizada' ? 'success' : prog.status === 'prevista' ? 'warning' : 'error'}
                        >
                          {prog.status === 'realizada' ? 'Realizada' : prog.status === 'prevista' ? 'Prevista' : 'Cancelada'}
                        </StatusBadge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {prog.tipo === 'formacao' && prog.status === 'realizada' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCreateAcompanhamento(prog)}
                            >
                              <LinkIcon size={14} className="mr-1" />
                              Acompanhamento
                            </Button>
                          )}
                          {prog.status === 'prevista' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenManageDialog(prog)}
                            >
                              <Edit size={14} className="mr-1" />
                              Gerenciar
                            </Button>
                          )}
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setProgramacaoToDelete(prog);
                                setIsDeleteDialogOpen(true);
                              }}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 size={14} />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manage Dialog */}
      <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Gerenciar Ação</DialogTitle>
          </DialogHeader>
          
          {selectedProgramacao && (
            <div className="space-y-6 mt-4">
              <div className="p-4 rounded-xl bg-muted/50 space-y-2">
                <div className="flex items-center gap-2">
                  <StatusBadge variant="primary">
                    {getAcaoLabel(selectedProgramacao.tipo)}
                  </StatusBadge>
                  <span className="font-medium">{selectedProgramacao.titulo}</span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span>{format(parseISO(selectedProgramacao.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                  <span>•</span>
                  <span>{getEscolaNome(selectedProgramacao.escola_id)}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">A ação foi realizada? *</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setAcaoRealizada(true); setMotivoCancelamento(''); setReagendar(false); }}
                    className={cn(
                      "flex-1 py-3 rounded-lg border-2 font-medium transition-all flex items-center justify-center gap-2",
                      acaoRealizada === true
                        ? "border-success bg-success/10 text-success"
                        : "border-border hover:border-muted-foreground"
                    )}
                  >
                    <CheckCircle2 size={18} />
                    Sim
                  </button>
                  <button
                    type="button"
                    onClick={() => setAcaoRealizada(false)}
                    className={cn(
                      "flex-1 py-3 rounded-lg border-2 font-medium transition-all flex items-center justify-center gap-2",
                      acaoRealizada === false
                        ? "border-destructive bg-destructive/10 text-destructive"
                        : "border-border hover:border-muted-foreground"
                    )}
                  >
                    <XCircle size={18} />
                    Não
                  </button>
                </div>
              </div>

              {acaoRealizada === false && (
                <div className="space-y-4 p-4 rounded-xl border border-destructive/30 bg-destructive/5">
                  <div>
                    <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                      <AlertCircle size={16} className="text-destructive" />
                      Motivo / Justificativa *
                    </label>
                    <Textarea
                      value={motivoCancelamento}
                      onChange={(e) => setMotivoCancelamento(e.target.value)}
                      placeholder="Informe o motivo..."
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <Checkbox 
                      id="reagendar" 
                      checked={reagendar}
                      onCheckedChange={(checked) => setReagendar(checked as boolean)}
                    />
                    <label htmlFor="reagendar" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                      <CalendarPlus size={16} className="text-primary" />
                      Reagendar esta ação
                    </label>
                  </div>

                  {reagendar && (
                    <div className="grid grid-cols-3 gap-3 pt-2">
                      <div>
                        <label className="block text-xs font-medium mb-1">Nova Data *</label>
                        <input
                          type="date"
                          value={novaData}
                          onChange={(e) => setNovaData(e.target.value)}
                          className="input-field text-sm"
                          min={format(new Date(), 'yyyy-MM-dd')}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Início *</label>
                        <input
                          type="time"
                          value={novoHorarioInicio}
                          onChange={(e) => setNovoHorarioInicio(e.target.value)}
                          className="input-field text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Fim *</label>
                        <input
                          type="time"
                          value={novoHorarioFim}
                          onChange={(e) => setNovoHorarioFim(e.target.value)}
                          className="input-field text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsManageDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleManageSubmit} 
                  disabled={acaoRealizada === null || isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Confirmar'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <ProgramacaoUploadDialog
        open={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
        escolas={escolas}
        aaps={aaps}
        onUpload={handleBatchUpload}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta programação?
              {programacaoToDelete && (
                <div className="mt-2 p-3 rounded-lg bg-muted text-foreground">
                  <p className="font-medium">{programacaoToDelete.titulo}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(parseISO(programacaoToDelete.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    {' - '}
                    {getEscolaNome(programacaoToDelete.escola_id)}
                  </p>
                </div>
              )}
              <p className="mt-2 text-sm text-destructive">
                Esta ação não pode ser desfeita. Os registros de ação vinculados também serão excluídos.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProgramacao}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="animate-spin" size={16} /> : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Avaliação de Acompanhamento de Aula Dialog */}
      <Dialog open={isAvaliacaoDialogOpen} onOpenChange={setIsAvaliacaoDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="text-warning" size={20} />
              Avaliação de Acompanhamento de Aula
            </DialogTitle>
            <DialogDescription>
              {selectedProgramacao && (
                <span>
                  {selectedProgramacao.titulo} - {format(parseISO(selectedProgramacao.data), "dd/MM/yyyy", { locale: ptBR })}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {isLoadingProfessores ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : professoresAvaliacao.length === 0 ? (
            <div className="text-center py-12">
              <User className="mx-auto text-muted-foreground mb-4" size={48} />
              <p className="text-muted-foreground">
                Nenhum professor encontrado para esta escola, segmento e ano/série.
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                  setIsAvaliacaoDialogOpen(false);
                  setIsManageDialogOpen(true);
                }}
              >
                Voltar
              </Button>
            </div>
          ) : (
            <div className="space-y-6 mt-4">
              {/* Campos gerais */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Turma</label>
                  <input
                    type="text"
                    value={turma}
                    onChange={(e) => setTurma(e.target.value)}
                    className="input-field"
                    placeholder="Ex: 5º A"
                  />
                </div>
                <div>
                  <label className="form-label">Observações Gerais</label>
                  <input
                    type="text"
                    value={observacoesAcompanhamento}
                    onChange={(e) => setObservacoesAcompanhamento(e.target.value)}
                    className="input-field"
                    placeholder="Observações sobre a visita..."
                  />
                </div>
              </div>
              
              {/* Legenda de pontuação */}
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-xs font-medium mb-2">Legenda de Pontuação:</p>
                <div className="flex flex-wrap gap-3">
                  {pontuacaoLegenda.map(p => (
                    <span key={p.nota} className="text-xs">
                      <strong>{p.nota}</strong> - {p.titulo}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Lista de professores para avaliar */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <User size={16} />
                  Professores para Avaliar ({professoresAvaliacao.length})
                </h4>
                
                <div className="grid gap-3">
                  {professoresAvaliacao.map(prof => {
                    const avaliacao = avaliacaoList.find(a => a.professorId === prof.id);
                    const isExpanded = selectedProfessorAvaliacao === prof.id;
                    
                    return (
                      <div 
                        key={prof.id} 
                        className={cn(
                          "border rounded-xl transition-all",
                          isExpanded ? "border-primary bg-primary/5" : "border-border"
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedProfessorAvaliacao(isExpanded ? null : prof.id)}
                          className="w-full p-4 flex items-center justify-between text-left"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <User size={18} className="text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{prof.nome}</p>
                              <p className="text-sm text-muted-foreground">
                                {cargoLabels[prof.cargo as keyof typeof cargoLabels] || prof.cargo} • {segmentoLabels[prof.segmento as Segmento] || prof.segmento}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {avaliacao && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Star size={14} className="text-warning fill-warning" />
                                <span>
                                  {((avaliacao.clareza_objetivos + avaliacao.dominio_conteudo + avaliacao.estrategias_didaticas + avaliacao.engajamento_turma + avaliacao.gestao_tempo) / 5).toFixed(1)}
                                </span>
                              </div>
                            )}
                            <ChevronRight 
                              size={18} 
                              className={cn(
                                "text-muted-foreground transition-transform",
                                isExpanded && "rotate-90"
                              )} 
                            />
                          </div>
                        </button>
                        
                        {isExpanded && avaliacao && (
                          <div className="px-4 pb-4 space-y-4">
                            <div className="grid gap-3">
                              {dimensoesAvaliacao.map(dim => (
                                <div key={dim.key} className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="text-sm font-medium">{dim.label}</p>
                                      <p className="text-xs text-muted-foreground">{dim.description}</p>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map(nota => (
                                      <button
                                        key={nota}
                                        type="button"
                                        onClick={() => handleUpdateAvaliacao(prof.id, dim.key as keyof AvaliacaoAulaItem, nota as NotaAvaliacao)}
                                        className={cn(
                                          "flex-1 py-2 rounded-lg border-2 font-medium transition-all text-sm",
                                          avaliacao[dim.key as keyof AvaliacaoAulaItem] === nota
                                            ? "border-primary bg-primary text-primary-foreground"
                                            : "border-border hover:border-muted-foreground"
                                        )}
                                      >
                                        {nota}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium mb-2">Observações sobre este professor</label>
                              <Textarea
                                value={avaliacao.observacoes}
                                onChange={(e) => handleUpdateAvaliacao(prof.id, 'observacoes', e.target.value)}
                                placeholder="Observações específicas..."
                                rows={2}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsAvaliacaoDialogOpen(false);
                    setIsManageDialogOpen(true);
                  }}
                >
                  Voltar
                </Button>
                <Button 
                  onClick={handleSaveAvaliacoes} 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Salvar Avaliações'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Presença de Formação Dialog */}
      <Dialog open={isPresencaDialogOpen} onOpenChange={setIsPresencaDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="text-success" size={20} />
              Registro de Presença - Formação
            </DialogTitle>
            <DialogDescription>
              {selectedProgramacao && (
                <span>
                  {selectedProgramacao.titulo} - {format(parseISO(selectedProgramacao.data), "dd/MM/yyyy", { locale: ptBR })}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {isLoadingProfessores ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : professoresPresenca.length === 0 ? (
            <div className="text-center py-12">
              <User className="mx-auto text-muted-foreground mb-4" size={48} />
              <p className="text-muted-foreground">
                Nenhum professor encontrado para esta escola com os filtros selecionados.
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                  setIsPresencaDialogOpen(false);
                  setIsManageDialogOpen(true);
                }}
              >
                Voltar
              </Button>
            </div>
          ) : (
            <div className="space-y-6 mt-4">
              {/* Campos de observação */}
              <div className="grid gap-4">
                <div>
                  <label className="form-label">Observações Gerais</label>
                  <Textarea
                    value={observacoesFormacao}
                    onChange={(e) => setObservacoesFormacao(e.target.value)}
                    placeholder="Observações sobre a formação..."
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Avanços</label>
                    <Textarea
                      value={avancosFormacao}
                      onChange={(e) => setAvancosFormacao(e.target.value)}
                      placeholder="Avanços observados..."
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="form-label">Dificuldades</label>
                    <Textarea
                      value={dificuldadesFormacao}
                      onChange={(e) => setDificuldadesFormacao(e.target.value)}
                      placeholder="Dificuldades observadas..."
                      rows={2}
                    />
                  </div>
                </div>
              </div>
              
              {/* Ações em massa */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                <span className="text-sm font-medium">
                  Professores: {presencaList.filter(p => p.presente).length} de {presencaList.length} presentes
                </span>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleMarcarTodosPresenca(true)}
                  >
                    <CheckCircle2 size={14} className="mr-1 text-success" />
                    Todos Presentes
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleMarcarTodosPresenca(false)}
                  >
                    <XCircle size={14} className="mr-1 text-destructive" />
                    Todos Ausentes
                  </Button>
                </div>
              </div>
              
              {/* Lista de professores */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {professoresPresenca.map(prof => {
                  const presencaItem = presencaList.find(p => p.professorId === prof.id);
                  const isPresente = presencaItem?.presente ?? false;
                  
                  return (
                    <div 
                      key={prof.id} 
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer",
                        isPresente 
                          ? "border-success/50 bg-success/5" 
                          : "border-border hover:border-muted-foreground"
                      )}
                      onClick={() => handleTogglePresenca(prof.id)}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox 
                          checked={isPresente}
                          onCheckedChange={() => handleTogglePresenca(prof.id)}
                        />
                        <div>
                          <p className="font-medium">{prof.nome}</p>
                          <p className="text-xs text-muted-foreground">
                            {segmentoLabels[prof.segmento as Segmento] || prof.segmento} • {prof.ano_serie}
                          </p>
                        </div>
                      </div>
                      {isPresente ? (
                        <CheckCircle2 size={18} className="text-success" />
                      ) : (
                        <XCircle size={18} className="text-muted-foreground" />
                      )}
                    </div>
                  );
                })}
              </div>
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsPresencaDialogOpen(false);
                    setIsManageDialogOpen(true);
                  }}
                >
                  Voltar
                </Button>
                <Button 
                  onClick={handleSavePresencas} 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Salvar Presenças'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}