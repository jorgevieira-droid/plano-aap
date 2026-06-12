## Ajustes em "Atores dos Programas"

### 1. Esconder usuários N1 da listagem
Em `src/pages/admin/AtoresProgramaPage.tsx`, no filtro `filteredUsers`, adicionar exclusão de qualquer usuário cujo `role === 'admin'` — N1 nunca aparece para ninguém (inclusive outros N1).

### 2. Visibilidade do menu no Sidebar
Em `src/components/layout/Sidebar.tsx`, mudar a entrada `'Atores dos Programas'`:
- `allowedTiers: ALL_TIERS` → `allowedTiers: ['admin', 'manager']`
- Resultado: N1, N2 e N3 veem o item; N4–N8 não veem.

### 3. Hierarquia de gerenciamento (regras de quem pode editar quem)
Reescrever a lógica `canManage` na coluna "Ações" da tabela para refletir exatamente:

| Quem | Pode gerenciar |
|---|---|
| N1 (admin) | Todos (exceto outros N1, que nem aparecem) |
| N2 (gestor) | Usuários N3–N8 que compartilham pelo menos um programa |
| N3 | Usuários N3–N8 (nível ≥ 3); para N3 ↔ N3, só os que compartilham programa |
| N4–N8 | Nenhum (sem botões de ação; o menu já estará oculto) |

Implementação:
```ts
const targetLevel = getRoleLevel(u.role);
const sharesProgram = u.programas.some(p => myProgramas.includes(p));

let canManage = false;
if (myLevel === 1) canManage = true;                       // N1
else if (myLevel === 2) canManage = targetLevel >= 3 && sharesProgram; // N2
else if (myLevel === 3) canManage = targetLevel >= 3 && (targetLevel > 3 || sharesProgram); // N3
// N4+ → false
```
A lógica atual usa `canManageOthers(myLevel)` (libera até N5) e `targetLevel >= myLevel` — substituída pela tabela acima. O ramo especial de GPI (`canEditEntidades`) para N4.2 é removido junto, já que N4 não tem mais ação nesta página (gerenciamento de entidades de CPed permanece disponível na página de Usuários/AAPs onde já existe).

### 4. Filtros de visibilidade da lista
Os filtros atuais por `minVisible` e programa/entidade já restringem corretamente a lista para cada nível; mantidos como estão, apenas com o acréscimo da exclusão de N1 do item 1.

### Arquivos alterados
- `src/pages/admin/AtoresProgramaPage.tsx` — filtro N1 + nova lógica `canManage` + remoção do ramo GPI.
- `src/components/layout/Sidebar.tsx` — `allowedTiers` do item Atores.

Sem alterações em rotas, permissões de ação, schema ou edge functions.