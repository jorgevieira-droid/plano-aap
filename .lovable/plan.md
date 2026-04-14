

# Alterar "Desempenho por AAP" para "Desempenho por Ator" com Previstas x Realizadas dinâmicas

## Visão Geral

Substituir o gráfico atual "Desempenho por AAP" (que mostra apenas Formações e Visitas fixas) por um gráfico "Desempenho por Ator" que exibe **todas as ações previstas x realizadas** de cada ator, usando os tipos dinâmicos habilitados para o programa selecionado.

## Alterações

### `src/pages/admin/RelatoriosPage.tsx`

1. **Renomear e reestruturar `presencaPorAAP`** → `desempenhoPorAtor`: para cada ator (AAP), calcular previstas e realizadas **por tipo de ação habilitado** (usando `enabledTipos`), em vez de apenas `formacoes` e `visitas` fixos.

2. **Atualizar o gráfico**: renderizar uma `<Bar>` para cada tipo de ação habilitado dinamicamente (com cores distintas), em vez das 2 barras fixas. Título: "Desempenho por Ator".

3. **Atualizar export Excel**: ajustar a seção `porAAP` para refletir os novos campos dinâmicos.

### `src/components/reports/PdfReportContent.tsx`

Atualizar título e barras do gráfico para usar os dados dinâmicos por tipo de ação.

### Detalhes técnicos

```text
Dados atuais (fixo):
  { name: "Celia", formacoes: 4, visitas: 0 }

Dados novos (dinâmico):
  { name: "Celia", "Formação": { previstas: 5, realizadas: 4 }, "Visita": { previstas: 2, realizadas: 0 }, ... }
  → achatado para recharts: { name: "Celia", "Formação Prev.": 5, "Formação Real.": 4, "Visita Prev.": 2, "Visita Real.": 0 }
```

Alternativa mais limpa: usar barras agrupadas com apenas "Previstas" e "Realizadas" por tipo, gerando dataKeys como `formacao_previstas`, `formacao_realizadas`, etc.

| Arquivo | Alteração |
|---|---|
| `src/pages/admin/RelatoriosPage.tsx` | Reestruturar dados do gráfico; barras dinâmicas por tipo; título "Desempenho por Ator" |
| `src/components/reports/PdfReportContent.tsx` | Atualizar gráfico correspondente no PDF |

