---
name: Cálculo de NPS
description: Fórmula oficial de NPS a ser usada em todos os relatórios/indicadores de NPS
type: feature
---
Sempre que um relatório apresentar NPS, usar a fórmula oficial (não usar "% de notas 9 e 10"):

- Promotores: notas 9 e 10
- Passivos: notas 7 e 8
- Detratores: notas 0 a 6
- NPS = % promotores − % detratores (inteiro, pode ser negativo; exibir com sinal "+" quando positivo)

Manter também, quando fizer sentido, o indicador "Nota média de NPS" (média simples das notas).

Implementação de referência: helpers `calcNps` / `fmtNps` em `src/pages/admin/RelatoriosFormacaoColetivaPanelPage.tsx`.
