# Card "Visita Técnica — T@RL" no dashboard e no relatório

## Causa
O componente `InstrumentDimensionCharts` (usado pelo card mostrado no anexo) é alimentado por `useInstrumentChartData`, que lê apenas da tabela `instrument_responses`. O formulário de T@RL persiste exclusivamente em `relatorios_visita_tecnica_tarl` — por isso o card nunca aparece no dashboard nem no relatório.

`instrument_fields` já tem os 14 critérios de T@RL cadastrados com `scale_max = 4`, e `INSTRUMENT_FORM_TYPES` já lista `visita_tecnica_tarl`. Falta só o hook conhecer a tabela dedicada.

## Correção (1 arquivo: `src/hooks/useInstrumentChartData.ts`)

1. Adicionar um mapa `DEDICATED_TABLES`, espelhando o padrão já usado em `useInstrumentComparisonData.ts`:
   ```ts
   const DEDICATED_TABLES: Record<string, string> = {
     visita_tecnica_tarl: 'relatorios_visita_tecnica_tarl',
   };
   ```
2. Para cada `formType` em `viewableInstrumentTypes` que esteja no `DEDICATED_TABLES`, fazer um `select` na tabela dedicada com as colunas `registro_acao_id, escola_id, aap_id, created_at` + os `field_key` de rating do tipo. Concatenar os resultados ao array `responses` do hook, **achatados no mesmo shape** dos `instrument_responses`:
   ```ts
   { form_type, responses: { <field_key>: <valor>, ... }, registro_acao_id, escola_id, aap_id, created_at }
   ```
3. Pular o `form_type` na consulta original ao `instrument_responses` se ele já estiver em `DEDICATED_TABLES` (evita rota dupla). Para T@RL não há linhas em `instrument_responses` hoje, mas a guarda evita inconsistência futura.
4. O restante do pipeline (registrosMap por `registro_acao_id`, filtros de mês/ano/escola/programa/ator/componente/entidadeFilhoEscolaId, agregação de médias, geração de `chartData`) **não muda** — passa a operar sobre o array unificado.

Como o hook é o único produtor de `chartData`, o card "Visita Técnica — T@RL" passa a aparecer automaticamente em:
- `AdminDashboard.tsx` (módulo `<InstrumentDimensionCharts/>` na linha 1413)
- `RelatoriosPage.tsx` (linha 1318)
- `PdfReportContent.tsx` (consome a mesma estrutura)

O layout do card é exatamente o do anexo: header com ícone + título, contagem de respostas + média geral, barras horizontais por critério e progress rings.

## Out of scope
- Não alterar o formulário T@RL nem schema/RLS/GRANTs.
- Não tocar nos cards existentes (Alfabetização REDES, Microciclos, Monitoramento Regionais).
- Não criar componente novo — reaproveitamos `InstrumentDimensionCharts`.
- Sem migration/backfill.
