# Gráfico de Custo de Relatórios Narrativos por Mês e Programa

Adicionar um novo gráfico em **Relatório de Acessos** (logo abaixo do existente "Acessos por mês e programa"), no mesmo estilo (barras agrupadas), consolidando o **custo em USD** das gerações de Relatórios Narrativos por mês × programa. Visível apenas para **N1, N2 e N3**.

Como hoje nada é persistido, é preciso primeiro instrumentar o backend para registrar cada geração.

---

## 1. Backend — tabela de log de uso

Migração nova: `public.narrative_report_usage`

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK default `gen_random_uuid()` | |
| `user_id` | uuid | quem disparou (do JWT) |
| `programa` | text | `escolas` / `regionais` / `redes_municipais` |
| `form_type` | text | instrumento |
| `total_registros` | int | tamanho do recorte |
| `prompt_tokens` | int | de `usage.prompt_tokens` |
| `completion_tokens` | int | de `usage.completion_tokens` |
| `total_tokens` | int | |
| `cost_usd` | numeric(10,6) | calculado server-side |
| `model` | text | `google/gemini-2.5-flash` |
| `created_at` | timestamptz default `now()` | |

GRANTs:
```sql
GRANT SELECT ON public.narrative_report_usage TO authenticated;
GRANT ALL ON public.narrative_report_usage TO service_role;
```

RLS:
- `SELECT`: somente N1/N2/N3 (`admin`, `gestor`, `n3_coordenador_programa`) — usa `is_manager(auth.uid())`.
- `INSERT`: bloqueado para usuários comuns; a edge function escreve via `service_role`.

Função agregadora (security definer, retorna `mes date, programa text, total_usd numeric, total_geracoes bigint`):

```sql
CREATE FUNCTION public.get_custo_narrativos_por_mes_programa()
RETURNS TABLE(mes date, programa text, total_usd numeric, total_geracoes bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT date_trunc('month', created_at)::date AS mes,
         programa,
         SUM(cost_usd)::numeric AS total_usd,
         COUNT(*)::bigint AS total_geracoes
  FROM public.narrative_report_usage
  GROUP BY 1, 2
  ORDER BY 1, 2;
$$;
```
Acesso à função: só roles N1-N3 (verificado no front via `isAdmin/isGestor/isN3` antes de chamar).

---

## 2. Edge function `generate-narrative-report`

- Receber `programa` (string slug) já vem no payload (`body.programaLabel` existe; adicionar `programa: filters.programa` no `useNarrativeReport.ts`).
- Após resposta OK da Gemini, ler `ai.usage.prompt_tokens` e `ai.usage.completion_tokens`.
- Calcular custo:
  - input: `prompt_tokens / 1_000_000 * 0.30`
  - output: `completion_tokens / 1_000_000 * 2.50`
  - `cost_usd = input + output` (preços constantes no topo do arquivo, fáceis de ajustar).
- Inserir em `narrative_report_usage` usando `SUPABASE_SERVICE_ROLE_KEY` (já está nos secrets). `user_id` extraído do JWT do header `Authorization`.
- Falha de log NÃO bloqueia retorno (apenas `console.error`).

---

## 3. Frontend — `RelatorioAcessosPage.tsx`

Manter tudo o que já existe. Adicionar:

- Hook de busca: `supabase.rpc('get_custo_narrativos_por_mes_programa')`, executado em paralelo às outras queries em `fetchData`. Resultado guardado em `narrativeCostAggregates`.
- Permissão: novo gráfico só renderiza se `isAdmin || role === 'gestor' || role === 'n3_coordenador_programa'`.
- `chartCostData`: mesma transformação do gráfico existente — agrupa por `mes` (label `MMM/YY` pt-BR) e cria coluna por programa permitido.
- Componente: novo card `Custo de Relatórios Narrativos (USD)` logo abaixo do gráfico atual, mesma estrutura (Recharts `BarChart` agrupado, mesmas cores `PROGRAMA_COLORS`).
  - Eixo Y formatado como `$0.000` (até 3-4 decimais) usando `tickFormatter`.
  - Tooltip mostra `$x.xxxx · N gerações` por programa.
  - Subtítulo: "Custo estimado com base em tokens reais (Gemini 2.5 Flash: $0.30/M input + $2.50/M output). Histórico completo, não é afetado pelo filtro de data."
- CSV: adicionar coluna `Custo Narrativos USD` no export? **Não** — manter o CSV atual focado em acessos.

---

## 4. Detalhes técnicos

- Filtro de programa do gráfico segue o mesmo `selectedProgramas` já existente na página (botões superiores).
- Sem alteração no `NarrativeReportViewer.tsx` ou na UX de geração do relatório — instrumentação é transparente.
- Custos passados (anteriores ao deploy) **não** aparecem — apenas novas gerações são logadas. Mencionar isso na nota do gráfico ("a partir do início do registro").

## Arquivos afetados

- `supabase/migrations/<timestamp>_narrative_report_usage.sql` (novo)
- `supabase/functions/generate-narrative-report/index.ts` (instrumentação + insert)
- `src/hooks/useNarrativeReport.ts` (enviar `programa` no body)
- `src/pages/admin/RelatorioAcessosPage.tsx` (novo card + query + gating)
