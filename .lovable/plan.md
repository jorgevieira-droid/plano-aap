# Título específico da ação no diálogo do instrumento + legenda SME

## Problema
O diálogo de gerenciamento do instrumento em `/programacao` usa o título fixo "Instrumento Pedagógico" para todas as ações, em vez do nome real da ação (ex.: "Visita Técnica à Secretaria (SME)"). A legenda das rubricas já foi centralizada no `InstrumentForm`, mas o preview que você estava vendo carregou uma versão antiga do app (bundle desatualizado) — por isso ela ainda não apareceu.

## Mudanças

### 1. `src/pages/admin/ProgramacaoPage.tsx`
- **Diálogo do Instrumento Pedagógico (linha ~5594):** substituir o título fixo "Instrumento Pedagógico" por `getAcaoLabel(selectedProgramacao.tipo)`, mantendo "Instrumento Pedagógico" apenas como fallback quando não houver ação selecionada. Assim, ao gerenciar uma Visita Técnica à Secretaria (SME), o título mostrará o nome correto da ação.
- **Bloco inline no diálogo de presenças (linha ~5497):** mesmo ajuste no cabeçalho "Instrumento Pedagógico" exibido para Formação/REDES, usando o nome da ação.

### 2. Legenda das rubricas (SME)
- Nenhuma mudança de código adicional necessária: `InstrumentForm` já renderiza a `VisitaSmeRubricLegendCard` antes das dimensões quando o tipo é `visita_tecnica_secretaria_sme` — vale tanto para `/programacao` quanto para `/registros`.
- Após a implementação, validar no preview atualizado que a legenda aparece acima de "DIMENSÃO 1".

## Validação
1. Em `/programacao`, gerenciar a ação "teste" (Visita Técnica à Secretaria – SME) → o diálogo deve abrir com o título "Visita Técnica à Secretaria (SME)" e a legenda das rubricas (0–3 colorida) antes da Dimensão 1.
2. Em `/registros`, abrir o mesmo instrumento → confirmar que título, "Dados do cadastro" e legenda continuam corretos, sem duplicação.