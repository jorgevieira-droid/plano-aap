# NPS na escala 0 a 10

## O que muda

- Nos formulários **Registro de Formação Coletiva** ("NPS da formação") e **Registro de Apoio ao Coordenador** ("NPS Apoio"), passa a existir o botão **0**, formando a escala 0–10 (11 opções).
- Nos relatórios **Formação Coletiva** e **Apoio ao Coordenador**, a "Distribuição das notas (NPS)" passa a exibir também a nota 0.
- O cálculo do NPS continua o oficial (promotores 9–10 menos detratores 0–6); agora a nota 0 é de fato registrável e contabilizada como detrator.
- A "Nota média de NPS" passa a considerar o 0 como nota válida.

## Detalhes técnicos

- `src/components/formularios/OlharParceiroContents.tsx` (linha ~290) e `src/components/formularios/ApoioCoordenadorContent.tsx` (linha ~81): trocar `Array.from({ length: 10 }, (_, i) => i + 1)` por `Array.from({ length: 11 }, (_, i) => i)`.
- `src/pages/admin/RelatoriosFormacaoColetivaPanelPage.tsx` e `src/pages/admin/RelatoriosApoioCoordenadorPanelPage.tsx` (`porNota`, linha ~155/160): mesma alteração; ajustar grid para acomodar 11 colunas/linhas.
- Verificar filtros de notas válidas para aceitar `0` (usar checagem por `Number.isFinite`/`!= null` em vez de valor "truthy").
- Atualizar `mem://logic/nps-calculation` registrando a escala 0–10.
