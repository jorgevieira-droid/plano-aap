# Relatório de Gestão: voltar a mostrar todos os formulários

## O que está acontecendo
- Os formulários do Jefferson de 07/10 e 14/10 existem e estão preenchidos. Os dois foram salvos hoje (30/10).
- O Relatório de Gestão busca os formulários de uma vez só, e o sistema devolve no máximo 1.000 por busca. Hoje já são 1.058 formulários das ações do Programa Escolas.
- Os 58 que passam desse limite são deixados de fora sem aviso, e os mais recentes, como os do Jefferson, estão entre eles. Por isso o painel mostra 0 planejamentos.
- Os outros números do relatório também podem estar mais baixos do que deveriam.

## O que muda
- O relatório passa a buscar os formulários em partes de 1.000, até trazer todos. É a mesma correção já feita na Reunião Mensal.
- Depois disso, os planejamentos de 07/10 e 14/10 voltam a contar no painel de Planejamento conjunto e nos totais do relatório.
- O de 21/10 continua no quadro "Ações realizadas sem formulário".

## Detalhes técnicos
- `RelatoriosGestaoEscolasPage.tsx`: trocar a consulta única em `instrument_responses` por um laço com `.order('id').range(from, from+999)` até a última página.
- Procurar o mesmo padrão nos painéis individuais das ações do Programa Escolas e aplicar a mesma correção onde houver risco de passar de 1.000 registros.
- Conferir no preview com filtro de outubro e Jefferson: 2 planejamentos no painel e 1 no quadro de pendentes.
