# Nova Ação: Registro de Planejamento Conjunto com o Professor

Nova ação/formulário exclusiva do Programa de Escolas, seguindo o mesmo padrão de "Registro de Formação Coletiva".

Observação: o pedido cita a página de resultados como "Relatório - Registro de Formação Coletiva" (essa página já existe). Vou assumir que se trata da nova ação e nomear a página **"Relatório - Planejamento Conjunto"**. Se preferir outro nome, é só dizer.

## 1. Cadastro (agendamento)

Campos exibidos: Escola, Data, Hora início/fim, Consultor, Professor (texto curto), Segmento, Componente, Ano-Série, Turma.
Campos ocultos: Descrição e Tags. Programa fica oculto quando o usuário tem apenas 1 programa (regra já existente).

## 2. Registro da Ação (instrumento)

- Turma do VOAR? (Sim / Não)
- Quantos estudantes abaixo do básico a turma possui? (número)
- Quantos estudantes no Básico a turma possui? (número)
- Quantos estudantes elegíveis a turma possui? (número)
- Tema da aula (texto curto)
- Nº da aula (MD/SP em ação) (número)
- Registre as contribuições realizadas ao planejamento do professor (texto longo)
- Como essa aula será monitorada pela consultoria? (texto longo)

## 3. Página "Relatório - Planejamento Conjunto"

Mesma linguagem visual de "Relatórios - Apoio Presencial", disponível para N1/N2/N3 do Programa de Escolas, com filtros de período, escola e consultor (listas em ordem alfabética) e exportação em PDF.

Blocos, nesta ordem:

1. **Indicadores (cards numéricos)**: total de planejamentos registrados; planejamentos em turmas do VOAR; escolas atendidas; consultores envolvidos; média de estudantes elegíveis por turma; média do Nº da aula (MD/SP).
2. **Números da turma**: totais e médias de estudantes abaixo do básico, no básico e elegíveis, com participação percentual de cada faixa.
3. **Tabelas de ranking** (quantidade + barra proporcional): por Escola e por Consultor, com colunas de total de registros, % turmas VOAR e média de elegíveis.
4. **Gráficos de evolução mensal**: linha com registros por mês e linhas com médias mensais de estudantes elegíveis / abaixo do básico / básico.
5. **Distribuições**: barras por Segmento, Componente e Ano-Série.
6. **Seções qualitativas**: listas dos textos de "contribuições ao planejamento" e "monitoramento pela consultoria", agrupadas por escola/data, com tema da aula e Nº da aula em destaque.

## Detalhes técnicos

- Novo tipo `registro_planejamento_conjunto` seguindo o checklist de novo AcaoTipo:
  - Migração: atualizar `programacoes_tipo_check` e `registros_acao_tipo_check` e inserir `form_config_settings` com `programas = {escolas}`.
  - `src/config/acaoPermissions.ts`: adicionar ao union `AcaoTipo`, à lista de tipos, `ACAO_TYPE_INFO`, `buildRolePerms` (mesmo padrão dos demais registros: CRUD_ALL / CRUD_PRG / CRUD_ENT, N6-N8 sem acesso) e config de cadastro com `requiresEntidade: true`, `showSegmento/showComponente/showAnoSerie: true`, `responsavelLabel: 'Consultor'`.
  - `src/hooks/useInstrumentFields.ts`: incluir em `INSTRUMENT_FORM_TYPES`.
- `src/pages/admin/ProgramacaoPage.tsx`: incluir o tipo na condição que oculta Descrição/Tags, exibir campo Professor (reaproveitando `apoio_professor_nome`) e Turma para este tipo.
- Novo componente `PlanejamentoConjuntoContent` em `src/components/formularios/` e registro em `InstrumentFormRouter.tsx` + `DEDICATED_CONTENT_TYPES`; respostas gravadas em `instrument_responses` (`form_type = 'registro_planejamento_conjunto'`), sem nova tabela.
- Nova página `src/pages/admin/RelatoriosPlanejamentoConjuntoPanelPage.tsx` (baseada em `RelatoriosApoioPresencialPanelPage.tsx`), rota `/relatorios-planejamento-conjunto` em `App.tsx`/`AppLayout.tsx` e item no `Sidebar.tsx` com `requiresAcao: ['registro_planejamento_conjunto']`.
- Ordenação alfabética com `localeCompare('pt-BR', { sensitivity: 'base' })`; PDF com marca dupla Parceiros + Bússola.
