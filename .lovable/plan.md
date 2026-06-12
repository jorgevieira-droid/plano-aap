## Plano — Completar gráficos faltantes em Relatórios Gerais

### Diagnóstico

A página tem 3 blocos de visualização:
1. **Previsto vs Realizado** — já dinâmico, lista todas as ações habilitadas que tenham dados (OK).
2. **Instrumentos Pedagógicos** (`InstrumentDimensionCharts`) — médias por dimensão.
3. **Visita Técnica — IAB (REDES)** — bloco dedicado (radar + anéis por dimensão).
4. **Presença por Escola** — apenas tabela por entidade.

Hoje o hook `useInstrumentChartData` carrega ratings de `instrument_responses` e de `DEDICATED_TABLES` (apenas T@RL e Alfabetização). Vários instrumentos têm dados/colunas de rating também em tabelas dedicadas que não estão mapeadas, causando médias parciais ou ausentes.

### Mudanças

**1. `src/hooks/useInstrumentChartData.ts` — Mapear tabelas dedicadas faltantes + dedupe**

Adicionar ao `DEDICATED_TABLES`:
- `observacao_aula_redes` → `observacoes_aula_redes` (colunas `nota_criterio_1..9`)
- `observacao_aula_gpa` → `observacoes_aula_gpa` (`nota_criterio_1..9`)
- `encontro_eteg_redes` → `relatorios_eteg_redes` (`item_1..8`)
- `encontro_professor_redes` → `relatorios_professor_redes` (`item_1..8`)
- `encontro_microciclos_recomposicao` → `relatorios_microciclos_recomposicao` (`item_1..10`)
- `reuniao_acomp_alfabetizacao` → `relatorios_reuniao_acomp_alfabetizacao` (`nota_criterio_1..13`)

Filtrar dedicadas por `status = 'enviado'` quando a coluna existir (todas têm).

Implementar **dedupe por `(form_type, registro_acao_id)`**: ao unir `instrument_responses` + tabelas dedicadas, preferir a versão da tabela dedicada (mais canônica) quando ambos existirem para o mesmo `registro_acao_id`. Isso corrige `monitoramento_acoes_formativas` (1 em responses vs 110 em tabela dedicada — embora essa tabela específica não tenha colunas de rating, ela permanecerá só em `instrument_responses`).

**2. `src/pages/admin/RelatoriosPage.tsx` — Bloco para Visita Técnica Alfabetização e T@RL**

Hoje só REDES tem bloco específico (radar + anéis por dimensão). Adicionar dois blocos análogos:
- **Visita Técnica — Alfabetização** (`relatorios_visita_tecnica_alfabetizacao`, 8 critérios escala 1–4, com a regra "Q4 = Não se aplica à rede" — excluir 0/null da média).
- **Visita Técnica — T@RL** (`relatorios_visita_tecnica_tarl`, 14 critérios escala 1–4).

Carregar via `Promise.all` igual ao REDES; criar componentes `VisitaAlfabetizacaoBlock.tsx` e `VisitaTarlBlock.tsx` em `src/components/dashboard/`, espelhando `VisitaAlfabetizacaoRedesBlock`. Para evitar duplicação na seção de Instrumentos Pedagógicos, remover esses dois `form_types` de `DEDICATED_TABLES` do hook OU ocultá-los no `InstrumentDimensionCharts` quando o bloco específico for renderizado (preferência: ocultar via filtro no `viewableInstrumentTypes`).

**3. Presença — breakdown por tipo de ação**

Adicionar acima da tabela "Presença por Escola" um cartão **"Presença por Tipo de Ação"** com bar chart: para cada tipo que gera presença (Formação, Microciclos, Encontro Professor REDES, Encontro ETEG REDES, Reunião Acomp. Alfabetização, etc.) mostrar `% de presentes` e total de presentes. Calculado a partir de `presencas` agrupado pelo `tipo` do `registro_acao`.

A tabela atual "Presença por Escola" permanece (já inclui presenças de Microciclos e demais — verificado no banco).

### Detalhes técnicos

- Aplicar mesmo filtro programa/mês/ano/escola/aap/componente/entidade-filho às novas tabelas dedicadas (usar `registros_acao` para obter `data`/`programa`).
- Excluir valor `0`/`null` das médias para escalas 1–4 e 1–5 (regra padrão); manter `0` apenas no modelo REDES (0–2) — não afeta as novas tabelas, que são 1–4/1–5.
- Não adicionar bloco para `monitoramento_acoes_formativas`, `monitoramento_gestao`, `registro_consultoria_pedagogica`, `registro_apoio_presencial` — esses já usam `instrument_responses` corretamente e os gráficos já aparecem.

### Arquivos alterados

- `src/hooks/useInstrumentChartData.ts` — DEDICATED_TABLES expandido + dedupe + filtro `status='enviado'` opcional.
- `src/pages/admin/RelatoriosPage.tsx` — carregar `relatorios_visita_tecnica_alfabetizacao` e `relatorios_visita_tecnica_tarl`; renderizar 2 novos blocos; remover esses 2 form_types do InstrumentDimensionCharts via override no hook; adicionar bar chart "Presença por Tipo de Ação".
- `src/components/dashboard/VisitaAlfabetizacaoBlock.tsx` (novo).
- `src/components/dashboard/VisitaTarlBlock.tsx` (novo).
