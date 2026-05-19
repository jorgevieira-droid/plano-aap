## Objetivo
Garantir que ações/formulários **inativos** (sem programas em `form_config_settings.programas`) deixem de ser contabilizados e exibidos em qualquer painel, relatório, gráfico ou seletor do app.

## Diagnóstico
A "fonte da verdade" para ativo/inativo é o hook `src/hooks/useAcoesByPrograma.ts`. Hoje:
- `isAcaoInativa(tipo)` já identifica inativos (settings com `programas = []`).
- Mas `getAcoesByPrograma('todos')` retorna **todos** os `ACAO_TIPOS` sem filtrar inativos.
- E `isAcaoEnabledForPrograma(tipo, 'todos')` sempre retorna `true`.

Como praticamente todas as telas (AdminDashboard, RelatoriosPage, MatrizAcoesPage, RelatorioInstrumentosPage, useInstrumentChartData, MonitoramentoRegionaisManageDialog) consomem esses helpers, basta corrigir o hook que o efeito se propaga.

## Alteração (1 arquivo)

### `src/hooks/useAcoesByPrograma.ts`
1. `getAcoesByPrograma(programa)`:
   - Filtrar sempre fora os tipos cujo `isAcaoInativa(tipo)` é `true`, inclusive quando `programa === 'todos'`.
2. `isAcaoEnabledForPrograma(tipo, programa)`:
   - Se `isAcaoInativa(tipo)` → retornar `false` (em qualquer programa, inclusive `'todos'`).
   - Mantém o restante da lógica.
3. `getInstrumentFormTypesByPrograma` e `getModuleVisibility` já dependem de `getAcoesByPrograma`, então herdam o filtro automaticamente.

## Efeitos esperados
- **AdminDashboard / RelatoriosPage**: contadores, gráficos "Previsto x Realizado", visibilidade de módulos passam a ignorar ações inativas.
- **MatrizAcoesPage**: tipos inativos somem da matriz para qualquer programa.
- **RelatorioInstrumentosPage**: dropdown de instrumentos e contagens já filtravam; comportamento reforçado para o caso `programa = 'todos'` (se aplicável).
- **useInstrumentChartData**: gráficos por instrumento deixam de mostrar formulários inativos.
- **MonitoramentoRegionaisManageDialog**: lista de ações disponíveis para Regionais sem inativos.

## Fora do escopo
- Não altera dados históricos (`registros_acao` antigos permanecem no banco; apenas deixam de ser somados/exibidos via filtros do app que usam o hook).
- Nenhuma mudança de schema, RLS, queries diretas ou layout.