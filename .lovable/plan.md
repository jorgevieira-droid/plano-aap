## Objetivo

Em `/relatorios`, os filtros do "box" (Segmento, Componente, Escola, Ator do Programa) hoje ignoram o **Programa** selecionado nos filtros superiores. Ajustar para que:

1. **Entidade** (renomeado de "Escola") só liste entidades do Programa selecionado.
2. **Ator do Programa** só liste atores vinculados ao Programa selecionado.
3. O label do campo "Escola" passa a ser "Entidade" (a opção padrão segue "Todas").

## Mudanças

### `src/components/forms/FilterBar.tsx`

1. **Nova prop opcional:** `programaFilter?: string` (valor `'todos'` ou um `ProgramaTypeDB`).
2. **Carregar dados crus uma vez:** manter o fetch atual mas armazenar nos estados as listas já com o campo `programa` (escolas) e a lista de `user_programas` para cruzar com atores. Hoje o `setEscolas` descarta `programa` — passar a guardá-lo.
3. **Filtragem reativa por Programa** (via `useMemo` ou no render):
   - `escolasVisiveis = programaFilter && programaFilter !== 'todos' ? escolas.filter(e => e.programa?.includes(programaFilter)) : escolas`
   - `aapsVisiveis`: filtrar `aaps` mantendo apenas IDs presentes em `user_programas` cujo `programa === programaFilter` (quando filtro estiver ativo).
4. **Reset de seleção:** `useEffect` em `programaFilter` que, se o `filters.escolaId` ou `filters.aapId` atual não estiver mais nas listas visíveis, chama `onFilterChange` resetando o respectivo campo para `'todos'`.
5. **Label:** trocar `"Escola"` por `"Entidade"` no `<label>` do select de entidades (linha 179). Manter "Todas" como opção default.

### `src/pages/admin/RelatoriosPage.tsx`

1. Passar a nova prop ao `FilterBar` (linha 1195):
   ```tsx
   <FilterBar filters={filters} onFilterChange={setFilters} programaFilter={programaFilter} className="flex-1" />
   ```

### Fora de escopo

- Demais usos de `FilterBar` em outras páginas continuam funcionando (prop é opcional; sem ela o comportamento atual é preservado).
- Não alterar Segmento e Componente, que não dependem de Programa.
- Não mudar a lógica de cálculo dos relatórios.
