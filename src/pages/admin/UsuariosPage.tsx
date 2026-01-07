import { useState, useEffect } from 'react';
import { Search, Shield, Loader2, UserCog, Plus, Trash2, Edit, KeyRound, Eye, EyeOff } from 'lucide-react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type AppRole = 'admin' | 'gestor' | 'aap_inicial' | 'aap_portugues' | 'aap_matematica';
type ProgramaType = 'escolas' | 'regionais' | 'redes_municipais';

const programaLabels: Record<ProgramaType, string> = {
  escolas: 'Programa de Escolas',
  regionais: 'Regionais de Ensino',
  redes_municipais: 'Redes Municipais',
};

interface UserWithRole {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  created_at: string;
  role: AppRole | null;
  programas: ProgramaType[];
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

type DialogMode = 'create' | 'edit' | 'role' | 'password' | null;

export default function UsuariosPage() {
  const { isAdmin, user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form fields
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    password: '',
    role: 'none' as AppRole | 'none',
    programas: [] as ProgramaType[],
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const [profilesRes, rolesRes, programasRes] = await Promise.all([
        supabase.from('profiles').select('*').order('nome'),
        supabase.from('user_roles').select('user_id, role'),
        supabase.from('aap_programas').select('aap_user_id, programa'),
      ]);

      if (profilesRes.error) throw profilesRes.error;
      if (rolesRes.error) throw rolesRes.error;
      if (programasRes.error) throw programasRes.error;

      const usersWithRoles: UserWithRole[] = (profilesRes.data || []).map(profile => {
        const userRole = rolesRes.data?.find(r => r.user_id === profile.id);
        const userProgramas = programasRes.data
          ?.filter(p => p.aap_user_id === profile.id)
          .map(p => p.programa as ProgramaType) || [];
        return {
          id: profile.id,
          nome: profile.nome,
          email: profile.email,
          telefone: profile.telefone,
          created_at: profile.created_at,
          role: userRole?.role as AppRole | null,
          programas: userProgramas,
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

  const resetForm = () => {
    setFormData({ nome: '', email: '', telefone: '', password: '', role: 'none', programas: [] });
    setShowPassword(false);
  };

  const openDialog = (mode: DialogMode, user?: UserWithRole) => {
    if (user) {
      setSelectedUser(user);
      setFormData({
        nome: user.nome,
        email: user.email,
        telefone: user.telefone || '',
        password: '',
        role: user.role || 'none',
        programas: user.programas || [],
      });
    } else {
      setSelectedUser(null);
      resetForm();
    }
    setDialogMode(mode);
  };

  const closeDialog = () => {
    setDialogMode(null);
    setSelectedUser(null);
    resetForm();
  };

  const callManageUsersFunction = async (action: string, params: Record<string, unknown>) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ action, ...params }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Erro na operação');
    }
    return result;
  };

  const handleCreateUser = async () => {
    if (!formData.nome || !formData.email || !formData.password) {
      toast.error('Preencha nome, email e senha');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setIsSubmitting(true);
    try {
      await callManageUsersFunction('create', {
        email: formData.email,
        password: formData.password,
        nome: formData.nome,
        telefone: formData.telefone || null,
        role: formData.role !== 'none' ? formData.role : null,
      });

      toast.success('Usuário criado com sucesso!');
      closeDialog();
      fetchUsers();
    } catch (error: unknown) {
      console.error('Error creating user:', error);
      const message = error instanceof Error ? error.message : 'Erro ao criar usuário';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser || !formData.nome || !formData.email) {
      toast.error('Preencha nome e email');
      return;
    }

    setIsSubmitting(true);
    try {
      await callManageUsersFunction('update', {
        userId: selectedUser.id,
        email: formData.email,
        nome: formData.nome,
        telefone: formData.telefone || null,
      });

      toast.success('Usuário atualizado com sucesso!');
      closeDialog();
      fetchUsers();
    } catch (error: unknown) {
      console.error('Error updating user:', error);
      const message = error instanceof Error ? error.message : 'Erro ao atualizar usuário';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveRole = async () => {
    if (!selectedUser) return;
    setIsSubmitting(true);

    try {
      // Update role
      if (formData.role === 'none') {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', selectedUser.id);
        if (error) throw error;
      } else {
        const { data: existingRole } = await supabase
          .from('user_roles')
          .select('id')
          .eq('user_id', selectedUser.id)
          .maybeSingle();

        if (existingRole) {
          const { error } = await supabase
            .from('user_roles')
            .update({ role: formData.role })
            .eq('user_id', selectedUser.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('user_roles')
            .insert({ user_id: selectedUser.id, role: formData.role });
          if (error) throw error;
        }
      }

      // Update programas for AAP users
      if (formData.role?.startsWith('aap_')) {
        // Delete existing programas
        await supabase
          .from('aap_programas')
          .delete()
          .eq('aap_user_id', selectedUser.id);

        // Insert new programas
        if (formData.programas.length > 0) {
          const programasToInsert = formData.programas.map(p => ({
            aap_user_id: selectedUser.id,
            programa: p,
          }));
          const { error } = await supabase
            .from('aap_programas')
            .insert(programasToInsert);
          if (error) throw error;
        }
      } else {
        // Remove programas if not AAP
        await supabase
          .from('aap_programas')
          .delete()
          .eq('aap_user_id', selectedUser.id);
      }

      toast.success('Papel e programas atualizados com sucesso!');
      closeDialog();
      fetchUsers();
    } catch (error) {
      console.error('Error saving role:', error);
      toast.error('Erro ao salvar papel');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser || !formData.password) {
      toast.error('Digite a nova senha');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setIsSubmitting(true);
    try {
      await callManageUsersFunction('reset-password', {
        userId: selectedUser.id,
        newPassword: formData.password,
      });

      toast.success('Senha redefinida com sucesso!');
      closeDialog();
    } catch (error: unknown) {
      console.error('Error resetting password:', error);
      const message = error instanceof Error ? error.message : 'Erro ao redefinir senha';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    setIsSubmitting(true);
    try {
      await callManageUsersFunction('delete', { userId: selectedUser.id });

      toast.success('Usuário excluído com sucesso!');
      setDeleteDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: unknown) {
      console.error('Error deleting user:', error);
      const message = error instanceof Error ? error.message : 'Erro ao excluir usuário';
      toast.error(message);
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
        <div className="space-y-1">
          {user.role ? (
            <Badge variant="outline" className={roleColors[user.role]}>
              {roleLabels[user.role]}
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-muted text-muted-foreground">
              Sem papel
            </Badge>
          )}
          {user.role?.startsWith('aap_') && user.programas.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {user.programas.map(p => (
                <span key={p} className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                  {p === 'escolas' ? 'Escolas' : p === 'regionais' ? 'Regionais' : 'Redes Mun.'}
                </span>
              ))}
            </div>
          )}
        </div>
      ),
    },
    ...(isAdmin ? [{
      key: 'actions',
      header: 'Ações',
      className: 'w-48',
      render: (user: UserWithRole) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openDialog('edit', user)}
            title="Editar usuário"
          >
            <Edit size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openDialog('role', user)}
            title="Alterar papel"
          >
            <Shield size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openDialog('password', user)}
            title="Redefinir senha"
          >
            <KeyRound size={16} />
          </Button>
          {user.id !== currentUser?.id && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedUser(user);
                setDeleteDialogOpen(true);
              }}
              title="Excluir usuário"
              className="text-destructive hover:text-destructive"
            >
              <Trash2 size={16} />
            </Button>
          )}
        </div>
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
        {isAdmin && (
          <Button onClick={() => openDialog('create')} className="gap-2">
            <Plus size={18} />
            Novo Usuário
          </Button>
        )}
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

      {/* Create/Edit User Dialog */}
      <Dialog open={dialogMode === 'create' || dialogMode === 'edit'} onOpenChange={() => closeDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {dialogMode === 'create' ? (
                <>
                  <Plus className="w-5 h-5 text-primary" />
                  Novo Usuário
                </>
              ) : (
                <>
                  <Edit className="w-5 h-5 text-primary" />
                  Editar Usuário
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Nome completo"
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
              />
            </div>
            <div>
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>
            {dialogMode === 'create' && (
              <>
                <div>
                  <Label htmlFor="password">Senha *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Mínimo 6 caracteres"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div>
                  <Label>Papel (opcional)</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData({ ...formData, role: value as AppRole | 'none' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um papel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem papel</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="gestor">Gestor</SelectItem>
                      <SelectItem value="aap_inicial">AAP Anos Iniciais</SelectItem>
                      <SelectItem value="aap_portugues">AAP Língua Portuguesa</SelectItem>
                      <SelectItem value="aap_matematica">AAP Matemática</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={closeDialog} disabled={isSubmitting} className="flex-1">
                Cancelar
              </Button>
              <Button
                onClick={dialogMode === 'create' ? handleCreateUser : handleUpdateUser}
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Salvar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Role Dialog */}
      <Dialog open={dialogMode === 'role'} onOpenChange={() => closeDialog()}>
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
                <Label>Papel do Usuário</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value as AppRole | 'none' })}
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
              {formData.role?.startsWith('aap_') && (
                <div>
                  <Label>Programas do AAP</Label>
                  <div className="space-y-2 mt-2">
                    {(['escolas', 'regionais', 'redes_municipais'] as ProgramaType[]).map(prog => (
                      <label key={prog} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.programas.includes(prog)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, programas: [...formData.programas, prog] });
                            } else {
                              setFormData({ ...formData, programas: formData.programas.filter(p => p !== prog) });
                            }
                          }}
                          className="rounded border-border"
                        />
                        <span className="text-sm">{programaLabels[prog]}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                <p className="font-medium mb-1">Permissões:</p>
                {formData.role === 'admin' && (
                  <p>Acesso total ao sistema, incluindo gestão de usuários e escolas.</p>
                )}
                {formData.role === 'gestor' && (
                  <p>Gerencia AAPs, professores e agendamentos. Não edita escolas.</p>
                )}
                {formData.role?.startsWith('aap_') && (
                  <p>Visualiza escolas atribuídas, registra ações e consulta histórico.</p>
                )}
                {formData.role === 'none' && (
                  <p>Usuário sem acesso ao sistema.</p>
                )}
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={closeDialog} disabled={isSubmitting} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={handleSaveRole} disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Salvar'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={dialogMode === 'password'} onOpenChange={() => closeDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-primary" />
              Redefinir Senha
            </DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 mt-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="font-medium text-foreground">{selectedUser.nome}</p>
                <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
              </div>
              <div>
                <Label htmlFor="newPassword">Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={closeDialog} disabled={isSubmitting} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={handleResetPassword} disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Redefinir'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o usuário <strong>{selectedUser?.nome}</strong>? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
