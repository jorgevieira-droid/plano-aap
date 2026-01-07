import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, School, Mail, Phone, Key } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

type AAPRole = 'aap_inicial' | 'aap_portugues' | 'aap_matematica';

interface AAP {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  role: AAPRole;
  escolasIds: string[];
  createdAt?: string;
}

interface Escola {
  id: string;
  nome: string;
  codesc?: string;
  cod_inep?: string;
}

const tipoLabels: Record<AAPRole, string> = {
  aap_inicial: 'AAP / Formador Anos Iniciais',
  aap_portugues: 'AAP / Formador Língua Portuguesa',
  aap_matematica: 'AAP / Formador Matemática',
};

export default function AAPsPage() {
  const [aapsList, setAapsList] = useState<AAP[]>([]);
  const [escolas, setEscolas] = useState<Escola[]>([]);
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
  });

  useEffect(() => {
    fetchAAPs();
    fetchEscolas();
  }, []);

  const fetchEscolas = async () => {
    const { data, error } = await supabase
      .from('escolas')
      .select('id, nome, codesc, cod_inep')
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
        toast.error('Erro ao carregar AAPs');
        return;
      }

      setAapsList(data.users || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao carregar AAPs');
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
      });
    }
    setIsDialogOpen(true);
  };

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
          }
        });

        if (error || data?.error) {
          toast.error(data?.error || 'Erro ao atualizar AAP');
          return;
        }

        toast.success('AAP atualizado com sucesso!');
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
          }
        });

        if (error || data?.error) {
          toast.error(data?.error || 'Erro ao cadastrar AAP');
          return;
        }

        toast.success('AAP cadastrado com sucesso!');
      }

      setIsDialogOpen(false);
      fetchAAPs();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao salvar AAP');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este AAP? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('manage-aap-user', {
        body: { action: 'delete', userId: id }
      });

      if (error || data?.error) {
        toast.error(data?.error || 'Erro ao excluir AAP');
        return;
      }

      toast.success('AAP excluído com sucesso!');
      fetchAAPs();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao excluir AAP');
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
      header: 'AAP / Formador',
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
      key: 'escolas',
      header: 'Escolas',
      render: (aap: AAP) => {
        const escolasVinculadas = escolas.filter(e => aap.escolasIds.includes(e.id));
        return (
          <div className="flex items-center gap-2">
            <School size={16} className="text-muted-foreground" />
            <span className="text-sm">
              {escolasVinculadas.length} escola{escolasVinculadas.length !== 1 ? 's' : ''}
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
          <h1 className="page-header">AAPs / Formadores</h1>
          <p className="page-subtitle">Gerencie os AAPs / Formadores do programa</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <button onClick={() => handleOpenDialog()} className="btn-primary flex items-center gap-2">
              <Plus size={20} />
              Novo AAP / Formador
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingAAP ? 'Editar AAP / Formador' : 'Novo AAP / Formador'}
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
                <div className="col-span-2">
                  <label className="form-label">Escolas Vinculadas</label>
                  {escolas.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-3 border border-border rounded-lg">
                      Nenhuma escola cadastrada. Cadastre escolas primeiro.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto p-3 border border-border rounded-lg">
                      {escolas.map(escola => (
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
          placeholder="Buscar AAPs / Formadores..."
          className="input-field pl-11"
        />
      </div>

      {/* Table */}
      <DataTable
        data={filteredAAPs}
        columns={columns}
        keyExtractor={(aap) => aap.id}
        emptyMessage="Nenhum AAP / Formador cadastrado"
        isLoading={isLoading}
      />
    </div>
  );
}