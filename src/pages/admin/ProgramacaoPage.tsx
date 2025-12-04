import { useState } from 'react';
import { Plus, Search, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { programacoes as initialProgramacoes, escolas, aaps, segmentoLabels, componenteLabels, anoSerieOptions } from '@/data/mockData';
import { Programacao, TipoAcao, StatusAcao, Segmento, ComponenteCurricular } from '@/types';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function ProgramacaoPage() {
  const [programacoes, setProgramacoes] = useState<Programacao[]>(initialProgramacoes);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  
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
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { locale: ptBR });
  const calendarEnd = endOfWeek(monthEnd, { locale: ptBR });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getEventsForDay = (date: Date) => {
    return programacoes.filter(p => isSameDay(new Date(p.data), date));
  };

  const selectedDayEvents = selectedDate ? getEventsForDay(selectedDate) : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newProgramacao: Programacao = {
      id: String(Date.now()),
      tipo: formData.tipo,
      titulo: formData.titulo,
      descricao: formData.descricao,
      data: new Date(formData.data),
      horarioInicio: formData.horarioInicio,
      horarioFim: formData.horarioFim,
      escolaId: formData.escolaId,
      aapId: formData.aapId,
      segmento: formData.segmento,
      componente: formData.componente,
      anoSerie: formData.anoSerie,
      status: 'prevista',
      createdAt: new Date(),
    };
    
    setProgramacoes(prev => [...prev, newProgramacao]);
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
    });
  };

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

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
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, tipo: 'formacao' })}
                        className={cn(
                          "flex-1 py-3 rounded-lg border-2 font-medium transition-all",
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
                          "flex-1 py-3 rounded-lg border-2 font-medium transition-all",
                          formData.tipo === 'visita'
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-muted-foreground"
                        )}
                      >
                        Visita
                      </button>
                    </div>
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
                      onChange={(e) => setFormData({ ...formData, escolaId: e.target.value })}
                      className="input-field"
                      required
                    >
                      <option value="">Selecione</option>
                      {escolas.map(escola => (
                        <option key={escola.id} value={escola.id}>{escola.nome}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="form-label">AAP *</label>
                    <select
                      value={formData.aapId}
                      onChange={(e) => setFormData({ ...formData, aapId: e.target.value })}
                      className="input-field"
                      required
                    >
                      <option value="">Selecione</option>
                      {aaps.map(aap => (
                        <option key={aap.id} value={aap.id}>{aap.nome}</option>
                      ))}
                    </select>
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
                  <button type="submit" className="btn-primary flex-1">
                    Programar
                  </button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
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
                  selectedDayEvents.map(event => {
                    const escola = escolas.find(e => e.id === event.escolaId);
                    const aap = aaps.find(a => a.id === event.aapId);
                    
                    return (
                      <div
                        key={event.id}
                        className="p-4 rounded-lg bg-muted/50 space-y-2"
                      >
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium text-foreground">{event.titulo}</h4>
                          <StatusBadge variant={event.tipo === 'formacao' ? 'primary' : 'info'}>
                            {event.tipo === 'formacao' ? 'Formação' : 'Visita'}
                          </StatusBadge>
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p className="flex items-center gap-2">
                            <Clock size={14} />
                            {event.horarioInicio} - {event.horarioFim}
                          </p>
                          <p className="flex items-center gap-2">
                            <MapPin size={14} />
                            {escola?.nome}
                          </p>
                          <p>AAP: {aap?.nome}</p>
                          <p>{segmentoLabels[event.segmento]} • {event.anoSerie}</p>
                        </div>
                        <StatusBadge 
                          variant={event.status === 'realizada' ? 'success' : event.status === 'prevista' ? 'warning' : 'error'}
                        >
                          {event.status === 'realizada' ? 'Realizada' : event.status === 'prevista' ? 'Prevista' : 'Cancelada'}
                        </StatusBadge>
                      </div>
                    );
                  })
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
        /* List View */
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="divide-y divide-border">
            {programacoes
              .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
              .map(event => {
                const escola = escolas.find(e => e.id === event.escolaId);
                const aap = aaps.find(a => a.id === event.aapId);
                
                return (
                  <div key={event.id} className="p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex flex-col items-center justify-center">
                          <span className="text-xs text-primary font-medium">
                            {format(new Date(event.data), 'MMM', { locale: ptBR })}
                          </span>
                          <span className="text-lg font-bold text-primary">
                            {format(new Date(event.data), 'd')}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-foreground">{event.titulo}</h4>
                            <StatusBadge variant={event.tipo === 'formacao' ? 'primary' : 'info'} size="sm">
                              {event.tipo === 'formacao' ? 'Formação' : 'Visita'}
                            </StatusBadge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {escola?.nome} • {aap?.nome} • {event.horarioInicio} - {event.horarioFim}
                          </p>
                        </div>
                      </div>
                      <StatusBadge 
                        variant={event.status === 'realizada' ? 'success' : event.status === 'prevista' ? 'warning' : 'error'}
                      >
                        {event.status === 'realizada' ? 'Realizada' : event.status === 'prevista' ? 'Prevista' : 'Cancelada'}
                      </StatusBadge>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
