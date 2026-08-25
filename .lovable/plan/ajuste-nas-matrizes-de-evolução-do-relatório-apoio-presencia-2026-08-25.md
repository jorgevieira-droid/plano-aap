# Ajuste nas matrizes de evolução do Relatório - Apoio Presencial

## Objetivo
Nas tabelas de evolução mensal das rubricas (observação e práticas essenciais) da página **Relatórios - Registro de Apoio Presencial**, apresentar a **quantidade de respostas antes da média** em cada célula.

## Contexto atual
- O cálculo das médias já existe em `RelatoriosApoioPresencialPanelPage.tsx`, mas apenas a média é renderizada (`fmt(v)`).
- A matriz on-line usa o componente `MatrizCard`; o PDF usa a função `renderMatriz` dentro de `handleExport`.

## O que será alterado

### 1. Estrutura de dados
- Em `rubricaEvolucao` e `praticasEvolucao`, além do array `valores` (média mensal), adicionar um array `contagens` com o número de respostas consideradas em cada mês.
- O total acumulado por rubrica (`total`) permanece inalterado.

### 2. Renderização on-line (`MatrizCard`)
- Alterar as células para exibir, nessa ordem:
  1. Quantidade de respostas (ex.: `3`)
  2. Média correspondente (ex.: `2,5`)
- Quando não houver dados, manter `—`.

### 3. Renderização do PDF (`renderMatriz`)
- Replicar a mesma ordem na exportação PDF: quantidade antes da média.

### 4. Gráficos de linha
- Continuam usando apenas a média (`valores`), sem mudança.

## Arquivos envolvidos
- `src/pages/admin/RelatoriosApoioPresencialPanelPage.tsx`

## Critério de aceitação
- Tanto na página quanto no PDF, cada célula das matrizes mensais mostra a quantidade antes da média para rubricas de observação e práticas essenciais.
- Nenhuma outra funcionalidade da página é impactada.
