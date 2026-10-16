# Título correto para ações sem campo "Título"

## O que acontece
A ação de 08/10 (Planejamento conjunto com prof., escola CLOVIS DE LUCCA) está salva com o tipo certo, mas com o título "Formação Coletiva". Esse formulário não mostra o campo Título, mas o sistema guarda o título digitado ou preenchido antes. Se alguém abre uma Formação Coletiva e depois troca para Planejamento conjunto, ou reaproveita o formulário, o título antigo fica escondido e é gravado junto.

## Correção
1. Nas ações que não pedem título, o título passa a ser sempre o nome do tipo da ação: Planejamento conjunto com prof., Formação Coletiva, Apoio Presencial com a Coordenação, Reunião com a coordenação, Alteração de agenda da visita e as outras sem esse campo. Isso vale ao criar e ao editar.
2. Ao trocar o tipo da ação no formulário, o título escondido é apagado.
3. Corrigir as ações já salvas: quando o tipo não pede título e o título é diferente do nome do tipo, o título passa a ser o nome do tipo. A ação de 08/10 está incluída. As ações que pedem título não mudam.

## Detalhes técnicos
- `ProgramacaoPage.tsx` (~1658): trocar o `tituloFinal` para usar `getAcaoLabel(tipo)` nos tipos sem campo de título, sem usar `formData.titulo`. Fazer o mesmo no caminho de edição.
- Limpar `titulo` no `onChange` do tipo.
- Fazer um UPDATE em `programacoes` para os tipos sem campo de título, onde `titulo <> label`. Antes, conferir quantos registros vão mudar.
