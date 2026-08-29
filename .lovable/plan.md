# Paginação e virtualização nas listagens e relatórios

## Situação atual (verificada no banco)

Os volumes hoje são pequenos: programações 1.673, registros de ação 1.668, presenças 2.349, histórico de alterações 2.498, respostas de instrumentos 897, professores 917, escolas 64. A exceção é o log de acessos, com 12.470 linhas.

Ou seja: os timeouts recentes vinham do custo das regras de acesso por linha (já corrigido), não do volume. Paginar no servidor agora traz ganho pequeno de consulta — o ganho real está em (1) trazer menos colunas, (2) limitar por período no banco e (3) parar de desenhar milhares de linhas de uma vez na tela. O plano prioriza isso e deixa a base pronta para crescer.

## O que será feito

### 1. Buscar menos dados do banco
- Substituir as leituras "traz tudo" (`select *`) por listas de colunas realmente usadas em: Registros de Ações, Programação/Calendário, Extração de Bases, Escolas, Usuários, Evolução do Professor e Painel.
- Aplicar filtro de período direto no banco nas telas que já têm filtro de data (Registros, Programação, relatórios do Programa Escolas e painéis de relatório), em vez de baixar todo o histórico e filtrar na tela.
- Em Registros, carregar presenças e avaliações apenas dos registros exibidos, e não a tabela inteira.

### 2. Paginação nas listagens
- Listagens com tabela longa (Registros de Ações, Programação em modo lista, Professores, Atores dos Programas, Histórico de Presença, Histórico de Alterações, Relatório de Acessos) passam a exibir páginas de 50 itens, com controles "anterior/próxima", contador de total e seletor de tamanho de página.
- O total vem de uma contagem no banco (`count: exact`), então o usuário continua vendo quantos registros existem.
- Filtros e busca continuam sendo aplicados no banco; ao mudar um filtro, a listagem volta para a primeira página.
- Filtros permanecem persistidos entre navegações, como hoje, e a página atual também.

### 3. Virtualização onde a lista precisa ser contínua
- Nas telas em que rolar tudo faz parte do uso (calendário/agenda com muitos itens no mês, seleção de professores para lista de presença, tabelas de extração), usar renderização virtualizada: só as linhas visíveis são desenhadas.
- Isso elimina travamentos de rolagem sem mudar o comportamento de rolagem infinita dessas telas.

### 4. Exportações e PDF continuam completos
- Exportações Excel/CSV e geração de PDF seguem buscando o conjunto completo do filtro (em lotes no banco), independentemente da página exibida na tela. Nada de "exportou só a página 1".

### 5. Indicadores dos relatórios continuam somando tudo
- Os cartões de indicadores (KPIs) dos painéis do Programa Escolas e demais relatórios continuam calculados sobre todo o período filtrado, não sobre a página visível. Onde for possível, a soma passa a ser feita no banco.

## Detalhes técnicos

- Novo hook `src/hooks/usePagedQuery.ts` encapsulando `range()` + `count: 'exact'` + estado de página persistido via `usePersistedState`, para reuso nas listagens.
- Novo componente `src/components/ui/data-pagination.tsx` (controles de página) e `src/components/ui/virtual-list.tsx` para as listas contínuas.
- Virtualização com `@tanstack/react-virtual` (mesma família do React Query já usado no projeto); adicionar a dependência.
- Páginas afetadas: `RegistrosPage.tsx`, `ProgramacaoPage.tsx`, `ProfessoresPage.tsx`, `AtoresProgramaPage.tsx`, `HistoricoPresencaPage.tsx`, `HistoricoAlteracoesPage.tsx`, `RelatorioAcessosPage.tsx`, `ExtracaoBasesInstrumentosPage.tsx`, `EscolasPage.tsx`, `UsuariosPage.tsx`, `EvolucaoProfessorPage.tsx`, `AdminDashboard.tsx` e os painéis `Relatorios*PanelPage.tsx` + `RelatoriosGestaoEscolasPage.tsx`.
- Exportações passam a usar um utilitário de leitura em lotes (`fetchAllPaged`) em vez de reaproveitar o estado da tela.
- Sem mudanças de schema, de permissões ou de regras de negócio.

## Sequência sugerida

1. Colunas enxutas + filtro de data no banco (maior ganho, menor risco).
2. Hook e componente de paginação; aplicar em Registros e Programação.
3. Estender paginação às demais listagens.
4. Virtualização nas listas contínuas.
5. Revisar exportações, PDFs e KPIs para garantir que continuam completos.
