---
name: User Access Tracking
description: How user_access_log is populated (1 marcação por usuário por dia) and how the Relatório de Acessos counts usage for cost rateio
type: feature
---

**Regra atual (a partir de 28/08/2026):**
- `user_access_log` recebe **no máximo 1 linha por usuário por dia** (dia em `America/Sao_Paulo`), gravada sempre que o app carrega com sessão válida (login novo, retorno, nova aba).
- Implementação: `logDailyAccess()` em `AuthContext.tsx` → guarda em `localStorage` (`bussola:access:<userId>`) + RPC `public.log_daily_access()` (SECURITY DEFINER) que só insere se ainda não houver linha do usuário no dia.
- Não há mais insert no `login()`.

**Histórico:**
- Antes de 28/08/2026 só logins explícitos com e-mail/senha geravam linha. Como as sessões duram muito, quem usava o sistema diariamente quase não aparecia: jul/26 e ago/26 caíram para ~12 usuários e ~18 usuário-dias por mês (contra ~50 usuários / ~320 usuário-dias em jun/26). Esse período é subestimado e não pode ser reconstruído.
- Antes disso ainda, ouvir `SIGNED_IN` inflava a contagem em 10–100×; por isso a regra foi restringida demais.

**Reporting:**
- **Registros de Acesso** = `COUNT(*)` (RPC `get_acessos_por_usuario`) — hoje equivale a dias de uso.
- **Dias de Uso** = `COUNT(DISTINCT dia)` (RPC `get_dias_ativos_por_usuario`).
- **Usuário-dias por programa** (base do rateio de custo): RPC `get_acessos_por_mes_programa()`; usuário com N programas conta 1 dia em cada.
- **Rateio CSV**: RPC `get_rateio_usuario_programa_mes(_inicio, _fim)`.
- Acesso ao relatório restrito a N1–N3; N4–N5 veem apenas indicadores pessoais.
