## Objetivo
Incluir, na página **Relatório de Acessos** (`/admin/relatorio-acessos`), um gráfico mostrando o **total de acessos por mês**, segmentado por **programa** (Escolas, Regionais, Redes Municipais).

## Onde

Arquivo: `src/pages/admin/RelatorioAcessosPage.tsx`

O gráfico será posicionado **logo abaixo do bloco de Filtros e acima da tabela**, respeitando os filtros já existentes (Programas, De, Até) — ou seja, o gráfico recalcula quando o usuário muda os filtros.

## Como funciona

1. Cada linha de `user_access_log` (já carregada via `fetchData`) tem `user_id` + `accessed_at`.
2. Para cada acesso, identificamos os programas do usuário via `user_programas` (também já carregado).
3. Agrupamos por **mês (YYYY-MM)** × **programa**, somando 1 acesso por linha de log para cada programa do usuário (um acesso de um usuário com 2 programas conta 1 vez em cada programa — comportamento consistente com a tabela atual, que mostra o mesmo usuário em ambos os programas).
4. Renderiza um **BarChart agrupado** (recharts) com:
   - Eixo X: meses no formato `MMM/AA` (pt-BR), ordenados cronologicamente
   - Eixo Y: nº de acessos
   - Uma barra por programa (cores distintas), com legenda
   - Tooltip com valores por programa

5. Filtros aplicados:
   - Se `selectedProgramas` tiver itens, apenas esses programas aparecem como séries.
   - `dateFrom` / `dateTo` limitam os meses exibidos.
   - Se usuário não-admin, restringe aos programas que ele já pode ver (mesmo filtro `allowedProgramas` existente).

## Detalhes técnicos

- Carregar `accessed_at` completo (não só o último) — `fetchData` já busca tudo, basta guardar a lista bruta num novo estado `rawAccessLog: { user_id, accessed_at }[]`.
- Manter um `Map<user_id, ProgramaType[]>` para lookup rápido de programas por usuário.
- Memoizar a agregação com `useMemo`, dependente de `[rawAccessLog, userProgramasMap, selectedProgramas, dateFrom, dateTo, allowedProgramas]`.
- Cores: usar tokens do design system (paleta HSL já existente para programas, se houver) ou tons `hsl(var(--primary))`, `hsl(var(--accent))`, `hsl(var(--muted-foreground))`.
- Componente do gráfico: inline na própria página (não justifica componente separado), ~60 linhas.
- Altura fixa: `h-72`, dentro de um `card p-4`.
- Se não houver dados no período, mostrar mensagem "Sem acessos no período selecionado".

## Fora de escopo

- Não altera `user_access_log`, RLS, ou edge functions.
- Não inclui exportação do gráfico no CSV (o CSV continua com os dados da tabela).
- Não adiciona novos filtros — usa os 3 já existentes.

## Arquivos alterados

- `src/pages/admin/RelatorioAcessosPage.tsx` (único arquivo)
