

# Remover módulo "Desempenho por Ator"

## Alterações

### `src/pages/admin/RelatoriosPage.tsx`

1. **Remover variável `desempenhoPorAtor`** (linhas ~517-530) e as constantes `BAR_COLORS_PREV`/`BAR_COLORS_REAL`.
2. **Remover o bloco do gráfico** "Desempenho por Ator" (linhas 1197-1226). O gráfico "Previsto vs Realizado" passa a ocupar largura total (`lg:grid-cols-1`).
3. **Atualizar a condição do wrapper** (linha 1173): remover referência a `desempenhoPorAtor`.
4. **Remover seção `porAtor` do export Excel** (linhas ~638-650).
5. **Remover prop `desempenhoPorAtor` e `enabledTipos`** da chamada ao `PdfReportContent` (linha ~714).

### `src/components/reports/PdfReportContent.tsx`

1. **Remover props** `desempenhoPorAtor` e `enabledTipos` da interface e da desestruturação.
2. **Remover o bloco do gráfico** "Desempenho por Ator" (linhas 83-101).
3. **Remover constantes** `BAR_COLORS_PREV`/`BAR_COLORS_REAL` e imports não utilizados (`ACAO_TYPE_INFO`, `AcaoTipo`).
4. O PDF fica com o gráfico "Previsto vs Realizado" ocupando largura total.

| Arquivo | Alteração |
|---|---|
| `src/pages/admin/RelatoriosPage.tsx` | Remover gráfico, variável, export Excel da seção por ator |
| `src/components/reports/PdfReportContent.tsx` | Remover gráfico e props relacionados |

