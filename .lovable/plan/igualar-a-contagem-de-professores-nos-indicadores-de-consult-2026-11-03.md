Igualar a contagem de professores nos Indicadores de Consultoria (Relatório de Gestão) ao critério do Apoio Presencial

Critério: cada combinação de professor + escola + segmento + componente conta uma vez; registros sem nome de professor ficam de fora.

Mudanças em `RelatoriosGestaoEscolasPage.tsx`:
- Cálculo dos indicadores CAE: a chave de agrupamento dos professores passa a incluir o segmento (hoje é professor+escola+componente).
- O total "professores atendidos" (`profsDistintos`) passa a ser o número dessas combinações, em vez de nomes distintos.
- Na tabela por escola, a coluna "Professores atendidos" usa a mesma chave (professor+segmento+componente dentro da escola).
- A tabela "Professores Apoiados" e o Excel ganham a separação por segmento, então o total do card bate com o número de linhas.

Resultado esperado: com o mesmo período e filtros, o número do Relatório de Gestão fica igual ao do painel de Apoio Presencial e da Reunião Mensal.
