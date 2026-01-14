import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { segmentoLabels, componenteLabels, cargoLabels, tipoAcaoLabels } from '@/data/mockData';
import { NotaAvaliacao, notaAvaliacaoLabels, Segmento, ComponenteCurricular } from '@/types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  Check, 
  X, 
  FileText, 
  TrendingUp, 
  AlertCircle,
  ChevronRight,
  CheckCircle2,
  Star,
  ClipboardCheck,
  CalendarPlus,
  XCircle,
  Loader2
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

type ProgramaType = 'escolas' | 'regionais' | 'redes_municipais';

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

interface Escola {
  id: string;
  nome: string;
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
  programa: string[] | null;
}

const dimensoesAvaliacao = [
  { key: 'clareza_objetivos', label: 'Clareza dos objetivos' },
  { key: 'dominio_conteudo', label: 'Domínio do conteúdo' },
  { key: 'estrategias_didaticas', label: 'Estratégias didáticas' },
  { key: 'engajamento_turma', label: 'Engajamento da turma' },
  { key: 'gestao_tempo', label: 'Gestão do tempo' },
] as const;

export default function AAPRegistrarAcaoPage() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [selectedProgramacao, setSelectedProgramacao] = useState<ProgramacaoDB | null>(null);
  const [presencaList, setPresencaList] = useState<PresencaItem[]>([]);
  const [avaliacaoList, setAvaliacaoList] = useState<AvaliacaoAulaItem[]>([]);
  const [selectedProfessorAvaliacao, setSelectedProfessorAvaliacao] = useState<string | null>(null);
  const [observacoes, setObservacoes] = useState('');
  const [avancos, setAvancos] = useState('');
  const [dificuldades, setDificuldades] = useState('');
  const [turma, setTurma] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [acaoRealizada, setAcaoRealizada] = useState<boolean | null>(null);
  const [motivoCancelamento, setMotivoCancelamento] = useState('');
  const [reagendar, setReagendar] = useState(false);
  const [novaData, setNovaData] = useState('');
  const [novoHorarioInicio, setNovoHorarioInicio] = useState('');
  const [novoHorarioFim, setNovoHorarioFim] = useState('');
  
  // Filter
  const [programaFilter, setProgramaFilter] = useState<ProgramaType | 'todos'>('todos');
  const [tipoFilter, setTipoFilter] = useState<string>('todos');
  
  // Database state
  const [escolas, setEscolas] = useState<Escola[]>([]);
  const [professores, setProfessores] = useState<ProfessorDB[]>([]);
  const [programacoes, setProgramacoes] = useState<ProgramacaoDB[]>([]);
  const [aapProgramas, setAapProgramas] = useState<ProgramaType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch data from database
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      if (!user) {
        setEscolas([]);
        setProfessores([]);
        setProgramacoes([]);
        setIsLoading(false);
        return;
      }

      try {
        // 1) Carregar programas do AAP
        const { data: aapProgramasData } = await supabase
          .from('aap_programas')
          .select('programa')
          .eq('aap_user_id', user.id);
        
        const userAapProgramas = (aapProgramasData || []).map(ap => ap.programa as ProgramaType);
        setAapProgramas(userAapProgramas);
        
        // 2) Carregar apenas as escolas atribuídas ao AAP
        const { data: aapEscolasData, error: aapEscolasError } = await supabase
          .from('aap_escolas')
          .select('escola_id')
          .eq('aap_user_id', user.id);

        if (aapEscolasError) throw aapEscolasError;

        const escolaIds = (aapEscolasData || []).map((r) => r.escola_id);

        if (escolaIds.length === 0) {
          setEscolas([]);
          setProfessores([]);
          setProgramacoes([]);
          return;
        }

        const [escolasRes, professoresRes, programacoesRes] = await Promise.all([
          supabase.from('escolas').select('id, nome').eq('ativa', true).in('id', escolaIds).order('nome'),
          supabase
            .from('professores')
            .select('id, nome, escola_id, segmento, componente, ano_serie, cargo')
            .eq('ativo', true)
            .in('escola_id', escolaIds)
            .order('nome'),
          supabase
            .from('programacoes')
            .select('*')
            .eq('status', 'prevista')
            .eq('aap_id', user.id)
            .order('data', { ascending: true }),
        ]);

        setEscolas(escolasRes.data || []);
        setProfessores(professoresRes.data || []);
        setProgramacoes(programacoesRes.data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Erro ao carregar dados');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Get pending programações with filters
  const pendingProgramacoes = useMemo(() => {
    return programacoes.filter(p => {
      // Filter by user if AAP
      // For now showing all pending - can filter by aap_id === user?.id if needed
      if (programaFilter !== 'todos' && (!p.programa || !p.programa.includes(programaFilter))) return false;
      if (tipoFilter !== 'todos' && p.tipo !== tipoFilter) return false;
      return true;
    });
  }, [programacoes, programaFilter, tipoFilter]);

  // Get professors for selected escola and segmento (including coordenadores)
  const availableProfessors = useMemo(() => {
    if (!selectedProgramacao) return [];
    return professores.filter(p => 
      p.escola_id === selectedProgramacao.escola_id &&
      p.segmento === selectedProgramacao.segmento
    );
  }, [selectedProgramacao, professores]);

  const isAcompanhamentoAula = selectedProgramacao?.tipo === 'acompanhamento_aula';

  const handleSelectProgramacao = (prog: ProgramacaoDB) => {
    setSelectedProgramacao(prog);
    // Get professors for this escola and segmento
    const profs = professores.filter(p => 
      p.escola_id === prog.escola_id &&
      p.segmento === prog.segmento
    );
    
    if (prog.tipo === 'acompanhamento_aula') {
      // Initialize avaliação list
      setAvaliacaoList(profs.map(p => ({
        professorId: p.id,
        clareza_objetivos: 3,
        dominio_conteudo: 3,
        estrategias_didaticas: 3,
        engajamento_turma: 3,
        gestao_tempo: 3,
        observacoes: '',
      })));
      setPresencaList([]);
    } else {
      // Initialize presence list with all professors as absent
      setPresencaList(profs.map(p => ({ professorId: p.id, presente: false })));
      setAvaliacaoList([]);
    }
    
    setSelectedProfessorAvaliacao(null);
    setObservacoes('');
    setAvancos('');
    setDificuldades('');
    setTurma('');
    setAcaoRealizada(null);
    setMotivoCancelamento('');
    setReagendar(false);
    setNovaData('');
    setNovoHorarioInicio('');
    setNovoHorarioFim('');
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

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Você precisa estar logado para registrar uma ação');
      return;
    }

    if (!selectedProgramacao || acaoRealizada === null) return;
    
    if (!acaoRealizada && !motivoCancelamento.trim()) {
      toast.error('Informe o motivo do cancelamento');
      return;
    }
    
    if (reagendar && (!novaData || !novoHorarioInicio || !novoHorarioFim)) {
      toast.error('Preencha os dados do reagendamento');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Update programacao status
      const { error: updateError } = await supabase
        .from('programacoes')
        .update({
          status: acaoRealizada ? 'realizada' : 'cancelada',
          motivo_cancelamento: acaoRealizada ? null : motivoCancelamento,
        })
        .eq('id', selectedProgramacao.id);
      
      if (updateError) throw updateError;
      
      if (acaoRealizada) {
        // Create registro_acao
        const { data: registroData, error: registroError } = await supabase
          .from('registros_acao')
          .insert({
            programacao_id: selectedProgramacao.id,
            tipo: selectedProgramacao.tipo,
            data: selectedProgramacao.data,
            escola_id: selectedProgramacao.escola_id,
            // garante que o registro pertence ao usuário logado (RLS + visibilidade)
            aap_id: user!.id,
            segmento: selectedProgramacao.segmento,
            componente: selectedProgramacao.componente,
            ano_serie: selectedProgramacao.ano_serie,
            turma: turma || null,
            observacoes: observacoes || null,
            avancos: avancos || null,
            dificuldades: dificuldades || null,
            programa: selectedProgramacao.programa,
          })
          .select('id')
          .single();
        
        if (registroError) throw registroError;
        
        if (isAcompanhamentoAula) {
          // Save avaliacoes
          const avaliacoesToInsert = avaliacaoList.map(av => ({
            registro_acao_id: registroData.id,
            professor_id: av.professorId,
            escola_id: selectedProgramacao.escola_id,
            aap_id: user!.id,
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
            description: `${avaliacaoList.length} professor(es)/coordenador(es) avaliado(s)`
          });
        } else if (selectedProgramacao.tipo === 'formacao') {
          // Save presencas only for formação
          const presencasToInsert = presencaList.map(p => ({
            registro_acao_id: registroData.id,
            professor_id: p.professorId,
            presente: p.presente,
          }));
          
          const { error: presencasError } = await supabase
            .from('presencas')
            .insert(presencasToInsert);
          
          if (presencasError) throw presencasError;
          
          const presentes = presencaList.filter(p => p.presente).length;
          const total = presencaList.length;
          toast.success('Registro salvo com sucesso!', {
            description: `${presentes} de ${total} presentes`
          });
        } else {
          // Visita - no presence needed
          toast.success('Visita registrada com sucesso!');
        }
      } else {
        // If reagendar, create new programacao
        if (reagendar) {
          const { error: insertError } = await supabase.from('programacoes').insert({
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
          });
          
          if (insertError) throw insertError;
          
          toast.success('Ação cancelada e reagendada com sucesso!', {
            description: `Nova data: ${format(new Date(novaData), "dd/MM/yyyy", { locale: ptBR })}`
          });
        } else {
          toast.success('Ação marcada como não realizada', {
            description: 'Motivo registrado com sucesso'
          });
        }
      }
      
      // Refresh programacoes (somente do AAP logado)
      const { data: updatedProgramacoes } = await supabase
        .from('programacoes')
        .select('*')
        .eq('status', 'prevista')
        .eq('aap_id', user!.id)
        .order('data', { ascending: true });

      setProgramacoes(updatedProgramacoes || []);

      // Invalidate queries to refresh history + dashboard
      queryClient.invalidateQueries({ queryKey: ['registros_acao'] });
      queryClient.invalidateQueries({ queryKey: ['presencas'] });
      queryClient.invalidateQueries({ queryKey: ['avaliacoes_aula'] });
      queryClient.invalidateQueries({ queryKey: ['programacoes'] });
      setSelectedProgramacao(null);
      setPresencaList([]);
      setAvaliacaoList([]);
      setAcaoRealizada(null);
      setMotivoCancelamento('');
      setReagendar(false);
      setNovaData('');
      setNovoHorarioInicio('');
      setNovoHorarioFim('');
    } catch (error) {
      console.error('Error saving registro:', error);
      toast.error('Erro ao salvar registro');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getEscolaNome = (escolaId: string) => {
    return escolas.find(e => e.id === escolaId)?.nome || '-';
  };

  const getTipoVariant = (tipo: string) => {
    switch (tipo) {
      case 'formacao': return 'primary';
      case 'visita': return 'info';
      case 'acompanhamento_aula': return 'warning';
      default: return 'default';
    }
  };

  const presentes = presencaList.filter(p => p.presente).length;
  const totalProfessores = presencaList.length;

  const selectedProfessorData = selectedProfessorAvaliacao 
    ? professores.find(p => p.id === selectedProfessorAvaliacao)
    : null;

  const selectedAvaliacaoData = selectedProfessorAvaliacao
    ? avaliacaoList.find(a => a.professorId === selectedProfessorAvaliacao)
    : null;

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
      <div>
        <h1 className="page-header">Registrar Ação</h1>
        <p className="page-subtitle">Selecione uma programação e registre a presença ou avaliação</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select
          value={programaFilter}
          onValueChange={(value) => setProgramaFilter(value as ProgramaType | 'todos')}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por programa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Programas</SelectItem>
            {aapProgramas.map(prog => (
              <SelectItem key={prog} value={prog}>
                {prog === 'escolas' ? 'Programa de Escolas' : prog === 'regionais' ? 'Regionais de Ensino' : 'Redes Municipais'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={tipoFilter}
          onValueChange={setTipoFilter}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Tipos</SelectItem>
            <SelectItem value="formacao">Formação</SelectItem>
            <SelectItem value="visita">Visita</SelectItem>
            <SelectItem value="acompanhamento_aula">Acompanhamento de Aula</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Pending Programações */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="text-primary" size={20} />
          Programações Pendentes
        </h2>

        {pendingProgramacoes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle2 size={48} className="mx-auto mb-3 text-success" />
            <p>Nenhuma programação pendente</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingProgramacoes.map(prog => (
              <button
                key={prog.id}
                onClick={() => handleSelectProgramacao(prog)}
                className={`w-full p-4 rounded-xl border transition-all text-left hover:border-primary hover:bg-primary/5 ${
                  selectedProgramacao?.id === prog.id 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <StatusBadge variant={getTipoVariant(prog.tipo) as 'primary' | 'info' | 'warning' | 'default'}>
                        {tipoAcaoLabels[prog.tipo] || prog.tipo}
                      </StatusBadge>
                      <span className="text-sm text-muted-foreground">
                        {segmentoLabels[prog.segmento as Segmento]}
                      </span>
                    </div>
                    <h3 className="font-medium truncate">{prog.titulo}</h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {format(parseISO(prog.data), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {prog.horario_inicio} - {prog.horario_fim}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={14} />
                        {getEscolaNome(prog.escola_id)}
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-muted-foreground flex-shrink-0 mt-2" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Registration Modal for Formação/Visita */}
      <Dialog open={!!selectedProgramacao && !isAcompanhamentoAula} onOpenChange={() => setSelectedProgramacao(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar Ação</DialogTitle>
          </DialogHeader>

          {selectedProgramacao && !isAcompanhamentoAula && (
            <div className="space-y-6 mt-4">
              {/* Action Info */}
              <div className="p-4 rounded-xl bg-muted/50 space-y-2">
                <div className="flex items-center gap-2">
                  <StatusBadge variant={getTipoVariant(selectedProgramacao.tipo) as 'primary' | 'info' | 'warning' | 'default'}>
                    {tipoAcaoLabels[selectedProgramacao.tipo] || selectedProgramacao.tipo}
                  </StatusBadge>
                  <span className="font-medium">{selectedProgramacao.titulo}</span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span>{format(parseISO(selectedProgramacao.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                  <span>•</span>
                  <span>{getEscolaNome(selectedProgramacao.escola_id)}</span>
                  <span>•</span>
                  <span>{segmentoLabels[selectedProgramacao.segmento as Segmento]} - {selectedProgramacao.ano_serie}</span>
                </div>
              </div>

              {/* Status da Ação */}
              <div>
                <label className="block text-sm font-medium mb-3">A ação foi realizada? *</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setAcaoRealizada(true); setMotivoCancelamento(''); setReagendar(false); }}
                    className={`flex-1 py-3 rounded-lg border-2 font-medium transition-all flex items-center justify-center gap-2 ${
                      acaoRealizada === true
                        ? 'border-success bg-success/10 text-success'
                        : 'border-border hover:border-muted-foreground'
                    }`}
                  >
                    <CheckCircle2 size={18} />
                    Sim, foi realizada
                  </button>
                  <button
                    type="button"
                    onClick={() => setAcaoRealizada(false)}
                    className={`flex-1 py-3 rounded-lg border-2 font-medium transition-all flex items-center justify-center gap-2 ${
                      acaoRealizada === false
                        ? 'border-destructive bg-destructive/10 text-destructive'
                        : 'border-border hover:border-muted-foreground'
                    }`}
                  >
                    <XCircle size={18} />
                    Não foi realizada
                  </button>
                </div>
              </div>

              {/* Motivo Cancelamento */}
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
                      placeholder="Informe o motivo pelo qual a ação não foi realizada..."
                      rows={3}
                    />
                  </div>

                  {/* Opção de Reagendar */}
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

              {/* Presence List (shown only for formação when action was realized) */}
              {acaoRealizada === true && selectedProgramacao.tipo === 'formacao' && (
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
                  
                  {availableProfessors.length === 0 ? (
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
              )}

              {/* Observations (shown when action was realized) */}
              {acaoRealizada === true && (
                <>

                  {/* Observations */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                        <FileText size={16} className="text-muted-foreground" />
                        Observações Gerais
                      </label>
                      <Textarea
                        value={observacoes}
                        onChange={(e) => setObservacoes(e.target.value)}
                        placeholder="Observações sobre a ação..."
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                          <TrendingUp size={16} className="text-success" />
                          Avanços Identificados
                        </label>
                        <Textarea
                          value={avancos}
                          onChange={(e) => setAvancos(e.target.value)}
                          placeholder="Quais avanços foram observados?"
                          rows={3}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                          <AlertCircle size={16} className="text-warning" />
                          Dificuldades Encontradas
                        </label>
                        <Textarea
                          value={dificuldades}
                          onChange={(e) => setDificuldades(e.target.value)}
                          placeholder="Quais dificuldades foram encontradas?"
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedProgramacao(null)}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmit} disabled={acaoRealizada === null || isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Salvar Registro'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Registration Modal for Acompanhamento de Aula */}
      <Dialog open={!!selectedProgramacao && isAcompanhamentoAula} onOpenChange={() => setSelectedProgramacao(null)}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardCheck size={20} className="text-warning" />
              Acompanhamento de Aula
            </DialogTitle>
          </DialogHeader>

          {selectedProgramacao && isAcompanhamentoAula && (
            <div className="space-y-6 mt-4">
              {/* Action Info */}
              <div className="p-4 rounded-xl bg-warning/10 border border-warning/30 space-y-2">
                <div className="flex items-center gap-2">
                  <StatusBadge variant="warning">Acompanhamento de Aula</StatusBadge>
                  <span className="font-medium">{selectedProgramacao.titulo}</span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span>{format(parseISO(selectedProgramacao.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                  <span>•</span>
                  <span>{getEscolaNome(selectedProgramacao.escola_id)}</span>
                  <span>•</span>
                  <span>{segmentoLabels[selectedProgramacao.segmento as Segmento]} - {selectedProgramacao.ano_serie}</span>
                </div>
              </div>

              {/* Status da Ação */}
              <div>
                <label className="block text-sm font-medium mb-3">A ação foi realizada? *</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setAcaoRealizada(true); setMotivoCancelamento(''); setReagendar(false); }}
                    className={`flex-1 py-3 rounded-lg border-2 font-medium transition-all flex items-center justify-center gap-2 ${
                      acaoRealizada === true
                        ? 'border-success bg-success/10 text-success'
                        : 'border-border hover:border-muted-foreground'
                    }`}
                  >
                    <CheckCircle2 size={18} />
                    Sim
                  </button>
                  <button
                    type="button"
                    onClick={() => setAcaoRealizada(false)}
                    className={`flex-1 py-3 rounded-lg border-2 font-medium transition-all flex items-center justify-center gap-2 ${
                      acaoRealizada === false
                        ? 'border-destructive bg-destructive/10 text-destructive'
                        : 'border-border hover:border-muted-foreground'
                    }`}
                  >
                    <XCircle size={18} />
                    Não
                  </button>
                </div>
              </div>

              {/* Cancelamento */}
              {acaoRealizada === false && (
                <div className="space-y-4 p-4 rounded-xl border border-destructive/30 bg-destructive/5">
                  <div>
                    <label className="block text-sm font-medium mb-2">Motivo *</label>
                    <Textarea
                      value={motivoCancelamento}
                      onChange={(e) => setMotivoCancelamento(e.target.value)}
                      placeholder="Informe o motivo..."
                      rows={3}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Checkbox 
                      id="reagendar-acomp" 
                      checked={reagendar}
                      onCheckedChange={(checked) => setReagendar(checked as boolean)}
                    />
                    <label htmlFor="reagendar-acomp" className="text-sm font-medium cursor-pointer">
                      Reagendar esta ação
                    </label>
                  </div>
                  {reagendar && (
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1">Nova Data *</label>
                        <input type="date" value={novaData} onChange={(e) => setNovaData(e.target.value)} className="input-field text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Início *</label>
                        <input type="time" value={novoHorarioInicio} onChange={(e) => setNovoHorarioInicio(e.target.value)} className="input-field text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Fim *</label>
                        <input type="time" value={novoHorarioFim} onChange={(e) => setNovoHorarioFim(e.target.value)} className="input-field text-sm" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Evaluation Section */}
              {acaoRealizada === true && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Professor List */}
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Users size={18} className="text-primary" />
                      Professores/Coordenadores ({avaliacaoList.length})
                    </h4>
                    <div className="border border-border rounded-lg divide-y divide-border max-h-80 overflow-y-auto">
                      {availableProfessors.length === 0 ? (
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
              )}

              {/* General observations */}
              {acaoRealizada === true && (
                <div>
                  <label className="block text-sm font-medium mb-2">Observações Gerais da Visita</label>
                  <Textarea
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder="Observações gerais sobre o acompanhamento..."
                    rows={3}
                  />
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedProgramacao(null)}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmit} disabled={acaoRealizada === null || isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Salvar Avaliação'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}