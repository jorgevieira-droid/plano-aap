import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { programacoes as mockProgramacoes, segmentoLabels, componenteLabels, cargoLabels } from '@/data/mockData';
import { Programacao, Professor, NotaAvaliacao, notaAvaliacaoLabels, Segmento, ComponenteCurricular } from '@/types';
import { format } from 'date-fns';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

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

const dimensoesAvaliacao = [
  { key: 'clareza_objetivos', label: 'Clareza dos objetivos' },
  { key: 'dominio_conteudo', label: 'Domínio do conteúdo' },
  { key: 'estrategias_didaticas', label: 'Estratégias didáticas' },
  { key: 'engajamento_turma', label: 'Engajamento da turma' },
  { key: 'gestao_tempo', label: 'Gestão do tempo' },
] as const;

export default function AAPRegistrarAcaoPage() {
  const { user } = useAuth();
  const [selectedProgramacao, setSelectedProgramacao] = useState<Programacao | null>(null);
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
  
  // Database state
  const [escolas, setEscolas] = useState<Escola[]>([]);
  const [professores, setProfessores] = useState<ProfessorDB[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [programacoes] = useState<Programacao[]>(mockProgramacoes); // TODO: Replace with real data

  // Fetch escolas and professores from database
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [escolasRes, professoresRes] = await Promise.all([
          supabase.from('escolas').select('id, nome').eq('ativa', true).order('nome'),
          supabase.from('professores').select('id, nome, escola_id, segmento, componente, ano_serie, cargo').eq('ativo', true).order('nome'),
        ]);
        
        setEscolas(escolasRes.data || []);
        setProfessores(professoresRes.data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Erro ao carregar dados');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Get pending programações for current AAP (using mock for now - todo: implement real)
  const pendingProgramacoes = useMemo(() => {
    // For now using mock data - filter by user id when using real programacoes table
    return programacoes.filter(p => p.status === 'prevista')
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
  }, [programacoes]);

  // Get professors for selected escola and segmento (including coordenadores)
  const availableProfessors = useMemo(() => {
    if (!selectedProgramacao) return [];
    return professores.filter(p => 
      p.escola_id === selectedProgramacao.escolaId &&
      p.segmento === selectedProgramacao.segmento
    );
  }, [selectedProgramacao, professores]);

  const isAcompanhamentoAula = selectedProgramacao?.tipo === 'acompanhamento_aula';

  const handleSelectProgramacao = (prog: Programacao) => {
    setSelectedProgramacao(prog);
    // Get professors for this escola and segmento
    const profs = professores.filter(p => 
      p.escola_id === prog.escolaId &&
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
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (!acaoRealizada) {
      if (reagendar) {
        toast.success('Ação cancelada e reagendada com sucesso!', {
          description: `Nova data: ${format(new Date(novaData), "dd/MM/yyyy", { locale: ptBR })}`
        });
      } else {
        toast.success('Ação marcada como não realizada', {
          description: 'Motivo registrado com sucesso'
        });
      }
    } else if (isAcompanhamentoAula) {
      const avaliadosCount = avaliacaoList.length;
      toast.success('Avaliação de acompanhamento salva com sucesso!', {
        description: `${avaliadosCount} professor(es)/coordenador(es) avaliado(s)`
      });
    } else {
      const presentes = presencaList.filter(p => p.presente).length;
      const total = presencaList.length;
      toast.success('Registro salvo com sucesso!', {
        description: `${presentes} de ${total} presentes`
      });
    }
    
    setSelectedProgramacao(null);
    setPresencaList([]);
    setAvaliacaoList([]);
    setAcaoRealizada(null);
    setMotivoCancelamento('');
    setReagendar(false);
    setNovaData('');
    setNovoHorarioInicio('');
    setNovoHorarioFim('');
    setIsSubmitting(false);
  };

  const getEscolaNome = (escolaId: string) => {
    return escolas.find(e => e.id === escolaId)?.nome || '-';
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'formacao': return 'Formação';
      case 'visita': return 'Visita';
      case 'acompanhamento_aula': return 'Acompanhamento de Aula';
      default: return tipo;
    }
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="page-header">Registrar Ação</h1>
        <p className="page-subtitle">Selecione uma programação e registre a presença ou avaliação</p>
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
                        {getTipoLabel(prog.tipo)}
                      </StatusBadge>
                      <span className="text-sm text-muted-foreground">
                        {segmentoLabels[prog.segmento]}
                      </span>
                    </div>
                    <h3 className="font-medium truncate">{prog.titulo}</h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {format(new Date(prog.data), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {prog.horarioInicio} - {prog.horarioFim}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={14} />
                        {getEscolaNome(prog.escolaId)}
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

      {/* Registration Modal */}
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
                    {getTipoLabel(selectedProgramacao.tipo)}
                  </StatusBadge>
                  <span className="font-medium">{selectedProgramacao.titulo}</span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span>{format(new Date(selectedProgramacao.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                  <span>•</span>
                  <span>{getEscolaNome(selectedProgramacao.escolaId)}</span>
                  <span>•</span>
                  <span>{segmentoLabels[selectedProgramacao.segmento]} - {selectedProgramacao.anoSerie}</span>
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

              {/* Turma - só mostrar se ação foi realizada */}
              {acaoRealizada === true && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Turma (opcional)</label>
                    <input
                      type="text"
                      value={turma}
                      onChange={(e) => setTurma(e.target.value)}
                      placeholder="Ex: Turma A"
                      className="input-field"
                    />
                  </div>

                  {/* Presence List */}
                  <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Users size={18} className="text-primary" />
                    Lista de Presença
                    <span className="text-sm font-normal text-muted-foreground">
                      ({presentes}/{totalProfessores})
                    </span>
                  </h4>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMarcarTodos(true)}
                    >
                      <Check size={14} className="mr-1" />
                      Todos
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMarcarTodos(false)}
                    >
                      <X size={14} className="mr-1" />
                      Nenhum
                    </Button>
                  </div>
                </div>

                {availableProfessors.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground border border-dashed border-border rounded-lg">
                    <Users size={32} className="mx-auto mb-2 opacity-50" />
                    <p>Nenhum professor/coordenador encontrado para este segmento</p>
                  </div>
                ) : (
                  <div className="border border-border rounded-lg overflow-hidden">
                    {availableProfessors.map((professor, index) => {
                      const presencaItem = presencaList.find(p => p.professorId === professor.id);
                      const isPresente = presencaItem?.presente || false;
                      
                      return (
                        <div 
                          key={professor.id}
                          className={`flex items-center justify-between p-3 cursor-pointer transition-colors hover:bg-muted/50 ${
                            index < availableProfessors.length - 1 ? 'border-b border-border' : ''
                          } ${isPresente ? 'bg-success/5' : ''}`}
                          onClick={() => handleTogglePresenca(professor.id)}
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox 
                              checked={isPresente}
                              onCheckedChange={() => handleTogglePresenca(professor.id)}
                            />
                            <div>
                              <p className="text-sm font-medium">{professor.nome}</p>
                              <p className="text-xs text-muted-foreground">
                                {cargoLabels[professor.cargo] || professor.cargo} • {componenteLabels[professor.componente as ComponenteCurricular] || professor.componente} • {professor.ano_serie}
                              </p>
                            </div>
                          </div>
                          <StatusBadge variant={isPresente ? 'success' : 'default'} size="sm">
                            {isPresente ? 'Presente' : 'Ausente'}
                          </StatusBadge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Observations */}
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <FileText size={16} className="text-muted-foreground" />
                  Observações
                </label>
                <Textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Descreva como foi a ação, pontos relevantes..."
                  rows={3}
                />
              </div>

              {/* Advances */}
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <TrendingUp size={16} className="text-success" />
                  Avanços Observados
                </label>
                <Textarea
                  value={avancos}
                  onChange={(e) => setAvancos(e.target.value)}
                  placeholder="Quais avanços foram observados..."
                  rows={2}
                />
              </div>

              {/* Difficulties */}
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <AlertCircle size={16} className="text-warning" />
                  Dificuldades Encontradas
                </label>
                <Textarea
                  value={dificuldades}
                  onChange={(e) => setDificuldades(e.target.value)}
                  placeholder="Quais dificuldades foram encontradas..."
                  rows={2}
                />
              </div>
                </>
              )}

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setSelectedProgramacao(null)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar Registro'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Acompanhamento de Aula Modal */}
      <Dialog open={!!selectedProgramacao && isAcompanhamentoAula} onOpenChange={() => setSelectedProgramacao(null)}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardCheck className="text-warning" size={20} />
              Acompanhamento de Aula
            </DialogTitle>
          </DialogHeader>

          {selectedProgramacao && isAcompanhamentoAula && (
            <div className="space-y-6 mt-4">
              {/* Action Info */}
              <div className="p-4 rounded-xl bg-muted/50 space-y-2">
                <div className="flex items-center gap-2">
                  <StatusBadge variant="warning">
                    Acompanhamento de Aula
                  </StatusBadge>
                  <span className="font-medium">{selectedProgramacao.titulo}</span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span>{format(new Date(selectedProgramacao.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                  <span>•</span>
                  <span>{getEscolaNome(selectedProgramacao.escolaId)}</span>
                  <span>•</span>
                  <span>{segmentoLabels[selectedProgramacao.segmento]} - {selectedProgramacao.anoSerie}</span>
                </div>
              </div>

              {/* Status da Ação */}
              <div>
                <label className="block text-sm font-medium mb-3">O acompanhamento foi realizado? *</label>
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
                    Sim, foi realizado
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
                    Não foi realizado
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
                      placeholder="Informe o motivo pelo qual o acompanhamento não foi realizado..."
                      rows={3}
                    />
                  </div>

                  {/* Opção de Reagendar */}
                  <div className="flex items-center gap-3">
                    <Checkbox 
                      id="reagendar-acomp" 
                      checked={reagendar}
                      onCheckedChange={(checked) => setReagendar(checked as boolean)}
                    />
                    <label htmlFor="reagendar-acomp" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                      <CalendarPlus size={16} className="text-primary" />
                      Reagendar este acompanhamento
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

              {/* Turma - só mostrar se ação foi realizada */}
              {acaoRealizada === true && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Turma (opcional)</label>
                    <input
                      type="text"
                      value={turma}
                      onChange={(e) => setTurma(e.target.value)}
                      placeholder="Ex: Turma A"
                      className="input-field"
                    />
                  </div>

                  {/* Professor Selection */}
                  <div>
                <h4 className="font-medium flex items-center gap-2 mb-3">
                  <Users size={18} className="text-primary" />
                  Selecione o Professor/Coordenador para avaliar
                </h4>

                {availableProfessors.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground border border-dashed border-border rounded-lg">
                    <Users size={32} className="mx-auto mb-2 opacity-50" />
                    <p>Nenhum professor/coordenador encontrado para este segmento</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {availableProfessors.map((professor) => {
                      const avaliacao = avaliacaoList.find(a => a.professorId === professor.id);
                      const mediaNotas = avaliacao 
                        ? ((avaliacao.clareza_objetivos + avaliacao.dominio_conteudo + avaliacao.estrategias_didaticas + avaliacao.engajamento_turma + avaliacao.gestao_tempo) / 5).toFixed(1)
                        : '3.0';
                      
                      return (
                        <button
                          key={professor.id}
                          onClick={() => setSelectedProfessorAvaliacao(professor.id)}
                          className={`p-4 rounded-xl border transition-all text-left hover:border-primary hover:bg-primary/5 ${
                            selectedProfessorAvaliacao === professor.id 
                              ? 'border-primary bg-primary/5' 
                              : 'border-border'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium">{professor.nome}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {cargoLabels[professor.cargo] || professor.cargo} • {componenteLabels[professor.componente as ComponenteCurricular] || professor.componente}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 text-warning">
                              <Star size={14} fill="currentColor" />
                              <span className="text-sm font-medium">{mediaNotas}</span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Avaliação Form */}
              {selectedProfessorData && selectedAvaliacaoData && (
                <div className="p-4 rounded-xl border border-border bg-card space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Star size={18} className="text-warning" />
                    Avaliação de {selectedProfessorData.nome}
                    <StatusBadge variant="info" size="sm">{cargoLabels[selectedProfessorData.cargo] || selectedProfessorData.cargo}</StatusBadge>
                  </h4>

                  <div className="space-y-4">
                    {dimensoesAvaliacao.map(({ key, label }) => (
                      <div key={key} className="space-y-2">
                        <label className="block text-sm font-medium">{label}</label>
                        <div className="flex flex-wrap gap-2">
                          {([1, 2, 3, 4, 5] as NotaAvaliacao[]).map((nota) => (
                            <button
                              key={nota}
                              type="button"
                              onClick={() => handleUpdateAvaliacao(selectedProfessorData.id, key, nota)}
                              className={`flex-1 min-w-[100px] p-3 rounded-lg border transition-all text-center ${
                                selectedAvaliacaoData[key] === nota
                                  ? 'border-primary bg-primary text-primary-foreground'
                                  : 'border-border hover:border-primary hover:bg-primary/5'
                              }`}
                            >
                              <div className="font-bold text-lg">{nota}</div>
                              <div className="text-xs opacity-80">{notaAvaliacaoLabels[nota]}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Observações sobre este professor/coordenador
                      </label>
                      <Textarea
                        value={selectedAvaliacaoData.observacoes}
                        onChange={(e) => handleUpdateAvaliacao(selectedProfessorData.id, 'observacoes', e.target.value as unknown as NotaAvaliacao)}
                        placeholder="Observações específicas sobre a aula observada..."
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              )}

                  {/* General Observations */}
                  <div>
                    <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                      <FileText size={16} className="text-muted-foreground" />
                      Observações Gerais
                    </label>
                    <Textarea
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      placeholder="Observações gerais sobre o acompanhamento..."
                      rows={3}
                    />
                  </div>
                </>
              )}

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setSelectedProgramacao(null)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar Avaliação'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
