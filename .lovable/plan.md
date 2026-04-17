

## Nova Ação: "Encontro Formativo – Microciclos de Recomposição"

Ação **independente** (novo `tipo`), disponível nos **3 programas** (Escolas, Regionais, REDES), com formulário próprio (escala 0-1-2) e geração automática do próximo encontro.

### Decisões já confirmadas
- Tipo novo: `encontro_microciclos_recomposicao`
- Disponível em todos os programas
- **Sem campo TURMA** (lista de presença filtra apenas pela entidade)
- Encaminhamentos geram automaticamente nova `programacao` agendada

### Permissões (igual aos outros encontros REDES)
| N1 | N2 | N3 | N4.1 | N4.2 | N5 | N6/N7/N8 |
|---|---|---|---|---|---|---|
| CRUD all | CRUD prog | CRUD prog | CRUD ent | CRUD ent | CRUD ent | NONE |

### Estrutura do formulário (escala 0-1-2)

**Campos de cabeçalho (registro da ação)**
- Município (= entidade) · Data · Formador (= ator) · Local · Horário
- **Ponto Focal da Rede** (texto livre — novo campo)

**10 itens de verificação** (rating 0/1/2):
1. Clareza do ponto focal sobre objetivos do microciclo
2. Compreensão do agrupamento por proficiência e cadernos por faixa
3. Quórum ≥ 75% no encontro
4. Acesso à Plataforma Trajetórias
5. Uso da avaliação diagnóstica para indicar cadernos
6. Rotina de 3 encontros/semana com 1h-aula por componente
7. Aplicação de Quizzes + registro via QR Code
8. Agrupamentos conforme orientação (modelos 1, 2 ou 3)
9. Material didático (cadernos) disponível e em uso
10. Resultados de percurso orientando avanço pelas faixas

**Relato objetivo** (textarea)

**Uso da Plataforma Trajetórias** (2 single-choice + textarea)
- Acesso aos dados: Autônoma / Com apoio / Não acessam
- Quizzes registrados/utilizados: Sistematicamente / Parcialmente / Não
- Observações (texto)

**Encaminhamentos**
- Pontos fortes (texto) · Aspectos a fortalecer (texto)
- Encaminhamentos acordados (texto) · Prazo (data) · Responsável (texto)
- **Próximo encontro – data prevista** (data)
- **Pauta prevista** (texto)

**Lista de Presença** — atores educacionais da entidade (filtra por programa)

### Automação do próximo encontro
Ao salvar com "data prevista do próximo encontro" preenchida, criar nova `programacao`:
- mesmo `tipo`, mesma entidade, mesmo formador
- `descricao` = pauta prevista
- `status` = `agendada`
- `formacao_origem_id` aponta ao registro atual (rastreabilidade)

### Mudanças técnicas

**1. Banco de dados** (migration)
- Adicionar tipo na lista válida (sem alterar enum — `tipo` é text)
- `instrument_fields`: 10 itens de verificação + 2 single-choice + textareas
- `form_config_settings`: registrar `encontro_microciclos_recomposicao` com os 3 programas
- `form_field_config`: defaults para cada role

**2. `src/config/acaoPermissions.ts`**
- Adicionar `encontro_microciclos_recomposicao` em `AcaoTipo`, `ACAO_TIPOS`, `ACAO_TYPE_INFO`, `ACAO_PERMISSION_MATRIX`, `ACAO_FORM_CONFIG`
- `useResponsavelSelector: true`, eligibleRoles = N2/N3/N4.1/N4.2/N5

**3. Componentes/páginas**
- `src/components/instruments/RedesFormPreview.tsx`: novo `MICROCICLOS_ITEMS` + case no switch
- Novo `src/components/formularios/EncontroMicrociclosForm.tsx` (10 itens + Plataforma + Encaminhamentos)
- `src/pages/admin/ProgramacaoPage.tsx`: incluir tipo nos arrays de presença, salvar `local`, `encaminhamentos`, etc.
- `src/pages/admin/RegistrosPage.tsx`: caso para edição/visualização
- `src/pages/aap/AAPRegistrarAcaoPage.tsx`: render do novo form + lógica de auto-criar próxima programação
- `src/pages/admin/HistoricoPresencaPage.tsx`: incluir tipo na consulta de presença
- `src/pages/admin/MatrizAcoesPage.tsx` e `FormFieldConfigPage`: aparecem automaticamente via `ACAO_TIPOS`

**4. Memória**
- Novo `mem://features/action-types/encontro-microciclos-recomposicao` documentando regras
- Atualizar `mem://index.md`

### Resultado
Nova ação "Encontro Formativo – Microciclos de Recomposição" disponível em qualquer programa, com formulário fiel ao documento, lista de presença pela entidade, e geração automática do próximo encontro a partir da data prevista.

