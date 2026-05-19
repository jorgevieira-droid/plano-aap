## Objetivo
No "Relatório de Instrumentos", o dropdown de Instrumentos deve listar apenas formulários **ativos** para o programa selecionado, conforme a configuração existente em `form_config_settings` (mesma fonte usada nos dashboards/menus).

## Alteração

Arquivo: `src/pages/admin/RelatorioInstrumentosPage.tsx`

1. Importar `useAcoesByPrograma` de `@/hooks/useAcoesByPrograma`.
2. Obter `isAcaoEnabledForPrograma` e `isAcaoInativa` do hook.
3. No `useMemo` `instrumentosDisponiveis` (linhas 179-189), além do filtro atual (instrumentos com dados no programa), aplicar:
   - manter apenas `t.value` cujo `isAcaoEnabledForPrograma(t.value, programa)` seja `true`;
   - excluir os que `isAcaoInativa(t.value)` retornar `true`.
4. Resetar `instrumento` para `'todos'` se o valor atual deixar de estar disponível após troca de programa (já tratado em `onChangePrograma`).

## Comportamento
- Formulários desativados (sem o programa em `form_config_settings.programas` ou com array vazio) deixam de aparecer no dropdown, mesmo que existam `registros_acao` antigos com aquele tipo.
- Nenhuma mudança em queries de dados, contagens ou filtros de Status.
