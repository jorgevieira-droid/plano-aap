## Objetivo
No PDF de impressão da **Visita Técnica à Secretaria (SME)**, exibir, em cada questão de nota, a **descrição de cada nível da rubrica** (0–3), e não apenas os círculos com números.

## Alteração

Arquivo: `src/components/print/VisitaTecnicaSecretariaSmePrintSection.tsx`

- Atualizar o componente `RatingValue` para receber também `scale_labels` (já existente em `InstrumentField`) e a `RUBRICA` global como fallback.
- Em cada questão do tipo `rating`, renderizar uma lista vertical com os 4 níveis:
  - Círculo marcado quando `value === n`
  - Número + título curto (ex.: "0 — Não realizado")
  - Descrição (do `scale_labels[n].description` se houver; caso contrário, da `RUBRICA` global definida no arquivo)
- Manter o cartão de Legenda no topo (visão geral colorida), pois ajuda a leitura impressa.
- Sem alterações de dados, schema, ou em outros instrumentos. Não mexer no fluxo de busca de respostas em `AcaoPrintDialog`/`AcaoPrintForm`.

## Resultado esperado
Cada questão de nota no PDF do SME passa a mostrar, abaixo do enunciado, as 4 opções (0, 1, 2, 3) com o nome e a descrição do nível ao lado — assim o leitor entende o significado da nota marcada sem precisar voltar à legenda.