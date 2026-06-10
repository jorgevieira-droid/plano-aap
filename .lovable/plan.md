## Objetivo

Criar o **Assistente IA "Olhar Parceiro"** (renomeado de "Bússola") que ajude N1/N2/N3 a:
- Conversar sobre os dados (chat com threads persistidas)
- Gerar relatórios analíticos com 1 clique (Boas Práticas / Preocupações / Encaminhamentos)
- **Rastrear custo por programa** para rateio mensal entre PEI, VOAR, PEC etc.

Usa **Lovable AI Gateway** (sem chave do usuário) com `google/gemini-3-flash-preview` (chat) e `google/gemini-2.5-pro` (análise estruturada).

## Estimativa de custo por consulta (US$)

| Tipo | Tokens IN | Tokens OUT | Modelo | Custo estimado |
|---|---|---|---|---|
| Pergunta simples no chat | 2.000 | 500 | Flash | **US$ 0,001** |
| Chat com 1 tool call | 8.000 | 1.200 | Flash | **US$ 0,003 – 0,005** |
| Chat com 2-3 tool calls | 20.000 | 2.000 | Flash | **US$ 0,008 – 0,012** |
| "Gerar análise IA" (1 clique) | 40.000 | 3.000 | Pro 2.5 | **US$ 0,06 – 0,09** |
| Análise consolidada mensal | 80.000 | 4.000 | Pro 2.5 | **US$ 0,12 – 0,18** |

**Projeção:** 30 usuários × 20 chats + 5 relatórios/mês ≈ **US$ 15–25/mês**. Uso pesado (100 usuários) ≈ **US$ 80–150/mês**.

## Escopo aprovado

| Decisão | Valor |
|---|---|
| Nome | **Olhar Parceiro** (substitui "Bússola" no assistente) |
| Formato | Chat + botões "Gerar análise IA" em Relatórios |
| Fontes | Campos textuais + notas dos instrumentos (0-2 / 1-5) |
| Acesso | N1, N2, N3 |
| Histórico | Threads persistidas no banco |
| **Rateio** | **Cada consulta registra programa(s) + custo em US$** |
| **Dashboard de custos** | **Visão N1: custo por programa × mês** |

## Arquitetura

### 1. Banco — 3 tabelas novas

**`ai_chat_threads`** — `id`, `user_id`, `title`, `programa` (programa principal da conversa, derivado do usuário/contexto), `created_at`, `updated_at`.

**`ai_chat_messages`** — `id`, `thread_id`, `role`, `content`, `parts` (jsonb), `created_at`.

**`ai_usage_log`** — registro fino para rateio:
- `id`, `thread_id`, `message_id`, `user_id`
- `programas` (text[] — programas atribuídos à consulta; pode ser >1 quando a pergunta envolve múltiplos)
- `model` (flash/pro)
- `tokens_input`, `tokens_output`
- `cost_usd` (numeric(10,6)) — calculado no edge function a partir dos tokens + tabela de preços
- `created_at`

RLS: usuário vê próprios threads/mensagens; **`ai_usage_log` legível apenas por N1** (admin). GRANTs padrão.

### 2. Atribuição de programa(s) à consulta (regra de rateio)

Ordem de prioridade no edge function:
1. **Filtro explícito** enviado pelo botão "Gerar análise IA" (programa selecionado nos Relatórios) → atribui 100% a esse programa.
2. **Programa(s) usados em tool calls** durante a conversa → se a IA chamou `buscar_registros_textuais({ programa: 'PEI' })`, atribui ao PEI. Se múltiplos, divide proporcionalmente pelo nº de tool calls por programa.
3. **Fallback**: programas do `user_programas` do usuário logado, divididos igualmente.
4. **N1 sem programa**: marca como `'compartilhado'` (rateado depois por proporção do mês).

Cada `ai_usage_log` registra **um array de programas + peso implícito por divisão igual** (ex.: `['pei','voar']` = 50/50). Para rateio mais granular, futuro: coluna `programa_weights jsonb`.

### 3. Edge Function `ai-assistant` (streaming, AI SDK)
- Valida JWT + role (N1/N2/N3); rejeita demais.
- `streamText` + `toUIMessageStreamResponse` com Lovable AI Gateway.
- **System prompt em PT-BR**: contexto Olhar Parceiro, papéis N1-N8, programas PEI/VOAR/PEC, instrumentos, escala 0-2.
- **Tools (function calling)** com service_role respeitando filtros:
  - `buscar_registros_textuais({ programa?, escola_id?, periodo, limite })`
  - `buscar_metricas_instrumentos({ form_type, programa?, escola_id?, periodo })`
  - `listar_escolas_programas()`
  - `gerar_resumo_analitico({ programa, periodo, escolas? })`
- `stopWhen: stepCountIs(50)`. Limite 200 registros/tool.
- **`onFinish`**: salva mensagem assistant **e** insere linha em `ai_usage_log` com tokens, custo calculado (tabela de preços hardcoded no shared/ai-gateway.ts), e programas inferidos pela ordem acima.

### 4. Frontend

**Nova página `/assistente`** (`AssistantePage.tsx`)
- Layout 2 colunas: sidebar de threads | área de chat.
- Rotas `/assistente` e `/assistente/:threadId`.
- AI Elements: `bunx ai-elements@latest add conversation message prompt-input shimmer tool`.
- `useChat` com `id={threadId}`, `DefaultChatTransport` apontando p/ edge function, `Authorization: Bearer <publishable>`.
- Renderiza `message.parts` (tool calls colapsáveis).
- Empty state com sugestões clicáveis (Boas Práticas, Preocupações, Encaminhamentos, etc).

**Botão "Gerar análise IA"** em `RelatoriosPage`, `PontosObservadosPage`, `RelatorioConsultoriaPage`, `RelatorioRegionaisPage` — cria thread com programa e período pré-filtrados.

**Nova página `/assistente/custos`** (apenas N1)
- Tabela e gráfico de barras empilhadas: linhas = mês, colunas = programa, valor = US$ total.
- Filtros: período (default últimos 6 meses), modelo (flash/pro/todos), usuário.
- Cards no topo: custo total no período, custo médio/consulta, programa de maior custo.
- Export CSV para fechamento contábil.
- Detalhe drill-down por thread (data, usuário, programa, tokens, US$).

**Navegação**
- Item **"Assistente Olhar Parceiro"** no Sidebar — visível p/ N1/N2/N3.
- Sub-item **"Custos IA"** — visível só p/ N1.

### 5. Segurança & RLS
- Edge function valida `has_role(user, 'admin'|'gestor'|'n3_coordenador_programa')`.
- Tools respeitam `gestor_can_view_*` e `user_has_programa`.
- `ai_usage_log` SELECT apenas para `is_admin(auth.uid())`; INSERT só via service_role (edge function).

### 6. Modelo de preços (hardcoded em `_shared/ai-gateway.ts`)
```text
gemini-3-flash-preview : IN $0.10 / OUT $0.40 (por 1M tokens)
gemini-2.5-pro         : IN $1.25 / OUT $5.00 (por 1M tokens)
```
Fácil de atualizar quando o Lovable AI Gateway publicar preços oficiais.

## Mudanças por arquivo

### Novos
- `supabase/migrations/<ts>_ai_assistant.sql` — 3 tabelas + RLS + GRANTs.
- `supabase/functions/ai-assistant/index.ts` — streaming + tools + log de uso.
- `supabase/functions/_shared/ai-gateway.ts` — provider + tabela de preços + helper de cálculo.
- `src/pages/admin/AssistantePage.tsx`
- `src/pages/admin/AssistenteCustosPage.tsx` (N1)
- `src/components/assistente/ThreadList.tsx`, `ChatWindow.tsx`, `ToolCallCard.tsx`, `SuggestionChips.tsx`
- `src/components/assistente/CustosPorProgramaChart.tsx`, `CustosDetailTable.tsx`
- `src/hooks/useAiThreads.ts`, `useAiCosts.ts`
- `src/components/ai-elements/*` (CLI)

### Editados
- `src/App.tsx` — rotas `/assistente`, `/assistente/:threadId`, `/assistente/custos`.
- `src/config/roleConfig.ts` + `src/components/layout/Sidebar.tsx` — itens de menu.
- `RelatoriosPage.tsx`, `PontosObservadosPage.tsx`, `RelatorioConsultoriaPage.tsx`, `RelatorioRegionaisPage.tsx` — botão "Gerar análise IA".

## Tratamento de erros
- 429 → toast "Aguarde alguns segundos e tente novamente".
- 402 → "Créditos de IA esgotados. Contate o administrador.".
- Falha de tool → card de erro inline, conversa segue.
- Falha ao inserir em `ai_usage_log` → log no console + sentry-like, **não bloqueia resposta** (rateio é "best-effort").

## Fora de escopo (futuro)
- PDF do resumo (reusar `pdfExport.ts`).
- Análise de imagens.
- E-mail automático do relatório.
- Peso explícito por programa via `programa_weights jsonb` (hoje divisão igual entre array).

## Validação ao final
- Criar 2 threads, enviar mensagens, recarregar `/assistente/:id` → mensagens restauram.
- N4-N8 → `/assistente` redireciona p/ `/unauthorized`; `/assistente/custos` idem para N2/N3.
- Botão "Gerar análise IA" PEI/junho → abre thread com resumo nas 3 categorias; `ai_usage_log` mostra linha com `programas=['pei']`.
- Após 5+ consultas mistas, `/assistente/custos` exibe gráfico empilhado coerente; CSV exportado bate com a soma da tabela.
- Conferir nos logs do edge function `X-Lovable-AIG-Run-ID` por consulta.