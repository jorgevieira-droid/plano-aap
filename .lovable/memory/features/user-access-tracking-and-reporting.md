---
name: User Access Tracking
description: How user_access_log is populated and how the Relatório de Acessos counts logins and active users
type: feature
---

**Counting rule (definitive):**
- `user_access_log` receives **exactly 1 row per explicit email/password login**. The `INSERT` lives inside `AuthContext.login()` (right after a successful `signInWithPassword`), NOT in `onAuthStateChange`.
- The following do NOT count as access: token refresh, multi-tab session restore, page reload (F5), in-app navigation, opening a new tab while logged in.

**Why:** `SIGNED_IN` in supabase-js v2 fires on multiple non-login events (multi-tab broadcast via localStorage, initial session restore, sometimes alongside token refresh). Listening to it inflated counts by 10–100×. One user generated 289 events in a single day before the fix.

**Reporting:**
- Table column "Qtd Acessos" = `COUNT(*)` of `user_access_log` per user (= total explicit logins).
- Chart "Usuários ativos por mês e programa" uses RPC `get_acessos_por_mes_programa()` which counts `DISTINCT (user_id, day)` per program — i.e. "users-day active". A user with N programs is counted once per program (by design, for per-program visibility).
- Access reporting is restricted to N1-N3; N4-N5 see only personal indicators.
