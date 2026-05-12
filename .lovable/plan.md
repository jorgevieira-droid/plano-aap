# Editar formulários de ações/programações já realizadas

## Comportamento atual

**Em `/programacao`:**
- Botão "Editar" → `handleOpenEditProgramacao` → edita só metadados da programação (data, horário, escola, segmento, tags etc.). **Não toca nos dados dos formulários/instrumentos preenchidos.**
- Botão "Gerenciar" → renderizado **apenas** quando `status === "prevista"`. Ou seja, depois de marcada como `realizada`, não há entrada para reabrir o formulário preenchido.
- Para `realizada`, só aparece "Acompanhamento" (em formação).

**Em `/registros`:**
- Botão "Gerenciar" (`handleOpenManage`) já é exibido em qualquer status e já pré-carrega dados existentes para a maioria dos tipos:
  - Tipos de instrumento → carrega `instrument_responses` ✓
  - `acompanhamento_aula` → carrega `avaliacoes_aula` ✓
  - `monitoramento_acoes_formativas` → `MonitoramentoRegionaisManageDialog` carrega o registro existente ✓
  - `observacao_aula_redes` → abre `ObservacaoAulaRedesForm` (precisa confirmar pré-carregamento)
  - Default (formação/encontros) → carrega `presencas` ✓ mas **não** carrega `observacoes/avancos/dificuldades` da programação nem `instrument_responses` quando aplicável.

Resultado: na Programação, edição pós-realizada é inviável; em Registros, parte dos campos não vem pré-preenchida.

## Mudanças

### 1. `src/pages/admin/ProgramacaoPage.tsx` — habilitar reabertura do formulário em realizadas

- Botão "Gerenciar" passa a aparecer também quando `status === "realizada"` (calendário e tabela). Quando `realizada`, o rótulo passa a ser "Editar Formulário" para diferenciar de programação prevista.
- Em `handleOpenManageDialog`, se `prog.status === "realizada"`:
  - Setar `acaoRealizada = true` automaticamente.
  - Pular o passo "A ação aconteceu? Sim/Não/Reagendar/Cancelar" — abrir direto o fluxo do tipo (mesmo que o atual roteamento de `handleManageSubmit` faz quando `acaoRealizada === true`).
  - Não permitir mudar para "não realizada" / cancelar a partir desse fluxo (manter realizada).
- Em `handleManageSubmit`, quando vier de uma realizada, **pré-carregar** dados existentes em vez de inicializar vazio:
  - Ramo `INSTRUMENT_TYPE_SET` (linhas ~1844): buscar `instrument_responses.responses` e `questoes_selecionadas` por `registro_acao_id` + `form_type` e popular `instrumentResponses` antes de abrir `IsInstrumentDialogOpen`.
  - Ramo `TIPOS_COM_PRESENCA` (formação/encontros/microciclos): além de buscar professores, ler `presencas` existentes para inicializar `presencaList`, e ler `observacoes/avancos/dificuldades` do `registros_acao` (e `instrument_responses` se houver para encontros) para popular `observacoesFormacao`, `avancosFormacao`, `dificuldadesFormacao`, `instrumentResponses`.
  - Ramo `acompanhamento_aula/observacao_aula`: ler `instrument_responses` por professor (consulta filtrada por `registro_acao_id` + `form_type`) e popular `perProfessorResponses` e `selectedQuestionKeys` (a partir de `questoes_selecionadas` salva).
  - Ramo `registro_consultoria_pedagogica`: ler `consultoria_pedagogica_respostas` por `registro_acao_id` e popular o estado do `ConsultoriaDialog` (componente já recebe `registroId`; garantir que o componente também carrega — ajuste apenas se necessário).
  - Ramo `monitoramento_acoes_formativas`: nada a mudar (componente já carrega).
  - Ramo `observacao_aula_redes` (se tratado por aqui): ler `observacoes_aula_redes` por `registro_acao_id` e injetar no formulário.
- No submit dos sub-fluxos (presença, instrumento, avaliações, consultoria, monitoramento) usar `update` quando o registro já existir (a maioria já faz; padronizar).

### 2. `src/pages/admin/RegistrosPage.tsx` — pré-carregar campos faltantes

- No ramo default de `handleOpenManage` (formação/encontros), além de `presencas`, buscar do `registros_acao` os campos `observacoes/avancos/dificuldades` e popular os estados correspondentes do dialog, e buscar `instrument_responses` (quando o tipo possuir instrumento associado, ex.: encontros REDES) para popular `instrumentResponses`.
- Em `handleOpenManage` para `observacao_aula_redes`: garantir que `ObservacaoAulaRedesForm` recebe `registroAcaoId` e carrega o registro existente (ajustar o componente se não carregar).
- Manter botão "Gerenciar" visível em qualquer status (já está) e o gating por `canEdit` (role + ownership N4/N5; admin/gestor sem restrição). **Sem mudanças nas regras de permissão/RLS.**

### 3. `src/components/formularios/ObservacaoAulaRedesForm.tsx`

- Verificar se já carrega o registro existente por `registro_acao_id`. Se não, adicionar `useEffect` para `select * from observacoes_aula_redes where registro_acao_id = ?` no mount e popular o formulário; manter `update` no salvar quando já existir (atualmente provavelmente já existe; ajustar somente o que faltar).

## Permissões / segurança

- Sem alteração nas RLS. As tabelas (`instrument_responses`, `avaliacoes_aula`, `presencas`, `consultoria_pedagogica_respostas`, `relatorios_monit_acoes_formativas`, `observacoes_aula_redes`) já têm políticas de UPDATE para N1 (admin) / N2 (gestor) / N3 (coordenador) / N4-N5 (operacional, dono ou via `user_has_full_data_access`).
- O botão "Editar Formulário" continua gated pelo `canUserEditAcao(role, tipo)` + ownership já existente.
- N6/N7/N8 não recebem nem o botão nem permissão de UPDATE (continua como hoje).

## Fora de escopo

- Não criar novo status, não tocar em fluxo de cancelamento/reagendamento.
- Não alterar regras de filtro por programa/hierarquia.
- Não mexer em metadados editáveis pelo `handleOpenEditProgramacao` (continua disponível em paralelo).

## Validação

- Em cada tipo de ação (Observação de Aula, Acompanhamento de Aula, Observação Aula REDES, Formação, Encontros REDES, Microciclos, Lista de Presença, Consultoria Pedagógica, Apoio Presencial, Monitoramento Regionais, instrumentos diversos): marcar como realizada → reabrir via "Editar Formulário" → conferir que todos os campos vêm preenchidos → alterar 1 campo → salvar → reabrir e confirmar persistência.
- Validar com perfis N1, N2, N3, N4.1, N4.2, N5: visibilidade do botão respeitando programa/escola/dono.
