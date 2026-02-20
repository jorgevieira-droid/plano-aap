
# Exclusão em Lote de Atores Educacionais

## Contexto e padrão existente

O sistema já implementa exclusão em lote na página de Registros (`RegistrosPage.tsx`). O padrão é consistente e bem estruturado, usando:
- Checkboxes na coluna da tabela (via `DataTable` com `header` como função)
- Barra de ação flutuante exibida quando há itens selecionados
- `AlertDialog` de confirmação com contagem dos itens
- Exclusão sequencial das dependências antes de deletar o item principal

A mesma abordagem será aplicada à página de Atores Educacionais (`ProfessoresPage.tsx`).

## Dependências do banco de dados

Ao excluir um professor, é necessário remover primeiro os registros relacionados em ordem:

1. `presencas` → `professor_id`
2. `avaliacoes_aula` → `professor_id`
3. `instrument_responses` → `professor_id`
4. `professores` → exclusão do registro principal

Se essas dependências não forem removidas primeiro, a exclusão falhará por violação de chave estrangeira.

## Controle de permissões

Apenas `isAdminOrGestor` pode excluir professores (igual à exclusão individual já existente). O checkbox e a barra de ação só aparecem para esses perfis.

## Alterações em `src/pages/admin/ProfessoresPage.tsx`

### 1. Novos estados

```typescript
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
const [isBatchDeleting, setIsBatchDeleting] = useState(false);
const [isBatchDeleteDialogOpen, setIsBatchDeleteDialogOpen] = useState(false);
```

### 2. Limpar seleção quando filtros mudam

```typescript
useEffect(() => {
  setSelectedIds(new Set());
}, [searchTerm, filterEscola, filterSegmento, filterPrograma, showInactive]);
```

### 3. Helpers de seleção

```typescript
// IDs deletáveis (apenas os filtrados visíveis)
const deletableFilteredIds = filteredProfessores.map(p => p.id);
const allSelected = deletableFilteredIds.length > 0 && deletableFilteredIds.every(id => selectedIds.has(id));

const handleToggleSelectAll = () => {
  if (allSelected) {
    setSelectedIds(new Set());
  } else {
    setSelectedIds(new Set(deletableFilteredIds));
  }
};

const handleToggleSelect = (id: string) => {
  setSelectedIds(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
};
```

### 4. Função de exclusão em lote

```typescript
const handleBatchDelete = async () => {
  if (selectedIds.size === 0) return;
  setIsBatchDeleting(true);
  let successCount = 0;
  let errorCount = 0;

  for (const id of selectedIds) {
    try {
      // Remover dependências antes do registro principal
      await supabase.from('presencas').delete().eq('professor_id', id);
      await supabase.from('avaliacoes_aula').delete().eq('professor_id', id);
      await supabase.from('instrument_responses').delete().eq('professor_id', id);
      const { error } = await supabase.from('professores').delete().eq('id', id);
      if (error) throw error;
      successCount++;
    } catch (error) {
      console.error(`Error deleting professor ${id}:`, error);
      errorCount++;
    }
  }

  if (successCount > 0) toast.success(`${successCount} ator(es) excluído(s) com sucesso!`);
  if (errorCount > 0) toast.error(`${errorCount} ator(es) não puderam ser excluídos.`);

  setSelectedIds(new Set());
  setIsBatchDeleting(false);
  setIsBatchDeleteDialogOpen(false);
  fetchData();
};
```

### 5. Coluna de checkbox na tabela

Adicionar uma nova coluna no início do array `columns` (condicional a `isAdminOrGestor`):

```typescript
...(isAdminOrGestor ? [{
  key: 'select',
  header: () => (
    <Checkbox
      checked={allSelected}
      onCheckedChange={handleToggleSelectAll}
      aria-label="Selecionar todos"
    />
  ),
  className: 'w-10',
  render: (prof: Professor) => (
    <Checkbox
      checked={selectedIds.has(prof.id)}
      onCheckedChange={() => handleToggleSelect(prof.id)}
      aria-label={`Selecionar ${prof.nome}`}
    />
  ),
}] : []),
```

> Nota: O componente `DataTable` já suporta `header` como função, conforme documentado na memória de arquitetura do projeto.

### 6. Barra de ação flutuante

Exibida acima da tabela quando `selectedIds.size > 0`:

```tsx
{isAdminOrGestor && selectedIds.size > 0 && (
  <div className="flex items-center justify-between gap-4 p-3 mb-3 rounded-lg bg-primary/10 border border-primary/20">
    <span className="text-sm font-medium">
      {selectedIds.size} ator(es) selecionado(s)
    </span>
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
        Limpar seleção
      </Button>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => setIsBatchDeleteDialogOpen(true)}
        disabled={isBatchDeleting}
      >
        <Trash2 size={14} className="mr-1" />
        Excluir selecionados
      </Button>
    </div>
  </div>
)}
```

### 7. AlertDialog de confirmação

```tsx
<AlertDialog open={isBatchDeleteDialogOpen} onOpenChange={setIsBatchDeleteDialogOpen}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Confirmar Exclusão em Lote</AlertDialogTitle>
      <AlertDialogDescription>
        <p>Tem certeza que deseja excluir <strong>{selectedIds.size}</strong> ator(es) educacional(is)?</p>
        <p className="mt-2 text-sm text-destructive">
          Esta ação não pode ser desfeita. Presenças, avaliações e respostas de instrumentos
          vinculadas a estes atores também serão excluídas permanentemente.
        </p>
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel disabled={isBatchDeleting}>Cancelar</AlertDialogCancel>
      <AlertDialogAction
        onClick={handleBatchDelete}
        disabled={isBatchDeleting}
        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
      >
        {isBatchDeleting ? (
          <><Loader2 size={14} className="mr-1 animate-spin" />Excluindo...</>
        ) : (
          `Excluir ${selectedIds.size} ator(es)`
        )}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### 8. Novos imports necessários

```typescript
import { Checkbox } from '@/components/ui/checkbox';
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
```

## Resumo das alterações

| Elemento | Detalhe |
|---|---|
| Arquivo alterado | `src/pages/admin/ProfessoresPage.tsx` |
| Novos estados | `selectedIds`, `isBatchDeleting`, `isBatchDeleteDialogOpen` |
| Coluna checkbox | Adicionada no início, apenas para `isAdminOrGestor` |
| Barra flutuante | Exibida quando `selectedIds.size > 0` |
| Confirmação | `AlertDialog` com contagem e aviso de dependências |
| Dependências deletadas | `presencas`, `avaliacoes_aula`, `instrument_responses` por `professor_id` |
| Permissão | Somente `isAdminOrGestor` (igual à exclusão individual) |
| Sem mudança de banco | Nenhuma migração necessária |
