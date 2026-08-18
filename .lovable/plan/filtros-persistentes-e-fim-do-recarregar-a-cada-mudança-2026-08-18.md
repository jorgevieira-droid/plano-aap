# Filtros persistentes e fim do "recarregar" a cada mudança

## Problema

Hoje só 4 páginas (Dashboard, Programação, Registros, Relatórios Gerais) guardam os filtros na sessão. Nas demais, os filtros voltam ao padrão sempre que se sai e volta da página.

Além disso, em várias páginas cada mudança de filtro dispara uma nova busca no banco com tela de carregamento cheia (spinner/skeleton no lugar da tabela), dando a sensação de "recarregar o sistema". Exemplos confirmados: Histórico de Presença (refaz a consulta a cada mudança de escola/programa/formador/datas) e Pontos Observados (refaz consulta ao trocar o filtro de formação).

## O que será feito

### 1. Filtros memorizados em todas as páginas
Aplicar o mesmo mecanismo já usado em Registros/Programação (`usePersistedState`, guardado por sessão) aos filtros das páginas que ainda não têm:

- Histórico de Presença, Pontos Observados, Relatório de Instrumentos, Relatório de Acessos, Relatório de Consultoria (e Visualização), Relatório Regionais, Relatório de Apoio Presencial, Relatórios Descritivos (AI), Painel de Encaminhamentos Internos, Pendências, Evolução do Professor, Histórico de Alterações, Lista de Presença, Extração de Bases, Matriz de Ações, além das buscas/abas de Usuários, Atores, Professores, Escolas, Entidades Filho, AAPs.

Regras mantidas: se o valor guardado não for mais válido para o perfil/programa do usuário (ex.: programa ao qual ele não tem mais acesso), volta ao padrão. Os filtros continuam sendo limpos no logout.

### 2. Sem recarregar a tela ao mudar filtro
- Onde os dados já vêm por consulta única e o filtro é apenas recorte, filtrar em memória em vez de refazer a busca.
- Onde a busca depende mesmo do filtro (datas, programa), manter os dados anteriores visíveis enquanto a nova consulta roda, mostrando apenas um indicador discreto de atualização — nada de tela em branco. O skeleton grande fica só no primeiro carregamento da página.
- Consultas passam a usar o cache do React Query (já configurado com 5 min de validade), evitando refazer buscas ao voltar para a página.

### 3. Sem auto-refresh
Remover qualquer atualização automática periódica ou por foco de janela que ainda exista em páginas/hooks individuais (o padrão global já está desligado). Atualização passa a ser sob demanda, pelo botão de atualizar quando existir, ou após salvar/editar um registro.

## Detalhes técnicos

- `usePersistedState` reutilizado com chaves no padrão `pagina:filtro`.
- Consultas dependentes de filtro passam a usar `placeholderData: keepPreviousData` e `isFetching` (indicador leve) em vez de `isLoading` bloqueante.
- Padrões `useEffect(fetch, [filtros])` com `setLoading(true)` migram para React Query com `queryKey` incluindo os filtros, ou para filtragem em memória quando o conjunto de dados já está carregado.
- Invalidação explícita de `queryKey` após mutações (salvar, remover presença, etc.) para os dados continuarem corretos.
- Sem mudanças de banco de dados, permissões ou regras de negócio.
