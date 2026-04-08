

# Ordenar dropdowns de Consultores e GPIs alfabeticamente

## Alteração

### `src/pages/admin/ProgramacaoPage.tsx`

**Linha 2404**: Adicionar `.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))` antes do `.map()` no filtro de Consultores.

**Linha 2419**: Adicionar `.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))` antes do `.map()` no filtro de GPIs.

```typescript
// Consultores (linha 2404)
{aaps.filter(u => u.roles.includes('n4_1_cped'))
  .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  .map(u => (
    <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>
  ))}

// GPIs (linha 2419)
{aaps.filter(u => u.roles.includes('n4_2_gpi'))
  .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  .map(u => (
    <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>
  ))}
```

| Arquivo | Alteração |
|---|---|
| `src/pages/admin/ProgramacaoPage.tsx` | Ordenar A-Z os dropdowns de Consultor e GPI |

