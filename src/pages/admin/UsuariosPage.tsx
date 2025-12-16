import { useState, useEffect } from 'react';
import { Search, Shield, Loader2, UserCog } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

type AppRole = 'admin' | 'gestor' | 'aap_inicial' | 'aap_portugues' | 'aap_matematica';

interface UserWithRole {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  created_at: string;
  role: AppRole | null;
}

const roleLabels: Record<AppRole, string> = {
  admin: 'Administrador',
  gestor: 'Gestor',
  aap_inicial: 'AAP Anos Iniciais',
  aap_portugues: 'AAP Língua Portuguesa',
  aap_matematica: 'AAP Matemática',
};

const roleColors: Record<AppRole, string> = {
  admin: 'bg-destructive/10 text-destructive border-destructive/20',
  gestor: 'bg-warning/10 text-warning border-warning/20',
  aap_inicial: 'bg-primary/10 text-primary border-primary/20',
  aap_portugues: 'bg-secondary/10 text-secondary-foreground border-secondary/20',
  aap_matematica: 'bg-accent/10 text-accent-foreground border-accent/20',
};

export default function UsuariosPage() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRole, setSelectedRole] = useState<AppRole | 'none'>('none');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('nome');

      if (profilesError) throw profilesError;

      // Fetch all roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Combine profiles with roles
      const usersWithRoles: UserWithRole[] = (profiles || []).map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.id);
        return {
          id: profile.id,
          nome: profile.nome,
          email: profile.email,
          telefone: profile.telefone,
          created_at: profile.created_at,
          role: userRole?.role as AppRole | null,
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenDialog = (user: UserWithRole) => {
    setSelectedUser(user);
    setSelectedRole(user.role || 'none');
    setIsDialogOpen(true);
  };

  const handleSaveRole = async () => {
    if (!selectedUser) return;
    setIsSubmitting(true);

    try {
      if (selectedRole === 'none') {
        // Remove role if exists
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', selectedUser.id);

        if (error) throw error;
      } else {
        // Check if user already has a role
        const { data: existingRole } = await supabase
          .from('user_roles')
          .select('id')
          .eq('user_id', selectedUser.id)
          .maybeSingle();

        if (existingRole) {
          // Update existing role
          const { error } = await supabase
            .from('user_roles')
            .update({ role: selectedRole })
            .eq('user_id', selectedUser.id);

          if (error) throw error;
        } else {
          // Insert new role
          const { error } = await supabase
            .from('user_roles')
            .insert({ user_id: selectedUser.id, role: selectedRole });

          if (error) throw error;
        }
      }

      toast.success('Papel atualizado com sucesso!');
      setIsDialogOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('Error saving role:', error);
      toast.error('Erro ao salvar papel');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    {
      key: 'nome',
      header: 'Usuário',
      render: (user: UserWithRole) => (
        <div>
          <p className="font-medium text-foreground">{user.nome}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      ),
    },
    {
      key: 'telefone',
      header: 'Telefone',
      render: (user: UserWithRole) => (
        <span className="text-muted-foreground">{user.telefone || '-'}</span>
      ),
    },
    {
      key: 'role',
      header: 'Papel',
      render: (user: UserWithRole) => (
        <div>
          {user.role ? (
            <Badge variant="outline" className={roleColors[user.role]}>
              {roleLabels[user.role]}
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-muted text-muted-foreground">
              Sem papel atribuído
            </Badge>
          )}
        </div>
      ),
    },
    ...(isAdmin ? [{
      key: 'actions',
      header: 'Ações',
      className: 'w-32',
      render: (user: UserWithRole) => (
        <button
          onClick={() => handleOpenDialog(user)}
          className="btn-outline text-sm py-1.5 px-3 flex items-center gap-2"
        >
          <Shield size={14} />
          Editar Papel
        </button>
      ),
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
          <h1 className="page-header flex items-center gap-3">
            <UserCog className="w-8 h-8 text-primary" />
            Gestão de Usuários
          </h1>
          <p className="page-subtitle">
            {users.length} usuários cadastrados
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(roleLabels).map(([role, label]) => {
          const count = users.filter(u => u.role === role).length;
          return (
            <div key={role} className="card p-4">
              <p className="text-2xl font-bold text-foreground">{count}</p>
              <p className="text-sm text-muted-foreground">{label}</p>
            </div>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nome ou email..."
          className="input-field pl-11"
        />
      </div>

      {/* Table */}
      <DataTable
        data={filteredUsers}
        columns={columns}
        keyExtractor={(user) => user.id}
        emptyMessage="Nenhum usuário encontrado"
      />

      {/* Edit Role Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Atribuir Papel
            </DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 mt-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="font-medium text-foreground">{selectedUser.nome}</p>
                <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
              </div>

              <div>
                <label className="form-label">Papel do Usuário</label>
                <Select
                  value={selectedRole}
                  onValueChange={(value) => setSelectedRole(value as AppRole | 'none')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um papel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem papel atribuído</SelectItem>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-destructive"></span>
                        Administrador
                      </div>
                    </SelectItem>
                    <SelectItem value="gestor">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-warning"></span>
                        Gestor
                      </div>
                    </SelectItem>
                    <SelectItem value="aap_inicial">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-primary"></span>
                        AAP Anos Iniciais
                      </div>
                    </SelectItem>
                    <SelectItem value="aap_portugues">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-secondary"></span>
                        AAP Língua Portuguesa
                      </div>
                    </SelectItem>
                    <SelectItem value="aap_matematica">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-accent"></span>
                        AAP Matemática
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                <p className="font-medium mb-1">Permissões:</p>
                {selectedRole === 'admin' && (
                  <p>Acesso total ao sistema, incluindo gestão de usuários e escolas.</p>
                )}
                {selectedRole === 'gestor' && (
                  <p>Gerencia AAPs, professores e agendamentos. Não edita escolas.</p>
                )}
                {selectedRole?.startsWith('aap_') && (
                  <p>Visualiza escolas atribuídas, registra ações e consulta histórico.</p>
                )}
                {selectedRole === 'none' && (
                  <p>Usuário sem acesso ao sistema.</p>
                )}
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
                  onClick={handleSaveRole}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Salvar'
                  )}
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
