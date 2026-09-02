# Visualização completa do "Registro de Apoio Presencial"

## O problema

A visualização/impressão do registro monta o formulário a partir do catálogo genérico de perguntas (`instrument_fields`), que para esse instrumento ainda descreve o modelo antigo (focos de observação e as 4 perguntas obrigatórias da devolutiva). As respostas atuais são gravadas com outras chaves (`turma_voar`, `rubrica_1_key`, `rubrica_1_nota`, `tem_rubrica_2`, `observou_praticas`, `pratica_1_nota`, `avaliacao_apoio`, etc.), verificadas nos registros existentes. Por isso, a partir do bloco 5 (Escolha da Rubrica de Observação) nada é exibido — essas perguntas simplesmente não existem no catálogo usado pela visualização.

## O que será feito

Criar uma seção dedicada de visualização para o "Registro de Apoio Presencial", espelhando exatamente os blocos do formulário atual:

1. Dados da Realização — Turma do VOAR, alunos presentes, diferença de horário, outros observadores, devolutiva realizada, data da devolutiva, dobradinha, motivo da não realização
2. Coleta de Evidências — evidências da observação
3. Devolutiva Formativa — temas abordados, encaminhamentos, participação/engajamento
4. Escolha da Rubrica de Observação — rubrica escolhida (título completo e foco) + nota, com a descrição do nível marcado
5. Segunda Rubrica (quando houver) — mesma apresentação
6. Práticas Essenciais — se observou, e as notas das 1ª, 2ª e 3ª práticas com seus títulos
7. Avaliação do Apoio Presencial — nota e justificativa

Campos sem resposta aparecem com traço, mantendo o layout de impressão (marca dupla Parceiros + Bússola, quebras de página).

## Detalhes técnicos

- Novo `src/components/print/RegistroApoioPresencialPrintSection.tsx`, no mesmo padrão das seções dedicadas já existentes (Microciclos, TaRL, GPA).
- `AcaoPrintForm.tsx`: quando `programacao.tipo === 'registro_apoio_presencial'`, renderizar essa seção no lugar do bloco genérico do instrumento (mantendo o bloco "Cadastro do Apoio" já existente e a lista de presença).
- Títulos e descrições de rubricas/práticas reutilizados de `src/components/formularios/apoioPresencialShared.ts` (fonte única, sem duplicar textos).
- Sem alteração de banco de dados e sem mudança no formulário de preenchimento.
