## Ajustes no Comparativo Temporal

### 1. Cor da segunda barra (período B)
Hoje a segunda série usa `hsl(var(--accent-foreground))`, que no tema atual fica praticamente igual ao primário (azul escuro), tornando-a invisível no gráfico.

**Mudança em `src/components/charts/InstrumentComparisonChart.tsx`:**
- Trocar a cor da `<Bar dataKey="B">` para um token semântico com bom contraste com o primário. Sugestão: usar uma das cores do gráfico já definidas no design system, `hsl(var(--chart-2))` (laranja/âmbar), com fallback para `hsl(var(--secondary))` caso `--chart-2` não exista.
- Atualizar também a cor do indicador "Mai/2026" no card-resumo da página (`RelatorioInstrumentosPage.tsx`) para manter consistência com a nova cor da barra.

### 2. Remover o "(n=X)" da tabela
O `(n=20)` indica a quantidade de respostas que entraram no cálculo da média daquela dimensão no período. O usuário quer remover.

**Mudança em `src/pages/admin/RelatorioInstrumentosPage.tsx`:**
- Na tabela "Detalhamento por dimensão", exibir apenas o valor da média formatado (ex.: `2.20`) nas colunas dos dois períodos, sem o sufixo `(n=X)`.
- Manter o tooltip do gráfico como está (lá o `n` continua útil ao passar o mouse) — só remover da tabela, conforme pedido.

### Arquivos a editar
- `src/components/charts/InstrumentComparisonChart.tsx` — cor da barra B
- `src/pages/admin/RelatorioInstrumentosPage.tsx` — cor do indicador no resumo + remoção do `(n=X)` na tabela

Sem mudanças em hooks, dados ou banco.