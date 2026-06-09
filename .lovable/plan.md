## Objetivo
Inserir o bloco "Legenda das Rubricas" (escala 0–2) antes das perguntas no formulário de gerenciamento da ação **Reunião — Acompanhamento Alfabetização**.

## Mudanças

### `src/components/instruments/InstrumentForm.tsx`
- Detectar `formType === 'reuniao_acomp_alfabetizacao'` (flag `showRubricLegend`).
- Renderizar um novo componente `<RubricLegendCard />` no topo do form, antes dos `dimensionOrder.map(...)`, no mesmo slot do atual `BinaryScaleLegendCard`.

### Novo componente `RubricLegendCard` (mesmo arquivo ou inline)
- Card com título **"Legenda das Rubricas"** e subtítulo: *"Cada critério é avaliado por descritores comportamentais observáveis — o que o avaliador vê acontecer na reunião ou visita, não uma impressão subjetiva."*
- Tabela com 3 colunas usando as cores do print:
  - **0 — Não implementado** (vermelho): "A prática observada está ausente ou é inadequada em relação ao esperado."
  - **1 — Parcialmente implementado** (amarelo): "Há tentativa, mas a execução é incompleta ou inconsistente. A prática está em construção."
  - **2 — Implementado conforme previsto** (verde): "O comportamento-alvo está presente de forma clara, consistente e autônoma."
- Usar tokens do design system (`destructive`, amarelo/verde via classes Tailwind compatíveis com o tema) e respeitar dark mode.

## Escopo
Mudança puramente de UI/apresentação. Sem alterações em DB, permissões, lógica de submissão ou tipos.
