## Diagnóstico

Na página **Registros**, ao gerenciar uma ação `Visita Técnica – Microciclos` (tipo `observacao_aula_redes`):

1. Abre o AlertDialog "A ação aconteceu?" → clicar **Sim** abre o AlertDialog "Deseja preencher o checklist?".
2. Clicar **Sim, preencher** deveria abrir o Dialog com o `VisitaTecnicaMicrociclosForm` — mas nada aparece.

**Causa:** os AlertDialogs intermediários têm `onOpenChange` que zera `selectedRegistro`:

```ts
onOpenChange={(open) => { if (!open) { setShowConfirmRedesChecklist(false); setSelectedRegistro(null); } }}
```

Quando o usuário clica em `AlertDialogAction`, o componente fecha automaticamente e dispara esse handler, limpando `selectedRegistro` no mesmo ciclo em que `setIsRedesManaging(true)` roda. O Dialog até abre, mas o corpo é `{selectedRegistro && <VisitaTecnicaMicrociclosForm .../>}` — como ficou `null`, não renderiza nada (modal vazio invisível atrás do fundo escurecido).

O mesmo padrão existe nos demais confirms intermediários (`showConfirmRedesAconteceu`, `showConfirmMonitRegionaisAconteceu`, `showConfirmRealizacao`), então a passagem entre confirms só funciona "por sorte" — em alguns fluxos a próxima dialog é aberta antes do `onOpenChange` rodar.

## Escopo da correção

### 1. Bug do checklist (correção imediata)

Em `src/pages/admin/RegistrosPage.tsx`, ajustar o `onOpenChange` dos AlertDialogs intermediários para **não** limpar `selectedRegistro` quando o próximo passo do fluxo já está prestes a abrir.

Abordagem: usar um flag "fluxo em transição" ou simplesmente remover `setSelectedRegistro(null)` desses `onOpenChange` — o `selectedRegistro` passa a ser limpo apenas pelos handlers terminais (`onSuccess` do form, "Não" no aconteceu, fechamento do Dialog principal `isRedesManaging` / `isMonitRegionaisManaging` / `isInstrumentManaging` / `isManaging`).

Dialogs afetados:
- `showConfirmRedesAconteceu` (linha 2900)
- `showConfirmRedesChecklist` (linha 2960)
- `showConfirmMonitRegionaisAconteceu` (linha 2927)
- `showConfirmRealizacao` (acompanhamento_aula)

### 2. Unificar gerenciamento de Registros com Programação

Hoje há duplicação:
- `ProgramacaoPage.handleManageSubmit` (roteador unificado por tipo, com pergunta "aconteceu?", reagendamento, agendar acompanhamento, formulário próprio para cada tipo).
- `RegistrosPage.handleOpenManage` (handlers bespoke por tipo, sem reagendamento, sem agendar acompanhamento, com dialogs diferentes).

**Proposta:** extrair o fluxo de gerenciamento de Programação para um componente/hook reutilizável (`useManageAcaoFlow` + `ManageAcaoDialog`) que receba `programacao` ou `registro` como entrada, e usar esse componente nos dois lugares. Resultado: comportamento idêntico em Calendário/Programação e Registros para **todas** as ações (REDES, Regionais, instrumentos, acompanhamento, presença, etc.).

Antes de partir para essa unificação, preciso confirmar o escopo com você — é um refactor grande que toca todas as ações.

## Perguntas antes de seguir

1. **Quero corrigir só o bug agora (rápido)** ou **já fazer o refactor completo de unificação** (mais demorado, mexe em vários fluxos)?
2. Se for unificar: o comportamento de referência é **exatamente** o de Programação (incluindo "reagendar?" e "agendar acompanhamento?" dentro do mesmo diálogo, em Registros)? Ou só o roteamento por tipo de ação?
3. Em Registros, ao reagendar via gerenciamento, devemos atualizar tanto `registros_acao` quanto a `programacao` vinculada (igual Programação faz)?

