## Objetivo
Exibir o valor numérico (rótulo de dados) diretamente em cada barra/coluna dos gráficos do sistema, sem alterar dados, filtros ou comportamento.

## Gráficos afetados
Colunas verticais (rótulo no topo da barra):
- `src/pages/admin/AdminDashboard.tsx` — "Ações por AAP" (Previstas/Realizadas) e "Ações por Tipo" (Previstas/Realizadas)
- `src/pages/admin/RelatoriosPage.tsx` — "Previsto vs Realizado" (Previstas/Realizadas)
- `src/pages/admin/RelatorioApoioPresencialPage.tsx` — gráfico de Quantidade por componente
- `src/pages/admin/RelatorioConsultoriaVisualizacaoPage.tsx` — gráfico de Quantidade
- `src/components/reports/PdfReportContent.tsx` — Previsto vs Realizado (PDF)

Barras horizontais (rótulo à direita da barra):
- `src/pages/admin/AdminDashboard.tsx` — "Professores por Componente/Ciclo", "Presença por Componente/Ciclo" (mostrar % com sufixo), "Usuários por Programa" (Cadastrados/Ativos)
- `src/components/dashboard/MonitoramentoRegionaisBlock.tsx` — "Por Frente" e "Por Entidade"
- `src/components/charts/InstrumentDimensionCharts.tsx` — Média por dimensão (1 casa decimal)

Já possui rótulo (sem alterações): `src/components/evolucao/EvolucaoLineChart.tsx`.

## Implementação
Para cada `<Bar>` adicionar um `<LabelList>` filho da biblioteca `recharts`:
- Colunas verticais: `position="top"`, fonte pequena, cor `hsl(var(--foreground))`.
- Barras horizontais: `position="right"`.
- Valores zero/nulos ficam ocultos via `formatter` (retorna string vazia).
- Percentuais ("Presença por Componente/Ciclo") com sufixo `%`; médias com 1 casa decimal; demais inteiros.
- Importar `LabelList` onde ainda não está importado.

## Fora de escopo
Gráficos de linha, radar, pizza e barras de progresso (não são Barras/Colunas).