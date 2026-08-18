# Filtro de Entidade em Registros de Ações

Adicionar um filtro "Entidade" na barra de filtros da página Registros de Ações, ao lado dos filtros já existentes (Programa, Tipo, Status, Ano, Mês).

## Comportamento

- Novo select "Entidade" com opção padrão "Todas as Entidades" e a lista de entidades (escolas / regionais / redes) em ordem alfabética pt-BR.
- A lista mostra apenas as entidades que aparecem nos registros já visíveis para o usuário, respeitando a hierarquia e o RLS atuais (nenhuma mudança de permissão).
- A lista acompanha o filtro de Programa: ao selecionar um programa, só aparecem entidades daquele programa; se a entidade selecionada sair do escopo, o filtro volta para "Todas".
- A seleção é memorizada na sessão, como os demais filtros, e limpa a seleção de linhas ao mudar.
- A exportação para Excel e as ações em lote passam a considerar o filtro, pois já usam a lista filtrada.

## Detalhes técnicos

Arquivo: `src/pages/admin/RegistrosPage.tsx`

- Novo estado `filterEscola` via `usePersistedState('registros:escola', 'todos')`.
- Incluir `programa` no `select` da query `escolas` para permitir filtrar as opções pelo `programaFilter`.
- Opções da lista: entidades presentes em `registros` (por `escola_id`), ordenadas com `localeCompare('pt-BR', { sensitivity: 'base' })`.
- Em `filteredRegistros`, adicionar `matchesEscola = filterEscola === 'todos' || registro.escola_id === filterEscola`.
- Adicionar `filterEscola` ao `useEffect` que limpa `selectedIds`.
- `useEffect` de reset: se a entidade selecionada não estiver mais nas opções visíveis, voltar para `todos`.
