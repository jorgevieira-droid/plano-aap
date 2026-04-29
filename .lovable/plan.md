## Diagnóstico

No modal **Gerenciar** de uma ação `Encontro Formativo – Microciclos de Recomposição` (em `/programacao`), as seções **Plataforma Trajetórias**, **Encaminhamentos** e **Próximo encontro** mostram apenas os títulos dos campos, sem caixas de texto, dropdowns ou seletor de data.

Causa raiz: o componente `InstrumentForm` (`src/components/instruments/InstrumentForm.tsx`) é o que renderiza esses campos a partir da configuração no banco (`instrument_fields`). No banco, os campos do Microciclos estão cadastrados com `field_type` = `textarea`, `single_choice` e `date`. Porém o `FieldRenderer` dentro de `InstrumentForm` só trata os tipos `rating`, `text`, `number`, `select_one` e `select_multi`. Como nenhum case bate, o componente renderiza só o `label` e nada mais — exatamente o que aparece na imagem.

Os mesmos campos também faltam para `single_choice` em outros instrumentos REDES, então a correção é genérica.

## O que será feito

Apenas uma alteração de front-end em `src/components/instruments/InstrumentForm.tsx`:

1. Adicionar suporte a `field_type === 'textarea'` (renderizar `Textarea`, mesma lógica do tipo `text`).
2. Adicionar suporte a `field_type === 'single_choice'` (renderizar como `Select`/`RadioGroup` lendo opções de `metadata.options`, tratando o caso em que as opções vêm como `[{value, label}]`).
3. Adicionar suporte a `field_type === 'date'` (renderizar `<Input type="date" />`).
4. Manter retro-compatibilidade com `text`, `select_one`, etc. já existentes.

Sem alterações no banco, no `EncontroMicrociclosForm.tsx` (que já funciona corretamente em outro fluxo), nem em outros formulários — apenas o renderer compartilhado.

## Resultado esperado

No modal **Gerenciar** da ação Microciclos:
- "Acesso aos dados na Plataforma Trajetórias" e "Quizzes registrados / utilizados" → seleção única
- "Observações sobre uso da Plataforma", "Principais pontos fortes", "Aspectos a fortalecer", "Encaminhamentos acordados", "Pauta prevista" → caixas de texto editáveis
- "Data prevista do próximo encontro" → seletor de data

Os mesmos benefícios se aplicam automaticamente a qualquer outro instrumento que use esses tipos no banco.
