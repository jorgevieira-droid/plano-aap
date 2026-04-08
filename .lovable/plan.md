

# Filtro de Formadores: ordenar e filtrar por programa do usuário

## Problema
O dropdown de Formadores (N5) lista todos os formadores sem ordem definida e sem considerar o programa do usuário logado.

## Alteração

### `src/pages/admin/ProgramacaoPage.tsx`

**Linhas 2380-2382**: Alterar a lista de formadores para:
1. Filtrar apenas formadores que compartilham pelo menos um programa com o usuário logado (usando `gestorProgramas`, `aapProgramas`, ou todos para admin)
2. Ordenar alfabeticamente por nome

```typescript
// De:
{aaps.filter(u => u.roles.includes('n5_formador')).map(u => (
  <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>
))}

// Para:
{aaps
  .filter(u => {
    if (!u.roles.includes('n5_formador')) return false;
    // Admin vê todos
    if (isAdmin) return true;
    // Filtrar por programas do usuário logado
    const userProgs = gestorProgramas.length > 0 ? gestorProgramas : aapProgramas;
    if (userProgs.length === 0) return true;
    return u.programas.some(p => userProgs.includes(p));
  })
  .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  .map(u => (
    <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>
  ))
}
```

## Arquivo impactado

| Arquivo | Alteração |
|---|---|
| `src/pages/admin/ProgramacaoPage.tsx` | Filtrar formadores por programa do usuário e ordenar A-Z |

