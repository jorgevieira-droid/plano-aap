## Card "Total de professores apoiados" igual à tabela

No painel Relatórios de Apoio Presencial, o card passará a mostrar exatamente o número de linhas da tabela "Apoios por professor" (ex.: 88 em vez de 77).

- Mesmo critério da tabela: cada combinação Professor + Escola + Segmento + Componente conta 1.
- Vale também para o PDF do painel (usa o mesmo número).
- Nada mais muda (filtros, tabela, outros cards).

### Detalhe técnico
Em `RelatoriosApoioPresencialPanelPage.tsx`, `professoresApoiados` passa a ser `apoiosPorProfessor.length` (mantendo a exclusão de "Sem professor"/vazios, aplicada igualmente na tabela para os dois números baterem).
