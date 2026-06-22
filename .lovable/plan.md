## Diagnóstico

A ação "Visitas Técnicas - Microciclos" usa internamente o tipo `observacao_aula_redes` (mapeamento em `useInstrumentFields.ts` linha 61).

Fluxo atual em `src/pages/admin/RegistrosPage.tsx` quando o preenchimento acontece pela guia Registros:

1. `handleOpenManage` (linha 709) → dispara o dialog "A ação aconteceu?".
2. "Sim" → `handleConfirmRedesAconteceu` → abre o dialog "Deseja preencher o checklist?".
3. `handleConfirmRedesChecklist`:
   - **"Não preencher"** → atualiza `registros_acao.status = 'realizada'` ✅ (linha 904)
   - **"Sim, preencher"** → apenas `setIsRedesManaging(true)`, **sem atualizar o status** ❌
4. O formulário (`VisitaTecnicaMicrociclosForm`) faz upsert em `relatorios_visita_tecnica_microciclos` com `status='enviado'`, mas **nunca toca em `registros_acao.status`**.
5. `onSuccess` do dialog (linhas 3289–3293) só fecha o modal e invalida a query.

Resultado: o registro permanece com o status anterior (`agendada`/`prevista`/`reagendada`) mesmo após o envio do formulário. O status correto utilizado no sistema é **`realizada`** (não existe `concluido` em `registros_acao`).

## Correção proposta

**Arquivo único: `src/pages/admin/RegistrosPage.tsx`**

No `onSuccess` do `<VisitaTecnicaMicrociclosForm>` (linhas 3289–3293), atualizar `registros_acao.status = 'realizada'` para `selectedRegistro.id` antes de fechar o modal e invalidar a query. Mesma mecânica já usada em outros fluxos (ex.: `handleConfirmRedesChecklist` linha 904, GPA/Alfab/T@RL em `ProgramacaoPage.tsx`).

```ts
onSuccess={async () => {
  if (selectedRegistro) {
    await supabase
      .from('registros_acao')
      .update({ status: 'realizada' })
      .eq('id', selectedRegistro.id);
  }
  setIsRedesManaging(false);
  setSelectedRegistro(null);
  queryClient.invalidateQueries({ queryKey: ['registros_acao'] });
}}
```

## Fora de escopo

- Não alterar o schema nem o formulário.
- Não mexer no fluxo do `ProgramacaoPage`, que já marca `realizada` corretamente.
- Não alterar o status `'enviado'` da tabela `relatorios_visita_tecnica_microciclos` (semântica do relatório, independente do status da ação).

## Confirmação rápida

Você se referiu a "concluido", mas o status canônico em `registros_acao` é **`realizada`**. Vou aplicar `'realizada'` (consistente com todos os outros instrumentos). Se preferir outro valor, me avise.