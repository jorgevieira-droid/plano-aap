## Objetivo
Adicionar a possibilidade de **inativar/reativar usuários** em `Usuários`, preservando todo o histórico (registros, ações, avaliações, presenças). Hoje o único caminho é excluir, o que dispara `ON DELETE CASCADE`/`SET NULL` e pode perder vínculos.

## Como vai funcionar

- Novo campo `ativo` (boolean, default `true`) em `profiles`.
- Usuário inativo:
  - **Não consegue mais fazer login** (bloqueio via `auth.users.banned_until` no Supabase Auth).
  - **Não aparece** em seletores de Formador/Consultor/GPI, listas de atribuição, filtros de novas ações.
  - **Continua aparecendo** em registros históricos, relatórios e dashboards (para não quebrar o histórico).
  - Fica listado em `Usuários` com badge "Inativo" e pode ser **reativado** a qualquer momento.
- O botão "Excluir" atual permanece, mas passa a ter destaque menor (ação destrutiva de última instância). O botão principal recomendado passa a ser "Inativar".

## Escopo de permissão
Mesma hierarquia já usada para editar/resetar senha:
- N1 (admin) inativa/reativa qualquer um.
- N2 (gestor) inativa/reativa N3–N8 do seu programa.
- N3 inativa/reativa N4–N8 do seu programa.
- N4–N8 sem ação.

## Mudanças técnicas

1. **Migração**
   - `ALTER TABLE public.profiles ADD COLUMN ativo boolean NOT NULL DEFAULT true;`
   - Índice parcial `WHERE ativo = false` para listagem rápida.

2. **Edge function `manage-users`**
   - Novas actions: `deactivate` e `reactivate`.
   - `deactivate`: valida escopo hierárquico (reaproveita `canResetPassword`-like); seta `profiles.ativo = false`; chama `auth.admin.updateUserById(id, { ban_duration: '876000h' })` (~100 anos) para bloquear login.
   - `reactivate`: seta `ativo = true` e `ban_duration: 'none'`.

3. **UI `src/pages/admin/UsuariosPage.tsx`**
   - Coluna/badge "Status" (Ativo/Inativo).
   - Filtro "Mostrar inativos" (padrão: só ativos).
   - Botão de ação "Inativar" (usuários ativos) / "Reativar" (usuários inativos), respeitando `canManage`.
   - Confirmação via `AlertDialog` explicando que o histórico é preservado.

4. **Filtros de seleção de pessoas** (Formador/Consultor/GPI/AAP etc.)
   - Em `AtoresProgramaPage`, `ProgramacaoPage`, formulários de agendamento e diálogos que listam atores, filtrar `profiles.ativo = true` ao popular selects. Telas de histórico e relatórios permanecem sem filtro.

5. **Sem alterações** em RLS de tabelas de registros, dashboards, exports e Manual (apenas nota curta a adicionar no Manual explicando Inativar vs Excluir — parte do mesmo commit).

## Fora de escopo
- Não mexe em `ON DELETE` das FKs (Excluir continua igual).
- Não altera regras de e-mails/notificações — usuários inativos apenas param de receber por não estarem em listas ativas de atribuição.

Confirma que posso seguir com esse desenho (campo `ativo` + botão Inativar/Reativar + bloqueio de login via ban) para eu implementar?