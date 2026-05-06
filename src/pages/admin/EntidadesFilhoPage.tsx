import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth, ProgramaType } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Search, Building2, Upload } from 'lucide-react';
import { EntidadeFilhoUploadDialog } from '@/components/forms/EntidadeFilhoUploadDialog';

interface EntidadeFilho {
  id: string;
  escola_id: string;
  codesc_filho: string;
  nome: string;
  ativa: boolean;
  created_at: string;
  escolas?: { id: string; nome: string; codesc: string | null; programa: ProgramaType[] | null } | null;
}

const programaLabels: Record<ProgramaType, string> = {
  escolas: 'Programa de Escolas',
  regionais: 'Regionais de Ensino',
  redes_municipais: 'Redes Municipais',
};

interface FormData {
  codesc_pai: string;
  codesc_filho: string;
  nome: string;
  ativa: boolean;
}

const initialFormData: FormData = { codesc_pai: '', codesc_filho: '', nome: '', ativa: true };

export default function EntidadesFilhoPage() {
  const { isAdmin, isGestor, hasRole, profile, isSimulating, effectiveProgramas } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [parentFilter, setParentFilter] = useState('todos');
  const [filterPrograma, setFilterPrograma] = useState<string>('todos');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [resolvedEscola, setResolvedEscola] = useState<{ id: string; nome: string } | null>(null);
  const [lookupError, setLookupError] = useState('');

  const userProgramas = isSimulating && effectiveProgramas ? effectiveProgramas : profile?.programas;
  const effectiveIsAdmin = isAdmin && !(isSimulating && effectiveProgramas && effectiveProgramas.length > 0);

  // Show program filter only for admins or users with multiple programs.
  const showProgramaFilter = effectiveIsAdmin || (userProgramas && userProgramas.length > 1);

  const { data: entidades = [], isLoading } = useQuery({
    queryKey: ['entidades_filho'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('entidades_filho')
        .select('*, escolas(id, nome, codesc, programa)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as EntidadeFilho[];
    },
  });

  const parentOptions = useMemo(() => {
    const map = new Map<string, { id: string; nome: string; codesc: string | null; programa: ProgramaType[] | null }>();
    entidades.forEach((e) => {
      if (e.escolas?.id) map.set(e.escolas.id, e.escolas);
    });
    return Array.from(map.values()).sort((a, b) =>
      (a.nome || '').localeCompare(b.nome || '', 'pt-BR', { sensitivity: 'base' }),
    );
  }, [entidades]);

  const filtered = useMemo(() => {
    return entidades.filter((e) => {
      if (!showInactive && !e.ativa) return false;
      if (parentFilter !== 'todos' && e.escola_id !== parentFilter) return false;
      if (filterPrograma !== 'todos' && !e.escolas?.programa?.includes(filterPrograma as ProgramaType)) return false;
      if (!search) return true;
      const s = search.toLowerCase();
      return (
        e.codesc_filho?.toLowerCase().includes(s) ||
        e.nome?.toLowerCase().includes(s) ||
        e.escolas?.codesc?.toLowerCase().includes(s) ||
        e.escolas?.nome?.toLowerCase().includes(s)
      );
    });
  }, [entidades, parentFilter, filterPrograma, search, showInactive]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!resolvedEscola) throw new Error('Entidade pai não encontrada');
      const payload = {
        escola_id: resolvedEscola.id,
        codesc_filho: formData.codesc_filho.trim(),
        nome: formData.nome.trim(),
        ativa: formData.ativa,
      };
      if (editingId) {
        const { error } = await supabase.from('entidades_filho').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('entidades_filho').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entidades_filho'] });
      toast.success(editingId ? 'Entidade filho atualizada' : 'Entidade filho criada');
      closeDialog();
    },
    onError: (err: any) => toast.error(err?.message || err?.details || 'Erro ao salvar entidade filho'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('entidades_filho').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entidades_filho'] });
      toast.success('Entidade filho excluída');
      setDeleteId(null);
    },
    onError: (err: any) => toast.error(err.message || 'Erro ao excluir'),
  });

  const lookupEscola = async (codesc: string) => {
    setLookupError('');
    setResolvedEscola(null);
    if (!codesc.trim()) return;
    const { data, error } = await supabase
      .from('escolas')
      .select('id, nome, codesc')
      .eq('codesc', codesc.trim())
      .limit(1);
    if (error) { setLookupError(error.message || 'Erro ao buscar a Entidade Pai'); return; }
    const escola = data?.[0];
    if (!escola) { setLookupError('Nenhuma Entidade Pai encontrada com este CODESC no seu escopo'); return; }
    setResolvedEscola({ id: escola.id, nome: escola.nome });
  };

  const openCreate = () => {
    setEditingId(null);
    setFormData(initialFormData);
    setResolvedEscola(null);
    setLookupError('');
    setDialogOpen(true);
  };

  const openEdit = (e: EntidadeFilho) => {
    setEditingId(e.id);
    setFormData({
      codesc_pai: e.escolas?.codesc || '',
      codesc_filho: e.codesc_filho,
      nome: e.nome,
      ativa: e.ativa,
    });
    setResolvedEscola(e.escolas ? { id: e.escolas.id, nome: e.escolas.nome } : null);
    setLookupError('');
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setFormData(initialFormData);
    setResolvedEscola(null);
    setLookupError('');
  };

  const canSave = resolvedEscola && formData.codesc_filho.trim() && formData.nome.trim();

  const handleBatchUpload = async (items: { codesc_pai: string; codesc_filho: string; nome: string }[]) => {
    try {
      // Collect unique CODESC_PAI values
      const uniqueCodescs = [...new Set(items.map(i => i.codesc_pai))];
      const { data: escolas, error: lookupErr } = await supabase
        .from('escolas')
        .select('id, codesc')
        .in('codesc', uniqueCodescs);
      if (lookupErr) throw lookupErr;

      const codescMap = new Map((escolas || []).map(e => [e.codesc, e.id]));
      const toInsert: { escola_id: string; codesc_filho: string; nome: string }[] = [];
      const notFound: string[] = [];

      for (const item of items) {
        const escolaId = codescMap.get(item.codesc_pai);
        if (!escolaId) {
          notFound.push(item.codesc_pai);
          continue;
        }
        toInsert.push({ escola_id: escolaId, codesc_filho: item.codesc_filho, nome: item.nome });
      }

      if (toInsert.length === 0) {
        toast.error('Nenhum CODESC pai encontrado no banco');
        return;
      }

      const { error } = await supabase.from('entidades_filho').insert(toInsert);
      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['entidades_filho'] });
      const msg = `${toInsert.length} entidade(s) filho importada(s)`;
      if (notFound.length > 0) {
        toast.warning(`${msg}. ${notFound.length} CODESC pai não encontrado(s): ${[...new Set(notFound)].join(', ')}`);
      } else {
        toast.success(msg);
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao importar em lote');
    }
  };

  if (!isAdmin && !isGestor && !hasRole('n3_coordenador_programa')) {
    return <div className="p-8 text-center text-muted-foreground">Acesso restrito.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Entidades Filho</h1>
          <p className="text-sm text-muted-foreground">Gerencie as sub-entidades vinculadas às entidades pai</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setUploadOpen(true)}>
            <Upload className="mr-2 h-4 w-4" /> Importar em Lote
          </Button>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Nova Entidade Filho
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por CODESC ou nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={parentFilter} onValueChange={setParentFilter}>
          <SelectTrigger className="w-full sm:w-[280px]">
            <SelectValue placeholder="Entidade Pai" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas as Entidades Pai</SelectItem>
            {parentOptions.map((parent) => (
              <SelectItem key={parent.id} value={parent.id}>
                {parent.codesc ? `${parent.codesc} - ${parent.nome}` : parent.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {showProgramaFilter && (
          <Select value={filterPrograma} onValueChange={setFilterPrograma}>
            <SelectTrigger className="w-full sm:w-[220px]">
              <SelectValue placeholder="Programa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os programas</SelectItem>
              {(['escolas', 'regionais', 'redes_municipais'] as ProgramaType[])
                .filter((p) => effectiveIsAdmin || !userProgramas || userProgramas.includes(p))
                .map((p) => (
                  <SelectItem key={p} value={p}>{programaLabels[p]}</SelectItem>
                ))}
            </SelectContent>
          </Select>
        )}
        <div className="flex items-center gap-2">
          <Switch id="show-inactive" checked={showInactive} onCheckedChange={setShowInactive} />
          <Label htmlFor="show-inactive" className="text-sm">Mostrar inativos</Label>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>CODESC Pai</TableHead>
              <TableHead>Nome Pai</TableHead>
              <TableHead>CODESC Filho</TableHead>
              <TableHead>Nome Filho</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma entidade filho encontrada</TableCell></TableRow>
            ) : (
              filtered.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-mono text-sm">{e.escolas?.codesc || '—'}</TableCell>
                  <TableCell>{e.escolas?.nome || '—'}</TableCell>
                  <TableCell className="font-mono text-sm">{e.codesc_filho}</TableCell>
                  <TableCell>{e.nome}</TableCell>
                  <TableCell>
                    <Badge variant={e.ativa ? 'default' : 'secondary'}>
                      {e.ativa ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(e)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(e.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar' : 'Nova'} Entidade Filho</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>CODESC da Entidade Pai</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Digite o CODESC"
                  value={formData.codesc_pai}
                  onChange={(e) => setFormData({ ...formData, codesc_pai: e.target.value })}
                  onBlur={() => lookupEscola(formData.codesc_pai)}
                />
                <Button variant="outline" size="icon" onClick={() => lookupEscola(formData.codesc_pai)} title="Buscar">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              {resolvedEscola && (
                <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm">
                  <Building2 className="h-4 w-4 text-primary" />
                  <span className="font-medium">{resolvedEscola.nome}</span>
                </div>
              )}
              {lookupError && <p className="text-sm text-destructive">{lookupError}</p>}
            </div>

            <div className="space-y-2">
              <Label>CODESC Filho</Label>
              <Input
                placeholder="Código da entidade filho"
                value={formData.codesc_filho}
                onChange={(e) => setFormData({ ...formData, codesc_filho: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Nome da Entidade Filho</Label>
              <Input
                placeholder="Nome completo"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={formData.ativa} onCheckedChange={(v) => setFormData({ ...formData, ativa: v })} />
              <Label>Ativa</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={!canSave || saveMutation.isPending}>
              {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir entidade filho?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita. Considere desativar ao invés de excluir.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <EntidadeFilhoUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onUpload={handleBatchUpload}
      />
    </div>
  );
}
