# Mostrar campos da "Observação de Aula (GPA)" em Configurar Formulários

## Problema

Hoje a tela `Configurar Formulários` mostra "0 campos" e "Nenhum campo cadastrado para este instrumento" para a "Observação de Aula (GPA)", porque o formulário foi cadastrado como dedicado (sem entradas em `instrument_fields`) e está listado entre os REDES (preview estático).

O usuário quer que os campos apareçam na matriz por perfil (N1–N8) como em outros formulários (ex.: "Observação de Aula" padrão).

## Mudanças

### 1. Migration — popular `instrument_fields` para `observacao_aula_gpa`

Inserir todos os campos do formulário dedicado, agrupados por dimensão e na ordem em que aparecem no formulário:

**Identificação (`dimension = NULL`)**
- `municipio` (text), `nome_escola` (text), `data` (date), `observador` (text)
- `horario_inicio` (time), `horario_fim` (time)
- `nome_professor` (text), `ano` (select), `turma` (select), `segmento` (select)
- `material_didatico` (multiselect), `alunos_masculino` (number), `alunos_feminino` (number), `qtd_estudantes` (number)

**9 critérios** (escala 1–4) — `dimension` = D1/D2/D3/D4 conforme `GPA_CRITERIA`:
- `nota_criterio_1`..`nota_criterio_9` (rating 1–4) com `label` = título do critério e `scale_labels` = 4 níveis da rubrica
- `evidencia_criterio_1`..`evidencia_criterio_9` (text) — "Evidência observada"

**Encaminhamentos finais (`dimension = 'Encaminhamentos'`)**
- `pontos_fortes`, `aspectos_fortalecer`, `estrategias_sugeridas`, `combinacao_acompanhamento` (todos text)

`sort_order` sequencial respeitando a ordem visual do formulário.

### 2. `src/components/instruments/RedesFormPreview.tsx`

Remover `'observacao_aula_gpa'` de `REDES_FORM_TYPES` para que a página use a tabela/preview padrão (matriz por perfil + preview por role), já que agora há `instrument_fields` registrados.

A função/branch que renderizava o placeholder GPA dentro do preview REDES pode ser removida.

## Fora de escopo

- O formulário dedicado (`ObservacaoAulaGpaForm.tsx`) continua usando seus próprios campos hardcoded. As toggles de Configurar Formulários servirão para visibilidade/auditoria na matriz (mesmo padrão de outros formulários "dedicados" da base). Aplicar enabled/required dinamicamente dentro do form dedicado é uma mudança maior e não faz parte deste pedido.

## Detalhes técnicos

- Migration: `INSERT INTO public.instrument_fields (form_type, field_key, label, field_type, dimension, sort_order, scale_min, scale_max, scale_labels, description) VALUES (...)` para cada campo.
- Para os 9 ratings, `scale_labels` recebe um array JSON com `{value, label, description}` derivado de `GPA_CRITERIA[i].levels`.
- Nenhuma alteração em RLS, permissões ou no dispatcher do formulário.
