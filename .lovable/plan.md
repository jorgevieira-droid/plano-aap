## Objetivo
Reorganizar a barra de filtros da página Programação/Calendário em 2 linhas para aumentar o tamanho das caixas de seleção (MultiSelectFilter).

## Layout proposto

Linha 1: **Programa** | **Evento/Ação** | **Entidade**
Linha 2: **Entidade Filho** | **Formadores** | **Consultores** | **GPI**

## O que será alterado

- `src/pages/admin/ProgramacaoPage.tsx` (bloco de filtros, ~linhas 4500–4650)
  - Substituir o container único `flex flex-wrap gap-3` por duas linhas estruturadas (ex: grid de 3 colunas na primeira linha e 3–4 na segunda, ou flex com wrap controlado).
  - Aumentar a largura dos `MultiSelectFilter` para acomodar melhor os rótulos longos (ex: ~260–280 px no desktop).
  - Manter o filtro de **GPI** na segunda linha, pois ele já existe na tela e não foi citado na reorganização, mas não cabe na primeira.

## Não será alterado
- Lógica de filtragem, cascata, reset de estado ou permissões.
- Comportamento dos componentes `MultiSelectFilter`.
- Regras de exibição condicional (quem vê Formadores/Consultores/GPI).

## Resultado esperado
- Filtros visíveis em duas fileiras, com caixas mais largas e confortáveis para leitura dos rótulos selecionados.