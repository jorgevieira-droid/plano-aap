## Plano — Corrigir SLA no Manual para 7 dias

O código já usa SLA de 7 dias (`usePendencias.ts`, `PendenciasPage.tsx`, `send-pending-notifications/index.ts`). A inconsistência está apenas no Manual do Usuário, que ainda menciona "3 dias". Vou atualizar as 5 referências no Manual.

### Alterações em `src/pages/admin/ManualUsuarioPage.tsx`

- Seção 3 (Programação), tip: "Reagendar uma ação reinicia o prazo de 3 dias para registro." → "...prazo de 7 dias..."
- Seção 20: título "Pendências e SLA de 3 dias" → "Pendências e SLA de 7 dias"; descrição "SLA é de 3 dias após a data prevista" → "SLA é de 7 dias após a data prevista".
- Seção 21 (Notificações): "ações atrasadas (3 dias)" → "ações atrasadas (7 dias)".
- Seção 39 (Suporte/Glossário): "fora do SLA de 3 dias" → "fora do SLA de 7 dias".

### Memória
Atualizar `mem://features/pendencies-system-tracking` para refletir SLA de 7 dias (atualmente diz "3-day SLA").

Sem mudanças de código de comportamento — apenas texto do Manual e memória.
