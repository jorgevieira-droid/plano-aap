import { useState, useEffect, useMemo } from 'react';
import { Search, Loader2, Shield, KeyRound, Users, Eye, EyeOff, Building2 } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth, AppRole, ProgramaType } from '@/contexts/AuthContext';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ALL_ROLES, roleLabelsMap, getRoleTierColor, getRoleLevel,
  getMinVisibleLevel, canManageOthers, needsProgramas, needsEntidades,
  programaLabels, tierColors,
} from '@/config/roleConfig';

interface ActorUser {
  id: string;
  nome: string;
  email: string;
  role: AppRole | null;
  programas: ProgramaType[];
  entidadeIds: string[];
  segmento: string | null;
  componente: string | null;
}

interface EscolaOption {
  id: string;
  nome: string;
  programa: ProgramaType[] | null;
}

type DialogMode = 'role' | 'password' | 'entidades' | null;

export default function AtoresProgramaPage() {
  const { profile, isAdmin, user: currentUser } = useAuth();
  const [users, setUsers] = useState<ActorUser[]>([]);
  const [escolas, setEscolas] = useState<EscolaOption[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterPrograma, setFilterPrograma] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<ActorUser | null>(null);
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    role: 'none' as AppRole | 'none',
    programas: [] as ProgramaType[],
    entidadeIds: [] as string[],
    password: '',
    segmento: '',
    componente: '',
  });

  const myLevel = getRoleLevel(profile?.role as AppRole | null);
  const minVisible = getMinVisibleLevel(myLevel);
  const iCanManage = canManageOthers(myLevel);

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
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [profilesRes, rolesRes, programasRes, entidadesRes, escolasRes] = await Promise.all([
        supabase.from('profiles').select('id, nome, email, segmento, componente').order('nome'),
        supabase.from('user_roles').select('user_id, role'),
        supabase.from('user_programas').select('user_id, programa'),
        supabase.from('user_entidades').select('user_id, escola_id'),
        supabase.from('escolas').select('id, nome, programa').eq('ativa', true).order('nome'),
      ]);

      if (profilesRes.error) throw profilesRes.error;

      const usersData: ActorUser[] = (profilesRes.data || []).map(p => {
        const userRole = rolesRes.data?.find(r => r.user_id === p.id);
        return {
          id: p.id,
          nome: p.nome,
          email: p.email,
          role: (userRole?.role as AppRole) || null,
          programas: programasRes.data?.filter(x => x.user_id === p.id).map(x => x.programa as ProgramaType) || [],
          entidadeIds: entidadesRes.data?.filter(x => x.user_id === p.id).map(x => x.escola_id) || [],
          segmento: (p as any).segmento || null,
          componente: (p as any).componente || null,
        };
      });

      setUsers(usersData);
      setEscolas(escolasRes.data || []);
    } catch (error) {
      console.error('Error fetching actors:', error);
      toast.error('Erro ao carregar atores');
    } finally {
      setIsLoading(false);
    }
  };

  const myProgramas = profile?.programas || [];
  const myEntidades = profile?.entidadeIds || [];

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      // Don't show self
      if (u.id === currentUser?.id) return false;

      const uLevel = getRoleLevel(u.role);

      // Level visibility
      if (uLevel < minVisible) return false;

      // For N2/N3: filter by shared programs
      if (myLevel >= 2 && myLevel <= 3 && !isAdmin) {
        const sharedProg = u.programas.some(p => myProgramas.includes(p));
        if (!sharedProg && u.programas.length > 0) return false;
      }

      // For N4-N8: filter by shared programs AND entidades
      if (myLevel >= 4) {
        const sharedProg = u.programas.some(p => myProgramas.includes(p));
        const sharedEnt = u.entidadeIds.some(e => myEntidades.includes(e));
        if (!sharedProg && u.programas.length > 0) return false;
        if (!sharedEnt && u.entidadeIds.length > 0) return false;
      }

      // Search filter
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        if (!u.nome.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
      }

      // Role filter
      if (filterRole !== 'all' && u.role !== filterRole) return false;

      // Programa filter
      if (filterPrograma !== 'all' && !u.programas.includes(filterPrograma as ProgramaType)) return false;

      return true;
    });
  }, [users, searchTerm, filterRole, filterPrograma, minVisible, myLevel, isAdmin, myProgramas, myEntidades, currentUser?.id]);

  // Visible roles for the filter dropdown
  const visibleRoles = ALL_ROLES.filter(r => r.level >= minVisible && !r.value.startsWith('aap_'));

  const getEscolaNome = (id: string) => escolas.find(e => e.id === id)?.nome || id.slice(0, 8) + '...';

  const openDialog = (mode: DialogMode, user: ActorUser) => {
    setSelectedUser(user);
    setFormData({
      role: user.role || 'none',
      programas: user.programas || [],
      entidadeIds: user.entidadeIds || [],
      password: '',
      segmento: user.segmento || '',
      componente: user.componente || '',
    });
    setShowPassword(false);
    setDialogMode(mode);
  };

  const closeDialog = () => {
    setDialogMode(null);
    setSelectedUser(null);
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
        await supabase.from('user_roles').delete().eq('user_id', selectedUser.id);
      } else {
        const { data: existing } = await supabase.from('user_roles').select('id').eq('user_id', selectedUser.id).maybeSingle();
        if (existing) {
          await supabase.from('user_roles').update({ role: formData.role }).eq('user_id', selectedUser.id);
        } else {
          await supabase.from('user_roles').insert({ user_id: selectedUser.id, role: formData.role });
        }
      }

      // Update programas
      await supabase.from('user_programas').delete().eq('user_id', selectedUser.id);
      if (needsProgramas(formData.role) && formData.programas.length > 0) {
        await supabase.from('user_programas').insert(
          formData.programas.map(p => ({ user_id: selectedUser.id, programa: p }))
        );
      }

      // Update entidades
      await supabase.from('user_entidades').delete().eq('user_id', selectedUser.id);
      if (needsEntidades(formData.role) && formData.entidadeIds.length > 0) {
        await supabase.from('user_entidades').insert(
          formData.entidadeIds.map(id => ({ user_id: selectedUser.id, escola_id: id }))
        );
      }

      // Legacy sync
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

      toast.success('Papel atualizado com sucesso!');
      closeDialog();
      fetchData();
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
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.refreshSession();
      if (sessionError || !session) {
        toast.error('Sessão expirada. Faça login novamente.');
        return;
      }
      const token = session.access_token;

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ action: 'reset-password', userId: selectedUser.id, newPassword: formData.password }),
      });

      const result = await response.json();
      if (!response.ok) {
        toast.error(result.error || 'Erro ao redefinir senha');
        return;
      }

      toast.success('Senha redefinida com sucesso!');
      closeDialog();
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error('Erro ao redefinir senha');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEntidades = async () => {
    if (!selectedUser) return;

    if (formData.entidadeIds.length === 0) {
      toast.error('Selecione pelo menos uma entidade');
      return;
    }

    setIsSubmitting(true);
    try {
      await supabase.from('user_entidades').delete().eq('user_id', selectedUser.id);
      await supabase.from('user_entidades').insert(
        formData.entidadeIds.map(id => ({ user_id: selectedUser.id, escola_id: id }))
      );

      // Legacy sync for aap_escolas
      if (['aap_inicial', 'aap_portugues', 'aap_matematica'].includes(selectedUser.role || '')) {
        await supabase.from('aap_escolas').delete().eq('aap_user_id', selectedUser.id);
        await supabase.from('aap_escolas').insert(
          formData.entidadeIds.map(id => ({ aap_user_id: selectedUser.id, escola_id: id }))
        );
      }

      toast.success('Entidades atualizadas com sucesso!');
      closeDialog();
      fetchData();
    } catch (error) {
      console.error('Error saving entidades:', error);
      toast.error('Erro ao salvar entidades');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    {
      key: 'nome',
      header: 'Ator',
      render: (u: ActorUser) => (
        <div>
          <p className="font-medium text-foreground">{u.nome}</p>
          <p className="text-sm text-muted-foreground">{u.email}</p>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Papel',
      render: (u: ActorUser) => (
        <Badge variant="outline" className={getRoleTierColor(u.role)}>
          {u.role ? (roleLabelsMap[u.role] || u.role) : 'Sem papel'}
        </Badge>
      ),
    },
    {
      key: 'programas',
      header: 'Programas',
      render: (u: ActorUser) => (
        <div className="flex flex-wrap gap-1">
          {u.programas.length > 0 ? u.programas.map(p => (
            <span key={p} className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
              {p === 'escolas' ? 'Escolas' : p === 'regionais' ? 'Regionais' : 'Redes Mun.'}
            </span>
          )) : <span className="text-xs text-muted-foreground">—</span>}
        </div>
      ),
    },
    {
      key: 'entidades',
      header: 'Entidades',
      render: (u: ActorUser) => (
        <div className="max-w-[200px]">
          {u.entidadeIds.length > 0 ? (
            <p className="text-xs text-muted-foreground truncate" title={u.entidadeIds.map(getEscolaNome).join(', ')}>
              {u.entidadeIds.length} entidade(s)
            </p>
          ) : <span className="text-xs text-muted-foreground">—</span>}
        </div>
      ),
    },
    {
      key: 'segmento_componente',
      header: 'Segmento / Componente',
      render: (u: ActorUser) => {
        const segLabel: Record<string, string> = {
          anos_iniciais: 'Anos Iniciais', anos_finais: 'Anos Finais',
          ensino_medio: 'Ensino Médio', anos_finais_ensino_medio: 'Anos Finais/EM', nao_se_aplica: 'N/A',
        };
        const compLabel: Record<string, string> = {
          polivalente: 'Polivalente', lingua_portuguesa: 'Língua Port.',
          matematica: 'Matemática', nao_se_aplica: 'N/A',
        };
        if (!u.segmento && !u.componente) return <span className="text-muted-foreground text-xs">—</span>;
        return (
          <div className="space-y-0.5">
            {u.segmento && <p className="text-xs text-foreground">{segLabel[u.segmento] || u.segmento}</p>}
            {u.componente && <p className="text-xs text-muted-foreground">{compLabel[u.componente] || u.componente}</p>}
          </div>
        );
      },
    },
    ...(iCanManage || profile?.role === 'n4_2_gpi' ? [{
      key: 'actions',
      header: 'Ações',
      className: 'w-32',
      render: (u: ActorUser) => {
        const targetLevel = getRoleLevel(u.role);
        const canManage = iCanManage && (myLevel === 1 || targetLevel >= myLevel);
        const isGpi = profile?.role === 'n4_2_gpi';
        const targetIsCped = u.role === 'n4_1_cped';
        const sharesProgram = u.programas.some(p => myProgramas.includes(p));
        const canEditEntidades = isGpi && targetIsCped && sharesProgram;

        if (!canManage && !canEditEntidades) return null;
        return (
          <div className="flex items-center gap-1">
            {canManage && (
              <>
                <Button variant="ghost" size="sm" onClick={() => openDialog('role', u)} title="Alterar papel">
                  <Shield size={16} />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => openDialog('password', u)} title="Redefinir senha">
                  <KeyRound size={16} />
                </Button>
              </>
            )}
            {canEditEntidades && (
              <Button variant="ghost" size="sm" onClick={() => openDialog('entidades', u)} title="Alterar entidades">
                <Building2 size={16} />
              </Button>
            )}
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

  const renderProgramasField = () => (
    <div>
      <Label>Programas *</Label>
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

  const renderEntidadesField = () => {
    const entidadesFiltradas = escolas.filter(e =>
      formData.programas.length === 0 ? false :
      e.programa?.some(p => formData.programas.includes(p))
    );

    return (
      <div>
        <Label>Entidades vinculadas *</Label>
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="page-header flex items-center gap-3">
          <Users className="w-8 h-8 text-primary" />
          Atores dos Programas
        </h1>
        <p className="page-subtitle">
          {filteredUsers.length} ator(es) visível(is)
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome ou email..."
            className="input-field pl-11"
          />
        </div>
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Filtrar por papel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os papéis</SelectItem>
            {visibleRoles.map(r => (
              <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterPrograma} onValueChange={setFilterPrograma}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por programa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os programas</SelectItem>
            {(isAdmin ? ['escolas', 'regionais', 'redes_municipais'] : myProgramas).map(p => (
              <SelectItem key={p} value={p}>
                {p === 'escolas' ? 'Escolas' : p === 'regionais' ? 'Regionais' : 'Redes Municipais'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <DataTable
        data={filteredUsers}
        columns={columns}
        keyExtractor={(u) => u.id}
        emptyMessage="Nenhum ator encontrado para seus filtros"
      />

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
                    {ALL_ROLES.filter(r => !r.value.startsWith('aap_')).map(r => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {needsProgramas(formData.role) && renderProgramasField()}
              {needsEntidades(formData.role) && renderEntidadesField()}
              {renderSegmentoComponenteField()}
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

      {/* Password Dialog */}
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

      {/* Entidades Dialog (GPI → CPed) */}
      <Dialog open={dialogMode === 'entidades'} onOpenChange={() => closeDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Alterar Entidades
            </DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 mt-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="font-medium text-foreground">{selectedUser.nome}</p>
                <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
              </div>
              {(() => {
                const entidadesFiltradas = escolas.filter(e =>
                  selectedUser.programas.length === 0 ? false :
                  e.programa?.some(p => selectedUser.programas.includes(p))
                );
                return (
                  <div>
                    <Label>Entidades vinculadas *</Label>
                    <div className="max-h-60 overflow-y-auto space-y-1 mt-2 border rounded-md p-2">
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
                      {entidadesFiltradas.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma entidade encontrada para os programas do CPed</p>}
                    </div>
                  </div>
                );
              })()}
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={closeDialog} disabled={isSubmitting} className="flex-1">Cancelar</Button>
                <Button onClick={handleSaveEntidades} disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Salvar'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
