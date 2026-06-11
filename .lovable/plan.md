
## Visão geral

Criar uma nova página **`/relatorios-narrativos`** ("Relatórios Narrativos") que reproduz o formato do anexo (`relatorio_consultoria_pedagogica.docx`) — resumo executivo, blocos temáticos com barras, destaques/alertas, e ranking de entidades — para **qualquer instrumento/ação do projeto**.

A página segue o mesmo padrão visual da `/relatorio-instrumentos` (referência da imagem):

```text
Filtros
 ├─ Programa *           (obrigatório)
 ├─ Instrumento / Ação * (obrigatório — habilitado após Programa)
 └─ Filtros opcionais: Ator · Entidade · Status · Data início · Data fim
                                                          [ Gerar Relatório ]
```

Sem chat de IA nesta fase. A IA é usada apenas internamente, durante a geração, para categorizar os campos textuais e escrever os blocos de destaque.

## Fluxo

1. Usuário escolhe **Programa** → carrega lista de **Instrumentos/Ações** disponíveis (mesmo critério do Relatório de Instrumentos: `form_config_settings` × programa selecionado).
2. Usuário escolhe **Instrumento**, ajusta filtros opcionais.
3. Clica **Gerar Relatório**.
4. Página roda SQL determinístico (contagens, médias, ranking) + chama Edge Function `generate-narrative-report` que processa os campos textuais via Lovable AI (Gemini) com `Output.object` e devolve categorias/destaques.
5. Renderiza o **ReportViewer** padronizado (formato do anexo) + botão **Exportar PDF** (Bússola + Parceiros).

## Catálogo completo de templates (12)

Cada template = arquivo de config em `src/components/relatoriosNarrativos/templates/*.ts` definindo: tabela-fonte, joins, campos textuais a categorizar, campos quantitativos (rubricas/notas), seções a renderizar, prompt da IA.

| # | Instrumento / Ação | Tabela principal | Campos textuais (categorizados pela IA) | Seções geradas |
|---|---|---|---|---|
| 1 | **Consultoria Pedagógica** | `consultoria_pedagogica_respostas` + `registros_acao` | `boas_praticas`, `pontos_preocupacao`, `encaminhamentos`, `pauta_formativa`, `outros_pontos`, `analise_dados` | Resumo executivo · Boas práticas · Pontos de preocupação · Encaminhamentos · Top escolas |
| 2 | **Observação de Aula (GPA)** | `observacoes_aula_gpa` | `pontos_fortes`, `aspectos_fortalecer`, `estrategias_sugeridas`, `combinacao_acompanhamento`, `evidencia_criterio_1..9` | Médias por critério (1–4) · Fortalezas · Fragilidades · Estratégias · Top escolas |
| 3 | **Observação de Aula — REDES (Microciclos)** | `observacoes_aula_redes` | mesmos campos textuais + evidências | Médias (0–2) · Fortalezas · Fragilidades · Estratégias · Top redes |
| 4 | **Visita Técnica — Alfabetização** | `relatorios_visita_tecnica_alfabetizacao` | `pontos_fortes`, `aspectos_fortalecer`, `estrategias_sugeridas`, evidências | Médias por critério · Temas · Top municípios |
| 5 | **Visita Técnica — IAB (REDES)** | `relatorios_visita_tecnica_alfabetizacao_redes` | textuais | Rubrica REDES · temas · destaques |
| 6 | **Visita Técnica — T@RL** | `relatorios_visita_tecnica_tarl` | textuais | mesmo padrão da #4 |
| 7 | **Visitas Técnicas — Microciclos** | `relatorios_visita_tecnica_microciclos` | textuais (evidências/encaminhamentos) | Avanços · Fragilidades · Encaminhamentos · Top redes |
| 8 | **Microciclos de Recomposição (Encontro)** | `relatorios_microciclos_recomposicao` | textuais (rubrica 0–2) | Implementação por dimensão · Pontos atenção · Encaminhamentos |
| 9 | **Reunião — Acompanhamento Alfabetização** | `relatorios_reuniao_acomp_alfabetizacao` | textuais | Implementação por dimensão · Temas · Encaminhamentos |
| 10 | **Encontro Formativo ET/EG — REDES** | `relatorios_eteg_redes` | textuais | Avanços · Fragilidades · Encaminhamentos |
| 11 | **Encontro Formativo Professor — REDES** | `relatorios_professor_redes` | textuais | mesmo padrão da #10 |
| 12 | **Monitoramento — Regionais** *(combinado)* | `relatorios_monit_acoes_formativas` + `relatorios_monitoramento_gestao` | `item_1..5` + textuais de gestão | Temas por regional · Encaminhamentos |

Observação: cada template aceita os mesmos filtros (Programa, Ator, Entidade, Status, Período). Templates que dependem de programa específico (ex.: REDES) ficam ocultos quando o programa não bate, espelhando o comportamento atual de `form_config_settings`.

## Pipeline de geração

```text
filtros (Programa + Instrumento + opcionais)
   │
   ▼
SQL determinístico
 ├─ KPIs do resumo (total registros, entidades únicas, atores únicos)
 ├─ Médias / contagens por critério (campos rating)
 └─ Ranking de entidades + ator principal
   │
   ▼
Coleta de até N=200 registros com campos textuais (truncados ~600 chars/campo)
   │
   ▼
Edge Function `generate-narrative-report`
 ├─ system prompt por template (regras de categorização)
 ├─ Lovable AI Gateway, model: google/gemini-3-flash-preview
 └─ Output.object (zod): { categorias: [{label, count, descricao}], destaques: [{tipo, texto}] }
   │
   ▼
ReportViewer renderiza: KPIs · barras horizontais · listas "Temas identificados" · cards "DESTAQUE/ALERTA/PADRÃO" · tabela final
   │
   ▼
Export PDF (lib/pdfExport, dual branding, data-pdf-section)
```

- Determinismo: contagens/médias/rankings vêm de SQL — a IA só categoriza textos e gera os blocos de destaque.
- Médias respeitam a regra do projeto: excluir 0 (N/A) exceto em escalas REDES (0–2).

## Filtros e permissões

- Reusa hooks/filtros já existentes em `RelatorioInstrumentosPage` (programa, ator, entidade) — mesma UX, mesma matriz de permissões (N1–N4.2 conforme `roleConfig.ts`).
- Não cria policies novas; consultas respeitam RLS atual.

## Mudanças no banco

Nenhuma alteração de schema. Opcional (fora desta fase): tabela `narrative_report_runs` para cache/auditoria.

## Estrutura de arquivos

```text
src/pages/admin/RelatoriosNarrativosPage.tsx
src/components/relatoriosNarrativos/
  ├─ NarrativeFiltersBar.tsx        (espelha layout do print da imagem)
  ├─ ReportViewer.tsx               (layout estilo anexo, reaproveitável)
  ├─ ReportSectionThemes.tsx        (barras + lista de temas)
  ├─ ReportSectionHighlights.tsx    (cards DESTAQUE/ALERTA/PADRÃO)
  ├─ ReportSectionRanking.tsx       (tabela top entidades)
  └─ templates/
      ├─ types.ts                   (NarrativeTemplate)
      ├─ consultoria.ts
      ├─ observacaoAulaGpa.ts
      ├─ observacaoAulaRedes.ts
      ├─ visitaTecnicaAlfabetizacao.ts
      ├─ visitaTecnicaIabRedes.ts
      ├─ visitaTecnicaTarl.ts
      ├─ visitaTecnicaMicrociclos.ts
      ├─ microciclosRecomposicao.ts
      ├─ reuniaoAcompAlfabetizacao.ts
      ├─ encontroEtegRedes.ts
      ├─ encontroProfessorRedes.ts
      └─ monitoramentoRegionais.ts
src/hooks/useNarrativeReport.ts     (orquestra SQL + edge function, React Query)
supabase/functions/generate-narrative-report/index.ts
```

Reusa: `lib/pdfExport.ts`, branding Bússola/Parceiros, filtros do Relatório de Instrumentos, `useInstrumentFields` para descobrir campos rating de cada template.

## Navegação

- Rota `/relatorios-narrativos`, link no Sidebar abaixo de "Relatório de Instrumentos".
- Permissões (estáticas em `roleConfig.ts`): N1, N2, N3, N4.2 — mesma matriz do `/relatorio-instrumentos`.

## Detalhes técnicos

- **IA**: Lovable AI Gateway, `google/gemini-3-flash-preview`, `Output.object` com zod (sem JSON parsing manual). `stepCountIs(50)`.
- **Token budget**: trunca cada campo textual em ~600 chars; amostra até 200 registros mais recentes; SQL faz a contagem completa.
- **Cache**: React Query por `{templateId, filtrosHash}`, TTL 10 min, botão "Regerar".
- **Erros**: 402/429 do gateway exibidos em toast com mensagem específica (regra de error handling do projeto).
- **PDF**: header azul `#1a3a5c`, logos Bússola + Parceiros, `data-pdf-section` para quebras corretas.
- **Edge Function**: auth com JWT headers explícitos, CORS, refreshSession (padrão do projeto).

## Entregáveis

1. Página `/relatorios-narrativos` com a mesma barra de filtros da `/relatorio-instrumentos`.
2. Os **12 templates** ativos, cada um produzindo o relatório no formato do anexo.
3. `ReportViewer` reaproveitável (KPIs · barras · temas · destaques · ranking).
4. Edge Function `generate-narrative-report`.
5. Exportação PDF dual-branding.
6. Link no Sidebar + permissões em `roleConfig.ts`.
