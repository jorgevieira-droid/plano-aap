import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, CheckCircle2, XCircle, AlertCircle, CalendarPlus, Edit, Loader2 } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { segmentoLabels, componenteLabels, anoSerieOptions, tipoAcaoLabels } from '@/data/mockData';
import { TipoAcao, StatusAcao, Segmento, ComponenteCurricular } from '@/types';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';

type ProgramaType = 'escolas' | 'regionais' | 'redes_municipais';

const programaLabels: Record<ProgramaType, string> = {
  escolas: 'Escolas',
  regionais: 'Regionais',
  redes_municipais: 'Redes Mun.',
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
  created_at: string;
}

export default function ProgramacaoPage() {
  const { user } = useAuth();
  const [programacoes, setProgramacoes] = useState<ProgramacaoDB[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [isLoading, setIsLoading] = useState(true);
  
  // Filter states
  const [programaFilter, setProgramaFilter] = useState<ProgramaType | 'todos'>('todos');
  const [tipoFilter, setTipoFilter] = useState<string>('todos');
  
  // Estados para dados do banco
  const [escolas, setEscolas] = useState<Escola[]>([]);
  const [aaps, setAaps] = useState<AAPFormador[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
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
  
  const [formData, setFormData] = useState({
    tipo: 'formacao' as TipoAcao,
    titulo: '',
    descricao: '',
    data: '',
    horarioInicio: '',
    horarioFim: '',
    escolaId: '',
    aapId: '',
    segmento: 'anos_iniciais' as Segmento,
    componente: 'polivalente' as ComponenteCurricular,
    anoSerie: '',
    programa: ['escolas'] as ProgramaType[],
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
      // Fetch escolas
      const { data: escolasData } = await supabase
        .from('escolas')
        .select('id, nome, codesc')
        .eq('ativa', true)
        .order('nome');
      
      setEscolas(escolasData || []);
      
      // Fetch AAPs/Formadores (users with aap_ roles) along with their escola assignments
      const [profilesRes, rolesRes, programasRes, aapEscolasRes] = await Promise.all([
        supabase.from('profiles').select('id, nome').order('nome'),
        supabase.from('user_roles').select('user_id, role'),
        supabase.from('aap_programas').select('aap_user_id, programa'),
        supabase.from('aap_escolas').select('aap_user_id, escola_id'),
      ]);
      
      // Filter for aap_ roles
      const aapRoles = (rolesRes.data || []).filter(r => r.role.startsWith('aap_'));
      
      const aapUsers: AAPFormador[] = aapRoles.map(roleData => {
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
  }, []);

  // Filter AAPs based on selected escola
  const filteredAaps = useMemo(() => {
    if (!formData.escolaId) return aaps;
    return aaps.filter(aap => aap.escolasIds.includes(formData.escolaId));
  }, [aaps, formData.escolaId]);

  // Filter programacoes based on filters
  const filteredProgramacoes = useMemo(() => {
    return programacoes.filter(p => {
      if (programaFilter !== 'todos') {
        if (!p.programa || !p.programa.includes(programaFilter)) return false;
      }
      if (tipoFilter !== 'todos' && p.tipo !== tipoFilter) return false;
      return true;
    });
  }, [programacoes, programaFilter, tipoFilter]);

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
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase.from('programacoes').insert({
        tipo: formData.tipo,
        titulo: formData.titulo,
        descricao: formData.descricao || null,
        data: formData.data,
        horario_inicio: formData.horarioInicio,
        horario_fim: formData.horarioFim,
        escola_id: formData.escolaId,
        aap_id: formData.aapId,
        segmento: formData.segmento,
        componente: formData.componente,
        ano_serie: formData.anoSerie,
        status: 'prevista',
        programa: formData.programa,
        created_by: user?.id,
      });
      
      if (error) throw error;
      
      toast.success('Ação programada com sucesso!');
      setIsDialogOpen(false);
      setFormData({
        tipo: 'formacao',
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
      });
      fetchProgramacoes();
    } catch (error) {
      console.error('Error creating programacao:', error);
      toast.error('Erro ao criar programação');
    } finally {
      setIsSubmitting(false);
    }
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
      
      // If reagendar, create new programacao
      if (reagendar && !acaoRealizada) {
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="page-header">Programação</h1>
          <p className="page-subtitle">Agende visitas e formações</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-border overflow-hidden">
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
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <button className="btn-primary flex items-center gap-2">
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
                  <div className="col-span-2">
                    <label className="form-label">Tipo de Ação *</label>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, tipo: 'formacao' })}
                        className={cn(
                          "flex-1 min-w-[100px] py-3 rounded-lg border-2 font-medium transition-all",
                          formData.tipo === 'formacao'
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-muted-foreground"
                        )}
                      >
                        Formação
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, tipo: 'visita' })}
                        className={cn(
                          "flex-1 min-w-[100px] py-3 rounded-lg border-2 font-medium transition-all",
                          formData.tipo === 'visita'
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-muted-foreground"
                        )}
                      >
                        Visita
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, tipo: 'acompanhamento_aula' })}
                        className={cn(
                          "flex-1 min-w-[100px] py-3 rounded-lg border-2 font-medium transition-all",
                          formData.tipo === 'acompanhamento_aula'
                            ? "border-warning bg-warning/10 text-warning"
                            : "border-border hover:border-muted-foreground"
                        )}
                      >
                        Acompanhamento de Aula
                      </button>
                    </div>
                  </div>
                  
                  <div className="col-span-2">
                    <label className="form-label">Programa *</label>
                    <Select
                      value={formData.programa[0] || 'escolas'}
                      onValueChange={(value) => setFormData({ ...formData, programa: [value as ProgramaType] })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o programa" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="escolas">Programa de Escolas</SelectItem>
                        <SelectItem value="regionais">Regionais de Ensino</SelectItem>
                        <SelectItem value="redes_municipais">Redes Municipais</SelectItem>
                      </SelectContent>
                    </Select>
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
                      onChange={(e) => setFormData({ ...formData, escolaId: e.target.value, aapId: '' })}
                      className="input-field"
                      required
                    >
                      <option value="">Selecione</option>
                      {escolas.map(escola => (
                        <option key={escola.id} value={escola.id}>{escola.nome}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="col-span-2">
                    <label className="form-label">AAP / Formador *</label>
                    <select
                      value={formData.aapId}
                      onChange={(e) => setFormData({ ...formData, aapId: e.target.value })}
                      className="input-field"
                      required
                      disabled={!formData.escolaId}
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
                  
                  <div>
                    <label className="form-label">Segmento *</label>
                    <select
                      value={formData.segmento}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        segmento: e.target.value as Segmento,
                        anoSerie: ''
                      })}
                      className="input-field"
                      required
                    >
                      {Object.entries(segmentoLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="form-label">Componente *</label>
                    <select
                      value={formData.componente}
                      onChange={(e) => setFormData({ ...formData, componente: e.target.value as ComponenteCurricular })}
                      className="input-field"
                      required
                    >
                      {Object.entries(componenteLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="col-span-2">
                    <label className="form-label">Ano/Série *</label>
                    <select
                      value={formData.anoSerie}
                      onChange={(e) => setFormData({ ...formData, anoSerie: e.target.value })}
                      className="input-field"
                      required
                    >
                      <option value="">Selecione</option>
                      {anoSerieOptions[formData.segmento]?.map(ano => (
                        <option key={ano} value={ano}>{ano}</option>
                      ))}
                    </select>
                  </div>
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
            <SelectItem value="escolas">Programa de Escolas</SelectItem>
            <SelectItem value="regionais">Regionais de Ensino</SelectItem>
            <SelectItem value="redes_municipais">Redes Municipais</SelectItem>
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

      {viewMode === 'calendar' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2 bg-card rounded-xl border border-border p-6">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6">
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
                            "text-xs px-1.5 py-0.5 rounded truncate",
                            event.tipo === 'formacao' 
                              ? "bg-primary/20 text-primary" 
                              : event.tipo === 'acompanhamento_aula'
                              ? "bg-warning/20 text-warning"
                              : "bg-info/20 text-info"
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
                        <StatusBadge variant={event.tipo === 'formacao' ? 'primary' : event.tipo === 'acompanhamento_aula' ? 'warning' : 'info'}>
                          {tipoAcaoLabels[event.tipo] || event.tipo}
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
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <StatusBadge 
                          variant={event.status === 'realizada' ? 'success' : event.status === 'prevista' ? 'warning' : 'error'}
                        >
                          {event.status === 'realizada' ? 'Realizada' : event.status === 'prevista' ? 'Prevista' : 'Cancelada'}
                        </StatusBadge>
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
                        <StatusBadge variant={prog.tipo === 'formacao' ? 'primary' : prog.tipo === 'acompanhamento_aula' ? 'warning' : 'info'}>
                          {tipoAcaoLabels[prog.tipo] || prog.tipo}
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
                  <StatusBadge variant={selectedProgramacao.tipo === 'formacao' ? 'primary' : selectedProgramacao.tipo === 'acompanhamento_aula' ? 'warning' : 'info'}>
                    {tipoAcaoLabels[selectedProgramacao.tipo] || selectedProgramacao.tipo}
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
    </div>
  );
}