## Mudança

Em `src/pages/admin/ProgramacaoPage.tsx`, fazer os filtros do topo (Programa, Tipo, Entidade, Entidade Filho, Formador, Consultor, GPI) se restringirem mutuamente. Ao escolher um valor em qualquer filtro, os demais passam a mostrar somente opções compatíveis com a interseção dos filtros já ativos.

Aplica-se ao cabeçalho da página `Programação` (Calendário e Lista — é o mesmo cabeçalho compartilhado).

## Regras de cascata

Cada `<Select>` calcula suas opções a partir do conjunto de programações já filtrado pelos OUTROS filtros ativos (e respeitando o escopo de hierarquia que já é carregado no `loadData`). A opção "Todos" sempre fica disponível para limpar.

| Filtro | Opções dependem de |
|---|---|
| Programa | escopo da hierarquia (já existe). Ao mudar, reseta os demais. |
| Tipo | Programa selecionado (`getProgramasForTipo` cruzado com `programaFilter`) **+** tipos efetivamente presentes em `programacoes` filtradas pelos demais filtros. |
| Entidade | Programa, Tipo, Formador, Consultor, GPI já selecionados — listar apenas entidades que aparecem em alguma programação compatível. |
| Entidade Filho | Entidade + Tipo + Programa (lógica atual já filtra por entidade; estender para tipo/programa quando aplicável). |
| Formador (N5) | Programa + Tipo + Entidade — listar apenas N5 que: (a) aparecem como `aap_id` em alguma programação compatível, **ou** (b) cujo `programas` inclui o programa selecionado quando ainda não há entidade/tipo selecionados. |
| Consultor (N4.1) | Mesma lógica do Formador, restrito a `n4_1_cped`. |
| GPI (N4.2) | Mesma lógica do Formador, restrito a `n4_2_gpi`. |

Resumo da fórmula: para cada filtro X, suas opções = `distinct(campo_X)` de `programacoes` aplicando todos os filtros atuais EXCETO X, e mantendo o escopo de hierarquia.

## Comportamento de UX

- Quando o usuário muda Programa, resetar Tipo, Entidade, Entidade Filho, Formador, Consultor e GPI para `"todos"` (já existe `useEffect` que reseta parte deles em `[programaFilter, tipoFilter, currentMonth]` — estender para incluir todos os dependentes).
- Se o valor atualmente selecionado em um filtro deixar de ser uma opção válida após a cascata (ex.: Formador não atende ao Programa novo), resetá-lo para `"todos"` automaticamente em `useEffect`.
- Selects com 0 opções (além de "Todos") aparecem desabilitados, com placeholder "Sem opções para os filtros atuais".
- Listas continuam ordenadas A–Z em pt-BR (`localeCompare('pt-BR', { sensitivity: 'base' })`), padrão do projeto.

## Detalhes técnicos

Apenas em `ProgramacaoPage.tsx`, sem mudança de schema/backend:

1. Criar um `useMemo` `programacoesScoped` = `programacoes` no escopo de hierarquia já carregado (o estado `programacoes` já está scoped pelo `loadData`).

2. Função utilitária `applyFilters(p, exclude: Set<string>)` que aplica os mesmos predicates de `filteredProgramacoes` exceto os filtros listados em `exclude`.

3. Para cada select dependente, derivar `useMemo` com as opções:
   - `tipoOptions` = `distinct(p.tipo for p in programacoesScoped where applyFilters(p, {'tipo'}))` ∪ tipos permitidos pelo `programaFilter` via `getProgramasForTipo`.
   - `entidadeOptions` = `distinct(p.escola_id) where applyFilters(p, {'entidade','entidade_filho'})`, mapeando para os objetos em `escolas`.
   - `entidadeFilhoOptions` = `allEntidadesFilho` filtrado pela entidade + cruzado com programações (`applyFilters(p, {'entidade_filho'})`).
   - `formadorOptions`/`consultorOptions`/`gpiOptions` = união entre (a) `aap_id`s presentes em `applyFilters(p, {role-correspondente})` e (b) usuários do `aaps` com role+programa compatíveis (fallback quando ainda não há programação criada para combinar).

4. Adicionar `useEffect` que verifica se o valor atual de cada filtro continua presente em suas opções; senão `setXFilter("todos")`.

5. Reaproveitar componentes `<Select>` existentes — mudar apenas a fonte das opções.

Sem mudanças em telas de criação/edição de ação, regras de permissão de hierarquia ou business logic — apenas refinar as opções dos selects existentes.