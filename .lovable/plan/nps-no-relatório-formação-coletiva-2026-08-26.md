# NPS no Relatório - Formação Coletiva

## O que muda

1. O card **NPS Médio** passa a se chamar **Nota Média de NPS** (mesmo valor: média simples das notas).
2. O card **% de notas 9 e 10** passa a se chamar **NPS** e passa a usar a fórmula oficial:
   - Promotores: notas 9 e 10
   - Passivos: notas 7 e 8
   - Detratores: notas 0 a 6
   - NPS = % promotores − % detratores (arredondado, exibido como número inteiro, podendo ser negativo, ex.: `-20` ou `+60`)
3. A mesma correção vale para o PDF exportado (rótulos e valor).
4. Na tabela/gráfico de evolução mensal, a linha "NPS médio" passa a se chamar "Nota média de NPS" e é acrescentada uma linha **NPS** com a fórmula acima por mês.

## Regra permanente

Fica registrado na memória do projeto que qualquer indicador de NPS em novos relatórios deve usar essa fórmula (promotores − detratores em %), e não "% de notas 9 e 10".

## Detalhes técnicos

- Arquivo: `src/pages/admin/RelatoriosFormacaoColetivaPanelPage.tsx`
  - No `useMemo` de `kpis`, substituir o campo `promotores` por `npsScore` calculado como
    `round(((#notas>=9) - (#notas<=6)) / total * 100)`; manter `npsMedio`.
  - Atualizar os rótulos nos cards da tela e no array `pdfKpis`.
  - Em `LINHAS_EVOLUCAO` / `evolucaoData`, renomear `NPS médio` → `Nota média de NPS` e incluir `NPS` por mês.
- Nova memória `mem://logic/nps-calculation` + entrada em Core do índice.
