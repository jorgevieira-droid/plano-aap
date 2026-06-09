## Objetivo

Criar a nova ação **`reuniao_acomp_alfabetizacao`** — "Reunião — Acompanhamento Alfabetização" — com:
- Formulário de **cadastro** (Programação) e de **gerenciamento** (Registros) conforme o documento.
- Disponível em todos os programas (Escolas, Regionais, Redes Municipais).
- Mesma matriz de permissões da "Visita Técnica — IAB (REDES)".
- Card no Dashboard e bloco no Relatório seguindo o print (barras + donuts, escala 0–2), visível apenas quando há dados.
- Persistência confiável de **entidade_filho_id** entre cadastro e gerenciamento.

## 1. Banco de dados (migração única)

### 1.1 Persistir `entidade_filho_id` em `registros_acao`
Hoje só `programacoes` tem `entidade_filho_id` — essa é a raiz dos bugs anteriores. Vamos:
- Adicionar coluna `entidade_filho_id UUID` em `public.registros_acao` (FK → `entidades_filho(id)` ON DELETE SET NULL).
- Backfill a partir de `programacoes.entidade_filho_id` quando o registro tiver `programacao_id`.
- Atualizar o fluxo "Programação → Registro" para copiar o campo (ver §3).

### 1.2 Nova tabela `relatorios_reuniao_acomp_alfabetizacao`
Espelho de `relatorios_visita_tecnica_alfabetizacao_redes`, contendo:
- Cadastro persistido: `municipio`, `data`, `nome_escola`, `entidade_filho_id`, `ponto_focal_municipal`, `avaliador_id`, `hora_inicio`, `hora_fim`, `segmento` ('anos_iniciais' | 'anos_finais').
- Gerenciamento: `nota_criterio_1..13` (smallint 0–2), `evidencia_criterio_1..13` (text), `pontos_fortes`, `aspectos_fortalecer`, `estrategias_sugeridas`.
- Padrões: `registro_acao_id` UNIQUE, `status` ('rascunho'|'enviado'), `created_by`, `created_at/updated_at` + trigger.
- GRANTs para `authenticated` e `service_role`.
- RLS espelhando o padrão de `relatorios_visita_tecnica_alfabetizacao_redes` (N1 admin / N2-N3 por programa / N4-N5 por entidade+programa).

### 1.3 Configuração de instrumento
- Inserir `form_config_settings` com `form_key='reuniao_acomp_alfabetizacao'`, `programas={escolas, regionais, redes_municipais}`, `min_optional_questions=0`.
- Inserir 13 linhas em `instrument_fields` (dimension D1–D4, `field_type='rating'`, `scale_min=0`, `scale_max=2`, `scale_labels` com as rubricas do documento) + 3 campos textarea para encaminhamentos.

## 2. Configuração e permissões (frontend)

`src/config/acaoPermissions.ts`:
- Adicionar `'reuniao_acomp_alfabetizacao'` em `AcaoTipo`, `ACAO_TIPOS`, `ACAO_TYPE_INFO` (label "Reunião — Acompanhamento Alfabetização", icon `ClipboardList`).
- Em `ACAO_PERMISSION_MATRIX`: linha idêntica a `visita_tecnica_alfabetizacao_redes` (`CRUD_ALL, CRUD_PRG, CRUD_PRG, CRUD_ENT, CRUD_ENT, CRUD_ENT, CR_ENT, CR_ENT, CR_PRG`).
- Em `ACAO_FORM_CONFIG`: `requiresEntidade: true`, `showSegmento: false`, `showComponente: false`, `useResponsavelSelector: true`, `responsavelLabel: 'Avaliador(a)'`, eligibleResponsavelRoles equivalentes (gestor, n3, n4_1, n4_2, n5).

`src/hooks/useInstrumentFields.ts`:
- Adicionar `'reuniao_acomp_alfabetizacao'` em `INSTRUMENT_FORM_TYPES` (label "Reunião — Acompanhamento Alfabetização") — isso habilita auto-routing em Programação/Registros e exibe em "Configurar Formulário" e na Matriz de Ações (que já leem dessas fontes).

## 3. Formulário e fluxos

### 3.1 Cadastro (Programação)
- O `INSTRUMENT_TYPE_SET` já roteia o tipo para o fluxo padrão de programação. Adicionar campos extras de cadastro deste tipo em `ProgramacaoPage.tsx`:
  - Município (entidade — já existe), Data (já existe), **Nome da Escola = Entidade Filho** (dropdown filtrado por `escola_id`), Ponto Focal Municipal (texto), Avaliador (Ator do Programa — já existe), Hora Início / Hora Fim, Segmento (radio: Anos iniciais / Anos finais).
- Garantir gravação de `programacoes.entidade_filho_id` + um campo JSON `dados_cadastro` (já existe no padrão Microciclos) com `ponto_focal_municipal`, `hora_inicio`, `hora_fim`, `segmento`.

### 3.2 Persistência cadastro → gerenciamento
- Quando uma programação é "realizada" e gera `registros_acao`, copiar `entidade_filho_id` (novo campo §1.1) e os dados de cadastro para a linha de `relatorios_reuniao_acomp_alfabetizacao` recém-criada (pré-preenchidos, somente leitura na tela de gerenciamento).
- Verificação explícita do entidade_filho em todos os pontos: ProgramacaoPage (save), conversão para registro, ReuniaoAcompAlfabetizacaoForm (load + save). Adicionar testes manuais no checklist de QA.

### 3.3 Gerenciamento (Registros)
- Novo componente `src/components/formularios/ReuniaoAcompAlfabetizacaoForm.tsx` baseado em `VisitaTecnicaAlfabetizacaoRedesForm.tsx`:
  - Cabeçalho somente leitura com os dados de cadastro (incluindo Nome da Escola = entidade_filho.nome).
  - Legenda 0–2.
  - 4 dimensões × 13 critérios com `RatingScale` (0–2) + `RubricAccordion` + textarea "Evidência observada".
  - Bloco "Encaminhamentos": Pontos fortes, Aspectos a fortalecer, Estratégias sugeridas.
- Roteamento automático via INSTRUMENT_TYPE_SET (sem fluxo bespoke em `RegistrosPage`).

## 4. Dashboard e Relatório

### 4.1 Bloco Dashboard
- Novo `src/components/dashboard/ReuniaoAcompAlfabetizacaoBlock.tsx` espelhando `VisitaAlfabetizacaoRedesBlock.tsx` (que segue o print):
  - Header com ícone, título, "N respostas • Média geral: X.X / 2".
  - Gráfico de barras horizontais com média por critério (1–13).
  - Grid de donuts (ProgressRing, maxValue=2, displayAsNumber) por critério.
- Render condicional: só aparece se `responses.length > 0`.
- Integrar em `AdminDashboard.tsx` (dentro da seção REDES/Alfabetização) respeitando `useAcoesByPrograma`.

### 4.2 Bloco Relatório
- Em `RelatorioInstrumentosPage.tsx` (ou equivalente) adicionar bloco análogo com filtros + tabela de respostas + export PDF, padrão dos demais instrumentos (`InstrumentDimensionCharts` + `InstrumentComparisonChart`).
- Inclusão em `data-pdf-section` para impressão.

## 5. Memória do projeto

Adicionar `mem://features/action-types/reuniao-acomp-alfabetizacao.md` (label, programas, escala 0–2, 13 critérios, persistência de entidade_filho) e referência no `mem://index.md`.

## 6. Detalhes técnicos

### Mapeamento dos 13 critérios

| # | Critério | Dimensão |
|---|---|---|
| 1 | Material didático entregue e em uso regular | D1 — Materiais e Avaliação |
| 2 | Avaliação de entrada aplicada no prazo | D1 |
| 3 | Sondagem conforme cronograma pactuado | D1 |
| 4 | Devolutiva estruturada dos resultados às escolas | D1 |
| 5 | Orientação regular para uso das plataformas | D2 — Plataformas e Tecnologia |
| 6 | Uso regular das plataformas (EL, Matific, PARC) | D2 |
| 7 | Adesão à plataforma de monitoramento municipal | D2 |
| 8 | Planejamento de formação alinhado às sondagens | D3 — Formação e Suporte Pedagógico |
| 9 | Execução do calendário de formações | D3 |
| 10 | Quórum ≥ 85% nas turmas de alfabetização | D4 — Visita Técnica às Escolas |
| 11 | Agrupamento produtivo / por nível | D4 |
| 12 | Professor auxiliar com função pedagógica | D4 |
| 13 | Município acompanha indicadores de frequência | D4 |

### Escala (0–2) — descritores conforme documento

- **0 — Não implementado** / **1 — Parcialmente implementado** / **2 — Implementado**
- Cada critério tem rubrica específica (texto completo carregado em `instrument_fields.scale_labels`).

### Política de média
Conforme regra de projeto (REDES 0–2): incluir o valor 0 nos cálculos de média (não é N/A).

### Arquivos novos
- `src/components/formularios/ReuniaoAcompAlfabetizacaoForm.tsx`
- `src/components/dashboard/ReuniaoAcompAlfabetizacaoBlock.tsx`
- `src/components/print/ReuniaoAcompAlfabetizacaoPrintSection.tsx` (impressão/PDF)
- Migração SQL única

### Arquivos modificados
- `src/config/acaoPermissions.ts`
- `src/hooks/useInstrumentFields.ts`
- `src/pages/admin/ProgramacaoPage.tsx` (cadastro: ponto focal, horários, segmento; persistência `entidade_filho_id`)
- `src/pages/admin/RegistrosPage.tsx` (apenas título — auto-routing via INSTRUMENT_TYPE_SET)
- `src/pages/admin/AdminDashboard.tsx` (incluir novo bloco)
- `src/pages/admin/RelatorioInstrumentosPage.tsx` (filtro + bloco)
 - `src/components/print/AcaoPrintForm.tsx` (suporte ao novo instrumento)

## Nota crítica recorrente (CHECK constraints)
> **Sempre verificar e atualizar os CHECK constraints de `tipo` nas tabelas `programacoes` e `registros_acao` ao criar novos tipos de ação.**
> A migration anterior (`20260609200943`) não incluiu essa alteração, o que gerou o erro:
> `new row for relation "programacoes" violates check constraint "programacoes_tipo_check"`.
> Correção: incluir `DROP CONSTRAINT ... ADD CONSTRAINT` na migration, estendendo o `ARRAY` de tipos aceitos em ambas as tabelas.

## QA Checklist
1. Cadastrar uma reunião em Programação selecionando entidade + entidade_filho → confirmar que `programacoes.entidade_filho_id` foi gravado.
2. Marcar como realizada → confirmar que `registros_acao.entidade_filho_id` recebe o valor.
3. Abrir gerenciamento → confirmar que Nome da Escola exibe o entidade_filho correto e que pré-preenchidos (Ponto Focal, horários, segmento) aparecem.
4. Preencher os 13 critérios + encaminhamentos → confirmar gravação em `relatorios_reuniao_acomp_alfabetizacao`.
5. Conferir cards no Dashboard e Relatório com dados reais e ocultação quando vazio.
6. Validar permissões para N4.2 (GPI) e N5 (Formador).