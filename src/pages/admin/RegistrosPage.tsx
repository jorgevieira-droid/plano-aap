import { useState } from 'react';
import { Search, Eye, Calendar, MapPin, User, MessageSquare, TrendingUp, AlertCircle, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { segmentoLabels, componenteLabels, tipoAcaoLabels } from '@/data/mockData';
import { Segmento, ComponenteCurricular } from '@/types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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

export default function RegistrosPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('todos');
  const [programaFilter, setProgramaFilter] = useState<ProgramaType | 'todos'>('todos');
  const [selectedRegistro, setSelectedRegistro] = useState<RegistroAcaoDB | null>(null);

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
      header: 'Presença',
      render: (registro: RegistroAcaoDB) => {
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
      className: 'w-20',
      render: (registro: RegistroAcaoDB) => (
        <button
          onClick={() => setSelectedRegistro(registro)}
          className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <Eye size={16} />
        </button>
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
      <Dialog open={!!selectedRegistro} onOpenChange={() => setSelectedRegistro(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Registro</DialogTitle>
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

              {/* Presence List */}
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
    </div>
  );
}