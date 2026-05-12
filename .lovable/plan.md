# Bloco "Monitoramento de Ações Formativas (Regionais)" no Dashboard

## Objetivo
Adicionar, em `/dashboard` (`AdminDashboard.tsx`), um novo módulo dedicado às ações do tipo `monitoramento_acoes_formativas` (programa Regionais), com indicadores agregados e filtros próprios (data, frente de trabalho, entidade), sem interferir nos demais módulos.

## Visibilidade
- Só renderiza quando o filtro Programa do dashboard for `regionais` ou `todos` **e** o usuário tiver acesso a `regionais` (admin ou `regionais` em `user_programas`).
- Caso não haja registros no escopo, exibe estado vazio discreto ("Sem ações de monitoramento no período").

## Filtros do bloco (locais, independentes do header)
Renderizados num `FilterBar` no topo do card:
1. **Período** — dois date inputs (data início / data fim). Default: ano corrente do dashboard.
2. **Frente de trabalho** — Select com valores distintos de `relatorios_monit_acoes_formativas.frente_trabalho` (mais opção "Todas"). Ordenação A-Z `pt-BR`.
3. **Entidade** — Select com escolas/regionais vinculadas (via `registros_acao.escola_id` → `escolas.nome`). Apenas entidades que aparecem em registros do tipo. Ordenação A-Z.
- Botão "Limpar filtros".

Os filtros globais do dashboard (Ano/Mês/Ator) NÃO são reaproveitados aqui — mantemos a UX do bloco autocontida, conforme pedido.

## Indicadores (cards no topo do bloco)
Calculados sobre `registros_acao` filtrados (tipo = `monitoramento_acoes_formativas`, programa contém `regionais`):
- **Ações programadas** — total no período.
- **Ações realizadas** — `status = 'realizada'`.
- **Taxa de realização** — % realizadas / programadas.
- **Com fechamento preenchido** — relatórios com `fechamento` não nulo/vazio.
- **Com rubrica respondida** — registros com pelo menos 1 `instrument_responses` cujo `form_type` ≠ `monitoramento_acoes_formativas` e ≠ `lista_presenca`.
- **Total de presenças registradas** — soma de `presencas.presente = true` nesses registros.

## Visualizações
1. **Realizadas por Frente de trabalho** — bar chart horizontal (Recharts), top 10 + "Outras".
2. **Realizadas por Entidade** — bar chart horizontal, top 10 + "Outras".
3. **Evolução mensal** — line chart de programadas x realizadas no período.
4. **Resumo qualitativo** — contagens de relatórios com Avanços / Dificuldades / Encaminhamentos preenchidos (3 mini-cards).

Cada visualização respeita os 3 filtros do bloco.

## Estrutura técnica

### Dados (React Query, novo hook `useMonitoramentoRegionaisDashboard`)
Em `src/hooks/useMonitoramentoRegionaisDashboard.ts`:
- Query 1: `registros_acao` `select('id, data, status, escola_id, programa')` onde `tipo = 'monitoramento_acoes_formativas'` e `programa @> '{regionais}'`, intervalo de datas.
- Query 2: `relatorios_monit_acoes_formativas` filtrado por `registro_acao_id IN (...)`.
- Query 3: `presencas` agregadas por `registro_acao_id`.
- Query 4: `instrument_responses` (`form_type` distinto de monitoramento/lista_presenca) por `registro_acao_id`.
- Query 5: `escolas` lookup para nomes/entidades.
- Aplicação dos filtros local (frente, entidade) em memória após fetch para mudanças instantâneas.

### Componentes
- Novo componente `src/components/dashboard/MonitoramentoRegionaisBlock.tsx` que encapsula filtros locais + cards + charts.
- Inserido em `AdminDashboard.tsx` logo após o MÓDULO 4c "Frequência em Eventos Formativos" (antes do MÓDULO 5 InstrumentDimensionCharts).
- Reusa: `StatCard`, `BarChart`/`LineChart` do Recharts (mesmo padrão visual dos demais blocos), `Select` shadcn, `Input type="date"`.
- Sem migração de banco — todas as colunas necessárias já existem.

### Acessibilidade / consistência
- Sort A-Z usando `localeCompare('pt-BR', { sensitivity: 'base' })`.
- Estados de loading com `Loader2`.
- Layout responsivo (grid 2/3/4 colunas para os StatCards, charts em `grid-cols-1 lg:grid-cols-2`).
- Tokens semânticos do design system (sem cores hardcoded).

## Arquivos afetados
- **Novo:** `src/hooks/useMonitoramentoRegionaisDashboard.ts`
- **Novo:** `src/components/dashboard/MonitoramentoRegionaisBlock.tsx`
- **Editado:** `src/pages/admin/AdminDashboard.tsx` (importar e renderizar o bloco com guard de programa/role)

## Fora de escopo
- Drill-down por ação (já coberto pela página `/relatorio-regionais`).
- Exportação PDF/Excel deste bloco.
- Alteração dos filtros globais do dashboard.
