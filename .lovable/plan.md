
# Filtros de Ano/Mês no Dashboard + Entidade Filho no Relatório

## 1. Dashboard — Adicionar filtros de Ano e Mês

### `src/pages/admin/AdminDashboard.tsx`

**Estado**: Adicionar dois novos estados:
```typescript
const [anoFilter, setAnoFilter] = useState<number>(new Date().getFullYear());
const [mesFilter, setMesFilter] = useState<number | 'todos'>('todos');
```

**Constantes**: Adicionar `mesesLabels` e `anosDisponiveis` (mesmo padrão do RelatoriosPage).

**Filtros UI**: Adicionar dois `<Select>` (Ano e Mês) na barra de filtros existente, após o filtro de Componente.

**Lógica de filtragem**: Aplicar filtros de ano/mês em `filteredProgramacoes`, `filteredRegistros` e `filteredRegistrosPendentes` — mesmo padrão já usado no RelatoriosPage (comparar `getFullYear()` e `getMonth()+1`).

**Módulos condicionais**: Cada seção de gráfico/card só renderiza se tiver dados após a filtragem. Envolver cada módulo com uma verificação `{dados.length > 0 && (...)}`.

---

## 2. Relatório — Adicionar filtro de Entidade Filho

### `src/pages/admin/RelatoriosPage.tsx`

**Estado**:
```typescript
const [entidadeFilhoFilter, setEntidadeFilhoFilter] = useState<string>('todos');
const [entidadesFilho, setEntidadesFilho] = useState<{id: string; nome: string; escola_id: string}[]>([]);
```

**Fetch**: No `useEffect`, buscar `entidades_filho` ativas e armazenar no estado.

**Filtro UI**: Adicionar um `<Select>` de "Entidade Filho" na barra de filtros, após Componente. Exibir apenas as entidades filho vinculadas à escola selecionada no filtro de escola (se houver).

**Lógica**: Quando uma entidade filho é selecionada, filtrar programações e registros pela `escola_id` da entidade filho (pois entidades filho são sub-entidades vinculadas a uma escola pai).

---

## 3. Ocultar módulos sem dados nos filtros selecionados

### Ambos os arquivos

Envolver cada módulo/seção de gráfico com verificação condicional:
- Cards de resumo: ocultar se todos os valores forem 0
- Gráfico Previsto vs Realizado: ocultar se `execucaoData` / `acoesPorTipo` estiver vazio
- Gráfico por AAP: ocultar se não houver dados
- Tabela de presença por escola: ocultar se lista vazia
- Radar/satisfação: ocultar se não houver avaliações
- Instrumentos: ocultar se sem dados

---

## Arquivos impactados

| Arquivo | Alteração |
|---|---|
| `src/pages/admin/AdminDashboard.tsx` | Filtros de Ano e Mês + ocultar módulos vazios |
| `src/pages/admin/RelatoriosPage.tsx` | Filtro de Entidade Filho + ocultar módulos vazios |
