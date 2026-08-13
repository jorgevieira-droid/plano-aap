# Relatório Descritivo (AI) — textos do "PEC Qualidade de Aula"

## Situação atual (verificada)

- O instrumento "PEC Qualidade de Aula" tem apenas 5 campos cadastrados no catálogo, todos de nota (Planejamento, Uso de Dados, Observação/Feedback, Intervenção, Articulação). Não há nenhum campo de texto — por isso a IA não gera análise temática para ele.
- Os textos pedidos não ficam nas respostas do instrumento: **Observações, Avanços e Dificuldades** são campos do registro da ação, e **Encaminhamentos** é campo da programação vinculada.
- Hoje o Relatório Descritivo só lê textos das respostas do instrumento, então esses quatro campos nunca chegam à análise.
- Observação sobre o volume atual: existem 63 registros do tipo, e hoje praticamente todos estão com esses quatro campos vazios (apenas 1 encaminhamento preenchido). O relatório passará a considerá-los conforme forem preenchidos.

## O que muda

Para "PEC Qualidade de Aula", o Relatório Descritivo (AI) passa a analisar quatro textos adicionais:

- Encaminhamentos (da programação)
- Observações (do registro)
- Avanços (do registro)
- Dificuldades (do registro)

Eles entram na contagem de respostas por campo, na categorização temática por campo e no resumo executivo, respeitando os mesmos filtros (programa, ator, entidade, status, datas) e o escopo de visibilidade do usuário. Os gráficos de notas permanecem inalterados.

## Detalhes técnicos

- `src/hooks/useNarrativeReport.ts`:
  - incluir `observacoes, avancos, dificuldades, programacao_id` no select de `registros_acao`;
  - novo mapa `GENERIC_TEXT_FIELDS: Record<string, {key,label,source}[]>` com entrada para `pec_qualidade_aula` (3 campos do registro + `encaminhamentos` via `programacoes`);
  - quando o formType tiver entrada nesse mapa, buscar `programacoes(id, encaminhamentos)` pelos `programacao_id` dos registros e montar amostras de texto adicionais, concatenadas a `textSamples`/`textFieldsMeta` antes da chamada da edge function;
  - a base desses textos passa a ser todos os registros filtrados (`regs`), não apenas os que têm resposta do instrumento, e `hasText` passa a considerar também esses campos.
- Nenhuma migração de banco é necessária; nada muda em `instrument_fields` nem na edge function `generate-narrative-report`.
