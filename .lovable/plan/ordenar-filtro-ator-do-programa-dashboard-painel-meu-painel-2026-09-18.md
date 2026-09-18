# Ordenar filtro 'Ator do Programa' (Dashboard / Painel / Meu Painel)

## Contexto verificado
- Dashboard (`/dashboard`), Painel (`/dashboard`, tier local) e Meu Painel (`/aap/dashboard`) são o **mesmo componente**: `src/pages/admin/AdminDashboard.tsx`.
- A lista de atores do filtro é montada em `aapsWithProgramas` a partir de `uniqueUserIds` (ordem de retorno dos registros de papéis do banco) — **sem nenhuma ordenação** — e o `<Select>` de 'Ator do Programa' (linha ~960) renderiza `filteredAAPs` nessa ordem.
- O `FilterBar` usado em outras páginas já ordena; o problema é só o Dashboard.

## Alteração
1. Em `src/pages/admin/AdminDashboard.tsx`, ordenar `aapsWithProgramas` por `nome` logo após sua construção (antes dos filtros por perfil), usando o padrão do projeto:
   `localeCompare('pt-BR', { sensitivity: 'base' })`.
2. Isso automaticamente deixa em ordem alfabética:
   - o filtro 'Ator do Programa' do cabeçalho;
   - os gráficos "Ações Previstas x Realizadas - Por Ator do Programa" e "Horas por Ator do Programa", que derivam de `filteredAAPs`.

## Verificação
- `bun run build` (typecheck/build).
- Playwright: abrir `/dashboard`, expandir o filtro 'Ator do Programa' e confirmar a ordem alfabética no screenshot.
