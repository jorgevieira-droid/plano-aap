# Relatório Descritivo (AI) — campos de texto do Registro de Apoio Presencial

Hoje o Relatório Descritivo (AI) lê as perguntas do instrumento a partir do catálogo de campos (`instrument_fields`). Para o "Registro de Apoio Presencial" esse catálogo ainda reflete o modelo antigo: os únicos campos textuais cadastrados são os de evidências por foco e as 4 perguntas obrigatórias da devolutiva antiga. Os campos atuais do formulário (seções 3 e 4) não existem no catálogo, então nunca entram na análise da IA.

## O que será feito

Cadastrar os 5 campos de texto atuais para o instrumento, de modo que passem a ser analisados:

Seção 3 — Coleta de Evidências
- Registre as evidências da observação de aula (`evidencias_observacao`)

Seção 4 — Devolutiva Formativa
- Sobre o foco escolhido pelo professor (`foco_escolhido_professor`)
- Selecione e cole aqui as evidências trabalhadas (`evidencias_trabalhadas`)
- Registre os encaminhamentos combinados com o professor (`encaminhamentos_professor`)
- Registre os subsídios (atividades, textos, recursos, etc.) compartilhados com o professor para apoiá-lo na sua prática (`subsidios_compartilhados`)

Os campos textuais antigos (evidências por foco e as 4 perguntas obrigatórias) permanecem cadastrados, para que registros históricos continuem sendo analisados. Nenhum campo de nota/rubrica é alterado.

## Detalhes técnicos

- Migração de dados: inserir em `instrument_fields` as 5 linhas com `form_type = 'registro_apoio_presencial'`, `field_type = 'textarea'`, `dimension` = "Coleta de Evidências" / "Devolutiva Formativa" e `sort_order` após os existentes (22–26), com `ON CONFLICT DO NOTHING` para evitar duplicidade.
- Nenhuma mudança em `useNarrativeReport.ts` é necessária: o hook já coleta todos os campos `textarea` do instrumento e os envia à função de IA; as respostas ficam em `instrument_responses.responses` sob essas mesmas chaves.
- Efeito colateral esperado (positivo): esses campos também passam a aparecer nas exportações/relatórios que usam o catálogo de campos do instrumento.
