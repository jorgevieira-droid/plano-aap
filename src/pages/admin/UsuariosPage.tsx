import { useState, useEffect } from 'react';
import { Search, Shield, Loader2, UserCog, Plus, Trash2, Edit, KeyRound, Eye, EyeOff, Users } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth, AppRole, ProgramaType } from '@/contexts/AuthContext';
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
import { BatchUserUploadDialog } from '@/components/users/BatchUserUploadDialog';

import {
  ALL_ROLES, roleLabelsMap, ROLES_WITH_PROGRAMAS, ROLES_WITH_ENTIDADES,
  needsProgramas, needsEntidades, tierColors, getRoleTierColor, programaLabels,
} from '@/config/roleConfig';

interface UserWithRole {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  created_at: string;
  role: AppRole | null;
  programas: ProgramaType[];
  entidadeIds: string[];
  segmento: string | null;
  componente: string | null;
}

type DialogMode = 'create' | 'edit' | 'role' | 'password' | null;

interface EscolaOption {
  id: string;
  nome: string;
  programa: ProgramaType[] | null;
}

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
  const [batchUploadOpen, setBatchUploadOpen] = useState(false);
  const [escolas, setEscolas] = useState<EscolaOption[]>([]);

  // Form fields
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    password: '',
    role: 'none' as AppRole | 'none',
    programas: [] as ProgramaType[],
    entidadeIds: [] as string[],
    segmento: '',
    componente: '',
  });

  // When programas change, remove entidades that no longer match
  useEffect(() => {
    if (formData.programas.length === 0) {
      if (formData.entidadeIds.length > 0) {
        setFormData(prev => ({ ...prev, entidadeIds: [] }));
      }
      return;
    }
    const validIds = escolas
      .filter(e => e.programa?.some(p => formData.programas.includes(p)))
      .map(e => e.id);
    const filtered = formData.entidadeIds.filter(id => validIds.includes(id));
    if (filtered.length !== formData.entidadeIds.length) {
      setFormData(prev => ({ ...prev, entidadeIds: filtered }));
    }
  }, [formData.programas, escolas]);

  useEffect(() => {
    fetchUsers();
    fetchEscolas();
  }, []);

  const fetchEscolas = async () => {
    const { data } = await supabase.from('escolas').select('id, nome, programa').eq('ativa', true).order('nome');
    setEscolas(data || []);
  };

  const fetchUsers = async () => {
    try {
      const [profilesRes, rolesRes, programasRes, entidadesRes] = await Promise.all([
        supabase.from('profiles').select('*').order('nome'),
        supabase.from('user_roles').select('user_id, role'),
        supabase.from('user_programas').select('user_id, programa'),
        supabase.from('user_entidades').select('user_id, escola_id'),
      ]);

      if (profilesRes.error) throw profilesRes.error;
      if (rolesRes.error) throw rolesRes.error;

      const usersWithRoles: UserWithRole[] = (profilesRes.data || []).map(profile => {
        const userRole = rolesRes.data?.find(r => r.user_id === profile.id);
        const role = userRole?.role as AppRole | null;
        
        const userProgramas = programasRes.data
          ?.filter(p => p.user_id === profile.id)
          .map(p => p.programa as ProgramaType) || [];

        const userEntidades = entidadesRes.data
          ?.filter(e => e.user_id === profile.id)
          .map(e => e.escola_id) || [];
        
        return {
          id: profile.id,
          nome: profile.nome,
          email: profile.email,
          telefone: profile.telefone,
          created_at: profile.created_at,
          role,
          programas: userProgramas,
          entidadeIds: userEntidades,
          segmento: (profile as any).segmento || null,
          componente: (profile as any).componente || null,
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
    setFormData({ nome: '', email: '', telefone: '', password: '', role: 'none', programas: [], entidadeIds: [], segmento: '', componente: '' });
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
        entidadeIds: user.entidadeIds || [],
        segmento: user.segmento || '',
        componente: user.componente || '',
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

  const callManageUsersFunction = async (action: string, params: Record<string, unknown>): Promise<{ success?: boolean; error?: string; user?: unknown }> => {
    try {
      // Force token refresh to avoid stale/expired tokens
      const { data: { session }, error: sessionError } = await supabase.auth.refreshSession();
      if (sessionError || !session) {
        return { error: 'Sessão expirada. Faça login novamente.' };
      }
      const token = session.access_token;

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ action, ...params }),
      });

      const result = await response.json();
      if (!response.ok) {
        return { error: result.error || 'Erro na operação' };
      }
      return result;
    } catch (error) {
      console.error('Network error:', error);
      return { error: 'Erro de conexão. Tente novamente.' };
    }
  };

  const handleCreateUser = async () => {
    if (!formData.nome || !formData.email || !formData.password) {
      toast.error('Preencha nome, email e senha');
      return;
    }

    if (formData.password.length < 9) {
      toast.error('A senha deve ter pelo menos 9 caracteres');
      return;
    }

    if (needsProgramas(formData.role) && formData.programas.length === 0) {
      toast.error('Selecione pelo menos um programa');
      return;
    }

    if (needsEntidades(formData.role) && formData.entidadeIds.length === 0) {
      toast.error('Selecione pelo menos uma entidade');
      return;
    }

    setIsSubmitting(true);
    const result = await callManageUsersFunction('create', {
      email: formData.email,
      password: formData.password,
      nome: formData.nome,
      telefone: formData.telefone || null,
      role: formData.role !== 'none' ? formData.role : null,
      programas: needsProgramas(formData.role) ? formData.programas : null,
      entidadeIds: needsEntidades(formData.role) ? formData.entidadeIds : undefined,
      segmento: formData.segmento || null,
      componente: formData.componente || null,
    });

    if (result.error) {
      toast.error(result.error);
      setIsSubmitting(false);
      return;
    }

    toast.success('Usuário criado com sucesso!');
    closeDialog();
    fetchUsers();
    setIsSubmitting(false);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser || !formData.nome || !formData.email) {
      toast.error('Preencha nome e email');
      return;
    }

    setIsSubmitting(true);
    const result = await callManageUsersFunction('update', {
      userId: selectedUser.id,
      email: formData.email,
      nome: formData.nome,
      telefone: formData.telefone || null,
      segmento: formData.segmento || null,
      componente: formData.componente || null,
    });

    if (result.error) {
      toast.error(result.error);
      setIsSubmitting(false);
      return;
    }

    toast.success('Usuário atualizado com sucesso!');
    closeDialog();
    fetchUsers();
    setIsSubmitting(false);
  };

  const handleSaveRole = async () => {
    if (!selectedUser) return;
    
    if (needsProgramas(formData.role) && formData.programas.length === 0) {
      toast.error('Selecione pelo menos um programa');
      return;
    }

    if (needsEntidades(formData.role) && formData.entidadeIds.length === 0) {
      toast.error('Selecione pelo menos uma entidade');
      return;
    }
    
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

      // Update programas using unified table
      await supabase.from('user_programas').delete().eq('user_id', selectedUser.id);
      if (needsProgramas(formData.role) && formData.programas.length > 0) {
        const programasToInsert = formData.programas.map(p => ({
          user_id: selectedUser.id,
          programa: p,
        }));
        const { error } = await supabase.from('user_programas').insert(programasToInsert);
        if (error) throw error;
      }

      // Update entidades using unified table
      await supabase.from('user_entidades').delete().eq('user_id', selectedUser.id);
      if (needsEntidades(formData.role) && formData.entidadeIds.length > 0) {
        const entidadesToInsert = formData.entidadeIds.map(escolaId => ({
          user_id: selectedUser.id,
          escola_id: escolaId,
        }));
        const { error } = await supabase.from('user_entidades').insert(entidadesToInsert);
        if (error) throw error;
      }

      // Legacy sync: also update old tables for backward compat
      await supabase.from('aap_programas').delete().eq('aap_user_id', selectedUser.id);
      await supabase.from('gestor_programas').delete().eq('gestor_user_id', selectedUser.id);
      await supabase.from('aap_escolas').delete().eq('aap_user_id', selectedUser.id);

      if (formData.role && needsProgramas(formData.role) && formData.programas.length > 0) {
        if (formData.role === 'gestor') {
          await supabase.from('gestor_programas').insert(
            formData.programas.map(p => ({ gestor_user_id: selectedUser.id, programa: p }))
          );
        } else if (['aap_inicial', 'aap_portugues', 'aap_matematica'].includes(formData.role)) {
          await supabase.from('aap_programas').insert(
            formData.programas.map(p => ({ aap_user_id: selectedUser.id, programa: p }))
          );
        }
      }
      if (formData.role && needsEntidades(formData.role) && formData.entidadeIds.length > 0) {
        if (['aap_inicial', 'aap_portugues', 'aap_matematica'].includes(formData.role)) {
          await supabase.from('aap_escolas').insert(
            formData.entidadeIds.map(id => ({ aap_user_id: selectedUser.id, escola_id: id }))
          );
        }
      }

      // Save segmento and componente to profile
      await supabase.from('profiles').update({
        segmento: formData.segmento || null,
        componente: formData.componente || null,
      } as any).eq('id', selectedUser.id);

      toast.success('Papel, programas e entidades atualizados!');
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

    if (formData.password.length < 9) {
      toast.error('A senha deve ter pelo menos 9 caracteres');
      return;
    }

    setIsSubmitting(true);
    const result = await callManageUsersFunction('reset-password', {
      userId: selectedUser.id,
      newPassword: formData.password,
    });

    if (result.error) {
      toast.error(result.error);
      setIsSubmitting(false);
      return;
    }

    toast.success('Senha redefinida com sucesso!');
    closeDialog();
    fetchUsers();
    setIsSubmitting(false);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    setIsSubmitting(true);
    const result = await callManageUsersFunction('delete', { userId: selectedUser.id });

    if (result.error) {
      toast.error(result.error);
      setIsSubmitting(false);
      return;
    }

    toast.success('Usuário excluído com sucesso!');
    setDeleteDialogOpen(false);
    setSelectedUser(null);
    fetchUsers();
    setIsSubmitting(false);
  };

  const getEscolaNome = (escolaId: string) => {
    return escolas.find(e => e.id === escolaId)?.nome || escolaId.slice(0, 8) + '...';
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
            <Badge variant="outline" className={getRoleTierColor(user.role)}>
              {roleLabelsMap[user.role] || user.role}
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-muted text-muted-foreground">
              Sem papel
            </Badge>
          )}
          {user.programas.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {user.programas.map(p => (
                <span key={p} className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                  {p === 'escolas' ? 'Escolas' : p === 'regionais' ? 'Regionais' : 'Redes Mun.'}
                </span>
              ))}
            </div>
          )}
          {user.entidadeIds.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {user.entidadeIds.length} entidade(s)
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'segmento_componente',
      header: 'Segmento / Componente',
      render: (user: UserWithRole) => {
        const seg = user.segmento;
        const comp = user.componente;
        const segLabel: Record<string, string> = {
          anos_iniciais: 'Anos Iniciais', anos_finais: 'Anos Finais',
          ensino_medio: 'Ensino Médio', anos_finais_ensino_medio: 'Anos Finais/EM', nao_se_aplica: 'N/A',
        };
        const compLabel: Record<string, string> = {
          polivalente: 'Polivalente', lingua_portuguesa: 'Língua Port.',
          matematica: 'Matemática', nao_se_aplica: 'N/A',
        };
        if (!seg && !comp) return <span className="text-muted-foreground text-xs">—</span>;
        return (
          <div className="space-y-0.5">
            {seg && <p className="text-xs text-foreground">{segLabel[seg] || seg}</p>}
            {comp && <p className="text-xs text-muted-foreground">{compLabel[comp] || comp}</p>}
          </div>
        );
      },
    },
    ...(isAdmin ? [{
      key: 'actions',
      header: 'Ações',
      className: 'w-48',
      render: (user: UserWithRole) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => openDialog('edit', user)} title="Editar usuário">
            <Edit size={16} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => openDialog('role', user)} title="Alterar papel">
            <Shield size={16} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => openDialog('password', user)} title="Redefinir senha">
            <KeyRound size={16} />
          </Button>
          {user.id !== currentUser?.id && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setSelectedUser(user); setDeleteDialogOpen(true); }}
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

  // Stats by tier
  const tierStats = [
    { label: 'Admin (N1)', count: users.filter(u => u.role === 'admin').length },
    { label: 'Gestores (N2-N3)', count: users.filter(u => ['gestor', 'n3_coordenador_programa'].includes(u.role || '')).length },
    { label: 'Operacionais (N4-N5)', count: users.filter(u => ['n4_1_cped', 'n4_2_gpi', 'n5_formador', 'aap_inicial', 'aap_portugues', 'aap_matematica'].includes(u.role || '')).length },
    { label: 'Locais (N6-N7)', count: users.filter(u => ['n6_coord_pedagogico', 'n7_professor'].includes(u.role || '')).length },
    { label: 'Observadores (N8)', count: users.filter(u => u.role === 'n8_equipe_tecnica').length },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const renderProgramasField = (labelPrefix: string) => (
    <div>
      <Label>{labelPrefix} Programas *</Label>
      <p className="text-xs text-muted-foreground mt-0.5">Selecione pelo menos um programa</p>
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
              className="w-4 h-4 rounded border-border"
            />
            <span className="text-sm">{programaLabels[prog]}</span>
          </label>
        ))}
      </div>
    </div>
  );

  const renderEntidadesField = () => {
    const entidadesFiltradas = escolas.filter(e =>
      formData.programas.length === 0 ? false :
      e.programa?.some(p => formData.programas.includes(p))
    );

    return (
      <div>
        <Label>Entidades vinculadas *</Label>
        <p className="text-xs text-muted-foreground mt-0.5">Selecione as entidades dos programas</p>
        <div className="max-h-40 overflow-y-auto space-y-1 mt-2 border rounded-md p-2">
          {entidadesFiltradas.map(escola => (
            <label key={escola.id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.entidadeIds.includes(escola.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFormData({ ...formData, entidadeIds: [...formData.entidadeIds, escola.id] });
                  } else {
                    setFormData({ ...formData, entidadeIds: formData.entidadeIds.filter(id => id !== escola.id) });
                  }
                }}
                className="w-4 h-4 rounded border-border"
              />
              <span className="text-sm truncate">{escola.nome}</span>
            </label>
          ))}
          {formData.programas.length === 0 && <p className="text-xs text-muted-foreground">Selecione um programa primeiro</p>}
          {formData.programas.length > 0 && entidadesFiltradas.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma entidade encontrada para os programas selecionados</p>}
        </div>
      </div>
    );
  };

  const renderSegmentoComponenteField = () => (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <Label>Segmento</Label>
        <Select
          value={formData.segmento || 'nao_informado'}
          onValueChange={(v) => setFormData({ ...formData, segmento: v === 'nao_informado' ? '' : v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="nao_informado">Não informado</SelectItem>
            <SelectItem value="anos_iniciais">Anos Iniciais</SelectItem>
            <SelectItem value="anos_finais">Anos Finais</SelectItem>
            <SelectItem value="ensino_medio">Ensino Médio</SelectItem>
            <SelectItem value="anos_finais_ensino_medio">Anos Finais / Ensino Médio</SelectItem>
            <SelectItem value="nao_se_aplica">Não se aplica</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Componente</Label>
        <Select
          value={formData.componente || 'nao_informado'}
          onValueChange={(v) => setFormData({ ...formData, componente: v === 'nao_informado' ? '' : v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="nao_informado">Não informado</SelectItem>
            <SelectItem value="polivalente">Polivalente</SelectItem>
            <SelectItem value="lingua_portuguesa">Língua Portuguesa</SelectItem>
            <SelectItem value="matematica">Matemática</SelectItem>
            <SelectItem value="nao_se_aplica">Não se aplica</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderRoleSelect = () => (
    <div>
      <Label>Papel</Label>
      <Select
        value={formData.role}
        onValueChange={(value) => setFormData({ ...formData, role: value as AppRole | 'none', programas: [], entidadeIds: [] })}
      >
        <SelectTrigger>
          <SelectValue placeholder="Selecione um papel" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Sem papel</SelectItem>
          {ALL_ROLES.map(r => (
            <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const getRoleDescription = (role: AppRole | 'none') => {
    switch (role) {
      case 'admin': return 'Acesso total ao sistema, incluindo gestão de usuários e entidades.';
      case 'gestor': case 'n3_coordenador_programa': return 'Gerencia dados e usuários dentro dos programas atribuídos.';
      case 'n4_1_cped': case 'n4_2_gpi': case 'n5_formador':
      case 'aap_inicial': case 'aap_portugues': case 'aap_matematica':
        return 'Registra ações, gerencia professores e presença nas entidades atribuídas.';
      case 'n6_coord_pedagogico': case 'n7_professor': return 'Visualiza dados da sua entidade (somente leitura).';
      case 'n8_equipe_tecnica': return 'Visualiza dados dos programas atribuídos (somente leitura).';
      case 'none': return 'Usuário sem acesso ao sistema.';
      default: return '';
    }
  };

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
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setBatchUploadOpen(true)} className="gap-2">
              <Users size={18} />
              Cadastro em Lote
            </Button>
            <Button onClick={() => openDialog('create')} className="gap-2">
              <Plus size={18} />
              Novo Usuário
            </Button>
          </div>
        )}
      </div>

      {/* Stats by tier */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {tierStats.map(stat => (
          <div key={stat.label} className="card p-4">
            <p className="text-2xl font-bold text-foreground">{stat.count}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
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
        <DialogContent className="w-[95vw] sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {dialogMode === 'create' ? (
                <><Plus className="w-5 h-5 text-primary" /> Novo Usuário</>
              ) : (
                <><Edit className="w-5 h-5 text-primary" /> Editar Usuário</>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="nome">Nome *</Label>
              <Input id="nome" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} placeholder="Nome completo" />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="email@exemplo.com" />
            </div>
            <div>
              <Label htmlFor="telefone">Telefone</Label>
              <Input id="telefone" value={formData.telefone} onChange={(e) => setFormData({ ...formData, telefone: e.target.value })} placeholder="(00) 00000-0000" />
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
                      placeholder="Mínimo 9 caracteres"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                {renderRoleSelect()}
                {needsProgramas(formData.role) && renderProgramasField('')}
                {needsEntidades(formData.role) && renderEntidadesField()}
              </>
            )}
            {renderSegmentoComponenteField()}
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={closeDialog} disabled={isSubmitting} className="flex-1">Cancelar</Button>
              <Button onClick={dialogMode === 'create' ? handleCreateUser : handleUpdateUser} disabled={isSubmitting} className="flex-1">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Salvar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Role Dialog */}
      <Dialog open={dialogMode === 'role'} onOpenChange={() => closeDialog()}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
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
              {renderRoleSelect()}
              {needsProgramas(formData.role) && renderProgramasField('')}
              {needsEntidades(formData.role) && renderEntidadesField()}
              {renderSegmentoComponenteField()}
              <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                <p className="font-medium mb-1">Permissões:</p>
                <p>{getRoleDescription(formData.role)}</p>
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={closeDialog} disabled={isSubmitting} className="flex-1">Cancelar</Button>
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
                    placeholder="Mínimo 9 caracteres"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={closeDialog} disabled={isSubmitting} className="flex-1">Cancelar</Button>
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

      {/* Batch User Upload Dialog */}
      <BatchUserUploadDialog 
        open={batchUploadOpen} 
        onClose={() => setBatchUploadOpen(false)}
        onSuccess={() => {
          setBatchUploadOpen(false);
          fetchUsers();
        }}
      />
    </div>
  );
}
