## Objetivo
Ao tentar fechar o diálogo "Gerenciar" de uma ação com o instrumento preenchido (sem ter clicado em "Salvar Instrumento"), exibir confirmação:

> **Atenção! Informações de preenchimento não salvas! Deseja realmente fechar?** — Sim / Não

- **Sim:** descarta as alterações e fecha o diálogo.
- **Não:** mantém o diálogo aberto com o que foi preenchido.

## Observação importante sobre "status anterior"

Em `RegistrosPage.tsx > handleManageRegistro` (linhas 678-690), abrir o "Gerenciar" para um instrumento **não altera o status** da ação — o status só vai para `realizada` dentro de `handleSaveInstrumentManage` (linhas 977-992). Portanto fechar sem salvar **já preserva o status anterior naturalmente**, sem necessidade de rollback. O plano não toca em status.

## Mudanças

**Arquivo:** `src/pages/admin/RegistrosPage.tsx`

1. **Snapshot inicial das respostas** ao abrir o diálogo (em `handleManageRegistro`, junto de `setInstrumentResponses(...)` na linha 688): guardar em um novo state `initialInstrumentResponses` (JSON do mesmo valor carregado).

2. **Helper `isInstrumentDirty`**: compara `JSON.stringify(instrumentResponses)` com `JSON.stringify(initialInstrumentResponses)`.

3. **Novo state** `showUnsavedConfirm: boolean` para o `AlertDialog` de confirmação.

4. **Função `attemptCloseInstrumentDialog()`**:
   - Se `isInstrumentDirty()` → `setShowUnsavedConfirm(true)`.
   - Senão → fecha direto (`setIsInstrumentManaging(false); setSelectedRegistro(null); setInstrumentFormType(null);`).

5. **Substituir as 2 chamadas atuais que fecham o dialog** (linhas 3061 `onOpenChange` e 3083 botão "Cancelar") por `attemptCloseInstrumentDialog`.

6. **Após salvar com sucesso** em `handleSaveInstrumentManage` (linhas 994-997): também limpar `initialInstrumentResponses` para evitar dirty falso.

7. **Adicionar `<AlertDialog>`** logo após o Dialog do instrumento (após linha 3092):
   - Título: "Atenção! Informações de preenchimento não salvas!"
   - Descrição: "Deseja realmente fechar?"
   - `Cancel`: "Não" → apenas fecha o AlertDialog (mantém o instrumento aberto).
   - `Action`: "Sim" → fecha o instrumento descartando alterações e fecha o AlertDialog.

## Escopo

- Apenas o Dialog genérico `isInstrumentManaging` em `RegistrosPage.tsx` (linha 3061) — cobre todas as ações de instrumento padrão (ConsultoriaPedagógica, Observação de Aula etc.).
- **Fora do escopo:** `MonitoramentoRegionaisManageDialog` e `Gerenciar Presenças` / `Gerenciar Avaliações de Aula` (têm fluxos próprios). Posso estender depois se você confirmar.
- Sem mudanças de banco, RLS, ou em outros componentes.
