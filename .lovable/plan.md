
# Adicionar cargo 'PEC' e filtro de Cargo na página de Atores Educacionais

## Alterações

### 1. `src/types/index.ts`
- Adicionar `'pec'` ao tipo `CargoProfessor`.

### 2. `src/pages/admin/ProfessoresPage.tsx`
- Adicionar `pec: 'PEC'` ao objeto `cargoLabels` (linha ~106).
- Adicionar estado `filterCargo` (`useState('todos')`).
- Adicionar lógica de filtro `matchesCargo` na lista filtrada (linha ~239).
- Incluir `filterCargo` no `useEffect` que limpa seleção (linha ~245).
- Adicionar `<select>` de Cargo após o filtro de Programa (linha ~1350), usando `cargoLabels` para as opções.

### Resultado
- O cargo 'PEC' estará disponível no cadastro e no filtro.
- Todos os níveis verão o filtro de Cargo na página de Atores Educacionais.

| Arquivo | Alteração |
|---|---|
| `src/types/index.ts` | Adicionar `'pec'` ao `CargoProfessor` |
| `src/pages/admin/ProfessoresPage.tsx` | Adicionar `pec` em `cargoLabels`, estado + filtro + select de Cargo |
