## Objetivo
Adaptar `/relatorio-acessos` para servir como base de rateio de custos de Cloud, mantendo a auditoria de logins atual e adicionando métricas de **usuário-dia ativo (DAU)**.

## Mudanças

### 1. Tabela "Acessos por usuário" — nova coluna
- Adicionar coluna **"Dias ativos"** ao lado de "Qtd Acessos".
  - "Qtd Acessos" continua = total de logins explícitos (auditoria).
  - "Dias ativos" = `COUNT(DISTINCT date_trunc('day', accessed_at))` por usuário (base para rateio).
- Nova RPC `get_dias_ativos_por_usuario()` retornando `user_id, dias_ativos, last_access`.
- Frontend faz merge dos dois RPCs por `user_id`.

### 2. Card de totais para rateio (no topo da página)
- Bloco novo **"Resumo para rateio"** com:
  - **Total usuário-dias no período** (soma global de DAU no período filtrado).
  - **Breakdown por programa** (cards/linhas: Escolas, Regionais, Redes Municipais) — usa a RPC `get_acessos_por_mes_programa` já existente.
  - Nota explicativa: "Usuário-dias = soma de usuários únicos ativos por dia. Um usuário em mais de 1 programa é contado em cada programa (visão por programa)."
- Respeita o filtro de período (mês/ano) já existente na página.

### 3. Exportação CSV para rateio
- Botão **"Exportar CSV (rateio)"** no header da página.
- Nova RPC `get_rateio_usuario_programa_mes(_inicio date, _fim date)` retornando:
  `user_id, nome, email, programa, mes, dias_ativos`
- Frontend gera CSV no client (sem dependência nova — usa `Blob` + `URL.createObjectURL`) com colunas:
  `Usuário | E-mail | Programa | Mês | Dias ativos`.
- Salva como `rateio-acessos-YYYY-MM-DD.csv`.

### 4. Manual do Usuário
- Atualizar seção "Relatório de Acessos" explicando:
  - "Qtd Acessos" = auditoria de logins.
  - "Dias ativos" / "Usuário-dias" = métrica de rateio (DAU), recomendada para divisão proporcional de custos de Cloud.
  - Comportamento multi-programa.

### 5. Memory
- Atualizar `mem://features/user-access-tracking-and-reporting` com a nova métrica DAU, a RPC de rateio e o CSV.

## Detalhes técnicos
- **Arquivos**: `src/pages/admin/RelatorioAcessosPage.tsx`, `src/pages/admin/ManualUsuarioPage.tsx`, 1 migration (2 RPCs novas).
- **RLS/grants**: as RPCs novas seguem o padrão das existentes — `SECURITY DEFINER`, restritas a N1-N3 via `has_role` no corpo.
- **Sem mudança em `user_access_log`** (schema ou dados).
- **Sem dependência nova** (`xlsx` não é necessário — CSV simples atende rateio e abre direto no Excel).
- Risco: baixo. As métricas atuais não mudam; apenas somam-se as novas.
