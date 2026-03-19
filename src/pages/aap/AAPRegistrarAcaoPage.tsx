import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { segmentoLabels, componenteLabels, cargoLabels, tipoAcaoLabels } from '@/data/mockData';
import { getCreatableAcoes, getAcaoLabel, normalizeAcaoTipo, ACAO_TYPE_INFO } from '@/config/acaoPermissions';
import { Segmento, ComponenteCurricular } from '@/types';
import { useFormFieldConfig } from '@/hooks/useFormFieldConfig';
import { QuestionSelectionStep, QuestionItem } from '@/components/acompanhamento/QuestionSelectionStep';
import { InstrumentForm } from '@/components/instruments/InstrumentForm';
import { useInstrumentFields, INSTRUMENT_FORM_TYPES } from '@/hooks/useInstrumentFields';
import ObservacaoAulaRedesForm from '@/components/formularios/ObservacaoAulaRedesForm';
import EncontroETEGRedesForm from '@/components/formularios/EncontroETEGRedesForm';
import EncontroProfessorRedesForm from '@/components/formularios/EncontroProfessorRedesForm';
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
  CheckCircle2,
  ChevronRight,
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
  tags: string[] | null;
  tipo_ator_presenca: string | null;
}

const INSTRUMENT_TYPE_SET = new Set<string>(INSTRUMENT_FORM_TYPES.map(t => t.value));
const PRESENCE_TYPES = new Set(['formacao', 'lista_presenca']);
const REDES_TYPES = new Set(['observacao_aula_redes', 'encontro_eteg_redes', 'encontro_professor_redes']);

export default function AAPRegistrarAcaoPage() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const { isFieldEnabled, isFieldRequired, isLoading: isConfigLoading, minOptionalQuestions } = useFormFieldConfig('observacao_aula');
  const { fields: obsAulaFields, isLoading: isFieldsLoading } = useInstrumentFields('observacao_aula');
  const [selectedProgramacao, setSelectedProgramacao] = useState<ProgramacaoDB | null>(null);
  const [presencaList, setPresencaList] = useState<PresencaItem[]>([]);
  const [perProfessorResponses, setPerProfessorResponses] = useState<Record<string, Record<string, any>>>({});
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
  const [showQuestionSelection, setShowQuestionSelection] = useState(false);
  const [selectedQuestionKeys, setSelectedQuestionKeys] = useState<string[]>([]);
  const [questionSelectionDone, setQuestionSelectionDone] = useState(false);
  const [instrumentResponses, setInstrumentResponses] = useState<Record<string, any>>({});
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
          .from('user_programas')
          .select('programa')
          .eq('user_id', user.id);
        
        const userAapProgramas = (aapProgramasData || []).map(ap => ap.programa as ProgramaType);
        setAapProgramas(userAapProgramas);
        
        // 2) Carregar apenas as escolas atribuídas ao AAP
        const { data: aapEscolasData, error: aapEscolasError } = await supabase
          .from('user_entidades')
          .select('escola_id')
          .eq('user_id', user.id);

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

  // Get professors for selected escola, segmento, ano_serie e componente
  const availableProfessors = useMemo(() => {
    if (!selectedProgramacao) return [];
    
    // Para formação, filtrar também por segmento e ano_serie apenas se não for "todos"
    if (selectedProgramacao.tipo === 'formacao') {
      return professores.filter(p => {
        if (p.escola_id !== selectedProgramacao.escola_id) return false;
        if (p.componente !== selectedProgramacao.componente) return false;
        if (selectedProgramacao.segmento !== 'todos' && p.segmento !== selectedProgramacao.segmento) return false;
        if (selectedProgramacao.ano_serie !== 'todos' && p.ano_serie !== selectedProgramacao.ano_serie) return false;
        if (selectedProgramacao.tipo_ator_presenca && selectedProgramacao.tipo_ator_presenca !== 'todos' && p.cargo !== selectedProgramacao.tipo_ator_presenca) return false;
        return true;
      });
    }
    
    // Para acompanhamento_aula e visita, filtrar por todos os critérios
    return professores.filter(p => 
      p.escola_id === selectedProgramacao.escola_id &&
      (p.segmento === selectedProgramacao.segmento || p.segmento === 'todos') &&
      (p.ano_serie === selectedProgramacao.ano_serie || p.ano_serie === 'todos') &&
      p.componente === selectedProgramacao.componente
    );
  }, [selectedProgramacao, professores]);

  const isAcompanhamentoAula = selectedProgramacao?.tipo === 'acompanhamento_aula' || selectedProgramacao?.tipo === 'observacao_aula';
  const normalizedTipo = selectedProgramacao ? normalizeAcaoTipo(selectedProgramacao.tipo) : null;
  const isRedesType = normalizedTipo ? REDES_TYPES.has(normalizedTipo) : false;
  const isInstrumentType = normalizedTipo ? INSTRUMENT_TYPE_SET.has(normalizedTipo) && !isAcompanhamentoAula && !isRedesType : false;
  const isFormacao = selectedProgramacao?.tipo === 'formacao';
  const isPresenceType = selectedProgramacao ? PRESENCE_TYPES.has(selectedProgramacao.tipo) : false;


  const handleInstrumentResponseChange = (fieldKey: string, value: any) => {
    setInstrumentResponses(prev => ({ ...prev, [fieldKey]: value }));
  };

  const handleSelectProgramacao = (prog: ProgramacaoDB) => {
    setSelectedProgramacao(prog);
    
    // Get professors based on type
    let profs: ProfessorDB[];
    
    if (prog.tipo === 'formacao') {
      profs = professores.filter(p => {
        if (p.escola_id !== prog.escola_id) return false;
        if (p.componente !== prog.componente) return false;
        if (prog.segmento !== 'todos' && p.segmento !== prog.segmento && p.segmento !== 'todos') return false;
        if (prog.ano_serie !== 'todos' && p.ano_serie !== prog.ano_serie && p.ano_serie !== 'todos') return false;
        if (prog.tipo_ator_presenca && prog.tipo_ator_presenca !== 'todos' && p.cargo !== prog.tipo_ator_presenca) return false;
        return true;
      });
    } else {
      profs = professores.filter(p => 
        p.escola_id === prog.escola_id &&
        (p.segmento === prog.segmento || p.segmento === 'todos') &&
        (p.ano_serie === prog.ano_serie || p.ano_serie === 'todos') &&
        p.componente === prog.componente
      );
    }
    
    const isAcomp = prog.tipo === 'acompanhamento_aula' || prog.tipo === 'observacao_aula';
    
    if (isAcomp) {
      // Initialize per-professor responses map
      const initialResponses: Record<string, Record<string, any>> = {};
      profs.forEach(p => { initialResponses[p.id] = {}; });
      setPerProfessorResponses(initialResponses);
      setPresencaList([]);
      
      // Open question selection step first
      const requiredKeys = obsAulaFields
        .filter(f => isFieldEnabled(f.field_key) && isFieldRequired(f.field_key))
        .map(f => f.field_key);
      setSelectedQuestionKeys(requiredKeys);
      setQuestionSelectionDone(false);
      setShowQuestionSelection(true);
    } else if (PRESENCE_TYPES.has(prog.tipo)) {
      // Initialize presence list with all professors as absent
      setPresencaList(profs.map(p => ({ professorId: p.id, presente: false })));
      setPerProfessorResponses({});
      setQuestionSelectionDone(false);
      setInstrumentResponses({});
    } else {
      // Instrument type or basic type — no presence/avaliacao needed
      setPresencaList([]);
      setPerProfessorResponses({});
      setQuestionSelectionDone(false);
      setInstrumentResponses({});
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
    setInstrumentResponses({});
  };

  const handleConfirmQuestionSelection = () => {
    setShowQuestionSelection(false);
    setQuestionSelectionDone(true);
  };

  const questionItems: QuestionItem[] = useMemo(() => 
    obsAulaFields.map(f => ({
      key: f.field_key,
      label: f.label,
      type: f.field_type,
      required: isFieldRequired(f.field_key),
      enabled: isFieldEnabled(f.field_key),
    })),
    [obsAulaFields, isFieldEnabled, isFieldRequired]
  );

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

  const handleProfessorResponseChange = (professorId: string, fieldKey: string, value: any) => {
    setPerProfessorResponses(prev => ({
      ...prev,
      [professorId]: { ...(prev[professorId] || {}), [fieldKey]: value },
    }));
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
            tags: selectedProgramacao.tags,
          })
          .select('id')
          .single();
        
        if (registroError) throw registroError;
        
        if (isAcompanhamentoAula) {
          // Build questoes_selecionadas JSONB
          const questoesSelecionadas = selectedQuestionKeys.map(key => ({
            field_key: key,
            obrigatoria: isFieldRequired(key),
          }));

          // Save to instrument_responses per professor
          const professorIds = Object.keys(perProfessorResponses);
          const responsesToInsert = professorIds.map(profId => ({
            registro_acao_id: registroData.id,
            professor_id: profId,
            escola_id: selectedProgramacao.escola_id,
            aap_id: user!.id,
            form_type: 'observacao_aula',
            responses: perProfessorResponses[profId] || {},
            questoes_selecionadas: questoesSelecionadas,
          }));

          const { error: instrumentError } = await (supabase as any)
            .from('instrument_responses')
            .insert(responsesToInsert);
          
          if (instrumentError) throw instrumentError;
          
          toast.success('Avaliação de acompanhamento salva com sucesso!', {
            description: `${professorIds.length} professor(es)/coordenador(es) avaliado(s)`
          });
        } else if (isPresenceType) {
          // Save presencas
          const presencasToInsert = presencaList.map(p => ({
            registro_acao_id: registroData.id,
            professor_id: p.professorId,
            presente: p.presente,
          }));
          
          const { error: presencasError } = await supabase
            .from('presencas')
            .insert(presencasToInsert);
          
          if (presencasError) throw presencasError;

          // Save instrument responses for formacao (hybrid: presence + instrument)
          if (isFormacao && normalizedTipo && Object.keys(instrumentResponses).length > 0) {
            const { error: instrumentError } = await (supabase as any)
              .from('instrument_responses')
              .insert({
                registro_acao_id: registroData.id,
                professor_id: null,
                escola_id: selectedProgramacao.escola_id,
                aap_id: user!.id,
                form_type: normalizedTipo,
                responses: instrumentResponses,
                questoes_selecionadas: null,
              });
            if (instrumentError) throw instrumentError;
          }

          const presentes = presencaList.filter(p => p.presente).length;
          const total = presencaList.length;
          toast.success('Registro salvo com sucesso!', {
            description: `${presentes} de ${total} presentes`
          });
        } else if (isInstrumentType) {
          // Save instrument responses
          const { error: instrumentError } = await (supabase as any)
            .from('instrument_responses')
            .insert({
              registro_acao_id: registroData.id,
              professor_id: null,
              escola_id: selectedProgramacao.escola_id,
              aap_id: user!.id,
              form_type: normalizeAcaoTipo(selectedProgramacao.tipo),
              responses: instrumentResponses,
              questoes_selecionadas: null,
            });

          if (instrumentError) throw instrumentError;
          toast.success('Instrumento pedagógico salvo com sucesso!');
        } else {
          toast.success('Registro salvo com sucesso!');
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
      queryClient.invalidateQueries({ queryKey: ['instrument_responses'] });
      queryClient.invalidateQueries({ queryKey: ['programacoes'] });
      setSelectedProgramacao(null);
      setPresencaList([]);
      setPerProfessorResponses({});
      setInstrumentResponses({});
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
    const normalized = normalizeAcaoTipo(tipo);
    switch (normalized) {
      case 'acompanhamento_formacoes': return 'primary';
      case 'observacao_aula': return 'warning';
      case 'devolutiva_pedagogica': return 'success';
      case 'autoavaliacao': return 'default';
      case 'avaliacao_formacao_participante': return 'default';
      case 'qualidade_atpcs': return 'info';
      default: return 'info';
    }
  };

  const presentes = presencaList.filter(p => p.presente).length;
  const totalProfessores = presencaList.length;

  const professorIdsForEval = Object.keys(perProfessorResponses);

  const selectedProfessorResponses = selectedProfessorAvaliacao
    ? perProfessorResponses[selectedProfessorAvaliacao] || {}
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
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-muted-foreground">Filtros</span>
        <div className="flex flex-wrap gap-3">
          <Select
            value={programaFilter}
            onValueChange={(value) => setProgramaFilter(value as ProgramaType | 'todos')}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Programa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Programa</SelectItem>
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
            <SelectTrigger className="w-full sm:w-[220px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Tipo</SelectItem>
              {getCreatableAcoes(profile?.role).map(tipo => (
                <SelectItem key={tipo} value={tipo}>
                  {ACAO_TYPE_INFO[tipo].label}
                </SelectItem>
              ))}
              {/* Backward compat: also show acompanhamento_aula if present in data */}
              {!getCreatableAcoes(profile?.role).includes('observacao_aula') ? null : (
                <SelectItem value="acompanhamento_aula" className="hidden">Acompanhamento de Aula</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
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
                      <StatusBadge variant={getTipoVariant(prog.tipo) as 'primary' | 'info' | 'warning' | 'success' | 'default'}>
                        {getAcaoLabel(prog.tipo)}
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
      <Dialog open={!!selectedProgramacao && !isAcompanhamentoAula && !isRedesType} onOpenChange={() => setSelectedProgramacao(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] max-w-[95vw] sm:w-auto sm:max-w-2xl rounded-lg p-4 sm:p-6">
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
                  {selectedProgramacao.tipo !== 'visita' && (
                    <>
                      <span>•</span>
                      <span>{segmentoLabels[selectedProgramacao.segmento as Segmento]} - {selectedProgramacao.ano_serie}</span>
                    </>
                  )}
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
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
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
              {acaoRealizada === true && isPresenceType && (
                <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
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

              {/* Instrument Form (for pedagogical instrument types or hybrid types) */}
              {acaoRealizada === true && isInstrumentType && normalizedTipo && (
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <ClipboardCheck size={18} className="text-primary" />
                    Instrumento Pedagógico
                  </h4>
                  <InstrumentForm
                    formType={normalizedTipo}
                    responses={instrumentResponses}
                    onResponseChange={handleInstrumentResponseChange}
                  />
                </div>
              )}

              {/* Observations (shown when action was realized and NOT instrument type) */}
              {acaoRealizada === true && !isInstrumentType && (
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

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={() => setSelectedProgramacao(null)} className="w-full sm:w-auto">
                  Cancelar
                </Button>
                <Button onClick={handleSubmit} disabled={acaoRealizada === null || isSubmitting} className="w-full sm:w-auto">
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Salvar Registro'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Registration Modal for Acompanhamento de Aula */}
      <Dialog open={!!selectedProgramacao && isAcompanhamentoAula && questionSelectionDone} onOpenChange={() => { setSelectedProgramacao(null); setQuestionSelectionDone(false); }}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] max-w-[95vw] sm:w-auto sm:max-w-4xl rounded-lg p-4 sm:p-6">
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
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                      Professores/Coordenadores ({professorIdsForEval.length})
                    </h4>
                    <div className="border border-border rounded-lg divide-y divide-border max-h-80 overflow-y-auto">
                      {availableProfessors.length === 0 ? (
                        <p className="p-4 text-center text-muted-foreground">Nenhum professor encontrado</p>
                      ) : (
                        professorIdsForEval.map(profId => {
                          const professor = professores.find(p => p.id === profId);
                          const isSelected = selectedProfessorAvaliacao === profId;
                          
                          return (
                            <button
                              key={profId}
                              onClick={() => setSelectedProfessorAvaliacao(profId)}
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

                  {/* Evaluation Form — now uses InstrumentForm */}
                  <div>
                    {selectedProfessorAvaliacao && selectedProfessorResponses ? (
                      <div className="space-y-4">
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <h4 className="font-medium">{professores.find(p => p.id === selectedProfessorAvaliacao)?.nome}</h4>
                          <p className="text-sm text-muted-foreground">
                            {(() => {
                              const prof = professores.find(p => p.id === selectedProfessorAvaliacao);
                              return prof ? `${cargoLabels[prof.cargo] || prof.cargo} - ${componenteLabels[prof.componente as ComponenteCurricular] || prof.componente}` : '';
                            })()}
                          </p>
                        </div>

                        <InstrumentForm
                          formType="observacao_aula"
                          responses={selectedProfessorResponses}
                          onResponseChange={(fieldKey, value) => handleProfessorResponseChange(selectedProfessorAvaliacao, fieldKey, value)}
                          selectedKeys={selectedQuestionKeys}
                        />
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
              {acaoRealizada === true && selectedQuestionKeys.includes('observacoes_gerais') && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Observações Gerais da Visita
                    {isFieldRequired('observacoes_gerais') && <span className="text-destructive ml-1">*</span>}
                  </label>
                  <Textarea
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder="Observações gerais sobre o acompanhamento..."
                    rows={3}
                  />
                </div>
              )}

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={() => setSelectedProgramacao(null)} className="w-full sm:w-auto">
                  Cancelar
                </Button>
                <Button onClick={handleSubmit} disabled={acaoRealizada === null || isSubmitting} className="w-full sm:w-auto">
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Salvar Avaliação'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* REDES Form Dialog */}
      <Dialog open={!!selectedProgramacao && isRedesType} onOpenChange={() => setSelectedProgramacao(null)}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] max-w-[95vw] sm:w-auto sm:max-w-4xl rounded-lg p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>{selectedProgramacao ? getAcaoLabel(selectedProgramacao.tipo) : 'Formulário REDES'}</DialogTitle>
          </DialogHeader>
          {selectedProgramacao && isRedesType && (
            (() => {
              const formProps = {
                entidades: escolas,
                data: selectedProgramacao.data,
                horarioInicio: selectedProgramacao.horario_inicio,
                horarioFim: selectedProgramacao.horario_fim,
                onSuccess: async () => {
                  await supabase
                    .from('programacoes')
                    .update({ status: 'realizada' })
                    .eq('id', selectedProgramacao.id);
                  await supabase
                    .from('registros_acao')
                    .insert({
                      programacao_id: selectedProgramacao.id,
                      tipo: selectedProgramacao.tipo,
                      data: selectedProgramacao.data,
                      escola_id: selectedProgramacao.escola_id,
                      aap_id: user!.id,
                      segmento: selectedProgramacao.segmento,
                      componente: selectedProgramacao.componente,
                      ano_serie: selectedProgramacao.ano_serie,
                      programa: selectedProgramacao.programa,
                      tags: selectedProgramacao.tags,
                    });
                  const { data: updatedProgramacoes } = await supabase
                    .from('programacoes')
                    .select('*')
                    .eq('status', 'prevista')
                    .eq('aap_id', user!.id)
                    .order('data', { ascending: true });
                  setProgramacoes(updatedProgramacoes || []);
                  queryClient.invalidateQueries({ queryKey: ['programacoes'] });
                  queryClient.invalidateQueries({ queryKey: ['registros_acao'] });
                  setSelectedProgramacao(null);
                },
              };
              switch (normalizedTipo) {
                case 'observacao_aula_redes':
                  return <ObservacaoAulaRedesForm {...formProps} />;
                case 'encontro_eteg_redes':
                  return <EncontroETEGRedesForm {...formProps} />;
                case 'encontro_professor_redes':
                  return <EncontroProfessorRedesForm {...formProps} />;
                default:
                  return null;
              }
            })()
          )}
        </DialogContent>
      </Dialog>


      <QuestionSelectionStep
        open={showQuestionSelection}
        onOpenChange={(open) => {
          setShowQuestionSelection(open);
          if (!open) setSelectedProgramacao(null);
        }}
        questions={questionItems}
        selectedKeys={selectedQuestionKeys}
        onSelectedKeysChange={setSelectedQuestionKeys}
        minOptionalQuestions={minOptionalQuestions}
        onConfirm={handleConfirmQuestionSelection}
      />
    </div>
  );
}