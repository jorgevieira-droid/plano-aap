## Visitas Técnicas - Microciclos — novo formulário e mecânica

A ação atual `observacao_aula_redes` (rótulo "Visitas Técnicas - Microciclos") usa o formulário genérico `ObservacaoAulaRedesForm` (9 critérios REDES, escala 1-4, caderno 1-5, etc.). Vamos substituí-lo integralmente por um formulário dedicado, fiel ao documento anexado, mantendo o `tipo` da ação para preservar permissões, calendário, listas e relatórios já existentes.

### 1. Mecânica de gerenciamento (já implementada — manter)

O fluxo de duas confirmações em `RegistrosPage` já funciona como o documento pede:
- "A ação aconteceu?" → Não: mantém pendente. Sim → próxima pergunta.
- "Deseja preencher o checklist?" → Não: marca como realizada sem formulário. Sim: abre o formulário.

Sem mudança aqui.

### 2. Cadastro da ação (Programação)

Os campos já presentes no cadastro cobrem o que o documento pede para a "IDENTIFICAÇÃO": Programa (REDES), Formador (ator atribuído), Município (entidade pai), Escola (entidade filho, filtrada pela pai), Data, Título (opcional) e Descrição (opcional). Nenhuma alteração de schema na programação — apenas verificar que título/descrição estão como opcionais para este tipo (estão).

### 3. Novo formulário `VisitaTecnicaMicrociclosForm`

Substitui o `ObservacaoAulaRedesForm` no diálogo de gerenciamento (`isRedesManaging`) somente para `tipo === 'observacao_aula_redes'`.

**Cabeçalho (gerenciamento):**
- Pessoa da unidade escolar que acompanhou a visita — texto.
- Professor observado — texto.
- Horário início / horário término — `time` inputs.

**Bloco "Durante a visita técnica, houve:" (seleção múltipla):**
Conversa com Coord. Pedagógico · Observação de aula · Devolutiva ao Coord. Pedagógico · Presença de técnico da SME.

**PARTE 1 — Implementação dos microciclos (10 perguntas):**
1. Organização da rotina semanal — single (Sim / Em processo / Ainda não iniciou).
2. Início (ou previsão) das aulas de recomposição — texto.
3. 3 encontros semanais de 1h-aula por componente — single (Sim / Não).
4. Modelo de agrupamento — múltipla (5 opções fixas + "Outro" com texto livre + "Não há reagrupamento").
5. Anos escolares contemplados — múltipla (3º a 9º).
6. Nº de turmas de recomposição — número.
7. Nº de estudantes participantes — número.
8. Material didático em quantidade suficiente — single (Sim / Não).
9. Registros da avaliação de percurso — single (3 opções).
10. Tempo formativo do Coord./ponto focal — single (4 opções).

**PARTE 2 — Observação de aula (perguntas 11–22):**
- 11. Estudantes matriculados — número.
- 12. Estudantes presentes — número.
- 13. Componente curricular observado — single (LP / Matemática).
- 14. Modelo de agrupamento da turma — single (4 opções + "Outro" texto + "Não há reagrupamento").
- 15. Uso do material didático na aula — single (3 opções).
- 16. Cadernos em uso — múltipla (Caderno 1 a 4).
- 17–22. Seis rubricas com escala 1–4 (Insuficiente / Em Desenvolvimento / Consolidado / Avançado), cada uma com:
  - Componente de rubrica expansível com a tabela descritiva do nível (mesmo padrão do `RubricAccordion` já existente).
  - Nota atribuída (1–4).
  - Evidência observada (textarea).
  - Títulos: 17 Intervenções alinhadas ao caderno · 18 Metodologias que favorecem aprendizagem · 19 Objetivo de aprendizagem · 20 Verificação de compreensão · 21 Gestão do tempo · 22 Clima de sala.

**PARTE 3 — Encaminhamentos (3 blocos, cada bloco com 3 textareas):**
- Bloco "Condições gerais da implementação": Pontos fortes · Aspectos a fortalecer · Encaminhamentos acordados com o ponto focal.
- Bloco "Aspectos metodológicos da observação de aula": mesmos 3 textareas.
- Bloco "Análise do compilado de dados da plataforma Trajetória": mesmos 3 textareas.

**Observações gerais (final):** textarea livre.

**Botões:** "Salvar rascunho" e "Enviar" (mesmo padrão do form atual).

### 4. Persistência

Nova tabela `relatorios_visita_tecnica_microciclos`:
- `id uuid pk`, `registro_acao_id uuid unique` (FK para `registros_acao`), `created_by uuid`, `created_at`, `updated_at`, `status text` ('rascunho' | 'enviado').
- Campos do cadastro espelhados (município, escola, data, formador) para snapshot do relatório.
- Campos do gerenciamento: `pessoa_acompanhou`, `professor_observado`, `horario_inicio`, `horario_fim`.
- `partes_visita text[]` (4 chaves do bloco "Durante a visita…").
- Parte 1: 10 colunas tipadas (texto/número/array/single).
- Parte 2: campos numéricos, `componente`, `agrupamento_turma` + `agrupamento_outro`, `uso_material`, `cadernos_uso text[]`, e 6 pares `nota_q17..q22 int` + `evidencia_q17..q22 text`.
- Parte 3: 9 colunas de texto (3 por bloco).
- `observacoes_gerais text`.

RLS: mesmo padrão de `observacoes_aula_redes` (admin/manager full, demais por `registro_acao_id` ligado a registro do próprio usuário/programa).

A tabela legada `observacoes_aula_redes` permanece intocada (preserva histórico). O novo formulário grava exclusivamente na nova tabela.

### 5. Pontos de integração já existentes

- `acaoPermissions.ts`, `useInstrumentFields.ts`, `RegistrosPage.tsx`, `ProgramacaoPage.tsx`, `PendenciasPage.tsx`, `HistoricoPresencaPage.tsx`, `ListaPresencaPage.tsx`, `MatrizAcoesPage.tsx`, `AdminDashboard.tsx`, `useAcoesByPrograma.ts` continuam reconhecendo `observacao_aula_redes` (mesmo `tipo`); nenhum ajuste necessário.
- `RegistrosPage.tsx`: trocar somente o componente renderizado dentro do `Dialog` `isRedesManaging` de `ObservacaoAulaRedesForm` para `VisitaTecnicaMicrociclosForm`.
- `ProgramacaoUploadDialog.tsx`: copy já indica que esse tipo não é importável em lote — manter.

### 6. Detalhes técnicos

- Componente novo: `src/components/formularios/VisitaTecnicaMicrociclosForm.tsx`. Reutiliza `RubricAccordion`, `RatingScale`, `Checkbox`, `RadioGroup`, `Select`, `Textarea`, `Input`, `Card`. Validação com `zod` + `react-hook-form`.
- Para a Escola (entidade filho), reutiliza o mesmo padrão de carregamento de `entidades_filho` por `escola_id` já usado no form atual.
- Migration cria a nova tabela + RLS + índices em `registro_acao_id` e `created_by`.
- Sem alteração em edge functions, BigQuery export ou navegação.

### Arquivos afetados

- Criado: `src/components/formularios/VisitaTecnicaMicrociclosForm.tsx`.
- Editado: `src/pages/admin/RegistrosPage.tsx` (apenas troca do componente renderizado no diálogo REDES).
- Migration: `relatorios_visita_tecnica_microciclos` (tabela, RLS, índices).
- Memória: atualizar `mem://features/pedagogical-instruments-architecture/redes-forms-config` ou criar entrada dedicada para "Visitas Técnicas - Microciclos".
