# Filtro "Consultor / Gestor / Formador" na página de Registros

## O que será feito

Na barra de filtros da página **Registros**, incluir um novo filtro chamado **Consultor / Gestor / Formador**, com **seleção múltipla** (vários responsáveis ao mesmo tempo), no mesmo padrão visual dos filtros já existentes.

Comportamento:
- Lista apenas os responsáveis que realmente aparecem nos registros visíveis ao usuário, em ordem alfabética.
- A lista respeita o filtro de Programa: ao trocar o programa, os responsáveis fora do escopo saem da lista e da seleção.
- Nenhum selecionado = todos os registros (comportamento atual).
- A seleção fica guardada ao navegar entre páginas, como os outros filtros.
- Os registros exibidos, a contagem e a exportação em Excel passam a considerar o filtro.
- Filtro escondido para perfis que só veem os próprios registros (N4.1/N5), onde ele não faria diferença.

## Detalhes técnicos

- `src/pages/admin/RegistrosPage.tsx`:
  - Novo estado `filterResponsaveis: string[]` via `usePersistedState('registros:responsaveis', [])`.
  - Nova lista derivada `responsaveisFiltro` a partir de `registros.aap_id` cruzada com `profiles`, ordenada com `localeCompare('pt-BR', { sensitivity: 'base' })`, filtrada pelo `programaFilter` atual.
  - `useEffect` de saneamento removendo ids selecionados que saíram do escopo (mesmo padrão do `escolasFiltro`).
  - Condição adicional em `filteredRegistros`: `filterResponsaveis.length === 0 || filterResponsaveis.includes(registro.aap_id)`.
  - Incluir o novo filtro na dependência do reset de paginação (junto de `filterEscola`, `filterTipo` etc.).
  - UI com o componente existente `MultiSelectFilter` (`src/components/forms/MultiSelectFilter.tsx`), inserido ao lado do filtro de Entidade.
- Sem mudanças no banco, RLS, permissões ou regras de negócio.

## Verificação

Abrir Registros, selecionar dois responsáveis e confirmar que a lista, o total e o Excel exportado trazem somente os registros desses responsáveis; trocar de página e voltar para confirmar que a seleção permanece.
