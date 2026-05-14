## Objetivo

1. Garantir que **N2** e **N3** do programa **Regionais** vejam **duas** opções ao clicar em "+ Nova Ação":
   - **Monitoramento de Ações Formativas – Regionais**
   - **Monitoramento e Gestão**
2. Implementar o **gerenciamento** da ação **Monitoramento e Gestão** com fluxo "Sim/Não" e abertura do formulário dedicado (`MonitoramentoGestaoForm`), respeitando a regra de reverter para "Prevista" caso o instrumento seja fechado sem salvar.

---

## Situação atual (descoberta na exploração)

- `monitoramento_gestao` já está em `REGIONAIS_CADASTRABLE_TIPOS` e mapeado a `programas = {regionais}` em `form_config_settings`.
- Permissões (`acaoPermissions.ts`) já dão `CRUD_PRG` para N2/gestor e N3/coordenador.
- O componente `src/components/formularios/MonitoramentoGestaoForm.tsx` **existe mas não é referenciado em lugar nenhum** — o "Gerenciar" cai hoje no `InstrumentForm` genérico, sem o fluxo dedicado.
- Não há ramo dedicado em `ProgramacaoPage.tsx` (`handleManageSave`) para `monitoramento_gestao` — diferente do `monitoramento_acoes_formativas`, que abre o `MonitoramentoRegionaisManageDialog`.

---

## Mudanças

### 1. Type Selection — "+ Nova Ação"

Verificar/garantir que o filtro existente em `ProgramacaoPage.tsx` (linhas 2950–2966) liste ambos para N2/N3 simulando ou pertencendo a Regionais. A configuração já está correta; apenas validar visualmente que ambos aparecem (sem alteração de código esperada — caso ainda não apareçam, a causa será na lista `creatableAcoes`/`gestorProgramas`, e ajustaremos pontualmente).

### 2. Gerenciamento de "Monitoramento e Gestão"

Em `src/pages/admin/ProgramacaoPage.tsx`, dentro de `handleManageSave` (após o ramo de `monitoramento_acoes_formativas`, antes do bloco genérico de instrumentos):

- **Pergunta "ocorreu? Sim/Não"** já existe no Manage Dialog (estado `acaoRealizada`). Reutilizar.
- Se **Não** → marcar `programacao.status = 'nao_realizada'` (comportamento padrão atual). Sem mudança.
- Se **Sim** e `tipo === 'monitoramento_gestao'`:
  1. Buscar/criar `registros_acao` com `status = 'prevista'` (mesmo padrão do `monitoramento_acoes_formativas`).
  2. Pré-carregar `instrument_responses` existentes (form_type `monitoramento_gestao`) e setar `instrumentHadSavedResponse`.
  3. Fechar Manage Dialog e abrir um novo `Dialog` contendo `<MonitoramentoGestaoForm registroAcaoId={...} entidades={[escola]} data={...} horarioInicio={...} onSuccess={...} />`.
  4. **Onsuccess** (após salvar o instrumento): atualizar `programacao.status = 'realizada'`, criar/atualizar `registros_acao.status = 'realizada'`, fechar dialog, recarregar lista, toast de sucesso.
- **Fechar sem salvar**: reusar `handleInstrumentDialogCloseRequest` + `AlertDialog` já implementado para a regra geral. Caso o instrumento ainda não tenha resposta salva (`instrumentHadSavedResponse === false`), pedir confirmação e reverter `programacao.status` para `prevista`, deletando `registros_acao` órfão.

### 3. Persistência do `MonitoramentoGestaoForm`

Pequenos ajustes no `MonitoramentoGestaoForm.tsx`:
- Aceitar `initialValues` (ou carregar via `instrument_responses` no mount usando `registroAcaoId` + `form_type='monitoramento_gestao'`) para suportar reabertura de uma ação já realizada.
- Na submissão, gravar duas vezes:
  - `relatorios_monitoramento_gestao` (tabela específica, já usada hoje pelo form).
  - `instrument_responses` com `form_type='monitoramento_gestao'` e `responses = {...}` — necessário para a regra "fechou sem salvar = reverte" reconhecer que há instrumento preenchido.

---

## Detalhes técnicos

- **Arquivos editados**:
  - `src/pages/admin/ProgramacaoPage.tsx` — novo ramo `monitoramento_gestao` em `handleManageSave`; novo `Dialog` com `MonitoramentoGestaoForm`; reuso de `handleInstrumentDialogCloseRequest` / `handleConfirmRevertToPrevista`.
  - `src/components/formularios/MonitoramentoGestaoForm.tsx` — adicionar carga inicial via `instrument_responses` e gravação dupla (tabela específica + `instrument_responses`).

- **Estados novos** em `ProgramacaoPage`:
  - `isMonitGestaoManaging: boolean`
  - `monitGestaoRegistroId: string | null`
  - `monitGestaoInitial: Record<string, any> | undefined`

- **Sem migrações** — tabelas `relatorios_monitoramento_gestao` e `instrument_responses` já existem.

- **Sem mudança em `acaoPermissions.ts`** ou `form_config_settings` — já corretos.

---

## Critérios de aceite

1. Logado como N2 ou N3 com programa Regionais, clicar "+ Nova Ação" exibe **dois** cards: "Monitoramento de Ações Formativas – Regionais" e "Monitoramento e Gestão".
2. Criar uma ação `monitoramento_gestao`, depois "Gerenciar" → escolher "Sim, ocorreu" → abre o formulário dedicado de Monitoramento e Gestão.
3. Salvar o formulário marca a ação como Realizada e grava em `relatorios_monitoramento_gestao` + `instrument_responses`.
4. Reabrir "Editar Agendamento" da ação realizada exibe os dados preenchidos.
5. Fechar o formulário sem salvar exibe o `AlertDialog` de confirmação; ao confirmar, a ação volta para "Prevista" e o `registros_acao` órfão é removido.
