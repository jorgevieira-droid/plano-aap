# Painel - Microciclos: Encontros, Horas e Presença por Escola

## Por que hoje aparece "—"
Os 42 Encontros de Microciclos realizados estão cadastrados só na Rede, sem escola. Por isso a aba Por Escola fica sem encontros, horas e presença. Já os atores da lista de presença têm a escola deles no cadastro.

## O que muda
Na aba **Por Escola**, os números passam a vir dos atores de cada escola que estavam na lista de presença:
- **Encontros:** quantos encontros tiveram pelo menos um ator da escola na lista.
- **Horas:** a soma das horas desses encontros.
- **% Presença:** a média, entre esses encontros, da porcentagem de atores da escola que estavam presentes.

Assim, o **Score** da escola também passa a considerar presença e horas, e não só as visitas. Os mesmos números aparecem no gráfico, no Excel e no PDF. A aba **Por Rede** continua como está.

Se um encontro tiver escola no cadastro, ela continua valendo. Os atores sem escola não entram na conta das escolas.

## Detalhes técnicos
- Arquivo: `src/pages/admin/PainelMicrociclosPage.tsx`, função `buildRanking('escola')`.
- A agregação usa `atorPresencas` + `professoresInfo.entidade_filho_id`, agrupando por (encontro, escola). Para isso, é preciso guardar o id do encontro em `AtorPresencaRow`.
- O cálculo de `maxHoras` para a nota de horas por escola é feito com os novos valores.
- Sem mudança no banco.

## Verificação
Abrir a aba Por Escola de uma Rede e conferir que as escolas mostram Encontros, Horas e Presença, e que os números batem com a lista de Atores.
