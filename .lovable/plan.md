## Plano: Rótulos de dados e colunas de quantidade no Comparativo Temporal

### Objetivo
Melhorar a legibilidade do gráfico e da tabela no comparativo temporal de instrumentos.

### Mudanças

1. **Rótulo de dados nas barras do gráfico** (`InstrumentComparisonChart.tsx`)
   - Adicionar `<LabelList>` dentro de cada `<Bar>` do Recharts.
   - Exibir o valor da média formatado (ex: `2.20`) posicionado no fim de cada barra.
   - Fonte pequena (`fontSize: 11`) com cor contrastante.

2. **Colunas de quantidade de respostas na tabela** (`RelatorioInstrumentosPage.tsx`)
   - Inserir duas novas colunas na tabela "Detalhamento por dimensão":
     - `Qtd A` — exibe `countA` (quantidade de respostas não nulas do período A)
     - `Qtd B` — exibe `countB` (quantidade de respostas não nulas do período B)
   - Posicionar as colunas de quantidade logo após as colunas de média (`Média A`, `Média B`).
   - Manter as colunas existentes de Δ e Δ%.

### Arquivos
- `src/components/charts/InstrumentComparisonChart.tsx`
- `src/pages/admin/RelatorioInstrumentosPage.tsx`

Não há alteração de backend, hook ou banco de dados.