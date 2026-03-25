

# Filtro de Projeto para Redes Municipais

## Resumo
Adicionar campo "Projeto" (Alfabetização, Microciclo Anos Iniciais, Microciclo Anos Finais, Gestão para Aprendizagem) no agendamento de ações e filtros do Dashboard e Relatórios, visível apenas quando o programa é `redes_municipais`.

## Alterações

### 1. Migration SQL
- `ALTER TABLE registros_acao ADD COLUMN projeto text;`

### 2. ProgramacaoPage.tsx — Formulário de agendamento
- **Dropdown de Projeto**: Substituir o campo de texto `Projeto (Notion)` (linhas 2038-2049) por um `<Select>` com as 4 opções hardcoded. Visível quando `formData.programa` inclui `redes_municipais` (não apenas para formações).
- **Insert programacoes** (linha 628): Mudar para `projeto_notion: formData.projetoNotion || null` (sem condicional de tipo).
- **Insert registros_acao** (linha 636-648): Adicionar `projeto: formData.projetoNotion || null`.
- **Outros inserts de registros_acao** (linhas ~980, ~1020): Adicionar `projeto: selectedProgramacao?.projeto_notion || null`.

### 3. AdminDashboard.tsx — Filtro de Projeto
- Novo state `projetoFilter` com `useEffect` para resetar quando `programaFilter` muda.
- Dropdown condicional entre Programa e Escola (visível quando `programaFilter === 'redes_municipais'`).
- Atualizar queries para incluir `projeto_notion` em programacoes e `projeto` em registros_acao.
- Atualizar interfaces `ProgramacaoDB` e `RegistroAcaoDB`.
- Aplicar filtro de projeto em: `filteredProgramacoes`, `filteredRegistros`, `filteredRegistrosPendentes`.
- Atualizar subtítulo do dashboard.

### 4. RelatoriosPage.tsx — Filtro de Projeto
- Mesma lógica: state, useEffect, dropdown condicional, queries atualizadas, interfaces atualizadas, filtragem nos dados.

### 5. types.ts (auto-gerado)
- O campo `projeto` será adicionado automaticamente nos tipos após a migration.

## Arquivos modificados
| Arquivo | Mudança |
|---|---|
| Nova migration SQL | ADD COLUMN `projeto` em `registros_acao` |
| `src/pages/admin/ProgramacaoPage.tsx` | Dropdown de projeto + salvar em ambas tabelas |
| `src/pages/admin/AdminDashboard.tsx` | Filtro de projeto + queries + filtragem |
| `src/pages/admin/RelatoriosPage.tsx` | Filtro de projeto + queries + filtragem |

## Notas
- Os 4 projetos são hardcoded por enquanto.
- O campo `projeto_notion` em `programacoes` é reutilizado (sem nova coluna).
- Nenhuma outra funcionalidade existente é alterada.

