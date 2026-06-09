## Diagnóstico

- **Gráfico (por programa):** alimentado pela função `get_acessos_por_mes_programa`, que faz JOIN entre `user_access_log` e `user_programas`. Um acesso de usuário com N programas é contado 1× em cada barra de programa — comportamento correto para "acessos de usuários do programa X", mas inflaciona a soma total.
- **Coluna "Qtd Acessos" (por usuário):** lê `user_access_log` direto, com limite atual de 50.000 linhas (`.range(0, 49999)`). Hoje há ~9.557 registros, então não há corte de 1.000 — esse limite só seria atingido se ultrapassássemos 50k.
- **"X acessos totais" no cabeçalho:** hoje soma as barras do gráfico, herdando a inflação por multi-programa.

## Mudanças

### 1. Cabeçalho usa total real de acessos únicos
`src/pages/admin/RelatorioAcessosPage.tsx`
- Substituir o cálculo de `totalAcessos` para somar `accessCount` dos usuários em `filteredData` (cada acesso conta 1× — bate com a coluna da tabela).
- Atualizar subtítulo para: `"{N} usuários · {totalAcessos} acessos totais"` + nota curta no card do gráfico explicando que a soma das barras pode ser maior, pois um acesso aparece em cada programa do usuário.

### 2. Garantir contagem por usuário sem teto
- Trocar o download de até 50k linhas de `user_access_log` por uma agregação no banco: nova função `get_acessos_por_usuario()` (security definer) retornando `user_id, total, last_access` — evita qualquer risco futuro de truncamento e reduz payload.
- `fetchData` passa a chamar essa RPC para preencher `accessCount` e `lastAccess` na tabela. Mantém `monthlyAggregates` como hoje para o gráfico.

### 3. Pequeno polimento
- Adicionar tooltip/nota abaixo do gráfico: "Um acesso é contabilizado em cada programa do usuário; por isso a soma das barras pode superar o total único de acessos."

## Fora de escopo
- Não altero a semântica do gráfico (cada barra continua "acessos por usuários do programa").
- Sem mudanças no schema de `user_access_log` ou em outras telas.