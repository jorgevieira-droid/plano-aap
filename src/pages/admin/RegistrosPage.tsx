import { useState } from 'react';
import { Search, Eye, Calendar, MapPin, User, MessageSquare, TrendingUp, AlertCircle } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { registrosAcao, programacoes, escolas, aaps, professores, presencas, segmentoLabels, componenteLabels } from '@/data/mockData';
import { RegistroAcao } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function RegistrosPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('todos');
  const [selectedRegistro, setSelectedRegistro] = useState<RegistroAcao | null>(null);

  const filteredRegistros = registrosAcao.filter(registro => {
    const escola = escolas.find(e => e.id === registro.escolaId);
    const aap = aaps.find(a => a.id === registro.aapId);
    
    const matchesSearch = 
      escola?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      aap?.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipo = filterTipo === 'todos' || registro.tipo === filterTipo;
    
    return matchesSearch && matchesTipo;
  });

  const getPresencasForRegistro = (registroId: string) => {
    return presencas.filter(p => p.registroAcaoId === registroId);
  };

  const columns = [
    {
      key: 'data',
      header: 'Data',
      render: (registro: RegistroAcao) => (
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-muted-foreground" />
          <span>{format(new Date(registro.data), "dd/MM/yyyy", { locale: ptBR })}</span>
        </div>
      ),
    },
    {
      key: 'tipo',
      header: 'Tipo',
      render: (registro: RegistroAcao) => (
        <StatusBadge variant={registro.tipo === 'formacao' ? 'primary' : 'info'}>
          {registro.tipo === 'formacao' ? 'Formação' : 'Visita'}
        </StatusBadge>
      ),
    },
    {
      key: 'escola',
      header: 'Escola',
      render: (registro: RegistroAcao) => {
        const escola = escolas.find(e => e.id === registro.escolaId);
        return (
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-muted-foreground" />
            <span className="text-sm">{escola?.nome || '-'}</span>
          </div>
        );
      },
    },
    {
      key: 'aap',
      header: 'AAP',
      render: (registro: RegistroAcao) => {
        const aap = aaps.find(a => a.id === registro.aapId);
        return (
          <div className="flex items-center gap-2">
            <User size={16} className="text-muted-foreground" />
            <span className="text-sm">{aap?.nome || '-'}</span>
          </div>
        );
      },
    },
    {
      key: 'segmento',
      header: 'Segmento',
      render: (registro: RegistroAcao) => (
        <span className="text-sm">{segmentoLabels[registro.segmento]} - {registro.anoSerie}</span>
      ),
    },
    {
      key: 'presenca',
      header: 'Presença',
      render: (registro: RegistroAcao) => {
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
      render: (registro: RegistroAcao) => (
        <button
          onClick={() => setSelectedRegistro(registro)}
          className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <Eye size={16} />
        </button>
      ),
    },
  ];

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
        <select
          value={filterTipo}
          onChange={(e) => setFilterTipo(e.target.value)}
          className="input-field w-full md:w-48"
        >
          <option value="todos">Todos os tipos</option>
          <option value="formacao">Formações</option>
          <option value="visita">Visitas</option>
        </select>
      </div>

      {/* Table */}
      <DataTable
        data={filteredRegistros}
        columns={columns}
        keyExtractor={(registro) => registro.id}
        emptyMessage="Nenhum registro encontrado"
      />

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
                    {selectedRegistro.tipo === 'formacao' ? 'Formação' : 'Visita'}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Data</p>
                  <p className="font-medium">
                    {format(new Date(selectedRegistro.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Escola</p>
                  <p className="font-medium">
                    {escolas.find(e => e.id === selectedRegistro.escolaId)?.nome}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">AAP</p>
                  <p className="font-medium">
                    {aaps.find(a => a.id === selectedRegistro.aapId)?.nome}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Segmento</p>
                  <p className="font-medium">{segmentoLabels[selectedRegistro.segmento]}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Ano/Série</p>
                  <p className="font-medium">{selectedRegistro.anoSerie}</p>
                </div>
              </div>

              {/* Presence List */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <User size={18} className="text-primary" />
                  Lista de Presença
                </h4>
                <div className="border border-border rounded-lg overflow-hidden">
                  {getPresencasForRegistro(selectedRegistro.id).map(presenca => {
                    const professor = professores.find(p => p.id === presenca.professorId);
                    return (
                      <div 
                        key={presenca.id}
                        className="flex items-center justify-between p-3 border-b border-border last:border-0"
                      >
                        <span className="text-sm">{professor?.nome}</span>
                        <StatusBadge variant={presenca.presente ? 'success' : 'error'}>
                          {presenca.presente ? 'Presente' : 'Ausente'}
                        </StatusBadge>
                      </div>
                    );
                  })}
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
