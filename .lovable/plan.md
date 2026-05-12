# Correção: seleção da rubrica fecha a ação

## Diagnóstico

Em `src/components/formularios/MonitoramentoRegionaisManageDialog.tsx`, o `AlertDialog` "Preencher rubrica?" tem:

```tsx
onOpenChange={(o) => { if (!o) onClose(); }}
```

Quando o usuário clica em **"Sim, preencher"**, o handler faz `setStep('pick-rubric')`. Isso muda a condição `open && step === 'ask-rubric'` para `false`, o Radix dispara `onOpenChange(false)` e o `onClose()` do pai é chamado — fechando todo o fluxo antes do `Dialog` de seleção de rubrica conseguir abrir.

O mesmo padrão problemático existe no `Dialog` principal entre transições, mas como todos os steps de interesse (`form` / `pick-rubric` / `fill-rubric`) mantêm `open = true`, lá não dispara. O bug se concentra no `AlertDialog`.

## Mudança

Arquivo único: `src/components/formularios/MonitoramentoRegionaisManageDialog.tsx`

1. Remover a propagação automática do close no `AlertDialog` "ask-rubric". O fechamento do alerta deve acontecer apenas pelos botões explícitos:
   - "Não" → `handleFinish()` (já chama `onSuccess`)
   - "Sim, preencher" → `setStep('pick-rubric')`
   
   Trocar `onOpenChange={(o) => { if (!o) onClose(); }}` por um no-op (`onOpenChange={() => {}}`), garantindo que a transição de step não acione `onClose`.

2. (Defensivo) No `Dialog` principal, manter o comportamento atual (já funciona), mas garantir que ele só chame `onClose` quando o usuário realmente fecha externamente (clique fora / ESC) e não em transições internas — nenhuma alteração necessária pois `open` permanece `true` durante as transições internas.

## Resultado esperado

Após salvar as 5 perguntas → AlertDialog "Preencher rubrica?" → clicar em **"Sim, preencher"** → abre o Dialog `pick-rubric` com o `Select` listando as ações/formulários disponíveis para o programa Regionais → escolher uma → segue para `fill-rubric` com o `InstrumentForm` correspondente.
