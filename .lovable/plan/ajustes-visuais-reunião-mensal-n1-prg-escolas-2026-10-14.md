# Ajustes visuais — Reunião Mensal N1 (PRG Escolas)

Três ajustes de apresentação na página `ReuniaoMensalEscolasPage.tsx`, conforme o print enviado. Nenhuma mudança de dados, cálculo ou banco.

## 1. Alinhar os campos de filtro (conforme print)

Hoje o campo "Mês" estica em largura total e os selects ficam desalinhados.

- Linha de filtros em grade de 3 colunas de largura igual (`grid sm:grid-cols-3 gap-3 items-end`), com rótulos alinhados na mesma linha-base.
- Campo "Mês" deixa de ocupar largura total: mesma largura dos selects "Escola" e "Consultor(a)".
- Em telas estreitas, os três campos empilham em largura total.

## 2. Centralizar colunas numéricas nas tabelas

No componente `Tbl` (usado por todas as tabelas da página):

- Células cujo valor é número (ou texto numérico/percentual, ex. "12 (34%)") passam a ser centralizadas (`text-center`).
- O cabeçalho da coluna correspondente também é centralizado.
- Colunas de texto (Escola, Categoria, Descrição, Ano/série, Componente) permanecem alinhadas à esquerda.
- A regra vale para a linha de TOTAL (tfoot) também.
- Aplica-se a: tabela da Prática 1 (seção 2), Abrangência (5), Componentes (6), Formações coletivas (8) e Aulas compartilhadas (9).

## 3. Rótulo de dados com o número de cada faixa nos gráficos

Adicionar `LabelList` (já importado e usado na seção 4) em todas as barras que ainda não têm:

- **Seção 2 — Prática essencial 1 por semana** (barras empilhadas Observou / Não observou / Sem informação): rótulo dentro de cada faixa (`position="inside"`, fonte 10, cor clara para contraste). Faixas com valor 0 não exibem rótulo.
- **Seção 3 — Rubrica PEI x Parcial** (empilhadas): mesmo padrão.
- **Seção 7 — Professores por escola** (barras horizontais empilhadas): rótulo dentro de cada faixa.
- **Seção 8 — Formações coletivas** (horizontais empilhadas): rótulo dentro de cada faixa.
- Seção 4 (Apoios x Devolutivas) já tem rótulos no topo — mantida.

Os rótulos aparecem tanto na tela quanto no PDF exportado.

## Verificação

- Conferir no preview: alinhamento dos 3 filtros, colunas numéricas centralizadas nas 5 tabelas e rótulos visíveis nos 4 gráficos.
- Exportar o PDF e conferir que os rótulos e centralizações aparecem no arquivo.
