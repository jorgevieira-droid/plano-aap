

# Substituir cards fixos por grid dinâmico de ações programadas x realizadas

## Visão Geral

Remover **todos os 6 cards fixos** (Formações, Visitas, Acompanhamentos, Professores Formados, Taxa de Presença, % por segmento) e substituir por um grid dinâmico que exibe apenas os tipos de ação habilitados para o programa selecionado, mostrando Realizadas/Previstas com barra de progresso.

## Alterações

### `src/pages/admin/RelatoriosPage.tsx`

1. **Remover variáveis legacy** (linhas 478-483): `formacoesPrevistas`, `formacoesRealizadas`, `visitasPrevistas`, `visitasRealizadas`, `acompanhamentosPrevistas`, `acompanhamentosRealizados`.

2. **Substituir os 6 stat-cards** (linhas 1194-1249) por um grid dinâmico iterando sobre `execucaoData` (já calculado na linha 469). Cada card mostrará:
   - Label do tipo de ação (de `ACAO_TYPE_INFO`)
   - Contagem `Realizadas/Previstas`
   - Barra de progresso

3. **Atualizar `execucaoData`** para incluir todos os `enabledTipos` (remover o `.filter(item => item.Previstas > 0)` da linha 475) para que tipos sem programação apareçam como `0/0`.

4. **Grid responsivo**: `grid-cols-2 md:grid-cols-3 lg:grid-cols-4` para acomodar quantidade variável.

5. **Atualizar export Excel** para usar dados dinâmicos em vez dos campos fixos.

### `src/components/reports/PdfReportContent.tsx`

Adaptar props para receber array dinâmico `execucaoData: {name, Previstas, Realizadas}[]` em vez das props fixas de formação/visita/acompanhamento/presença/segmento.

| Arquivo | Alteração |
|---|---|
| `src/pages/admin/RelatoriosPage.tsx` | Remover 6 cards fixos + variáveis legacy; grid dinâmico com `execucaoData` |
| `src/components/reports/PdfReportContent.tsx` | Adaptar props para dados dinâmicos |

