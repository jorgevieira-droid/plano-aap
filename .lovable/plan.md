## Ajuste no e-mail do Relatório Mensal

Remover os 3 cards de topo que se referem a formulários/tipos de ação não utilizados, mantendo o restante do e-mail intacto.

### O que será removido

No `supabase/functions/send-monthly-report/index.ts`, na função `generateEmailHtml`:

1. Card **Formações** (Realizadas/Previstas)
2. Card **Visitas** (Realizadas/Previstas)
3. Card **Acompanhamentos** (Realizados/Previstos)
4. Colunas **Formações** e **Visitas** da tabela "Desempenho por Consultor/Gestor/Formador" (ficaria vazia sem essas colunas, então a tabela inteira será removida)

### O que permanece igual

- Header com logos e título
- Card **Professores Formados**
- Card **Taxa de Presença**
- Card **% de ações por segmento**
- Tabela **Presença por Escola**
- Demais seções do e-mail
- Lógica de cálculo no resto do código (sem alteração nos `stats`, apenas no HTML gerado)

### Layout dos cards restantes

Os 3 cards remanescentes (Professores Formados, Taxa de Presença, % por segmento) terão sua largura ajustada de `16.66%` para `33.33%` para ocupar a linha de forma equilibrada.

### Deploy

Após o ajuste, redeploy da Edge Function `send-monthly-report`.
