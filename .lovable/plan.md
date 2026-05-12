## Problema

Em `/registros` e `/programacao` (visões calendário e lista), o botão "Editar" (lápis) abre um **diálogo genérico de metadados** (programa, status, segmento, componente, observações), não o formulário próprio da ação. O usuário espera o mesmo comportamento da impressão: abrir o **formulário específico** da ação já preenchido com as respostas existentes (presenças, instrument_responses, consultoria, monitoramento regionais, REDES etc.) quando a ação está `realizada`.

A lógica de pré-preenchimento por tipo já existe:
- `/registros` → `handleOpenManage` (linha 648 de `RegistrosPage.tsx`) roteia por tipo e pré-carrega dados.
- `/programacao` → `handleOpenEditRealizada` (linha 1550 de `ProgramacaoPage.tsx`) faz o mesmo via `handleManageSubmit`.

Basta direcionar o botão "Editar" para esses fluxos.

## Mudanças

### `src/pages/admin/RegistrosPage.tsx`

1. Trocar o `onClick` do botão lápis "Editar Observações" (linha 1529) de `handleOpenEdit` para `handleOpenManage`. Atualizar `title` para "Editar Formulário".
2. Como `handleOpenManage` já existia no botão Users/ClipboardCheck, remover esse botão duplicado (linhas 1512–1518) — manter apenas o lápis consolidado.
3. Manter o botão "Editar Presenças" (UserCheck) separado para `ENCONTRO_PRESENCE_TYPES`, pois edita só presenças.
4. Para `ENCONTRO_PRESENCE_TYPES` em `INSTRUMENT_TYPE_SET` (encontros REDES e Microciclos), o `handleOpenManage` já carrega `instrument_responses`; complementar carregando também `observacoes/avancos/dificuldades` de `registros_acao` e exibi-los abaixo do `InstrumentForm` no diálogo `isInstrumentManaging` (linha 3058), salvando-os em `handleSaveInstrumentManage` via update em `registros_acao`.
5. Manter o diálogo genérico `isEditing` apenas como fallback para `status === 'cancelada'`, acionado por um botão secundário "Editar Agendamento" (opcional, somente quando relevante).

### `src/pages/admin/ProgramacaoPage.tsx`

1. Criar `handleEditAcaoClick(prog)`:
   - `status === 'realizada'` → `handleOpenEditRealizada(prog)`
   - `status === 'prevista'` → `handleOpenManageDialog(prog)`
   - `status === 'cancelada'` → `handleOpenEditProgramacao(prog)` (fallback metadados)
2. Trocar o `onClick` dos botões "Editar" (lápis) no calendário (linha 4182) e na lista (linha 4322) para `handleEditAcaoClick`.
3. Remover botões duplicados "Gerenciar" (linhas 4188 e 4328) e "Editar Formulário" (linhas 4194 e 4334).
4. Manter "Acompanhamento" (formação realizada) e "Imprimir" inalterados.
5. Adicionar botão secundário "Editar Agendamento" apenas para `status === 'prevista'` chamando `handleOpenEditProgramacao`, para quem quiser ajustar somente data/horário/escola sem abrir o formulário.

## Permissões

Sem mudanças. `canEdit(registro)` em `/registros` e `canEditProgramacao(prog)` em `/programacao` continuam controlando visibilidade. Políticas RLS de UPDATE em `presencas`, `avaliacoes_aula`, `instrument_responses`, `consultoria_pedagogica_respostas`, `relatorios_monit_acoes_formativas`, `observacoes_aula_redes` já cobrem N1–N3 e N4–N5 quando dono.

## Validação

Como N1, N3 e N5 (dono):
- Em `/registros` e `/programacao` (calendário e lista), clicar "Editar" em ação `realizada` de cada tipo principal (Formação, Consultoria Pedagógica, Apoio Presencial, Observação de Aula, Microciclos, Encontros REDES, Monitoramento Regionais, Devolutiva, Agenda de Gestão).
- Confirmar que abre o formulário específico do tipo, com respostas/notas/presenças/observações pré-preenchidas e editáveis.
- Salvar e confirmar que os registros são atualizados (não duplicados) na tabela alvo.
- Em ação `prevista`, confirmar que "Editar" abre o fluxo "aconteceu?" e em seguida o formulário correto.
- Em `prevista`, confirmar que "Editar Agendamento" abre apenas metadados.
