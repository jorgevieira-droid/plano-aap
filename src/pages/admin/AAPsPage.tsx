import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, School, Mail, Phone, Key } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
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

type AAPRole = 'aap_inicial' | 'aap_portugues' | 'aap_matematica';
type ProgramaType = 'escolas' | 'regionais' | 'redes_municipais';

interface AAP {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  role: AAPRole;
  escolasIds: string[];
  programas?: ProgramaType[];
  createdAt?: string;
}

interface Escola {
  id: string;
  nome: string;
  codesc?: string;
  cod_inep?: string;
  programa?: ProgramaType[];
}

const tipoLabels: Record<AAPRole, string> = {
  aap_inicial: 'Consultor / Gestor / Formador Anos Iniciais',
  aap_portugues: 'Consultor / Gestor / Formador Língua Portuguesa',
  aap_matematica: 'Consultor / Gestor / Formador Matemática',
};

const programaLabels: Record<ProgramaType, string> = {
  escolas: 'Programa de Escolas',
  regionais: 'Regionais de Ensino',
  redes_municipais: 'Redes Municipais',
};

export default function AAPsPage() {
  const { isAdmin, isGestor, user } = useAuth();
  const [aapsList, setAapsList] = useState<AAP[]>([]);
  const [escolas, setEscolas] = useState<Escola[]>([]);
  const [gestorProgramas, setGestorProgramas] = useState<ProgramaType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAAP, setEditingAAP] = useState<AAP | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    telefone: '',
    tipo: 'aap_inicial' as AAPRole,
    escolasIds: [] as string[],
    programas: [] as ProgramaType[],
  });

  useEffect(() => {
    fetchGestorProgramas();
    fetchAAPs();
    fetchEscolas();
  }, []);

  const fetchGestorProgramas = async () => {
    if (!user || isAdmin) return;
    
    const { data, error } = await supabase
      .from('gestor_programas')
      .select('programa')
      .eq('gestor_user_id', user.id);
    
    if (!error && data) {
      setGestorProgramas(data.map(p => p.programa as ProgramaType));
    }
  };

  const fetchEscolas = async () => {
    const { data, error } = await supabase
      .from('escolas')
      .select('id, nome, codesc, cod_inep, programa')
      .order('nome');

    if (error) {
      console.error('Error fetching escolas:', error);
      return;
    }

    setEscolas(data || []);
  };

  const fetchAAPs = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-aap-user', {
        body: { action: 'list' }
      });

      if (error) {
        console.error('Error fetching AAPs:', error);
        toast.error('Erro ao carregar consultores/gestores/formadores');
        return;
      }

      setAapsList(data.users || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao carregar consultores/gestores/formadores');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAAPs = aapsList.filter(aap =>
    aap.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    aap.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenDialog = (aap?: AAP) => {
    if (aap) {
      setEditingAAP(aap);
      setFormData({
        nome: aap.nome,
        email: aap.email,
        senha: '',
        telefone: aap.telefone || '',
        tipo: aap.role,
        escolasIds: aap.escolasIds,
        programas: aap.programas || (isGestor && !isAdmin ? gestorProgramas : ['escolas']),
      });
    } else {
      setEditingAAP(null);
      setFormData({
        nome: '',
        email: '',
        senha: '',
        telefone: '',
        tipo: 'aap_inicial',
        escolasIds: [],
        programas: isGestor && !isAdmin ? gestorProgramas : ['escolas'],
      });
    }
    setIsDialogOpen(true);
  };

  // Filter escolas based on gestor's programa AND selected programas in form
  const availableEscolas = (isAdmin ? escolas : escolas.filter(e => e.programa?.some(p => gestorProgramas.includes(p))))
    .filter(e => formData.programas.length === 0 ? false : e.programa?.some(p => formData.programas.includes(p)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingAAP) {
        const { data, error } = await supabase.functions.invoke('manage-aap-user', {
          body: {
            action: 'update',
            userId: editingAAP.id,
            email: formData.email,
            password: formData.senha || undefined,
            nome: formData.nome,
            telefone: formData.telefone,
            role: formData.tipo,
            escolasIds: formData.escolasIds,
            programas: formData.programas,
          }
        });

        if (error || data?.error) {
          toast.error(data?.error || 'Erro ao atualizar consultor/gestor/formador');
          return;
        }

        toast.success('Consultor/Gestor/Formador atualizado com sucesso!');
      } else {
        if (!formData.senha) {
          toast.error('Senha é obrigatória para novos usuários');
          return;
        }

        const { data, error } = await supabase.functions.invoke('manage-aap-user', {
          body: {
            action: 'create',
            email: formData.email,
            password: formData.senha,
            nome: formData.nome,
            telefone: formData.telefone,
            role: formData.tipo,
            escolasIds: formData.escolasIds,
            programas: formData.programas,
          }
        });

        if (error || data?.error) {
          toast.error(data?.error || 'Erro ao cadastrar consultor/gestor/formador');
          return;
        }

        toast.success('Consultor/Gestor/Formador cadastrado com sucesso!');
      }

      setIsDialogOpen(false);
      fetchAAPs();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao salvar consultor/gestor/formador');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este consultor/gestor/formador? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('manage-aap-user', {
        body: { action: 'delete', userId: id }
      });

      if (error || data?.error) {
        toast.error(data?.error || 'Erro ao excluir consultor/gestor/formador');
        return;
      }

      toast.success('Consultor/Gestor/Formador excluído com sucesso!');
      fetchAAPs();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao excluir consultor/gestor/formador');
    }
  };

  const handleEscolaToggle = (escolaId: string) => {
    setFormData(prev => ({
      ...prev,
      escolasIds: prev.escolasIds.includes(escolaId)
        ? prev.escolasIds.filter(id => id !== escolaId)
        : [...prev.escolasIds, escolaId]
    }));
  };

  const columns = [
    {
      key: 'nome',
      header: 'Consultor / Gestor / Formador',
      render: (aap: AAP) => (
        <div>
          <p className="font-medium text-foreground">{aap.nome}</p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Mail size={12} />
              {aap.email}
            </span>
            {aap.telefone && (
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Phone size={12} />
                {aap.telefone}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'tipo',
      header: 'Tipo',
      render: (aap: AAP) => {
        const variant = aap.role === 'aap_inicial' ? 'success' : 
                        aap.role === 'aap_portugues' ? 'primary' : 'warning';
        return <StatusBadge variant={variant}>{tipoLabels[aap.role]}</StatusBadge>;
      },
    },
    {
      key: 'programas',
      header: 'Programas',
      render: (aap: AAP) => (
        <div className="flex flex-wrap gap-1">
          {aap.programas?.map(p => (
            <span key={p} className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
              {p === 'escolas' ? 'Escolas' : p === 'regionais' ? 'Regionais' : 'Redes Mun.'}
            </span>
          )) || <span className="text-xs text-muted-foreground">-</span>}
        </div>
      ),
    },
    {
      key: 'escolas',
      header: 'Entidades',
      render: (aap: AAP) => {
        const escolasVinculadas = escolas.filter(e => aap.escolasIds.includes(e.id));
        return (
          <div className="flex items-center gap-2">
            <School size={16} className="text-muted-foreground" />
            <span className="text-sm">
              {escolasVinculadas.length} entidade{escolasVinculadas.length !== 1 ? 's' : ''}
            </span>
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Ações',
      className: 'w-24',
      render: (aap: AAP) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenDialog(aap)}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Editar"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => handleDelete(aap.id)}
            className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            title="Excluir"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="page-header">Consultores / Gestores / Formadores</h1>
          <p className="page-subtitle">Gerencie os Consultores / Gestores / Formadores do programa</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <button onClick={() => handleOpenDialog()} className="btn-primary flex items-center gap-2">
              <Plus size={20} />
              Novo Consultor / Gestor / Formador
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg w-[95vw] max-w-[95vw] sm:w-auto max-h-[85vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle>
                {editingAAP ? 'Editar Consultor / Gestor / Formador' : 'Novo Consultor / Gestor / Formador'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="form-label">Nome *</label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="input-field"
                    placeholder="Nome completo"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input-field"
                    placeholder="email@programa.edu.br"
                    required
                  />
                </div>
                <div>
                  <label className="form-label flex items-center gap-2">
                    <Key size={14} />
                    Senha {editingAAP ? '(deixe vazio para manter)' : '*'}
                  </label>
                  <input
                    type="password"
                    value={formData.senha}
                    onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                    className="input-field"
                    placeholder="••••••••"
                    required={!editingAAP}
                    minLength={6}
                  />
                </div>
                <div>
                  <label className="form-label">Telefone</label>
                  <input
                    type="tel"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    className="input-field"
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div>
                  <label className="form-label">Tipo *</label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value as AAPRole })}
                    className="input-field"
                    required
                  >
                    {Object.entries(tipoLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                {isAdmin && (
                  <div className="col-span-2">
                    <label className="form-label">Programas *</label>
                    <div className="grid grid-cols-1 gap-2 p-3 border border-border rounded-lg">
                      {(Object.entries(programaLabels) as [ProgramaType, string][]).map(([value, label]) => (
                        <label 
                          key={value} 
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={formData.programas.includes(value)}
                            onChange={() => {
                              setFormData(prev => {
                                const newProgramas = prev.programas.includes(value)
                                  ? prev.programas.filter(p => p !== value)
                                  : [...prev.programas, value];
                                // Remove escolasIds that no longer match any selected programa
                                const validEscolas = escolas
                                  .filter(e => newProgramas.length > 0 && e.programa?.some(p => newProgramas.includes(p)))
                                  .map(e => e.id);
                                const newEscolasIds = prev.escolasIds.filter(id => validEscolas.includes(id));
                                return { ...prev, programas: newProgramas, escolasIds: newEscolasIds };
                              });
                            }}
                            className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                          />
                          <span className="text-sm">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                <div className="col-span-2">
                  <label className="form-label">Entidades Vinculadas</label>
                  {formData.programas.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-3 border border-border rounded-lg">
                      Selecione um programa primeiro.
                    </p>
                  ) : availableEscolas.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-3 border border-border rounded-lg">
                      Nenhuma entidade disponível para os programas selecionados.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto p-3 border border-border rounded-lg">
                      {availableEscolas.map(escola => (
                        <label 
                          key={escola.id} 
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={formData.escolasIds.includes(escola.id)}
                            onChange={() => handleEscolaToggle(escola.id)}
                            className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                          />
                          <span className="text-sm">{escola.nome}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
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
                  className="btn-primary flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Salvando...' : editingAAP ? 'Salvar' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar Consultores / Gestores / Formadores..."
          className="input-field pl-11"
        />
      </div>

      {/* Table */}
      <DataTable
        data={filteredAAPs}
        columns={columns}
        keyExtractor={(aap) => aap.id}
        emptyMessage="Nenhum Consultor / Gestor / Formador cadastrado"
        isLoading={isLoading}
      />
    </div>
  );
}