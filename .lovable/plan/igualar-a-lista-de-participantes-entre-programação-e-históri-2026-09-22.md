# Igualar a lista de participantes entre Programação e Histórico/Lista de Presença

## O que foi verificado no banco

Encontro "Formação Microciclos | Bebedouro - 1º encontro" (28/04/2026):

- A rede de Bebedouro tem **53 participantes cadastrados**, dos quais **34 estão ativos** e 19 foram inativados depois.
- As presenças gravadas nesse encontro são **50 linhas, 33 marcadas como presentes** — exatamente o que aparece no Histórico de Presença (33/50 = 66%).
- Dessas 50 linhas, **16 pertencem a pessoas hoje inativas** (9 delas constavam como presentes).
- A tela de Programação monta a lista buscando apenas participantes **ativos** da entidade, por isso mostra 34 nomes e 24 presentes.

Ou seja: os dois números estão "certos" segundo regras diferentes. A Programação esconde quem foi inativado depois do encontro, e por isso pessoas que constam na lista de presença salva desaparecem de lá.

## O que será feito

1. Na tela de **Programação**, ao abrir a lista de presença de um encontro, incluir também os participantes **já gravados naquele encontro**, mesmo que estejam inativos hoje. Eles aparecem com a marcação "Inativo" e a presença original preservada.
2. Aplicar a mesma regra na tela **Lista de Presença** (que hoje também busca só ativos), para que a lista impressa não perca ninguém.
3. Com isso, o total e o número de presentes passam a ser os mesmos nas três telas (Programação, Lista de Presença e Histórico de Presença) para encontros já realizados.
4. Para encontros **ainda não realizados** nada muda: continuam listando apenas participantes ativos, evitando que pessoas inativas voltem a ser oferecidas para novas presenças.

## Detalhes técnicos

- `src/pages/admin/ProgramacaoPage.tsx` (busca de `professoresPresenca`, ~linha 2230): após a consulta filtrada por `ativo = true`, buscar os `professor_id` existentes em `presencas` do `registro_acao_id` do encontro e mesclar esses professores (sem o filtro `ativo`), deduplicando por id e reordenando por nome com `localeCompare('pt-BR')`.
- `src/pages/admin/ListaPresencaPage.tsx` (~linha 190): mesma mesclagem, usando o registro de ação vinculado à programação selecionada.
- Marcar os mesclados com uma flag (ex.: `inativo: true`) para exibir o badge "Inativo" na linha, sem alterar a lógica de salvamento (que já usa upsert por `registro_acao_id, professor_id`).
- Nenhuma alteração de banco, de permissões ou de dados históricos.

## Verificação

Abrir o encontro de Bebedouro 28/04 pela Programação e conferir 50 participantes e 33 presentes, iguais ao Histórico de Presença e à Lista de Presença; abrir um encontro futuro e conferir que só participantes ativos aparecem.
