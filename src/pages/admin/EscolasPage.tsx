import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, MapPin, Phone, User } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { escolas as initialEscolas } from '@/data/mockData';
import { Escola } from '@/types';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function EscolasPage() {
  const [escolas, setEscolas] = useState<Escola[]>(initialEscolas);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEscola, setEditingEscola] = useState<Escola | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    endereco: '',
    telefone: '',
    diretor: '',
  });

  const filteredEscolas = escolas.filter(escola =>
    escola.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    escola.diretor?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenDialog = (escola?: Escola) => {
    if (escola) {
      setEditingEscola(escola);
      setFormData({
        nome: escola.nome,
        endereco: escola.endereco || '',
        telefone: escola.telefone || '',
        diretor: escola.diretor || '',
      });
    } else {
      setEditingEscola(null);
      setFormData({ nome: '', endereco: '', telefone: '', diretor: '' });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingEscola) {
      setEscolas(prev => prev.map(escola =>
        escola.id === editingEscola.id
          ? { ...escola, ...formData }
          : escola
      ));
      toast.success('Escola atualizada com sucesso!');
    } else {
      const newEscola: Escola = {
        id: String(Date.now()),
        ...formData,
        createdAt: new Date(),
      };
      setEscolas(prev => [...prev, newEscola]);
      toast.success('Escola cadastrada com sucesso!');
    }
    
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta escola?')) {
      setEscolas(prev => prev.filter(escola => escola.id !== id));
      toast.success('Escola excluída com sucesso!');
    }
  };

  const columns = [
    {
      key: 'nome',
      header: 'Escola',
      render: (escola: Escola) => (
        <div>
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
      key: 'diretor',
      header: 'Diretor(a)',
      render: (escola: Escola) => (
        <div className="flex items-center gap-2">
          <User size={16} className="text-muted-foreground" />
          <span>{escola.diretor || '-'}</span>
        </div>
      ),
    },
    {
      key: 'telefone',
      header: 'Telefone',
      render: (escola: Escola) => (
        <div className="flex items-center gap-2">
          <Phone size={16} className="text-muted-foreground" />
          <span>{escola.telefone || '-'}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      className: 'w-24',
      render: (escola: Escola) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenDialog(escola)}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => handleDelete(escola.id)}
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
          <h1 className="page-header">Escolas</h1>
          <p className="page-subtitle">Gerencie as escolas do programa</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <button onClick={() => handleOpenDialog()} className="btn-primary flex items-center gap-2">
              <Plus size={20} />
              Nova Escola
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingEscola ? 'Editar Escola' : 'Nova Escola'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <label className="form-label">Nome da Escola *</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="input-field"
                  placeholder="E.M. Nome da Escola"
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
                  placeholder="Rua, número, bairro"
                />
              </div>
              <div>
                <label className="form-label">Telefone</label>
                <input
                  type="tel"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  className="input-field"
                  placeholder="(11) 1234-5678"
                />
              </div>
              <div>
                <label className="form-label">Diretor(a)</label>
                <input
                  type="text"
                  value={formData.diretor}
                  onChange={(e) => setFormData({ ...formData, diretor: e.target.value })}
                  className="input-field"
                  placeholder="Nome do diretor(a)"
                />
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
                  {editingEscola ? 'Salvar' : 'Cadastrar'}
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
          placeholder="Buscar escolas..."
          className="input-field pl-11"
        />
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
