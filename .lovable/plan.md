# Card "professores apoiados" da Reunião Mensal igual ao Apoio Presencial

## Causa
- Apoio Presencial (89): conta cada combinação **professor + escola + segmento + componente** uma vez.
- Reunião Mensal (86): o card do Painel Geral ainda conta só **professor + escola**. Um mesmo professor que recebeu apoio em dois componentes ou segmentos conta 1 vez aqui e 2 lá.
- O gráfico 7 já usa o critério novo; só o card e os números que dependem dele ficaram para trás.

## Mudança
- No card "professores apoiados" da Reunião Mensal, usar a mesma chave do Apoio Presencial (professor, escola, segmento, componente) e deixar de fora os registros sem nome de professor.
- Mesma regra para "Recorrência" (seção 5) e para a contagem por professor na Prática 1 (seção 2), para os números baterem entre si.
- A cobertura por componente (seção 5) continua igual: ela já separa por componente.

## Para conferir
Com o mesmo período e os mesmos filtros (escola/consultor), os dois cards devem mostrar o mesmo número (89 no seu exemplo). Se o período não for igual (o mês da Reunião Mensal segue as semanas do mês), ainda pode haver uma diferença pequena.

## Detalhes técnicos
`src/pages/admin/ReuniaoMensalEscolasPage.tsx`: `profKey` passa a ser `[professor, escola, segmento||'—', normalizeApoioComponente(componente)||'—'].join('|').toLowerCase()`, a mesma chave da linha ~333.
