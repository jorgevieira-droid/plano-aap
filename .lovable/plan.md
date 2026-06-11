## Nova ação/instrumento: Visita Técnica — Alfabetização

Criar a ação `visita_tecnica_alfabetizacao` (distinta da existente `visita_tecnica_alfabetizacao_redes`), disponível nos 3 programas (Escolas, REDES Municipais, Regionais), com tabela própria, formulário, legenda das rubricas (1–4) e card de score consolidado por dimensão.

### 1. Banco (migração única)

**Tabela `relatorios_visita_tecnica_alfabetizacao`**
- Vínculo: `registro_acao_id uuid references registros_acao(id) on delete cascade unique`
- Cadastro (persistido na criação): `municipio_id uuid` (entidade), `escola_filho_id uuid references entidades_filho(id)`, `data date`, `ator_user_id uuid`, `hora_inicio time`, `hora_fim time`.
- Gerenciamento: `ano text` (1º–9º Ano, 1ª–3ª Série), `turma text` (A–H), `qtd_estudantes integer`, `nivel_iab smallint` (1=Básico Inicial … 5=Avançado), `segmento text` (anos_iniciais/anos_finais), `material_didatico text[]` (Currículo em Ação IAB, Elefante Letrado, Matific, PARC), `alunos_masculino int`, `alunos_feminino int`.
- 8 critérios com nota 1–4 + evidência textual: `nota_q1`…`nota_q8 smallint`, `evidencia_q1`…`evidencia_q8 text`. `q4_nao_se_aplica boolean default false` (quando `true`, q4 ignorada na média).
- `status text default 'rascunho'`, `created_by uuid`, `created_at`, `updated_at` + trigger `update_updated_at_column`.
- GRANT SELECT/INSERT/UPDATE/DELETE para `authenticated`; ALL para `service_role`. RLS espelhando padrão de `relatorios_visita_tecnica_tarl` (admin/gestor/N3 amplo; criador edita; N4–N5 da mesma entidade leem).
- Adicionar entrada em `form_config_settings(form_key='visita_tecnica_alfabetizacao', programas=['escolas','regionais','redes_municipais'])`.
- Seed em `instrument_fields` para 8 perguntas (escala 1–4) agrupadas em 4 dimensões (D1 Objetivos e Regularidade, D2 Apoio e Material, D3 Agrupamentos e Plataformas, D4 Formação e Sondagens), com descrições/rubricas conforme documento.

### 2. Configuração de ação (`src/config/acaoPermissions.ts`)
- Adicionar `'visita_tecnica_alfabetizacao'` em `AcaoTipo`, `ACAO_TIPOS`, `ACAO_TYPE_INFO` (label "Visita Técnica — Alfabetização", `ClipboardList`).
- `ACAO_PERMISSION_MATRIX`: mesma matriz de `visita_tecnica_tarl` (N1 CRUD_ALL; N2/N3 CRUD_PRG; N4_1/N4_2/N5 CRUD_ENT; N6/N7 CR_ENT; N8 CR_PRG).
- `ACAO_FORM_CONFIG`: `requiresEntidade: true`, `responsavelLabel: 'Técnico(a)'`, segmento/componente/anoSerie `false`, `isCreatable: true`.

### 3. Hooks/registries
- `src/hooks/useInstrumentFields.ts` → incluir `{ value: 'visita_tecnica_alfabetizacao', label: 'Visita Técnica — Alfabetização' }`.
- `src/hooks/useInstrumentChartData.ts` → mapear `visita_tecnica_alfabetizacao: 'relatorios_visita_tecnica_alfabetizacao'` (média 1–4, exclui zeros e q4 quando `q4_nao_se_aplica`).

### 4. Programação/Cadastro (`src/pages/admin/ProgramacaoPage.tsx`)
- Em todas as listas que incluem `visita_tecnica_tarl/microciclos/alfabetizacao_redes`, acrescentar `'visita_tecnica_alfabetizacao'` (campos de cadastro Hora início/fim, requer Escola = entidade_filho, exibir bloco de Escola/entidade-filho, etc.).
- Cadastro grava: entidade (município), entidade_filho (escola), data, ator, hora_inicio, hora_fim — salvos em `registros_acao`/`programacoes` como hoje (sem persistir campos de gerenciamento). Garantir que ao abrir o gerenciamento o `entidade_filho_id` da programação seja lido e fixado (não permitir desvincular), reutilizando o padrão recém-corrigido de `visita_tecnica_tarl`/`microciclos`.

### 5. Formulário (`src/components/formularios/VisitaTecnicaAlfabetizacaoForm.tsx`)
- Espelhar `VisitaTecnicaMicrociclosForm.tsx`.
- Cabeçalho com dados do cadastro (município, escola, data, técnico, horários) somente leitura.
- Bloco GERENCIAMENTO: ano (dropdown), turma (A–H), qtd estudantes, nível IAB, segmento, material didático (checkboxes), alunos masculino/feminino.
- Renderizar `VisitaAlfabetizacaoRubricLegendCard` (legenda 1–4 conforme print2) acima da Dimensão 1.
- 8 perguntas com `RatingScale` 1–4 + `Textarea` de evidência. Q4 inclui checkbox "Não se aplica à rede" (ao marcar, oculta/desabilita nota e exclui da média).
- Card "Score consolidado" no topo do bloco de rubricas mostrando média geral (X.X / 4) e barra/rosca por critério, padrão visual do print1.

### 6. Roteamento de gerenciamento
- `RegistrosPage.tsx` / `ProgramacaoPage.tsx` → ao abrir o instrumento para `visita_tecnica_alfabetizacao`, usar o novo `VisitaTecnicaAlfabetizacaoForm` (fluxo direto, não via `InstrumentForm`).
- Disponível em **Matriz de Ações** (já incluso ao entrar em `ACAO_TIPOS`) e em **Configurar Formulário** (já incluso em `INSTRUMENT_FORM_TYPES`).

### 7. Legenda compartilhada (`src/components/instruments/InstrumentForm.tsx`)
- Como o form é dedicado, exportar `VisitaAlfabetizacaoRubricLegendCard` no próprio módulo do form (4 colunas: 1–Insuficiente, 2–Em Desenvolvimento, 3–Consolidado, 4–Avançado) seguindo o estilo do `VisitaSmeRubricLegendCard`.

### 8. Card de Score Consolidado (estilo print1)
- Reaproveitar `InstrumentDimensionCharts`/`InstrumentComparisonChart` adicionando `visita_tecnica_alfabetizacao` ao mapa de instrumentos, com `min=1, max=4`. Ignorar q4 quando `q4_nao_se_aplica=true` no cálculo da média.

### 9. Validação
- Cadastrar uma Visita Técnica — Alfabetização nos 3 programas e confirmar gravação de entidade/entidade_filho/hora_inicio/fim.
- Abrir o gerenciamento: entidade_filho aparece travada; legenda visível antes da Dimensão 1; Q4 com "Não se aplica" zera a contribuição na média.
- Em Matriz de Ações e em Configurar Formulário a ação aparece e os campos seeds são editáveis.
- Relatórios/Dashboard exibem o instrumento com card de média geral (1–4) e por critério.