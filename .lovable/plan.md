## Diagnóstico

**1. Gráficos sumiram da tela (`/relatorios`)**
- O hook `useInstrumentChartData` lança erro silencioso ao buscar das tabelas dedicadas `relatorios_eteg_redes` e `relatorios_professor_redes`. Estas duas tabelas **não possuem a coluna `registro_acao_id`**, mas o hook tenta sempre selecioná-la → Supabase retorna 400 → `throw dedErr` → toda a query (`useQuery`) falha → `chartData = []` → o componente `InstrumentDimensionCharts` retorna `null`.
- O resultado: só restam na tela os blocos independentes (Visita Técnica Alfabetização REDES / Alfabetização / T@RL), que usam outras consultas.

**2. PDF sai com cabeçalho + página em branco**
- O loop de exportação procura nós com `[data-pdf-section]` em `PdfReportContent`. **Nenhum elemento desse componente tem o atributo**, então `sections = []` e nada é desenhado abaixo do header.
- Além disso `PdfReportContent` ignora `instrumentChartData` (recebe a prop mas não renderiza) e não inclui os blocos de Visita Técnica.
- Subtítulo do header diz "Olhar Parceiro — Relatório de Acompanhamento" (texto legado) — divergente da identidade Bússola.

---

## Plano

### A. Corrigir `src/hooks/useInstrumentChartData.ts`
- Detectar dinamicamente se a tabela dedicada possui `registro_acao_id`. Mapear quais tabelas têm a coluna (com base no schema atual):
  - Têm: `observacoes_aula_redes`, `observacoes_aula_gpa`, `relatorios_microciclos_recomposicao`, `relatorios_reuniao_acomp_alfabetizacao`, `relatorios_visita_tecnica_tarl`, `relatorios_visita_tecnica_alfabetizacao`.
  - Não têm (REDES agregadas): `relatorios_eteg_redes`, `relatorios_professor_redes` — selecionar apenas `created_at, status, item_*` e usar `registro_acao_id = null` na linha flatten (não participam de dedupe).
- Envolver cada fetch de tabela dedicada em `try/catch` para que uma falha individual não derrube todo o hook; logar `console.warn` e continuar.
- Manter a regra de dedupe por `(form_type, registro_acao_id)` apenas para as tabelas que têm a coluna.

### B. Corrigir geração do PDF em `src/pages/admin/RelatoriosPage.tsx`
- Reescrever `PdfReportContent` (ou substituir o conteúdo passado ao container offscreen) para:
  - Marcar cada bloco com `data-pdf-section` (Previsto vs Realizado, Presença por Tipo de Ação, Presença por Escola, cada bloco de InstrumentDimensionCharts, e os 3 blocos de Visita Técnica).
  - Passar e renderizar `instrumentChartData` (loop similar ao componente de tela, simplificado para impressão).
  - Renderizar os blocos de Visita Técnica Alfabetização REDES / Alfabetização / T@RL com os mesmos dados filtrados que estão na tela (passar via prop).
- Ajustar subtítulo do header no `drawHeader` (linha 930) de "Olhar Parceiro — Relatório de Acompanhamento" para "Bússola — Parceiros da Educação", mantendo o restante do layout.

### C. Garantir respeito ao filtro por Programa
- A lógica já existe no hook (intersecção com `getInstrumentFormTypesByPrograma`). Após a correção A, os gráficos voltarão a obedecer o programa selecionado.
- No PDF, passar `instrumentChartData` (já filtrado por programa) + os arrays `filteredRelVisitaAlfaRedes / filteredRelVisitaAlfa / filteredRelVisitaTarl` (já filtrados) — assim o PDF respeita automaticamente o programa atual.

---

## Arquivos alterados
- `src/hooks/useInstrumentChartData.ts` — fetch resiliente das tabelas dedicadas + tratamento de `registro_acao_id` ausente.
- `src/components/reports/PdfReportContent.tsx` — adicionar marcadores `data-pdf-section`, renderizar instrumentos e blocos de Visita Técnica.
- `src/pages/admin/RelatoriosPage.tsx` — passar dados extras ao `PdfReportContent`; corrigir subtítulo do header.

Nenhuma alteração de schema ou de regras de permissão.