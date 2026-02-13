import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, MapPin, Upload, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { EscolaUploadDialog } from '@/components/forms/EscolaUploadDialog';
import { Switch } from '@/components/ui/switch';

type ProgramaType = 'escolas' | 'regionais' | 'redes_municipais';

const programaLabels: Record<ProgramaType, string> = {
  escolas: 'Programa de Escolas',
  regionais: 'Programa de Regionais de Ensino',
  redes_municipais: 'Programa de Redes Municipais',
};

interface Escola {
  id: string;
  codesc: string | null;
  cod_inep: string | null;
  nome: string;
  endereco: string | null;
  ativa: boolean;
  created_at: string;
  programa: ProgramaType[] | null;
}

export default function EscolasPage() {
  const { isAdmin, isManager, profile } = useAuth();
  const canManage = isAdmin || isManager;
  const [escolas, setEscolas] = useState<Escola[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [editingEscola, setEditingEscola] = useState<Escola | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterPrograma, setFilterPrograma] = useState('todos');
  const [formData, setFormData] = useState({
    codesc: '',
    cod_inep: '',
    nome: '',
    endereco: '',
    ativa: true,
    programa: ['escolas'] as ProgramaType[],
  });

  // Programs the current user has access to
  const userProgramas = profile?.programas;

  // Auto-select single program for non-admin users
  useEffect(() => {
    if (!isAdmin && userProgramas && userProgramas.length === 1) {
      setFilterPrograma(userProgramas[0]);
    }
  }, [isAdmin, userProgramas]);

  useEffect(() => {
  }, []);

  const fetchEscolas = async () => {
    try {
      const { data, error } = await supabase
        .from('escolas')
        .select('*')
        .order('nome');

      if (error) throw error;
      setEscolas(data || []);
    } catch (error) {
      console.error('Error fetching escolas:', error);
      toast.error('Erro ao carregar escolas');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredEscolas = escolas.filter(escola => {
    const matchesSearch = escola.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      escola.codesc?.includes(searchTerm) ||
      escola.cod_inep?.includes(searchTerm);
    const matchesStatus = showInactive || escola.ativa;
    const matchesPrograma = filterPrograma === 'todos' || escola.programa?.includes(filterPrograma as ProgramaType);
    return matchesSearch && matchesStatus && matchesPrograma;
  });

  const handleOpenDialog = (escola?: Escola) => {
    if (escola) {
      setEditingEscola(escola);
      setFormData({
        codesc: escola.codesc || '',
        cod_inep: escola.cod_inep || '',
        nome: escola.nome,
        endereco: escola.endereco || '',
        ativa: escola.ativa,
        programa: escola.programa || ['escolas'],
      });
    } else {
      setEditingEscola(null);
      setFormData({ codesc: '', cod_inep: '', nome: '', endereco: '', ativa: true, programa: ['escolas'] });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingEscola) {
        const { error } = await supabase
          .from('escolas')
          .update({
            codesc: formData.codesc || null,
            cod_inep: formData.cod_inep || null,
            nome: formData.nome,
            endereco: formData.endereco || null,
            ativa: formData.ativa,
            programa: formData.programa,
          })
          .eq('id', editingEscola.id);

        if (error) throw error;
        toast.success('Escola atualizada com sucesso!');
      } else {
        const { error } = await supabase
          .from('escolas')
          .insert({
            codesc: formData.codesc || null,
            cod_inep: formData.cod_inep || null,
            nome: formData.nome,
            endereco: formData.endereco || null,
            programa: formData.programa,
          });

        if (error) throw error;
        toast.success('Escola cadastrada com sucesso!');
      }

      setIsDialogOpen(false);
      fetchEscolas();
    } catch (error) {
      console.error('Error saving escola:', error);
      toast.error('Erro ao salvar escola');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBatchUpload = async (newEscolas: { codesc: string; codInep: string; nome: string; endereco?: string }[], updateExisting: boolean) => {
    try {
      let insertedCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;

      for (const e of newEscolas) {
        // Check if escola with same CODESC exists
        const { data: existingEscola } = await supabase
          .from('escolas')
          .select('id')
          .eq('codesc', e.codesc)
          .maybeSingle();

        if (existingEscola) {
          if (updateExisting) {
            // Update existing escola
            const { error } = await supabase
              .from('escolas')
              .update({
                cod_inep: e.codInep || null,
                nome: e.nome,
                endereco: e.endereco || null,
              })
              .eq('id', existingEscola.id);

            if (error) throw error;
            updatedCount++;
          } else {
            skippedCount++;
          }
        } else {
          // Insert new escola
          const { error } = await supabase
            .from('escolas')
            .insert({
              codesc: e.codesc || null,
              cod_inep: e.codInep || null,
              nome: e.nome,
              endereco: e.endereco || null,
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
      fetchEscolas();
    } catch (error) {
      console.error('Error batch uploading:', error);
      toast.error('Erro ao importar escolas');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta escola?')) return;

    try {
      const { error } = await supabase
        .from('escolas')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Escola excluída com sucesso!');
      setEscolas(prev => prev.filter(e => e.id !== id));
    } catch (error) {
      console.error('Error deleting escola:', error);
      toast.error('Erro ao excluir escola');
    }
  };

  const columns = [
    {
      key: 'status',
      header: 'Status',
      className: 'w-20',
      render: (escola: Escola) => (
        <div className="flex items-center">
          {escola.ativa ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-success bg-success/10 px-2 py-1 rounded-full">
              <CheckCircle size={12} />
              Ativa
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full">
              <XCircle size={12} />
              Inativa
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'codesc',
      header: 'CODESC',
      render: (escola: Escola) => (
        <span className="font-mono text-sm">{escola.codesc || '-'}</span>
      ),
    },
    {
      key: 'cod_inep',
      header: 'COD_INEP',
      render: (escola: Escola) => (
        <span className="font-mono text-sm">{escola.cod_inep || '-'}</span>
      ),
    },
    {
      key: 'nome',
      header: 'Escola / Regional / Rede',
      render: (escola: Escola) => (
        <div className={!escola.ativa ? 'opacity-60' : ''}>
          <p className="font-medium text-foreground">{escola.nome}</p>
          {escola.endereco && (
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin size={12} />
              {escola.endereco}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'programa',
      header: 'Programas',
      render: (escola: Escola) => (
        <div className="flex flex-wrap gap-1">
          {escola.programa?.map(p => (
            <span key={p} className="inline-flex text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded">
              {p === 'escolas' ? 'Escolas' : p === 'regionais' ? 'Regionais' : 'Redes Mun.'}
            </span>
          )) || '-'}
        </div>
      ),
    },
    ...(canManage ? [{
      key: 'actions',
      header: 'Ações',
      className: 'w-24',
      render: (escola: Escola) => {
        // N2/N3 can only manage entities linked to their programs
        const canEdit = isAdmin || (userProgramas && escola.programa?.some(p => userProgramas.includes(p)));
        if (!canEdit) return null;
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenDialog(escola)}
              className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <Edit2 size={16} />
            </button>
            <button
              onClick={() => handleDelete(escola.id)}
              className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        );
      },
    }] : []),
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="page-header">Entidades</h1>
          <p className="page-subtitle">
            {escolas.length} entidades cadastradas
          </p>
        </div>

        {canManage && (
          <div className="flex gap-3">
            {isAdmin && (
              <button
                onClick={() => setIsUploadDialogOpen(true)}
                className="btn-outline flex items-center gap-2"
              >
                <Upload size={18} />
                Importar Lote
              </button>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <button onClick={() => handleOpenDialog()} className="btn-primary flex items-center gap-2">
                  <Plus size={20} />
                  Nova Entidade
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingEscola ? 'Editar Entidade' : 'Nova Entidade'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">CODESC</label>
                    <input
                      type="text"
                      value={formData.codesc}
                      onChange={(e) => setFormData({ ...formData, codesc: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                      className="input-field font-mono"
                      placeholder="123456"
                      maxLength={6}
                    />
                  </div>
                  <div>
                    <label className="form-label">COD_INEP</label>
                    <input
                      type="text"
                      value={formData.cod_inep}
                      onChange={(e) => setFormData({ ...formData, cod_inep: e.target.value.replace(/\D/g, '').slice(0, 8) })}
                      className="input-field font-mono"
                      placeholder="12345678"
                      maxLength={8}
                    />
                  </div>
                </div>
                <div>
                  <label className="form-label">Nome da Escola *</label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="input-field"
                    placeholder="E.E. Nome da Escola"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Endereço</label>
                  <input
                    type="text"
                    value={formData.endereco}
                    onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                    className="input-field"
                    placeholder="Rua, número - Bairro"
                  />
                </div>
                <div>
                  <label className="form-label">Programas *</label>
                  <div className="space-y-2">
                    {(['escolas', 'regionais', 'redes_municipais'] as ProgramaType[])
                      .filter(prog => isAdmin || !userProgramas || userProgramas.includes(prog))
                      .map(prog => (
                      <label key={prog} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.programa.includes(prog)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, programa: [...formData.programa, prog] });
                            } else {
                              setFormData({ ...formData, programa: formData.programa.filter(p => p !== prog) });
                            }
                          }}
                          className="rounded border-border"
                        />
                        <span className="text-sm">{programaLabels[prog]}</span>
                      </label>
                    ))}
                  </div>
                </div>
                {editingEscola && (
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <label className="form-label mb-0">Escola Ativa</label>
                      <p className="text-xs text-muted-foreground">Desativar mantém o histórico de ações</p>
                    </div>
                    <Switch
                      checked={formData.ativa}
                      onCheckedChange={(checked) => setFormData({ ...formData, ativa: checked })}
                    />
                  </div>
                )}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsDialogOpen(false)}
                    className="btn-outline flex-1"
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      editingEscola ? 'Salvar' : 'Cadastrar'
                    )}
                  </button>
                </div>
              </form>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {/* Upload Dialog */}
      {isAdmin && (
        <EscolaUploadDialog
          open={isUploadDialogOpen}
          onOpenChange={setIsUploadDialogOpen}
          onUpload={handleBatchUpload}
        />
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, CODESC ou COD_INEP..."
            className="input-field pl-11"
          />
        </div>
        <select
          value={filterPrograma}
          onChange={(e) => setFilterPrograma(e.target.value)}
          className="input-field min-w-[200px]"
        >
          {(isAdmin || !userProgramas || userProgramas.length > 1) && (
            <option value="todos">Todos os programas</option>
          )}
          {(!userProgramas || isAdmin || userProgramas.includes('escolas' as ProgramaType)) && (
            <option value="escolas">Programa de Escolas</option>
          )}
          {(!userProgramas || isAdmin || userProgramas.includes('regionais' as ProgramaType)) && (
            <option value="regionais">Regionais de Ensino</option>
          )}
          {(!userProgramas || isAdmin || userProgramas.includes('redes_municipais' as ProgramaType)) && (
            <option value="redes_municipais">Redes Municipais</option>
          )}
        </select>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <Switch
            checked={showInactive}
            onCheckedChange={setShowInactive}
          />
          <span className="text-muted-foreground">Mostrar inativas</span>
        </label>
      </div>

      {/* Table */}
      <DataTable
        data={filteredEscolas}
        columns={columns}
        keyExtractor={(escola) => escola.id}
        emptyMessage="Nenhuma escola encontrada"
      />
    </div>
  );
}
