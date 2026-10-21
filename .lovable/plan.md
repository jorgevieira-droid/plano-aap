# Opções "VOAR LP" e "VOAR MAT" no campo Componente (Programa Escolas)

## Situação atual
- **Apoio Presencial** já tem essas duas opções, mas com outro nome: "LP VOAR" e "MAT VOAR".
- **Aula compartilhada com prof.**, **Planejamento conjunto com prof.** e **Apoio Presencial com a Coordenação** usam uma lista sem as opções VOAR.

## O que muda
1. Incluir **VOAR LP** e **VOAR MAT** no campo "Professor - Componente" dessas três ações, ao criar e ao editar.
2. No Apoio Presencial, as opções passam a aparecer como **VOAR LP** e **VOAR MAT**, iguais às demais ações.
3. As opções são gravadas com o mesmo valor que o Apoio Presencial já usa. Assim, os registros antigos continuam valendo e os relatórios (Indicadores Caê, painéis e Reunião Mensal) somam tudo na mesma categoria.
4. Nos relatórios, essas categorias também aparecem como "VOAR LP" e "VOAR MAT".

## O que não muda
- Nenhum registro salvo é alterado.
- As outras opções do campo continuam iguais.

## Detalhes técnicos
- `apoioPresencialShared.ts`: adicionar `'LP VOAR'` e `'MAT VOAR'` em `APOIO_COMPONENTE_OPTIONS_ESCOLAS` (após TUTOR LP / TUTOR MAT). Criar o helper `componenteDisplayLabel(v)`, que mapeia `LP VOAR`→`VOAR LP` e `MAT VOAR`→`VOAR MAT`.
- `ProgramacaoPage.tsx`: usar o helper no texto dos `<option>` (selects nas linhas ~4536 e ~4641). Em `PLANEJ_COMPONENTE_ENUM`, mapear `LP VOAR`→`lingua_portuguesa` e `MAT VOAR`→`matematica`.
- Painéis que agrupam por componente (Aula Compartilhada, Planejamento Conjunto, Apoio Coordenação, Gestão Escolas/Caê, Reunião Mensal): aplicar o helper só no texto exibido.
- Sem migration. Verificar com tsgo.
