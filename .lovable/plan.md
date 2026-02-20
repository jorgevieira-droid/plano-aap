
# Exclusão em Lote no Calendário de Programação

## Contexto e padrão existente

A página `ProgramacaoPage.tsx` já possui:
- Exclusão individual via `AlertDialog` (restrita a `isAdmin`, botão de lixeira em cada card)
- Dois modos de visualização: **Calendário** e **Lista**
- O array `filteredProgramacoes` é compartilhado entre as duas views

A exclusão em lote vai seguir o mesmo padrão já implementado em `ProfessoresPage.tsx` e `RegistrosPage.tsx`.

## Permissões

A exclusão individual de programações já é restrita a `isAdmin`. A exclusão em lote seguirá a mesma regra — somente administradores poderão ver e usar essa funcionalidade.

## Dependências do banco de dados

Ao excluir uma programação, é necessário verificar e remover primeiro os registros relacionados:
1. `registros_acao` → `programacao_id` (registros que referenciam a programação)
2. `programacoes` → exclusão do registro principal

## O que será implementado

### Novos estados

```typescript
const [selectedProgramacaoIds, setSelectedProgramacaoIds] = useState<Set<string>>(new Set());
const [isBatchDeleting, setIsBatchDeleting] = useState(false);
const [isBatchDeleteDialogOpen, setIsBatchDeleteDialogOpen] = useState(false);
```

### Limpar seleção quando filtros mudam

```typescript
useEffect(() => {
  setSelectedProgramacaoIds(new Set());
}, [programaFilter, tipoFilter, currentMonth]);
```

### Helpers de seleção

```typescript
const allFilteredIds = filteredProgramacoes.map(p => p.id);
const allSelected = allFilteredIds.length > 0 && allFilteredIds.every(id => selectedProgramacaoIds.has(id));

const handleToggleSelectAll = () => {
  if (allSelected) setSelectedProgramacaoIds(new Set());
  else setSelectedProgramacaoIds(new Set(allFilteredIds));
};

const handleToggleSelect = (id: string) => {
  setSelectedProgramacaoIds(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
};
```

### Função de exclusão em lote

```typescript
const handleBatchDeleteProgramacoes = async () => {
  if (selectedProgramacaoIds.size === 0) return;
  setIsBatchDeleting(true);
  let successCount = 0;
  let errorCount = 0;

  for (const id of selectedProgramacaoIds) {
    try {
      // Desvincular registros_acao que referenciam esta programação
      await supabase.from('registros_acao')
        .update({ programacao_id: null })
        .eq('programacao_id', id);
      
      const { error } = await supabase.from('programacoes').delete().eq('id', id);
      if (error) throw error;
      successCount++;
    } catch (error) {
      console.error(`Error deleting programacao ${id}:`, error);
      errorCount++;
    }
  }

  if (successCount > 0) toast.success(`${successCount} programação(ões) excluída(s) com sucesso!`);
  if (errorCount > 0) toast.error(`${errorCount} programação(ões) não puderam ser excluídas.`);

  setSelectedProgramacaoIds(new Set());
  setIsBatchDeleting(false);
  setIsBatchDeleteDialogOpen(false);
  fetchProgramacoes();
};
```

> Nota: A coluna `programacao_id` em `registros_acao` é nullable, então é seguro definí-la como `null` em vez de excluir o registro. Isso preserva o histórico de ações registradas.

## Onde os checkboxes aparecem

### View de Lista (mais natural para seleção em lote)

A view de lista já é uma tabela HTML com colunas bem definidas. Será adicionado:
- Uma coluna de checkbox no `<th>` com "selecionar todos" filtrados
- Um checkbox por linha no `<td>` correspondente
- A coluna de checkbox só aparece para `isAdmin`

### View de Calendário

No painel lateral direito ("Ações do dia selecionado"), cada card de evento receberá um checkbox no canto superior esquerdo. Isso permite ao admin selecionar programações específicas dia a dia.

### Barra de ação flutuante

Exibida acima do conteúdo (tanto no modo calendário quanto no modo lista) quando há itens selecionados:

```tsx
{isAdmin && selectedProgramacaoIds.size > 0 && (
  <div className="flex items-center justify-between gap-4 p-3 mb-3 rounded-lg bg-primary/10 border border-primary/20">
    <span className="text-sm font-medium">
      {selectedProgramacaoIds.size} programação(ões) selecionada(s)
    </span>
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm" onClick={() => setSelectedProgramacaoIds(new Set())}>
        Limpar seleção
      </Button>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => setIsBatchDeleteDialogOpen(true)}
        disabled={isBatchDeleting}
      >
        <Trash2 size={14} className="mr-1" />
        Excluir selecionadas
      </Button>
    </div>
  </div>
)}
```

### AlertDialog de confirmação

```tsx
<AlertDialog open={isBatchDeleteDialogOpen} onOpenChange={setIsBatchDeleteDialogOpen}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Confirmar Exclusão em Lote</AlertDialogTitle>
      <AlertDialogDescription>
        Tem certeza que deseja excluir {selectedProgramacaoIds.size} programação(ões)?
        Esta ação não pode ser desfeita. Os registros de ações vinculados serão desvinculados
        mas não excluídos.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel disabled={isBatchDeleting}>Cancelar</AlertDialogCancel>
      <AlertDialogAction
        onClick={handleBatchDeleteProgramacoes}
        disabled={isBatchDeleting}
        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
      >
        {isBatchDeleting ? (
          <><Loader2 size={14} className="mr-1 animate-spin" />Excluindo...</>
        ) : (
          `Excluir ${selectedProgramacaoIds.size} programação(ões)`
        )}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

## Resumo das alterações

| Elemento | Detalhe |
|---|---|
| Arquivo alterado | `src/pages/admin/ProgramacaoPage.tsx` |
| Novos estados | `selectedProgramacaoIds`, `isBatchDeleting`, `isBatchDeleteDialogOpen` |
| Coluna checkbox | Adicionada na view de lista; checkboxes nos cards da view de calendário |
| Barra flutuante | Exibida em ambas as views quando `selectedProgramacaoIds.size > 0` |
| Confirmação | `AlertDialog` com contagem e aviso sobre desvinculação de registros |
| Dependências | `registros_acao.programacao_id` definido como `null` (preserva histórico) |
| Permissão | Somente `isAdmin` (igual à exclusão individual) |
| Sem migração | Nenhuma mudança de schema necessária |
