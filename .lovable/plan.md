## Objetivo

Criar nova ação **"Visita Técnica — Alfabetização (REDES)"** (slug `visita_tecnica_alfabetizacao_redes`) como tipo separado, coexistindo com a atual `observacao_aula_redes`. Disponível por padrão em todos os programas, mas configurável via "Configurar Formulário".

## Estrutura do formulário (anexo IAB)

**CADASTRO (programação/calendário — enxuto):**
- Rede Municipal (entidade) — obrigatório
- Data — obrigatório
- Escola (entidade filho) — obrigatório
- Técnico Visitante (Ator do programa) — obrigatório
- Horário — opcional

**GERENCIAMENTO (formulário completo):**
- Turma/Ano (1º ano / 2º ano)
- Nível IAB em uso (1=1º ano / 2=2º ano)
- Qtd. de estudantes na turma (numérico)
- Segmento (1º ano / 2º ano)
- Material Didático IAB utilizado (checkboxes: Aprender a ler, Livro Gigante, Mini livros, Manual de Consciência Fonológica, Caderno de Revisão 1, Matemática 1º ano, Ciências)
- Alunos presentes — Masculino / Feminino (numérico)
- **12 critérios** distribuídos em 4 dimensões, escala 1–4 (Insuficiente / Em Desenvolvimento / Consolidado / Avançado), cada um com nota + evidência observada:
  - **D1 — Objetivos e Regularidade:** (1) Clareza de objetivos, (2) Quórum ≥85%, (3) Cronograma de visitas, (4) Aula conforme cronograma
  - **D2 — Aplicação Metodológica:** (5) Sequência de aulas/atividades, (6) Trabalho com fonemas, (7) Metodologia efetiva
  - **D3 — Participação e Engajamento:** (8) Alunos fazem perguntas/participam, (9) [doc], (10) Professor modela aprendizado
  - **D4 — Formação e Uso de Dados:** (11) Participação na formação IAB, (12) Sondagens orientam intervenções
- **Encaminhamentos (texto aberto):** Pontos fortes, Aspectos a fortalecer, Estratégias sugeridas, Combinações para acompanhamento futuro

## Banco de dados (migration)

Nova tabela `public.relatorios_visita_tecnica_alfabetizacao_redes` com colunas:
- Identificação: `id`, `registro_acao_id` (FK → registros_acao), `aap_id`, `escola_id` (rede), `entidade_filho_id` (escola), `created_at`, `updated_at`, `status` (rascunho/enviado)
- Contexto: `data`, `horario`, `tecnico_visitante`
- Turma: `turma_ano`, `nivel_iab`, `qtd_estudantes`, `segmento`, `material_didatico` (text[]), `alunos_masculino`, `alunos_feminino`
- Critérios 1–12: `nota_criterio_N` (int 1–4), `evidencia_criterio_N` (text) — todas lowercase
- Encaminhamentos: `pontos_fortes`, `aspectos_fortalecer`, `estrategias_sugeridas`, `combinacao_acompanhamento`
- GRANTs para anon (não), authenticated, service_role
- RLS espelhando `observacoes_aula_redes` (N1 admin, N2/N3 gestor programa, N4/N5 via registro+entidade)
- Trigger `update_updated_at_column`

## Frontend — novos arquivos

1. `src/components/formularios/VisitaTecnicaAlfabetizacaoRedesForm.tsx` — formulário completo do gerenciamento (12 critérios + encaminhamentos), com upsert na nova tabela
2. `src/components/print/VisitaAlfabetizacaoRedesPrintSection.tsx` — seção de impressão (header dual branding Bússola/Parceiros, todos os campos, escala 1–4)

## Frontend — alterações em arquivos existentes

1. **`src/config/acaoPermissions.ts`**
   - Adicionar `'visita_tecnica_alfabetizacao_redes'` ao tipo `AcaoTipo`, ao array `ACAO_TIPOS` e a `ACAO_TYPE_INFO` (label "Visita Técnica — Alfabetização (REDES)", icon `ClipboardList`)
   - Adicionar mesmas permissões do `observacao_aula_redes` no mapa de roles

2. **`src/hooks/useInstrumentFields.ts`**
   - Adicionar entrada em `INSTRUMENT_FORM_TYPES`

3. **`src/hooks/useAcoesByPrograma.ts`**
   - Permitir o novo tipo em todos os programas por padrão; respeitar `form_config_settings` (admin pode restringir via "Configurar Formulário")

4. **`src/pages/admin/ProgramacaoPage.tsx`**
   - Cadastro simplificado: tratar o novo tipo igual a `observacao_aula_redes` para exibir Rede + Entidade Filho + Ator + Data + Horário, mas SEM Turma/Ano/Qtd estudantes
   - Ao gerenciar, abrir Dialog com `<VisitaTecnicaAlfabetizacaoRedesForm/>` (paralelo ao bloco do Microciclos nas linhas 5384–5436)
   - Adicionar o tipo nas listas de checagem onde `observacao_aula_redes` aparece para roteamento de gerenciamento

5. **`src/pages/admin/RegistrosPage.tsx`**
   - Mesmo dispatch bespoke: ao editar/gerenciar um registro com `tipo === 'visita_tecnica_alfabetizacao_redes'`, abrir `<VisitaTecnicaAlfabetizacaoRedesForm/>`
   - Filtros e badges reconhecendo o novo tipo

6. **`src/components/print/AcaoPrintDialog.tsx`**
   - Adicionar branch para buscar `relatorios_visita_tecnica_alfabetizacao_redes` e renderizar `<VisitaAlfabetizacaoRedesPrintSection/>`

7. **`src/pages/admin/MatrizAcoesPage.tsx`**
   - Auto-incluído via `INSTRUMENT_TYPE_SET` / `ACAO_TIPOS`; validar exibição

8. **`src/pages/admin/RelatorioInstrumentosPage.tsx`**
   - Mapear `visita_tecnica_alfabetizacao_redes → relatorios_visita_tecnica_alfabetizacao_redes`

9. **`src/pages/admin/FormFieldConfigPage.tsx`** (Configurar Formulário)
   - Aparece automaticamente via `INSTRUMENT_FORM_TYPES`; admin pode habilitar/desabilitar por programa em `form_config_settings`

## Notas técnicas

- Todos os nomes de coluna em **lowercase puro** (sem camelCase) para evitar o problema histórico de schema cache.
- Form usa o mesmo padrão de `status: rascunho/enviado` da Microciclos.
- Print segue padrão dual-branding com `data-pdf-section` para quebras de página.
- Memória: após implementação, atualizar `mem://features/action-types/` com nova ação.

## Não-mudanças

- `observacao_aula_redes` permanece inalterada (continua como "Visitas Técnicas - Microciclos").
- Sem mudanças em edge functions, BigQuery export ou Notion sync (nova tabela pode ser adicionada depois se necessário).
