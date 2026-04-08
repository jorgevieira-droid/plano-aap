

# Tornar filtro de Formador visível para N5

## Situação atual
O filtro "Formador (N5)" já existe no painel de programação (linhas 2372-2385), mas está restrito a usuários com nível <= 4 (`getRoleLevel(...) <= 4`), o que exclui o próprio N5 de visualizá-lo.

## Alteração

### `src/pages/admin/ProgramacaoPage.tsx`

**Linha 2373**: Alterar a condição de visibilidade de `<= 4` para `<= 5`, permitindo que formadores (N5) também vejam e utilizem o filtro para buscar ações de outros formadores responsáveis.

```
getRoleLevel(profile?.role ?? null) <= 4
→
getRoleLevel(profile?.role ?? null) <= 5
```

Nenhuma outra alteração necessária — a lógica de filtragem (`formadorFilter !== 'todos' && p.aap_id !== formadorFilter`) e a lista de formadores (`aaps.filter(u => u.roles.includes('n5_formador'))`) já funcionam corretamente.

## Arquivo impactado

| Arquivo | Alteração |
|---|---|
| `src/pages/admin/ProgramacaoPage.tsx` | Expandir visibilidade do filtro Formador para incluir N5 |

