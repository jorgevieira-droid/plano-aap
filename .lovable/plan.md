## Problema

Em `/programacao`, ao clicar em **Gerenciar** numa ação `monitoramento_acoes_formativas` (Regionais), responder **Sim — A ação foi realizada** e salvar, é aberto o `Instrumento Pedagógico` genérico (`InstrumentForm`) com `formType="monitoramento_acoes_formativas"`. Como esse tipo não tem campos cadastrados, aparece **"Nenhum campo configurado para este instrumento."** e o fluxo correto (5 perguntas → "Preencher rubrica?" → seleção de rubrica) não é apresentado.

## Causa

`ProgramacaoPage.handleManageSubmit` cai no branch genérico (`INSTRUMENT_TYPE_SET.has(normalizedTipo)`, ~linhas 1796-1806) e abre `isInstrumentDialogOpen`. O fluxo dedicado `MonitoramentoRegionaisManageDialog` só estava ligado em `RegistrosPage`.

## Mudança

**`src/pages/admin/ProgramacaoPage.tsx`**

1. Importar `MonitoramentoRegionaisManageDialog`.
2. Adicionar dois estados: `isMonitRegionaisManaging` (boolean) e `monitRegionaisRegistroId` (string | null).
3. Em `handleManageSubmit`, **antes** do branch genérico de instrumento (linha 1796), adicionar:
   ```ts
   if (selectedProgramacao.tipo === 'monitoramento_acoes_formativas' && acaoRealizada) {
     // get-or-create registros_acao (mesmo padrão do branch de consultoria)
     // setMonitRegionaisRegistroId(regId)
     // setIsManageDialogOpen(false)
     // setIsMonitRegionaisManaging(true)
     return;
   }
   ```
   Reusa o snippet de `registro_consultoria_pedagogica` (linhas 1752-1793) só trocando o destino do dialog.
4. Renderizar `<MonitoramentoRegionaisManageDialog>` no fim do componente, com:
   - `registroAcaoId={monitRegionaisRegistroId}`
   - `escolaId`, `escolaNome`, `userId`, `registroStatus="prevista"`, `programacaoId={selectedProgramacao.id}`
   - `onClose` / `onSuccess`: fechar, limpar `selectedProgramacao` e invalidar `programacoes` + `registros_acao`, chamar `fetchProgramacoes()`.

Sem outras alterações: o `MonitoramentoRegionaisManageDialog` já implementa o fluxo correto (form de 5 textareas → AlertDialog "Preencher rubrica?" → Select com rubricas Regionais → InstrumentForm). O fluxo via `/registros` continua funcionando como já está.

## Fora de escopo

- Não altera `MonitoramentoRegionaisManageDialog`, `RegistrosPage`, RLS, permissões, nem o branch genérico (que continua válido para os demais tipos).
