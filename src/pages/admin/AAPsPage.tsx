import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, School, Mail, Phone } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { aaps as initialAaps, escolas } from '@/data/mockData';
import { AAP } from '@/types';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const tipoLabels = {
  anos_iniciais: 'Anos Iniciais',
  lingua_portuguesa: 'Língua Portuguesa',
  matematica: 'Matemática',
};

export default function AAPsPage() {
  const [aapsList, setAapsList] = useState<AAP[]>(initialAaps);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAAP, setEditingAAP] = useState<AAP | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    tipo: 'anos_iniciais' as 'anos_iniciais' | 'lingua_portuguesa' | 'matematica',
    escolasIds: [] as string[],
  });

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
        telefone: aap.telefone || '',
        tipo: aap.tipo,
        escolasIds: aap.escolasIds,
      });
    } else {
      setEditingAAP(null);
      setFormData({
        nome: '',
        email: '',
        telefone: '',
        tipo: 'anos_iniciais',
        escolasIds: [],
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingAAP) {
      setAapsList(prev => prev.map(aap =>
        aap.id === editingAAP.id
          ? { ...aap, ...formData }
          : aap
      ));
      toast.success('AAP atualizado com sucesso!');
    } else {
      const newAAP: AAP = {
        id: String(Date.now()),
        ...formData,
        userId: String(Date.now()),
        createdAt: new Date(),
      };
      setAapsList(prev => [...prev, newAAP]);
      toast.success('AAP cadastrado com sucesso!');
    }
    
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este AAP?')) {
      setAapsList(prev => prev.filter(aap => aap.id !== id));
      toast.success('AAP excluído com sucesso!');
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
      header: 'AAP',
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
        const variant = aap.tipo === 'anos_iniciais' ? 'success' : 
                        aap.tipo === 'lingua_portuguesa' ? 'primary' : 'warning';
        return <StatusBadge variant={variant}>{tipoLabels[aap.tipo]}</StatusBadge>;
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
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => handleDelete(aap.id)}
            className="p-2 rounded-lg hover:bg-error/10 text-muted-foreground hover:text-error transition-colors"
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
          <h1 className="page-header">Assistentes de Apoio Pedagógico</h1>
          <p className="page-subtitle">Gerencie os AAPs do programa</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <button onClick={() => handleOpenDialog()} className="btn-primary flex items-center gap-2">
              <Plus size={20} />
              Novo AAP
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingAAP ? 'Editar AAP' : 'Novo AAP'}
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
                  <label className="form-label">Telefone</label>
                  <input
                    type="tel"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    className="input-field"
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div className="col-span-2">
                  <label className="form-label">Tipo *</label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value as typeof formData.tipo })}
                    className="input-field"
                    required
                  >
                    {Object.entries(tipoLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="form-label">Escolas Vinculadas *</label>
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
                  {editingAAP ? 'Salvar' : 'Cadastrar'}
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
          placeholder="Buscar AAPs..."
          className="input-field pl-11"
        />
      </div>

      {/* Table */}
      <DataTable
        data={filteredAAPs}
        columns={columns}
        keyExtractor={(aap) => aap.id}
        emptyMessage="Nenhum AAP encontrado"
      />
    </div>
  );
}
