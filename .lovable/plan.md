

# Corrigir módulos que não respondem aos filtros (Dashboard + Relatório)

## Diagnóstico

Seis módulos não são afetados pelos filtros de Ano/Mês/Programa/Escola:

1. **Observação de Aula (radar)** — `filteredAvaliacoes` no Dashboard filtra por programa/escola mas **ignora ano/mês**. No Relatório filtra por segmento/componente/escola/aap mas **ignora ano/mês/programa**.
2. **Observação de Aula — REDES (radar)** — `observacoesRedes` não é filtrada por **nenhum** filtro em ambas as páginas.
3. **Instrumentos Pedagógicos** (Encontro ET/EG, Encontro Professor, Qualidade, Liderança) — `useInstrumentChartData` é chamado com valores **hardcoded** (`escolaFilter: 'todos'`, `anoFilter` fixo) em vez dos estados reais dos filtros.

## Alterações

### 1. `src/pages/admin/AdminDashboard.tsx`

**a) Avaliacoes (radar padrão):** Incluir `registro_acao_id` no select de `avaliacoes_aula`. Cruzar com `registros` para obter a data e aplicar filtros de ano/mês:
```typescript
const filteredAvaliacoes = avaliacoes.filter(av => {
  const matchPrograma = programaFilter === 'todos' || filteredEscolaIds.includes(av.escola_id);
  const matchEscola = escolaFilter === 'todos' || av.escola_id === escolaFilter;
  // Novo: filtrar por ano/mês via registro vinculado
  const registro = registros.find(r => r.id === av.registro_acao_id);
  if (!registro) return false;
  const d = new Date(registro.data);
  if (d.getFullYear() !== anoFilter) return false;
  if (mesFilter !== 'todos' && d.getMonth() + 1 !== mesFilter) return false;
  return matchPrograma && matchEscola;
});
```

**b) ObservacoesRedes:** Incluir `data` no select de `observacoes_aula_redes`. Filtrar por ano/mês e programa (quando programa não é "redes_municipais", ocultar).

**c) InstrumentChartData:** Passar os filtros reais:
```typescript
useInstrumentChartData({
  escolaFilter,
  anoFilter,
  mesFilter,
  programaFilter,
})
```

### 2. `src/pages/admin/RelatoriosPage.tsx`

**a) filteredAvaliacoes:** Adicionar filtragem por ano/mês/programa/entidade-filho via registro vinculado (mesmo padrão do Dashboard).

**b) ObservacoesRedes:** Incluir `data` no select, filtrar por ano/mês.

**c) InstrumentChartData:** Passar filtros reais em vez de hardcoded:
```typescript
useInstrumentChartData({
  escolaFilter: filters.escolaId,
  anoFilter,
  mesFilter,
})
```

### 3. `src/hooks/useInstrumentChartData.ts`

Adicionar suporte ao filtro `programaFilter`:
- Buscar `registro_acao_id` nas responses
- Cruzar com `registros_acao` para obter o `programa`
- Filtrar responses cujo registro pertence ao programa selecionado

## Arquivos impactados

| Arquivo | Alteração |
|---|---|
| `src/pages/admin/AdminDashboard.tsx` | Passar filtros reais para instrumentos + filtrar avaliacoes/redes por ano/mês |
| `src/pages/admin/RelatoriosPage.tsx` | Passar filtros reais para instrumentos + filtrar avaliacoes/redes por ano/mês |
| `src/hooks/useInstrumentChartData.ts` | Suporte a `programaFilter` via cruzamento com `registros_acao` |

