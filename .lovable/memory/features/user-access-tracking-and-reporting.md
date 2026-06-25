---
name: User Access Tracking
description: How user_access_log is populated and how the Relatório de Acessos counts logins and active users
type: feature
---

**Counting rule (definitive):**
- `user_access_log` receives **exactly 1 row per explicit email/password login**. The `INSERT` lives inside `AuthContext.login()` (right after a successful `signInWithPassword`), NOT in `onAuthStateChange`.
- The following do NOT count as access: token refresh, multi-tab session restore, page reload (F5), in-app navigation, opening a new tab while logged in.

**Why:** `SIGNED_IN` in supabase-js v2 fires on multiple non-login events (multi-tab broadcast via localStorage, initial session restore, sometimes alongside token refresh). Listening to it inflated counts by 10–100×. One user generated 289 events in a single day before the fix.

**Reporting (two independent metrics):**
- **Qtd Acessos** (audit): `COUNT(*)` of `user_access_log` per user — total explicit logins. RPC `get_acessos_por_usuario()`.
- **Dias Ativos** (DAU per user, basis for cost split): `COUNT(DISTINCT date_trunc('day', accessed_at))` per user. RPC `get_dias_ativos_por_usuario()`.
- **Usuário-dias por programa** (DAU per program, basis for cost rateio): RPC `get_acessos_por_mes_programa()` — `COUNT(DISTINCT (user_id, day))` joined with `user_programas`. A user with N programs is counted once per program per day (by design, for per-program visibility).
- **Rateio CSV export**: RPC `get_rateio_usuario_programa_mes(_inicio, _fim)` returns detailed rows `user × programa × mês × dias_ativos`, used by the "Exportar CSV (rateio)" button in `/relatorio-acessos`.
- Access reporting is restricted to N1-N3; N4-N5 see only personal indicators.
