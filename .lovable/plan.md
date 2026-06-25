
## Diagnóstico

**Como é contado hoje**
1. `AuthContext.tsx` escuta `supabase.auth.onAuthStateChange`. Sempre que o evento for `SIGNED_IN`, faz `INSERT` em `user_access_log` (1 linha = 1 "acesso").
2. A página `Relatório de Acessos` consome:
   - `get_acessos_por_usuario()` → `COUNT(*)` por usuário (coluna "Qtd Acessos").
   - `get_acessos_por_mes_programa()` → `COUNT(*)` agrupado por mês × programa, **com JOIN em `user_programas`**. Um usuário com 2 programas conta o mesmo acesso 2× no gráfico.

**Por que está alto (dados reais de maio/26)**
- 6.306 linhas para 49 usuários (~129 acessos/usuário/mês).
- Luiza Lima: 289 em um único dia → não são logins.
- `SIGNED_IN` do supabase-js v2 dispara também em: restauração de sessão multi-aba (broadcast via `localStorage`), retomada de foco em parte dos navegadores, e em conjunto com refresh inicial de token. Quem trabalha com várias abas/recarregamentos infla a contagem.
- O JOIN com `user_programas` multiplica cada acesso pelo nº de programas do usuário (a nota no gráfico já alerta, mas confunde a leitura).

## O que será feito

### 1. Registrar apenas login explícito (fonte do problema)
- Remover o `INSERT` em `user_access_log` do callback `onAuthStateChange` em `src/contexts/AuthContext.tsx`.
- Mover o `INSERT` para dentro da função `login()` (chamada só pelo formulário de e-mail/senha), executado após `signInWithPassword` retornar sucesso.
- Resultado: 1 linha por login real. Reabrir aba, refresh de token, F5, navegação interna → não contam mais.

### 2. Deduplicar histórico já existente (opcional, recomendado)
- Migration que mantém **no máximo 1 acesso por usuário a cada 30 minutos** no histórico de `user_access_log`, usando `DELETE` com `row_number()` particionado por `user_id` + janela de 30 min. Isso aproxima o histórico antigo da nova lógica sem perder a noção de "usuário ativo no mês".
- Apresentar o número antes/depois ao usuário antes de aplicar (incluir no PR como SQL revisável).

### 3. Ajustar a leitura do gráfico
- Em `get_acessos_por_mes_programa()`: trocar `COUNT(*)` por `COUNT(DISTINCT l.user_id || '|' || date_trunc('day', l.accessed_at))` para mostrar **usuários-dia ativos** por mês × programa, métrica mais útil e que não infla com múltiplos logins do mesmo dia.
- Atualizar o texto explicativo no card "Acessos por mês e programa" descrevendo a nova métrica e que continua duplicando quando o usuário pertence a mais de um programa (comportamento intencional para visão por programa).
- Manter a coluna "Qtd Acessos" da tabela como `COUNT(*)` puro (= nº de logins explícitos), já alinhada com a nova lógica.

### 4. Documentação
- Atualizar a página `Manual do Usuário` (seção Relatório de Acessos) e a memory `mem://features/user-access-tracking-and-reporting` com a regra nova: "1 acesso = 1 login com e-mail/senha. Recarregar página, abrir nova aba, refresh de token e navegação interna não contam."

## Detalhes técnicos

- Arquivos tocados: `src/contexts/AuthContext.tsx`, `src/pages/admin/RelatorioAcessosPage.tsx`, `src/pages/admin/ManualUsuarioPage.tsx`, 1 migration SQL (`get_acessos_por_mes_programa` + dedupe opcional do histórico).
- Sem mudança de schema em `user_access_log`.
- Sem impacto em RLS/grants.
- Risco baixo: a coluna "Último acesso" passa a refletir o último login real (não o último refresh de token) — é o comportamento que o usuário já esperava.

## Pergunta antes de implementar

Deseja que eu **também deduplique o histórico existente** (passo 2)? As opções são:
- **Sim, agressivo:** manter no máximo 1 por usuário a cada 30 min.
- **Sim, conservador:** manter no máximo 1 por usuário por dia.
- **Não:** preservar o histórico bruto e aplicar a correção só a partir de agora.
