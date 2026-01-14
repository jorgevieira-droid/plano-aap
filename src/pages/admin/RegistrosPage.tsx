import { useState, useMemo } from 'react';
import { Search, Eye, Calendar, MapPin, User, MessageSquare, TrendingUp, AlertCircle, Loader2, Edit, Star, History, Download, XCircle, CalendarClock, Check, X, Users, ClipboardCheck, ChevronRight } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { segmentoLabels, componenteLabels, tipoAcaoLabels, notaAvaliacaoLabels, cargoLabels } from '@/data/mockData';
import { Segmento, ComponenteCurricular, NotaAvaliacao } from '@/types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

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
}

interface ProgramacaoDB {
  id: string;
  motivo_cancelamento: string | null;
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
  { key: 'clareza_objetivos', label: 'Clareza dos objetivos' },
  { key: 'dominio_conteudo', label: 'Domínio do conteúdo' },
  { key: 'estrategias_didaticas', label: 'Estratégias didáticas' },
  { key: 'engajamento_turma', label: 'Engajamento da turma' },
  { key: 'gestao_tempo', label: 'Gestão do tempo' },
] as const;

const statusLabels: Record<string, string> = {
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
  const { user, profile, isAdmin, isGestor } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('todos');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [filterYear, setFilterYear] = useState<string>('todos');
  const [filterMonth, setFilterMonth] = useState<string>('todos');
  const [programaFilter, setProgramaFilter] = useState<ProgramaType | 'todos'>('todos');
  const [selectedRegistro, setSelectedRegistro] = useState<RegistroAcaoDB | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  
  // Edit form state
  const [editObservacoes, setEditObservacoes] = useState('');
  const [editAvancos, setEditAvancos] = useState('');
  const [editDificuldades, setEditDificuldades] = useState('');

  // Manage action state
  const [isManaging, setIsManaging] = useState(false);
  const [presencaList, setPresencaList] = useState<PresencaItem[]>([]);
  const [avaliacaoList, setAvaliacaoList] = useState<AvaliacaoAulaItem[]>([]);
  const [selectedProfessorAvaliacao, setSelectedProfessorAvaliacao] = useState<string | null>(null);

  const { data: registros = [], isLoading: isLoadingRegistros } = useQuery({
    queryKey: ['registros_acao'],
    queryFn: async () => {
      const { data, error } = await supabase.from('registros_acao').select('*').order('data', { ascending: false });
      if (error) throw error;
      return data as RegistroAcaoDB[];
    },
  });

  const { data: presencas = [] } = useQuery({
    queryKey: ['presencas'],
    queryFn: async () => {
      const { data, error } = await supabase.from('presencas').select('*');
      if (error) throw error;
      return data as PresencaDB[];
    },
  });

  const { data: avaliacoes = [] } = useQuery({
    queryKey: ['avaliacoes_aula'],
    queryFn: async () => {
      const { data, error } = await supabase.from('avaliacoes_aula').select('*');
      if (error) throw error;
      return data as AvaliacaoAulaDB[];
    },
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
      const { data, error } = await supabase.from('profiles').select('id, nome');
      if (error) throw error;
      return data as Profile[];
    },
  });

  const { data: professores = [] } = useQuery({
    queryKey: ['professores_all'],
    queryFn: async () => {
      const { data, error } = await supabase.from('professores').select('id, nome, escola_id, segmento, componente, cargo').eq('ativo', true);
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
        .select('id, motivo_cancelamento');
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

  const filteredRegistros = registros.filter(registro => {
    const escola = escolas.find(e => e.id === registro.escola_id);
    const aap = profiles.find(a => a.id === registro.aap_id);
    
    const matchesSearch = 
      escola?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      aap?.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipo = filterTipo === 'todos' || registro.tipo === filterTipo;
    const matchesStatus = filterStatus === 'todos' || registro.status === filterStatus;
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
    if (isAdmin || isGestor) return true;
    return registro.aap_id === user?.id;
  };

  // Get available professors for a registro
  const getAvailableProfessors = (registro: RegistroAcaoDB) => {
    return professores.filter(p => 
      p.escola_id === registro.escola_id &&
      p.segmento === registro.segmento
    );
  };

  const handleOpenEdit = (registro: RegistroAcaoDB) => {
    setSelectedRegistro(registro);
    setEditObservacoes(registro.observacoes || '');
    setEditAvancos(registro.avancos || '');
    setEditDificuldades(registro.dificuldades || '');
    setIsEditing(true);
  };

  const handleOpenManage = (registro: RegistroAcaoDB) => {
    setSelectedRegistro(registro);
    const profs = getAvailableProfessors(registro);
    
    if (registro.tipo === 'acompanhamento_aula') {
      // Load existing avaliacoes
      const existingAvaliacoes = getAvaliacoesForRegistro(registro.id);
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

  const handleSaveEdit = async () => {
    if (!selectedRegistro || !user) return;
    
    setIsSubmitting(true);
    try {
      // Get old values for log
      const oldValues = {
        observacoes: selectedRegistro.observacoes,
        avancos: selectedRegistro.avancos,
        dificuldades: selectedRegistro.dificuldades,
      };
      
      const newValues = {
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
      
      toast.success('Registro atualizado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['registros_acao'] });
      queryClient.invalidateQueries({ queryKey: ['registros_alteracoes', selectedRegistro.id] });
      setIsEditing(false);
      setSelectedRegistro(null);
    } catch (error) {
      console.error('Error updating registro:', error);
      toast.error('Erro ao atualizar registro');
    } finally {
      setIsSubmitting(false);
    }
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

  const columns = [
    {
      key: 'data',
      header: 'Data',
      render: (registro: RegistroAcaoDB) => (
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-muted-foreground" />
          <span>{format(parseISO(registro.data), "dd/MM/yyyy", { locale: ptBR })}</span>
        </div>
      ),
    },
    {
      key: 'tipo',
      header: 'Tipo',
      render: (registro: RegistroAcaoDB) => (
        <StatusBadge variant={registro.tipo === 'formacao' ? 'primary' : registro.tipo === 'acompanhamento_aula' ? 'warning' : 'info'}>
          {tipoAcaoLabels[registro.tipo] || registro.tipo}
        </StatusBadge>
      ),
    },
    {
      key: 'escola',
      header: 'Escola',
      render: (registro: RegistroAcaoDB) => (
        <div className="flex items-center gap-2">
          <MapPin size={16} className="text-muted-foreground" />
          <span className="text-sm">{getEscolaNome(registro.escola_id)}</span>
        </div>
      ),
    },
    {
      key: 'aap',
      header: 'AAP',
      render: (registro: RegistroAcaoDB) => (
        <div className="flex items-center gap-2">
          <User size={16} className="text-muted-foreground" />
          <span className="text-sm">{getAapNome(registro.aap_id)}</span>
        </div>
      ),
    },
    {
      key: 'segmento',
      header: 'Segmento',
      render: (registro: RegistroAcaoDB) => (
        <span className="text-sm">{segmentoLabels[registro.segmento as Segmento]} - {registro.ano_serie}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (registro: RegistroAcaoDB) => {
        const variant = registro.status === 'realizada' ? 'success' : 
                       registro.status === 'cancelada' ? 'error' : 
                       registro.status === 'reagendada' ? 'warning' : 'info';
        return (
          <div className="flex flex-col gap-1">
            <StatusBadge variant={variant}>
              {registro.is_reagendada && '🔄 '}
              {statusLabels[registro.status] || registro.status}
            </StatusBadge>
            {registro.reagendada_para && (
              <span className="text-xs text-muted-foreground">
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
      render: (registro: RegistroAcaoDB) => {
        if (registro.tipo === 'acompanhamento_aula') {
          const avaliacoesRegistro = getAvaliacoesForRegistro(registro.id);
          return (
            <span className="text-sm flex items-center gap-1">
              <Star size={14} className="text-warning" />
              {avaliacoesRegistro.length} avaliação(ões)
            </span>
          );
        }
        const presencasRegistro = getPresencasForRegistro(registro.id);
        const presentes = presencasRegistro.filter(p => p.presente).length;
        const total = presencasRegistro.length;
        
        return (
          <span className="text-sm">
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="page-header">Registros de Ações</h1>
          <p className="page-subtitle">Visualize os registros de visitas e formações realizadas</p>
        </div>
        <Button onClick={handleExportExcel} variant="outline" className="flex items-center gap-2">
          <Download size={18} />
          Exportar Excel
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por escola ou AAP..."
            className="input-field pl-11"
          />
        </div>
        
        <Select value={programaFilter} onValueChange={(v) => setProgramaFilter(v as ProgramaType | 'todos')}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Programa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Programas</SelectItem>
            <SelectItem value="escolas">Programa de Escolas</SelectItem>
            <SelectItem value="regionais">Regionais de Ensino</SelectItem>
            <SelectItem value="redes_municipais">Redes Municipais</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={filterTipo} onValueChange={setFilterTipo}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            <SelectItem value="formacao">Formações</SelectItem>
            <SelectItem value="visita">Visitas</SelectItem>
            <SelectItem value="acompanhamento_aula">Acompanhamento de Aula</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            <SelectItem value="prevista">Prevista</SelectItem>
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
            <SelectItem value="todos">Todos os anos</SelectItem>
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
            <SelectItem value="todos">Todos os meses</SelectItem>
            {months.map(month => (
              <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Empty State */}
      {registros.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-xl border border-border">
          <Calendar size={48} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum registro encontrado</h3>
          <p className="text-muted-foreground">Os registros de ações aparecerão aqui após serem criados.</p>
        </div>
      ) : (
        <DataTable
          data={filteredRegistros}
          columns={columns}
          keyExtractor={(registro) => registro.id}
          emptyMessage="Nenhum registro encontrado"
        />
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
                    <StatusBadge 
                      variant={
                        selectedRegistro.status === 'realizada' ? 'success' : 
                        selectedRegistro.status === 'cancelada' ? 'error' : 
                        selectedRegistro.status === 'reagendada' ? 'warning' : 'info'
                      }
                    >
                      {selectedRegistro.is_reagendada && '🔄 '}
                      {statusLabels[selectedRegistro.status] || selectedRegistro.status}
                    </StatusBadge>
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
                        <div className="font-medium mb-3">{getProfessorNome(avaliacao.professor_id)}</div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
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
                          <p className="mt-3 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
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

                      {dimensoesAvaliacao.map(dimensao => (
                        <div key={dimensao.key} className="space-y-2">
                          <label className="block text-sm font-medium">{dimensao.label}</label>
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Registro</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div>
              <label className="form-label">Observações</label>
              <Textarea
                value={editObservacoes}
                onChange={(e) => setEditObservacoes(e.target.value)}
                placeholder="Observações gerais..."
                rows={3}
              />
            </div>
            
            <div>
              <label className="form-label">Avanços</label>
              <Textarea
                value={editAvancos}
                onChange={(e) => setEditAvancos(e.target.value)}
                placeholder="Principais avanços observados..."
                rows={3}
              />
            </div>
            
            <div>
              <label className="form-label">Dificuldades</label>
              <Textarea
                value={editDificuldades}
                onChange={(e) => setEditDificuldades(e.target.value)}
                placeholder="Dificuldades encontradas..."
                rows={3}
              />
            </div>
          </div>
          
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
    </div>
  );
}
