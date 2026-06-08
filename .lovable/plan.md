## Problema

O contador "X acessos totais" no cabeçalho soma `accessCount` por usuário, e esse `accessCount` vem do `rawAccessLog` — que está limitado pelo servidor a ~1.000 linhas. Por isso aparece "1000 acessos totais" mesmo havendo 9.247 no banco.

## Solução

Reaproveitar `monthlyAggregates` (já buscado via RPC, sem limite) como **fonte de verdade do total**, respeitando o filtro de Programa.

### Mudanças em `src/pages/admin/RelatorioAcessosPage.tsx`

1. Criar um `useMemo` `totalAcessos` que soma `monthlyAggregates.total` filtrando pelos programas ativos (`selectedProgramas` ou `allowedProgramas`), igual à lógica do `chartData`.
2. No subtítulo do header, trocar `filteredData.reduce((s, r) => s + r.accessCount, 0)` por `totalAcessos`.
3. Como o total deixa de refletir filtros de data (igual ao gráfico), ajustar o texto para deixar claro: `{filteredData.length} usuários · {totalAcessos} acessos totais (histórico completo)`.

## Fora de escopo

- Tabela e CSV continuam usando `accessCount` por usuário (limitação conhecida do `rawAccessLog`; pode ser tratada depois se necessário).
- Nenhuma mudança de banco.
