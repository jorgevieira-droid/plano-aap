

User clarified that "Módulos" = each card/chart block on Dashboard and Relatórios (e.g., "Professores por Componente e Ciclo", "% Presença em Formações por Componente e Ciclo"). They want any module with no data to be hidden entirely (not show "Nenhum registro encontrado").

Let me explore Dashboard and Relatórios to identify all module cards and their data sources.

# Ocultar módulos sem dados no Dashboard e Relatórios

## Definição
"Módulo" = cada card/gráfico/bloco de informação exibido no Dashboard (`/dashboard`) e na página de Relatórios (`/relatorios`). Exemplos: "Professores por Componente e Ciclo", "% Presença em Formações por Componente e Ciclo", gráficos de Acompanhamento, cards de Previsto x Realizado, etc.

## Comportamento atual vs desejado

| Atual | Desejado |
|---|---|
| Card é renderizado mesmo vazio, mostrando "Nenhum registro encontrado" / gráfico em branco | Card **não é renderizado** quando não há dados |

## Regra de "sem dados"

Para cada módulo, considerar vazio quando:
- Array de dados tem `length === 0`, OU
- Soma de todos os valores numéricos do módulo é `0`, OU
- Nenhum filtro retorna registros

A regra exata depende do tipo de módulo (gráfico de barras, ring, tabela, lista).

## Plano de execução

1. **Mapear módulos** em:
   - `src/pages/admin/AdminDashboard.tsx`
   - `src/pages/admin/RelatoriosPage.tsx`
   - Componentes auxiliares (`InstrumentDimensionCharts`, `EvolucaoLineChart`, etc.) usados dentro deles

2. **Para cada módulo**, envolver o `<Card>` em condicional:
   ```tsx
   {hasData(moduleData) && (
     <Card>...</Card>
   )}
   ```

3. **Quando uma seção inteira** (ex: "Acompanhamento de Aula" com vários gráficos) ficar sem nenhum módulo visível, ocultar também o título/heading da seção.

4. **Preservar comportamento** de filtros: se o usuário aplicar um filtro que zera os dados, o módulo desaparece (em vez de mostrar estado vazio).

5. **Não ocultar** indicadores de KPI principais (cards de contagem total no topo) — apenas gráficos e tabelas detalhadas. Caso o usuário queira incluí-los também, ajustar depois.

## Resultado

Dashboard e Relatórios ficam mais limpos: somente módulos com dados reais aparecem; nada de placeholders "Nenhum registro encontrado" poluindo a visualização.

