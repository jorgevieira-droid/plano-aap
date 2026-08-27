# Relatórios de Gestão - Programa Escolas

## Objetivo
Reduzir a poluição do menu lateral agrupando os relatórios do Programa Escolas em uma única página de visão geral, com os principais indicadores de cada relatório e um botão para abrir o relatório completo.

## 1. Ocultar itens do menu lateral
Sair do menu (mas continuar existindo como páginas acessíveis):
- Painel Encaminhamentos Internos
- Relatórios – Apoio Presencial
- Relatório – Apoio com Coordenação
- Relatório – Formação Coletiva
- Relatório – Apoio ao Coordenador
- Relatório – Planejamento Conjunto
- Relatório – Aula Compartilhada

As rotas continuam válidas e serão abertas pelos botões "Visualizar Relatório" da nova página.

## 2. Novo item de menu
- Rótulo: "Relatórios de Gestão - Programa Escolas"
- Rota: `/relatorios-gestao-escolas`
- Visível para N1 (admin) e N2/N3 (manager) que tenham o programa Escolas habilitado.
- Posicionado no grupo "Ferramentas de Gestão", logo abaixo de Dashboard/Painel.

## 3. Nova página agregadora
Layout em cartões (grade responsiva de 2 colunas, 1 coluna no mobile), seguindo o print enviado:

- Filtros globais no topo (período, consultor(a), escola), persistidos como nas demais páginas, aplicados a todos os blocos.
- Um cartão por relatório, cada um com: título, subtítulo descritivo, botão "Visualizar Relatório" e os KPIs principais.

Cartões e indicadores:
- Registro de Apoio Presencial: total de apoios, devolutivas realizadas, apoios em turmas VOAR, apoios com outros observadores.
- Apoio Presencial com Coordenação: total de registros, observou a aula do início ao fim, devolutivas planejadas, devolutivas realizadas, registros em turma do VOAR, tematização posterior.
- Registro de Apoio ao Coordenador: apoios registrados, escolas atendidas, coordenadores atendidos, nota média de NPS, NPS.
- Planejamento Conjunto: planejamentos registrados, planejamentos em turmas VOAR, escolas atendidas, consultores(as) envolvidos, média de estudantes elegíveis, média do nº da aula.
- Formação Coletiva: formações realizadas, professores participantes, média de professores por formação, nota média de NPS, NPS, formações com link da pauta.
- Aula Compartilhada: aulas compartilhadas, aulas em turmas VOAR, escolas atendidas, consultores(as) envolvidos, média de alunos presentes, % de aulas como planejado.
- Encaminhamentos Internos: total de registros no período, consultores(as) selecionados, escolas selecionadas.

Cada cartão só aparece se a ação/evento correspondente estiver habilitada para o(s) programa(s) do usuário.

## 4. Página de entrada
Usuários N2/N3 (manager) que tenham somente o programa "Escolas" habilitado passam a entrar diretamente em `/relatorios-gestao-escolas`. Demais perfis mantêm o comportamento atual.

## Detalhes técnicos
- `src/components/layout/Sidebar.tsx`: remover/ocultar os 7 itens listados e incluir o novo item com `allowedTiers: ['admin','manager']` e restrição ao programa Escolas.
- Nova página `src/pages/admin/RelatoriosGestaoEscolasPage.tsx`, reaproveitando as mesmas consultas de `instrument_responses` + `registros_acao` usadas nos painéis existentes (mesmas chaves `form_type` e filtro `status='realizada'`), agregando os KPIs em um único hook por bloco.
- Registrar a rota em `src/App.tsx` e incluir `/relatorios-gestao-escolas` em `ALLOWED_ROUTES` (admin/manager) em `AppLayout.tsx`.
- Ajustar `getDefaultRoute` em `AppLayout.tsx` para retornar a nova rota quando `tier === 'manager'` e `programas` for exatamente `['escolas']`.
- Filtros com `usePersistedState`, sem auto-refresh, seguindo o padrão das demais páginas.
