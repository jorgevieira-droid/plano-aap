## Objetivo

Adicionar uma visualização **comparativa temporal** das notas médias por dimensão de cada instrumento, permitindo:
- **Mês x Mês** (dois meses do mesmo ano selecionado)
- **Ano x Ano** (mesmo mês em dois anos distintos)

A visualização será **barras agrupadas por dimensão** (uma barra por período), mantendo todos os filtros já existentes no Relatório de Instrumentos (programa, escola, ator, componente, entidade filho).

## Onde

Nova aba **"Comparativo Temporal"** dentro da página existente `/relatorio-instrumentos` (`RelatorioInstrumentosPage.tsx`), ao lado da visão atual (que vira aba "Médias por Dimensão"). Sem novo item de menu, sem nova rota.

## UX da nova aba

1. **Barra de filtros existente** (programa, escola, ator, componente, entidade filho) — compartilhada com a aba atual.
2. **Seletor de modo de comparação**: `Mês x Mês` | `Ano x Ano`.
3. **Seletores de período** condicionais:
   - Modo "Mês x Mês": Ano + Mês A + Mês B.
   - Modo "Ano x Ano": Mês + Ano A + Ano B.
4. **Seletor de instrumento** (dropdown único): mostra um gráfico por vez para leitura limpa. Default = primeiro instrumento disponível.
5. **Gráfico**: barras agrupadas (Recharts `BarChart` com 2 `Bar` series). Eixo X = dimensões do instrumento; eixo Y = média (0–scaleMax). Tooltip mostra média + N de respostas de cada período. Legenda nomeia os dois períodos (ex.: "Mar/2025" e "Mar/2026").
6. **Card-resumo** acima do gráfico: total de respostas em cada período + variação média geral (Δ e %).
7. **Estado vazio**: mensagem clara quando um dos períodos não tem respostas.

## Detalhes técnicos

### Novo hook: `useInstrumentComparisonData`
Arquivo: `src/hooks/useInstrumentComparisonData.ts`.

Baseado em `useInstrumentChartData`, mas:
- Recebe `periodA` e `periodB` (cada um: `{ ano, mes }`).
- Executa internamente **dois agrupamentos** sobre o mesmo `instrument_responses` + `registros_acao` (uma única query, filtrada pelos demais filtros), particionando as respostas pela data do `registros_acao.data` (fallback `created_at`) em A vs B.
- Reaproveita exatamente as mesmas regras: tipo `rating`, exclusão de zeros (com a exceção REDES já implementada na regra de métricas), permissões via `getViewableAcoes`, intersecção com `getInstrumentFormTypesByPrograma`.
- Retorna, por `form_type`:
  ```ts
  {
    formType, formLabel, scaleMax,
    dimensions: [{ fieldKey, label, dimension, avgA, countA, avgB, countB, delta, deltaPct }],
    totalA, totalB
  }
  ```

### Novo componente: `InstrumentComparisonChart`
Arquivo: `src/components/charts/InstrumentComparisonChart.tsx`.
- Recebe os dados de um instrumento + labels dos períodos.
- Renderiza `BarChart` com duas séries (cores semânticas do design system; nada de cores hard-coded).
- Responsivo via `ChartContainer`.

### Página: `src/pages/admin/RelatorioInstrumentosPage.tsx`
- Envolver conteúdo atual em `<Tabs>` shadcn com duas abas: "Médias por Dimensão" (existente) e "Comparativo Temporal" (nova).
- Manter os filtros globais acima das abas para que ambos os modos compartilhem o mesmo estado.
- Aba nova orquestra: seletor de modo → seletores de período → seletor de instrumento → `InstrumentComparisonChart`.

### Sem mudanças
- Sem nova rota, sem novo item de menu, sem mudança no Dashboard.
- Sem migração de banco — usa `instrument_responses` + `registros_acao` existentes.
- Sem alteração no `useInstrumentChartData` original.

## Arquivos a editar/criar

- **Criar** `src/hooks/useInstrumentComparisonData.ts`
- **Criar** `src/components/charts/InstrumentComparisonChart.tsx`
- **Editar** `src/pages/admin/RelatorioInstrumentosPage.tsx` (envolver em Tabs, adicionar nova aba)

## Fora de escopo (sugestões para próximas iterações)

- Comparação de períodos livres (intervalos arbitrários de data).
- Série temporal multilinhas e heatmap.
- Tabela com Δ exportável para PDF/Excel.
- Bloco resumido no Dashboard com "principais variações do mês".

Posso seguir com essa abordagem?
