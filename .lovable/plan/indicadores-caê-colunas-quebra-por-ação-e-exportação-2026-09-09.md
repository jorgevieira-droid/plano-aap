# Indicadores - Caê: colunas, quebra por ação e exportação

## Larguras das colunas
Ajustar o bloco para as proporções da imagem: coluna esquerda (Professores Atendidos + Apoios por Componente) e coluna central (Apoios por Ano/Série) mais estreitas, e a tabela de Professores Apoiados mais larga — 3 / 3 / 6 de 12 no desktop. Em telas pequenas continua empilhado.

## Tabela de Professores Apoiados
Passa a mostrar a quantidade separada por ação:

Professor | Escola | Componente | Apoio Presencial | Planejamento Conjunto | Aula Compartilhada | Total

Cada linha continua agrupada por professor + escola + componente, ordenada A–Z. O rodapé segue mostrando quantos registros estão sendo exibidos.

## Apoios por Componente e por Ano/Série
Cada item passa a mostrar o total e a quebra entre as três ações:
- A barra fica dividida em três segmentos, um por ação, com cores distintas.
- Abaixo do nome, os três valores aparecem em texto curto (ex.: AP 12 · PC 5 · AC 3).
- Uma legenda com as três cores aparece uma vez no topo do bloco.
- Ano/Série continua contando somente os valores exatos da listagem oficial.

## Exportar a tabela em Excel
Botão "Exportar Excel" no cabeçalho da tabela de Professores Apoiados, gerando um arquivo com as mesmas colunas e as mesmas linhas visíveis (respeitando os filtros de período, consultor e escola), com nome contendo o período.

## Detalhes técnicos
- Arquivo: `src/pages/admin/RelatoriosGestaoEscolasPage.tsx`.
- No `useMemo` `cae`, trocar `qtd` por `{ apoio, planejamento, aula, total }` no `profMap` e nas distribuições `porComponente` / `porAnoSerie` (contagem por `formType`).
- Grid: `lg:col-span-4/3/5` → `lg:col-span-3/3/6`; manter `lg:h-0 lg:min-h-full` na coluna da tabela.
- Exportação com a biblioteca XLSX já usada em outras páginas de relatórios do projeto.
- Sem mudanças de consultas, rotas ou permissões.

## Validação
- `npx tsgo --noEmit -p tsconfig.app.json`
- Conferência visual no preview (larguras, legenda, barras segmentadas) e download do Excel.
