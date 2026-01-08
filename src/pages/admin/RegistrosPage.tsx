import { useState } from 'react';
import { Search, Eye, Calendar, MapPin, User, MessageSquare, TrendingUp, AlertCircle, Loader2, Edit, Star, History } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { segmentoLabels, componenteLabels, tipoAcaoLabels, notaAvaliacaoLabels } from '@/data/mockData';
import { Segmento, ComponenteCurricular, NotaAvaliacao } from '@/types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

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
}

interface AlteracaoLog {
  id: string;
  tabela: string;
  registro_id: string;
  usuario_id: string;
  alteracao: any;
  created_at: string;
}

const dimensoesAvaliacao = [
  { key: 'clareza_objetivos', label: 'Clareza dos objetivos' },
  { key: 'dominio_conteudo', label: 'Domínio do conteúdo' },
  { key: 'estrategias_didaticas', label: 'Estratégias didáticas' },
  { key: 'engajamento_turma', label: 'Engajamento da turma' },
  { key: 'gestao_tempo', label: 'Gestão do tempo' },
] as const;

export default function RegistrosPage() {
  const { user, profile, isAdmin, isGestor } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('todos');
  const [programaFilter, setProgramaFilter] = useState<ProgramaType | 'todos'>('todos');
  const [selectedRegistro, setSelectedRegistro] = useState<RegistroAcaoDB | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  
  // Edit form state
  const [editObservacoes, setEditObservacoes] = useState('');
  const [editAvancos, setEditAvancos] = useState('');
  const [editDificuldades, setEditDificuldades] = useState('');

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
    queryKey: ['professores'],
    queryFn: async () => {
      const { data, error } = await supabase.from('professores').select('id, nome');
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

  const isLoading = isLoadingRegistros;

  const getEscolaNome = (escolaId: string) => escolas.find(e => e.id === escolaId)?.nome || '-';
  const getAapNome = (aapId: string) => profiles.find(p => p.id === aapId)?.nome || '-';
  const getProfessorNome = (professorId: string) => professores.find(p => p.id === professorId)?.nome || '-';

  const filteredRegistros = registros.filter(registro => {
    const escola = escolas.find(e => e.id === registro.escola_id);
    const aap = profiles.find(a => a.id === registro.aap_id);
    
    const matchesSearch = 
      escola?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      aap?.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipo = filterTipo === 'todos' || registro.tipo === filterTipo;
    const matchesPrograma = programaFilter === 'todos' || (registro.programa && registro.programa.includes(programaFilter));
    
    return matchesSearch && matchesTipo && matchesPrograma;
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

  const handleOpenEdit = (registro: RegistroAcaoDB) => {
    setSelectedRegistro(registro);
    setEditObservacoes(registro.observacoes || '');
    setEditAvancos(registro.avancos || '');
    setEditDificuldades(registro.dificuldades || '');
    setIsEditing(true);
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
      className: 'w-28',
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
            <button
              onClick={() => handleOpenEdit(registro)}
              className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
              title="Editar"
            >
              <Edit size={16} />
            </button>
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
      <div>
        <h1 className="page-header">Registros de Ações</h1>
        <p className="page-subtitle">Visualize os registros de visitas e formações realizadas</p>
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
      <Dialog open={!!selectedRegistro && !isEditing} onOpenChange={() => setSelectedRegistro(null)}>
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
              </div>

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
              <p className="text-center text-muted-foreground py-8">
                Nenhuma alteração registrada
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}