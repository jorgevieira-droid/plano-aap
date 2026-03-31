
# Correção: opção **0** e aviso de escala nas ações REDES (fluxo de Instrumento Pedagógico)

## Diagnóstico confirmado
O problema está no fluxo genérico de **Instrumento Pedagógico** (modal da Programação), não nos formulários REDES dedicados.

1. A opção **0** não aparece porque o `InstrumentForm` usa:
- `min={field.scale_min || 1}`
- `max={field.scale_max || 4}`

Como `0` é falsy em JS, `scale_min = 0` vira `1`, removendo a opção 0.

2. O aviso **“Escala de Resposta”** não aparece nesse fluxo porque o modal renderiza apenas `<InstrumentForm />`, sem o `BinaryScaleLegendCard` para:
- `encontro_eteg_redes`
- `encontro_professor_redes`

## Implementação proposta

### Arquivo: `src/components/instruments/InstrumentForm.tsx`

1. **Corrigir fallback de escala para preservar zero**
- Trocar:
  - `field.scale_min || 1` por `field.scale_min ?? 1`
  - `field.scale_max || 4` por `field.scale_max ?? 4`

2. **Exibir o card “Escala de Resposta” para REDES binário**
- Importar `BinaryScaleLegendCard` de `redesFormShared`.
- Adicionar condição por `formType`:
  - `encontro_eteg_redes`
  - `encontro_professor_redes`
- Renderizar o card antes dos itens do formulário nesse componente (assim corrige em todos os fluxos que usam `InstrumentForm`, incluindo Programação e AAP).

## Resultado esperado
- Nas ações **Encontro Formativo ET/EG – REDES** e **Encontro Formativo Professor – REDES**, o usuário verá:
  - **0 – Não implementado**
  - **1 – Parcialmente implementado**
  - **2 – Implementado conforme previsto**
- O card **Escala de Resposta** volta a aparecer acima dos itens, como no layout de referência.

## Validação funcional (E2E)
1. Abrir `/programacao`.
2. Gerenciar uma ação de cada tipo REDES acima.
3. Verificar no modal “Instrumento Pedagógico”:
   - presença dos 3 níveis (0, 1, 2);
   - presença do card “Escala de Resposta”;
   - salvamento sem regressões.
