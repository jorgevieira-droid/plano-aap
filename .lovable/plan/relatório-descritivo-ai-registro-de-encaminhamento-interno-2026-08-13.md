# Relatório Descritivo (AI) — Registro de Encaminhamento Interno

## Situação atual (verificada)

- O relatório usa os campos cadastrados em `instrument_fields` para saber o que analisar. Não existe **nenhuma** linha cadastrada para `registro_encaminhamentos_internos` — por isso o instrumento não tem textos para análise e o relatório sai sem temas.
- O relatório já mostra total de registros, entidades únicas, atores únicos e ranking por entidade (escola), mas **não** mostra a contagem por consultor.

## O que muda

1. **Os dois campos de texto passam a ser analisados**
   - "Existe alguma informação que precisa ser circulada internamente? Descreva abaixo"
   - "Existe algum encaminhamento ou resultado de uma informação circulada em REI anterior?"
   Ambos entram na categorização temática da IA e no resumo executivo.

2. **Quantidade total de ações realizadas no período**
   Novo cartão com o total de ações do instrumento no período/filtros selecionados (independente de terem texto preenchido), ao lado do total já existente de registros analisados.

3. **Quantidade por escola** — o ranking por entidade continua, com o rótulo "Escola" quando o programa é Escolas.

4. **Quantidade por consultor** — novo bloco de ranking com nome do consultor (ator do programa) e quantidade de ações, ordenado do maior para o menor.

Os três recortes respeitam os filtros já existentes (programa, ator, entidade, status, datas) e o escopo de visibilidade do usuário, e aparecem também na exportação em PDF.

## Detalhes técnicos

- Migração: inserir em `instrument_fields` duas linhas `form_type = 'registro_encaminhamentos_internos'`, `field_type = 'textarea'`, chaves `informacao_interna` (obrigatória) e `encaminhamento_rei_anterior`, com os rótulos do formulário e `sort_order` 1 e 2.
- `src/hooks/useNarrativeReport.ts`: adicionar `totalAcoes` (contagem de `regs`, antes do filtro por resposta) e `rankingAtores` (agregação por `aap_id` com nomes vindos de `profiles`), incluídos no tipo `NarrativeReport`.
- `src/components/relatoriosNarrativos/NarrativeReportViewer.tsx`: novo cartão de total de ações e novo bloco "Por consultor" espelhando o layout do ranking de entidades; rótulo do ranking de entidades condicionado ao programa Escolas.
