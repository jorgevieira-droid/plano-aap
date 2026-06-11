## Objetivo

No relatório gerado em `/relatorios-narrativos`, exibir os filtros aplicados (Ator, Entidade, Status, Período) tanto na visualização em tela quanto no PDF exportado.

## Mudanças

### 1. `src/hooks/useNarrativeReport.ts`
Estender `NarrativeFilters` com rótulos opcionais resolvidos no momento da geração:
- `atorLabel?: string` (nome do ator selecionado ou `"Todos"`)
- `entidadeLabel?: string` (nome da entidade ou `"Todas"`)
- `statusLabel?: string` (rótulo do status ou `"Todos"`)

Esses campos apenas trafegam pelos `filters` — nenhuma lógica de query muda.

### 2. `src/pages/admin/RelatoriosNarrativosPage.tsx`
Ao chamar `narrative.mutate`, calcular e enviar os rótulos:
- `atorLabel`: nome encontrado em `atores` por `atorId`, senão `"Todos"`.
- `entidadeLabel`: nome encontrado em `entidades` por `entidadeId`, senão `"Todas"`.
- `statusLabel`: rótulo de `STATUS_OPTIONS` por `status`, senão `"Todos"`.

### 3. `src/components/relatoriosNarrativos/NarrativeReportViewer.tsx`
Adicionar, logo após o cabeçalho (antes dos Destaques), um novo `Card` com `data-pdf-section` chamado **"Filtros aplicados"**, contendo uma grade compacta (2 colunas em mobile, 4 em desktop) com:
- Ator: `filters.atorLabel`
- Entidade: `filters.entidadeLabel`
- Status: `filters.statusLabel`
- Período: formatar `dataInicio`/`dataFim` em `dd/mm/aaaa`; se ambos vazios → `"Todo o período"`; se só um → `"a partir de …"` / `"até …"`.

Cada item: label pequena em `text-muted-foreground` + valor em `font-medium`. Como o card tem `data-pdf-section`, será incluído automaticamente no PDF pelo `exportSectionsToPdf` (que já varre nodes marcados).

## Fora do escopo
- Não altera o cabeçalho do PDF (header já contém título/subtítulo/Programa).
- Não muda a função de geração no Edge Function nem agregações.
