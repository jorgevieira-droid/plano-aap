## Verificação da regra de 7 dias

Varredura completa em `src/` e `supabase/functions/`:

| Local | Status |
|---|---|
| `src/lib/regionaisActionStatus.ts` (`PENDENTE_THRESHOLD_DAYS = 7`) | ✅ 7 |
| `src/hooks/usePendencias.ts` (`sevenDaysAgo`) | ✅ 7 |
| `src/pages/admin/AdminDashboard.tsx` (fetch de pendentes, linhas 257–265) | ✅ 7 (variável ainda chamada `twoDaysAgo`, mas subtrai 7) |
| `src/pages/admin/PendenciasPage.tsx` | ✅ "há mais de 7 dias" |
| `src/pages/admin/RegistrosPage.tsx` (2 ocorrências) | ✅ 7 |
| `src/pages/admin/RelatoriosPage.tsx` | ✅ "mais de 7 dias" |
| `supabase/functions/send-pending-notifications/index.ts` | ✅ subtrai 7 e textos "7 dias" |

A regra está implementada corretamente em todos os pontos. Falta apenas o **texto** em duas linhas do Dashboard que ainda diz "2 dias".

## Ajuste de texto

`src/pages/admin/AdminDashboard.tsx`

- Linha 967: `... há mais de 2 dias` → `... há mais de 7 dias`
- Linha 970: `As seguintes ações estão agendadas há mais de 2 dias e ainda não foram atualizadas:` → `... há mais de 7 dias ...`

## Fora de escopo

- Renomear a variável interna `twoDaysAgo` no Dashboard (cosmético; já subtrai 7 dias corretamente).
