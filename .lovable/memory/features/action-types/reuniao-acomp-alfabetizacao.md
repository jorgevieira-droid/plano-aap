---
name: Reunião — Acompanhamento Alfabetização
description: Nova ação tipo `reuniao_acomp_alfabetizacao` — checklist municipal de acompanhamento da alfabetização com escala 0–2 em 13 critérios sobre 4 dimensões.
type: feature
---

## Resumo

Ação **`reuniao_acomp_alfabetizacao`** com label "Reunião — Acompanhamento Alfabetização".

- **Programas:** todos (Escolas, Regionais, Redes Municipais).
- **Permissões:** idênticas a `visita_tecnica_alfabetizacao_redes` (N1 admin tudo; N2/N3 por programa; N4.1/N4.2/N5 por entidade; N6/N7 criam próprios; N8 cria no programa).
- **Roteamento:** segue a regra do projeto — auto-routing via `INSTRUMENT_TYPE_SET` (sem fluxo bespoke em RegistrosPage). Renderiza com `InstrumentForm` genérico.
- **Persistência de respostas:** padrão `instrument_responses` (não há tabela dedicada para rubricas).

## Cadastro (Programação)

Campos exigidos / aceitos:
- Programa, Município (entidade pai), Data — padrão.
- **Nome da Escola = Entidade Filho** (`entidade_filho_id`) — obrigatório. Dropdown filtrado por `escola_id`.
- Avaliador(a) (`aap_id`) — Ator do Programa.
- Hora Início / Hora Fim — campos `horario_inicio` / `horario_fim` padrão.

Os demais campos do documento (Ponto Focal Municipal, Segmento Anos iniciais/finais) são preenchidos no Gerenciamento como campos do instrumento (textarea/rating em `instrument_fields`).

## Gerenciamento

13 critérios escala **0–2** (com rubricas em `scale_labels`) + 13 textareas de evidência + 3 textareas finais (pontos fortes, aspectos a fortalecer, estratégias sugeridas), agrupados em 4 dimensões:
- **D1 — Materiais e Avaliação** (4 critérios)
- **D2 — Plataformas e Tecnologia** (3 critérios)
- **D3 — Formação e Suporte Pedagógico** (2 critérios)
- **D4 — Visita Técnica às Escolas** (4 critérios)

**Política de média (REDES 0–2):** o valor 0 É contado na média (significa "Não Implementado", não N/A).

## Persistência crítica de `entidade_filho_id`

A coluna `entidade_filho_id` foi adicionada à tabela **`registros_acao`** (FK → `entidades_filho` ON DELETE SET NULL) para garantir que a Escola Filho escolhida no Cadastro sobreviva à conversão Programação → Registro. Backfill aplicado para registros existentes via `programacao_id`. Aplica-se a TODOS os tipos que usam entidade_filho (não só este).

## Dashboard / Relatórios

Renderiza automaticamente via `useInstrumentChartData` + `InstrumentDimensionCharts` (mesmo padrão do print de referência: barras horizontais por critério + donuts agrupados por dimensão + média geral). Visível apenas quando há respostas, respeitando filtros de programa/ano/mês/escola/ator.

## Tabela auxiliar criada (não usada no MVP)

`public.relatorios_reuniao_acomp_alfabetizacao` foi criada na migração (com RLS) para eventual persistência estruturada de cadastro + respostas. **No MVP atual ela permanece vazia** — a implementação usa o fluxo genérico de `instrument_responses`. Pode ser usada futuramente caso queira-se persistir dados de cadastro (ponto focal, segmento) de forma tipada.
