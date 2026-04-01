

# Correções no Registro de Ações

## Problema 1: N3 (Coordenador) não vê ações do seu programa

No `RegistrosPage.tsx` (linha 266), a query de registros só filtra para `isGestor`. O N3 (Coordenador de Programa) não é tratado — cai no filtro `!isAdmin && !isGestor`, que restringe a `aap_id === user.id`, mostrando apenas ações próprias.

### Correção

Substituir a lógica de filtro da query (linhas 260-285) para usar `isManager` (que inclui N2 e N3) em vez de `isGestor`. Buscar `user_programas` (já utilizado pela RLS) em vez de `gestor_programas` para ambos os perfis.

- Alterar a query `gestorProgramas` (linhas 231-243) para buscar de `user_programas` e habilitar para `isManager` (N2 + N3).
- Na query principal de registros (linha 266): trocar `!isGestor` por `!isManager`.
- No filtro client-side (linha 276): trocar `isGestor` por `isManager`.
- Nas funções `canEdit` e `canDelete` (linhas 417-425): incluir `isManager` na verificação de permissão.

## Problema 2: Alteração de status no Registro não reflete na Programação

Quando o status de um registro é alterado em `handleSaveEdit` (linha 660), apenas o `registros_acao` é atualizado. A `programacoes` vinculada (via `programacao_id`) não é sincronizada.

### Correção

No `handleSaveEdit`, após atualizar `registros_acao`, verificar se o status mudou e se há `programacao_id`. Se sim, atualizar também o status da programação correspondente:

- `realizada` no registro → `realizada` na programação
- `agendada`/`prevista` no registro → `prevista` na programação
- `cancelada` no registro → `cancelada` na programação

Isso garante que ao reverter de "finalizada" para "programada", a ação reaparece disponível para gerenciamento na aba de Programação.

## Arquivo impactado

| Arquivo | Alteração |
|---|---|
| `src/pages/admin/RegistrosPage.tsx` | 1) Query de programas: usar `user_programas` + `isManager`; 2) Filtro de registros: incluir N3; 3) `canEdit`/`canDelete`: incluir N3; 4) `handleSaveEdit`: sincronizar status com `programacoes` |

