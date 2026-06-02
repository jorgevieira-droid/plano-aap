## Plano: Adicionar filtro de Entidade (Escola / Regional / Rede) no Relatório de Instrumentos

### Objetivo
Permitir filtrar tanto a tabela quanto o comparativo temporal por uma entidade específica do programa selecionado.

### Mudanças

1. **`RelatorioInstrumentosPage.tsx`**
   - Adicionar estado `entidadeId` (default `'todos'`).
   - Nova query `rel-instr-entidades` que busca `escolas` (id, nome) com `ativa = true` e `programa` contendo o programa selecionado, ordenadas A-Z com `localeCompare('pt-BR')`. Habilitada quando `programa` está definido.
   - Adicionar select **"Entidade"** dentro do card "Filtros opcionais" (junto com Ator/Status/Datas), disabled quando `!programa`. Opção "Todos" + lista.
   - Resetar `entidadeId` para `'todos'` em `onChangePrograma` e `onChangeInstrumento` (consistente com `atorId`).
   - Incluir `entidadeId` na `queryKey` e aplicar `registrosQuery.eq('escola_id', entidadeId)` quando `!== 'todos'`.
   - Passar `entidadeId` para `useInstrumentComparisonData`.

2. **`useInstrumentComparisonData.ts`**
   - Adicionar `entidadeId?: string` em `Params`.
   - Incluir no `queryKey`.
   - Aplicar `registrosQuery.eq('escola_id', entidadeId)` quando definido e diferente de `'todos'`.

### Arquivos
- `src/pages/admin/RelatorioInstrumentosPage.tsx`
- `src/hooks/useInstrumentComparisonData.ts`

Sem alterações de banco. RLS existente em `escolas` já restringe a visibilidade por papel/programa.