

# Filtro de Formador não aparece para N5 no Meu Calendário

## Diagnóstico

O código em `ProgramacaoPage.tsx` (linha 2373) já contém a condição `getRoleLevel(profile?.role ?? null) <= 5`, que deveria incluir N5. Analisando o fluxo completo:

- `profile.role` para um Formador N5 = `'n5_formador'`
- `getRoleLevel('n5_formador')` = `5` (definido em `roleConfig.ts`)
- `5 <= 5` = `true` → o filtro deveria renderizar

**Causa provável**: O `profile` pode ser `null` durante o carregamento inicial, e `getRoleLevel(null)` retorna `99`, fazendo `99 <= 5` = `false`. Se a query de dados (`fetchData`) resolver antes do `profile` ser carregado, o componente renderiza sem o filtro e não re-renderiza o bloco de filtros quando o `profile` chega (já que o bloco de filtros não depende de estado que force re-render da seção).

Na verdade, `profile` está no escopo do componente e qualquer mudança no AuthContext causa re-render. Portanto o filtro deveria aparecer quando o profile carrega.

**Possível causa alternativa**: A alteração anterior de `<= 4` para `<= 5` pode não ter sido salva corretamente ou o build pode estar desatualizado.

## Alteração

### `src/pages/admin/ProgramacaoPage.tsx`

1. **Confirmar** que a linha 2373 contém `<= 5` (e não `<= 4`).
2. **Adicionar log de debug temporário** (ou simplesmente forçar rebuild) para garantir que a alteração está ativa.
3. Se a condição já estiver correta (`<= 5`), a solução é garantir que o `profile` esteja carregado antes de renderizar os filtros, adicionando uma verificação: se `profile` ainda não carregou, não renderizar nenhum filtro condicional (ou mostrar skeleton).

Como o código atual já está com `<= 5`, a alteração efetiva será **retocar a condição** para ser mais robusta:

```typescript
// Linha 2373 - garantir que funciona mesmo com profile null temporário
{profile && getRoleLevel(profile.role ?? null) <= 5 && (
```

Isso já é equivalente ao atual (`profile?.role ?? null`), mas garante clareza. A real ação é **re-salvar o arquivo** para forçar um novo build, confirmando que a alteração anterior está de fato aplicada.

## Arquivo impactado

| Arquivo | Alteração |
|---|---|
| `src/pages/admin/ProgramacaoPage.tsx` | Confirmar/reaplicar condição `<= 5` no filtro Formador |

