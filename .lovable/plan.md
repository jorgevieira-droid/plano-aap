## Objetivo

Permitir que usuários **N4.1 (CPed)** e **N4.2 (GPI)** usem a página **Registros de Ações** (`/registros`) vendo apenas ações criadas por eles e podendo excluí-las. Atualizar a busca para refletir o termo "Consultor / Gestor / Formador" no lugar de "AAP".

## Diagnóstico

A infraestrutura já está quase toda pronta:

- O item "Registros" já aparece no menu **operational** (N4-N5) no `Sidebar.tsx`.
- A rota `/registros` em `App.tsx` não tem `ProtectedRoute`, então qualquer autenticado entra.
- A query em `RegistrosPage.tsx` (linha 321-323) já filtra `aap_id = user.id` quando o usuário **não é admin nem manager** — N4.1/N4.2 entram nesse caminho.
- `canDelete` (linha 542-546) já retorna `true` para o dono da ação quando o tipo permite. A matriz em `acaoPermissions.ts` já dá `CRUD_ENT` (canDelete=true) para N4.1/N4.2 nos tipos que eles criam.
- A coluna da tabela já se chama "Consultor / Gestor / Formador".

**Único ajuste real:** o placeholder do campo de busca ainda diz "Buscar por escola ou AAP...".

## Mudança

Arquivo: `src/pages/admin/RegistrosPage.tsx` (linha 1460)

- Trocar o placeholder do `input` de busca:
  - de: `"Buscar por escola ou AAP..."`
  - para: `"Buscar por escola ou Consultor / Gestor / Formador..."`

A lógica de filtro em `searchTerm` (linha 497-501) já procura tanto pelo nome da escola quanto pelo nome do "AAP" (que vem de `profiles_directory` e representa o Consultor/Gestor/Formador) — nenhuma mudança de código de filtro é necessária.

## Verificação pós-mudança

- Logar como N4.1 ou N4.2 → menu lateral mostra "Registros" → abre `/registros` → vê só linhas onde `aap_id` é o próprio usuário → botão de excluir aparece nas suas ações e funciona.
