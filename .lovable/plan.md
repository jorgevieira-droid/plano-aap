## Plano

### 1) Mostrar nomes completos no eixo Y do gráfico (sem truncar)

**`src/components/charts/InstrumentComparisonChart.tsx`**
- Remover o truncamento (`d.label.length > 28 ? slice + '…' : ...`) e usar o label completo.
- Substituir o `tick` padrão do `<YAxis>` por um tick custom que renderiza `<text>` SVG com quebra de linha automática:
  - Função que divide o label em palavras e gera múltiplos `<tspan x={x} dy="1.1em">` respeitando uma largura máxima (~190px / ~26 chars por linha).
  - Limite de 3 linhas; sobra vira `…` apenas no excedente.
- Aumentar a `width` do `<YAxis>` para `220` e o `left` margin para `8`.
- Ajustar a altura do container para considerar múltiplas linhas: `Math.max(320, 60 + dimensions.length * 64)` (passa de 48 → 64 px por barra).

### 2) Exportar comparativo em Excel

**`src/pages/admin/RelatorioInstrumentosPage.tsx`** (aba "Comparativo Temporal")
- Adicionar botão "Baixar XLS" no header do card "Detalhamento por dimensão".
- Handler `handleDownloadComparativo`:
  - Sheet 1 "Resumo": cabeçalho com Programa, Instrumento, Período A, Período B, Total A, Total B, filtros aplicados (Ator/Entidade).
  - Sheet 2 "Dimensões": colunas `Dimensão | {labelA} | Qtd {labelA} | {labelB} | Qtd {labelB} | Δ | Δ %`.
  - Nome do arquivo: `{programa}_{instrumento}_comparativo_{periodoA}_vs_{periodoB}.xlsx` via `slugify`.
- Reutiliza `XLSX` já importado.

### 3) Exportar comparativo em PDF

**`src/pages/admin/RelatorioInstrumentosPage.tsx`**
- Adicionar botão "Baixar PDF" ao lado do "Baixar XLS".
- Usar `html2canvas` + `jspdf` (já presentes no projeto — vide `src/lib/pdfExport.ts` e `EvolucaoPdfContent.tsx`) ou reutilizar `generatePdfFromElement` se existir.
- Estratégia: envolver o card do gráfico + o card de detalhamento numa `ref` (`comparativoRef`); capturar com `html2canvas`, gerar PDF A4 retrato/paisagem ajustando para a altura do gráfico.
- Cabeçalho institucional reutilizando o padrão dual Parceiros + Bússola (cor `#1a3a5c`, logos brancos) — seguir o mesmo header usado em outros exports do projeto.
- Nome do arquivo: `{programa}_{instrumento}_comparativo_{periodoA}_vs_{periodoB}.pdf`.

### Arquivos
- `src/components/charts/InstrumentComparisonChart.tsx` (tick custom multi-linha, largura/altura)
- `src/pages/admin/RelatorioInstrumentosPage.tsx` (botões + handlers XLS/PDF, `ref` para captura)

Sem mudanças de banco ou hooks.
