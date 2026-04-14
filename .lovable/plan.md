

# Renomear filtro "AAP" para "Ator do Programa" e adicionar ao Dashboard + permitir editar/excluir para N3-N5

## Visao Geral

Duas mudancas:
1. **Filtro**: Renomear o filtro "AAP" para "Ator do Programa" nos Relatorios (ja existe via `FilterBar`) e adicionar filtro equivalente no Dashboard (que atualmente nao tem filtro por ator).
2. **Permissoes**: Permitir que N3 (`n3_coordenador_programa`), N4 (`n4_consultor_gpi`) e N5 (`n5_formador`) possam editar e excluir acoes que foram inseridas por eles (`created_by`) ou atribuidas a eles (`aap_id`), tanto na ProgramacaoPage quanto na RegistrosPage.

## Alteracoes

### 1. `src/components/forms/FilterBar.tsx` - Renomear label

- Alterar o label "AAP" (linha 156) para "Ator do Programa".
- Alterar a query de dados para buscar todos os profiles que possuem programacoes ou registros, em vez de filtrar apenas por roles AAP legadas. Trazer todos os profiles da `profiles_directory` que tem `user_programas` vinculados.

### 2. `src/pages/admin/AdminDashboard.tsx` - Adicionar filtro "Ator do Programa"

- Adicionar estado `atorFilter` (default `'todos'`).
- Adicionar dropdown "Ator do Programa" na barra de filtros (apos Componente), populado com os profiles que tem programacoes/registros.
- Aplicar filtro nos `filteredProgramacoes`, `filteredRegistros`, e `filteredAvaliacoes` filtrando por `aap_id === atorFilter`.

### 3. `src/pages/admin/ProgramacaoPage.tsx` - Permitir editar/excluir para N3-N5

- Nas 2 ocorrencias de `{isAdmin && (` antes do botao `<Trash2>` (linhas ~2905 e ~3023), alterar para:
  ```
  {(isAdmin || isManager || (profile && prog.aap_id === user?.id)) && (
  ```
  Isso permite que N2/N3 (isManager) e N4/N5 (quando sao donos da acao) possam excluir.

### 4. `src/pages/admin/RegistrosPage.tsx` - Expandir delete para N3-N5

- Na condicao do botao de excluir (linha 1257): `{(isAdmin || isManager) && (` alterar para:
  ```
  {canDelete(registro) && (
  ```
  A funcao `canDelete` ja verifica se o role tem permissao de delete E se o usuario e dono da acao. As permissoes na `ACAO_PERMISSION_MATRIX` para N3-N5 ja incluem `canDelete: true` para a maioria dos tipos (`CRUD_PRG`, `CRUD_ENT`).

### 5. `src/pages/admin/RelatoriosPage.tsx` - Renomear referencia

- Onde o FilterBar e usado, o label "AAP" ja vem do `FilterBar.tsx`, entao a mudanca no passo 1 resolve automaticamente.

| Arquivo | Alteracao |
|---|---|
| `src/components/forms/FilterBar.tsx` | Renomear "AAP" para "Ator do Programa"; buscar todos os atores com programas |
| `src/pages/admin/AdminDashboard.tsx` | Adicionar dropdown "Ator do Programa" e aplicar filtro nos dados |
| `src/pages/admin/ProgramacaoPage.tsx` | Permitir excluir para isManager e donos da acao (N3-N5) |
| `src/pages/admin/RegistrosPage.tsx` | Usar `canDelete(registro)` em vez de `isAdmin \|\| isManager` |

