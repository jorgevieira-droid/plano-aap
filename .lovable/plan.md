## Problema

A legenda das rubricas (0–3) já foi adicionada ao diálogo de gerenciamento em `RegistrosPage.tsx`, mas o usuário está abrindo o instrumento pelo fluxo da **Programação** (`/programacao` → "Instrumento Pedagógico"), que vive em `ProgramacaoPage.tsx` (linhas 5579–5630) e renderiza `InstrumentForm` direto, sem o bloco de legenda. Por isso a legenda não aparece.

## Solução

Centralizar a legenda dentro do próprio `InstrumentForm.tsx` para que apareça automaticamente em **todos** os lugares onde o instrumento `visita_tecnica_secretaria_sme` é exibido (Programação, Registros, e qualquer outro futuro).

### Mudanças

1. **`src/components/instruments/InstrumentForm.tsx`**
   - Adicionar um novo card de legenda `VisitaSmeRubricLegendCard` com a escala 0–3 (cores: vermelho `#c0392b`, laranja `#e67e22`, amarelo `#f1c40f`, verde `#27ae60`), seguindo o mesmo padrão visual do `RubricLegendCard` existente.
   - Renderizar o card quando `formType === 'visita_tecnica_secretaria_sme'`, logo após o `BinaryScaleLegendCard`/`RubricLegendCard` e antes das dimensões.

2. **`src/pages/admin/RegistrosPage.tsx`** (linhas 3520–3545)
   - Remover o bloco de legenda duplicado, já que o `InstrumentForm` passará a renderizá-lo. Manter o bloco "Dados do cadastro" (linhas 3504–3519), que é específico do gerenciamento.

### Validação

- Abrir uma programação SME em `/programacao` → clicar em "Instrumento Pedagógico" → confirmar que a legenda aparece acima das perguntas.
- Abrir o mesmo registro em `/registros` → confirmar que o bloco "Dados do cadastro" continua aparecendo e que a legenda aparece **uma única vez** (sem duplicação).
