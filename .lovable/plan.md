## Objetivo

Garantir que o gráfico "Acessos por mês e programa" sempre exiba o histórico completo (Abril, Maio e Junho/26), independente dos filtros de data, que continuarão valendo apenas para a tabela e o CSV.

## Mudanças em `src/pages/admin/RelatorioAcessosPage.tsx`

1. **`chartData` (useMemo):** remover o uso de `dateFrom`/`dateTo` na agregação. O gráfico passa a considerar todos os registros de `rawAccessLog`, respeitando apenas o filtro de **Programa**.

2. **Rótulo do eixo X:** trocar `month: 'short'` por nomes completos em português ("Abril/26", "Maio/26", "Junho/26"), usando um mapa fixo de meses para evitar abreviações com ponto.

3. **Subtítulo do gráfico:** adicionar abaixo do título "Acessos por mês e programa" uma linha discreta:
   > "Histórico completo — não é afetado pelos filtros de data acima."

## Fora de escopo

- Filtros de data continuam aplicados normalmente à tabela e ao CSV.
- Sem mudanças no banco, query ou permissões.
