# Nova ação/evento: "Alterações de agenda da visita" (Programa Escolas)

Criar uma nova ação exclusiva do Programa de Escolas, com cadastro simples e um formulário de registro com duas perguntas obrigatórias.

## Campos

Cadastro:
- Data (obrigatória)
- Escola (entidade, obrigatória)
- Consultor (responsável, obrigatório)
- Título, Descrição e Tags ocultos
- Sem Segmento, Componente, Ano/Série, Hora início/fim

Registro da ação (ambas obrigatórias):
- Contexto da alteração — seleção de 1 ou mais opções: Feriado; Reunião de Pais; Conselho de Classe; Evento na escola; Convocação do profissional; Ausência do profissional; Outros
- Impacto na agenda — texto longo

## Alterações técnicas

Chave técnica: `alteracao_agenda_visita`.

1. Banco (migração):
   - Atualizar os checks `programacoes_tipo_check` e `registros_acao_tipo_check` para aceitar o novo tipo.
   - Inserir em `form_config_settings` a linha `form_key = 'alteracao_agenda_visita'` com `programas = {escolas}`.
   - Inserir em `instrument_fields` os dois campos (`contexto_alteracao` como `select_multi` com as 7 opções em `metadata.options`; `impacto_agenda` como `textarea`), ambos `is_required = true`.
2. `src/config/acaoPermissions.ts`: adicionar o tipo em `AcaoTipo`, `ACAO_TIPOS`, `ACAO_TYPE_INFO` (rótulo "Alterações de agenda da visita", ícone `CalendarClock`), permissões iguais às demais ações de Escolas (N1 total, N2/N3 por programa, N4.1/N4.2/N5 por entidade, N6–N8 sem acesso) e `ACAO_FORM_CONFIG` com `requiresEntidade: true`, `useResponsavelSelector: true`, `responsavelLabel: 'Consultor'`, sem segmento/componente/ano-série.
3. `src/hooks/useInstrumentFields.ts`: incluir o tipo em `INSTRUMENT_FORM_TYPES` para o roteamento automático do formulário genérico (`InstrumentForm`) — não precisa de componente dedicado.
4. `src/pages/admin/ProgramacaoPage.tsx`: ocultar Descrição, Tags e horários para esse tipo; garantir validação obrigatória de Data, Escola e Consultor.
5. `src/components/layout/Sidebar.tsx`: incluir o tipo na lista de ações do grupo do Programa Escolas, onde já constam as demais ações de Escolas (visibilidade por ação).

## Fora de escopo

- Não será criada página de relatório/painel para essa ação (não solicitado). Os registros aparecem normalmente em Programação, Registros e na visualização do formulário completo.

## Validação

- `npx tsgo --noEmit -p tsconfig.app.json`
- Conferir no preview: a ação aparece em "Adicionar Ação" (programa Escolas), o cadastro salva e o formulário de gerenciamento exige as duas respostas.
