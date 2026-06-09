# Card T@RL não aparece — corrigir colunas do select dedicado

## Causa
`relatorios_visita_tecnica_tarl` não tem colunas `escola_id` nem `aap_id` (só `registro_acao_id`). Em `useInstrumentChartData.ts`, o `select` da tabela dedicada inclui essas colunas, o que faz a query falhar (`throw dedErr`) e o hook retorna vazio — por isso o card não aparece mesmo com 1 registro salvo.

## Correção (`src/hooks/useInstrumentChartData.ts`)

1. No bloco "2a) Fetch from dedicated tables", remover `escola_id` e `aap_id` da lista de colunas — usar apenas `registro_acao_id, created_at, ...ratingKeys`. Ao montar o objeto achatado, deixar `escola_id: null, aap_id: null` (esses campos virão do `registrosMap`).
2. No bloco "2b) Fetch registros_acao", adicionar `aap_id` ao select e ao `registrosMap` (`aap_id: (reg as any).aap_id ?? null`).
3. Ajustar os filtros para usar fallback no `registrosMap` quando `r.escola_id`/`r.aap_id` for `null`:
   - `escolaFilter`: `(r.escola_id ?? registrosMap[r.registro_acao_id]?.escola_id) === filter`
   - `aapFilter`: `(r.aap_id ?? registrosMap[r.registro_acao_id]?.aap_id) === filter`

Sem migration, sem mexer em outras tabelas/cards. Resolve o erro silencioso e o card T@RL passa a aparecer com os filtros padrão funcionando.
