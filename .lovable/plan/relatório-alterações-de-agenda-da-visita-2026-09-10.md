# Relatório – Alterações de agenda da visita

Criar um painel próprio para a ação "Alterações de agenda da visita" (Programa Escolas), no mesmo molde do "Relatórios – Apoio Presencial", e adicionar um resumo dela na página "Relatórios de Gestão – Programa Escolas".

## Origem dos dados

A ação já grava as respostas com duas perguntas: **Contexto da alteração** (uma ou mais opções: Feriado, Reunião de Pais, Conselho de Classe, Evento na escola, Convocação do profissional, Ausência do profissional, Outros) e **Impacto na agenda** (texto longo). Cada registro tem ainda Data, Escola e Consultor(a). Hoje existem 3 registros preenchidos.

## Nova página: "Relatório – Alterações de agenda da visita"

Mesma estrutura visual do painel de Apoio Presencial:

**Filtros no topo** (persistidos, iguais aos demais painéis): Data início, Data fim, Consultor(a) e Escola.

**Indicadores (cards)**
- Total de alterações registradas
- Escolas impactadas
- Consultores(as) com alterações
- Contexto mais frequente

**Visualizações**
- Alterações por contexto — gráfico de barras com a contagem de cada motivo (um registro com vários motivos conta em cada um deles)
- Alterações por escola — lista ordenada com quantidade
- Alterações por consultor(a) — lista ordenada com quantidade
- Evolução mensal — total de alterações por mês
- Lista detalhada: Data, Consultor(a), Escola, Contexto(s) e Impacto na agenda (texto completo)

**Ações**: exportar o relatório em PDF, no mesmo padrão dos outros painéis (cabeçalho institucional Parceiros + Bússola).

**Acesso**: N1 (administrador) e N2/N3 com o Programa de Escolas — igual aos demais relatórios de Escolas.

## Resumo em "Relatórios de Gestão – Programa Escolas"

Novo bloco no mesmo formato dos existentes, reagindo aos filtros da página, com:
- Alterações registradas
- Escolas impactadas
- Consultores(as) envolvidos
- Contexto mais frequente

e o botão "Visualizar Relatório", que abre a nova página já com os filtros aplicados (consultor, escola e período), como acontece nos outros blocos.

## Detalhes técnicos

- Nova página `src/pages/admin/RelatoriosAlteracaoAgendaPanelPage.tsx`, consultando `instrument_responses` com `form_type = 'alteracao_agenda_visita'`, join em `registros_acao` (data, aap_id, escola_id, status, programa), filtrando `status = 'realizada'` e programa `escolas`.
- Campos lidos das respostas: `contexto_alteracao` (array) e `impacto_agenda` (texto).
- Rota `/relatorios-alteracao-agenda` em `src/App.tsx`, liberação em `ALLOWED_ROUTES.manager` (`AppLayout.tsx`) e item no `Sidebar.tsx` no grupo dos relatórios de Escolas, com `requiresAcao: ['alteracao_agenda_visita']`.
- Filtros com `usePersistedState`, prefixo `relatorios-alteracao-agenda`; PDF via `exportSectionsToPdf` com `data-pdf-section`.
- Em `RelatoriosGestaoEscolasPage.tsx`: incluir `'alteracao_agenda_visita'` em `FORM_TYPES` e adicionar o bloco correspondente com `path: '/relatorios-alteracao-agenda'` e `prefix: 'relatorios-alteracao-agenda'`, propagando os filtros via `writePersistedFilters`.
- Nenhuma mudança de banco de dados é necessária.
