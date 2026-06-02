## Nova ação: Observação de Aula (GPA)

Ação independente com formulário dedicado, baseada no padrão de `observacao_aula_redes` + `encontro_microciclos_recomposicao`. Sempre usa seu formulário específico no cadastro, gerenciamento, visualização e impressão.

**Identificador interno:** `observacao_aula_gpa`  
**Label exibida:** "Observação de Aula (GPA)"

---

### 1. Banco de dados (migration)

**Nova tabela `public.observacoes_aula_gpa`** com os campos do documento:

Cabeçalho (cadastro – preenchido na programação):
- `registro_acao_id uuid` (vincula à `registros_acao`)
- `municipio text`, `data date`, `nome_escola text`, `observador text`, `horario_inicio time`, `horario_fim time`

Identificação (gerenciamento):
- `nome_professor text` (obrigatório)
- `ano text` (1º…9º), `turma text` (A…J), `qtd_estudantes integer`
- `segmento text` ('anos_iniciais' | 'anos_finais')
- `material_didatico text[]` (multi-select: Currículo em Ação, Set/Moderna, PNLD)
- `alunos_masculino integer`, `alunos_feminino integer`

9 critérios com escala 1–4 + evidência observada (texto):
- `nota_criterio_1`..`nota_criterio_9 integer` (CHECK 1..4)
- `evidencia_criterio_1`..`evidencia_criterio_9 text`

Encaminhamentos finais:
- `pontos_fortes text`, `aspectos_fortalecer text`, `estrategias_sugeridas text`, `combinacao_acompanhamento text`

Metadados: `status text default 'rascunho'`, `created_at`, `updated_at`.

**GRANTs + RLS** (mesmo padrão de `observacoes_aula_redes`):
- N1 Admin: ALL
- N2/N3: ALL em programas do usuário (via `registros_acao` + `user_programas`)
- N4.1/N4.2/N5: ALL via `user_has_full_data_access` sobre o `registro_acao_id`
- N6/N7/N8: sem acesso (consistente com permissão escolhida "Padrão Formação/REDES")

**Seed em `form_config_settings`:**
```sql
INSERT INTO form_config_settings (form_key, programas, min_optional_questions)
VALUES ('observacao_aula_gpa', ARRAY['escolas','regionais','redes_municipais']::programa_type[], 3);
```
(Programas iniciais = todos; admin ajusta em Configurar Formulários.)

**Sem seed em `instrument_fields`** — o formulário é totalmente dedicado, igual a `observacao_aula_redes`.

---

### 2. Tipagem & configuração de ação

**`src/config/acaoPermissions.ts`:**
- Adicionar `'observacao_aula_gpa'` ao tipo `AcaoTipo` e ao array `ACAO_TIPOS`.
- `ACAO_TYPE_INFO['observacao_aula_gpa']`: label "Observação de Aula (GPA)", icon `Eye`.
- `ACAO_PERMISSION_MATRIX`: usar `buildRolePerms(CRUD_ALL, CRUD_PRG, CRUD_PRG, CRUD_ENT, CRUD_ENT, CRUD_ENT, NONE, NONE, NONE)` (padrão Formação/REDES).
- `ACAO_FORM_CONFIG`: `eligibleResponsavelRoles: ['gestor','n3_coordenador_programa','n4_1_cped','n4_2_gpi','n5_formador']`, `useResponsavelSelector: true`, `requiresEntidade: true`, `showSegmento/Componente/AnoSerie: false`, `responsavelLabel: 'Observador'`.

---

### 3. Componente de formulário

**Novo `src/components/formularios/ObservacaoAulaGpaForm.tsx`** seguindo a estrutura de `ObservacaoAulaRedesForm`:

- Carrega/salva em `observacoes_aula_gpa` por `registro_acao_id`.
- Seções:
  1. **Cabeçalho** (read-only, pré-preenchido da programação): Município, Data, Escola, Observador, Horário.
  2. **Identificação**: Professor, Ano (dropdown 1º–9º), Turma (A–J), Qtd. estudantes, Segmento (radio), Material Didático (checkboxes), Alunos M/F.
  3. **Legenda das rubricas** (bloco informativo 1–4).
  4. **9 critérios** em 4 dimensões (D1 conteúdo • D2 explicação/metodologia • D3 engajamento/verificação • D4 clima/tempo) com `<RatingScale min=1 max=4>` + `<Textarea>` "Evidência observada".
  5. **Encaminhamentos**: 4 textareas.
  6. **Síntese das notas** (calculada): tabela com as 9 notas + média geral.

Botões: Salvar rascunho, Enviar (status='enviado'), Cancelar.

**Novo `src/components/formularios/observacaoAulaGpaShared.ts`** com constantes (anos, turmas, materiais, dimensões/critérios) reutilizadas pelo form e pela impressão.

---

### 4. Integração nas páginas existentes

Roteamento por tipo já é centralizado. Em cada local, adicionar `observacao_aula_gpa` ao dispatcher para abrir `ObservacaoAulaGpaForm` (e não o `InstrumentForm` genérico):

- **`src/pages/admin/ProgramacaoPage.tsx`** — cadastro/agendamento usa o fluxo genérico de programação (sem mudanças além do `acaoPermissions`).
- **`src/pages/admin/RegistrosPage.tsx`** — adicionar branch para renderizar `ObservacaoAulaGpaForm` ao clicar em Gerenciar/Visualizar.
- **`src/pages/admin/MatrizAcoesPage.tsx`** — automático via `ACAO_TIPOS`/`ACAO_TYPE_INFO`; verificar que aparece na matriz.
- **`src/pages/admin/FormFieldConfigPage.tsx`** — registrar `observacao_aula_gpa` na lista de form_keys configuráveis (programas), reutilizando o controle de `form_config_settings`. Como o formulário é dedicado, **não** expor configuração de campos individuais (mesmo tratamento dos outros forms dedicados).
- **`src/components/print/AcaoPrintDialog.tsx` / `AcaoPrintForm.tsx`** — adicionar seção/condicional para impressão dedicada do GPA (cabeçalho institucional Parceiros+Bússola, identificação, 9 critérios com nota+evidência, encaminhamentos, síntese). Criar `src/components/print/ObservacaoAulaGpaPrintSection.tsx`.
- **`useAcoesByPrograma`** e listagens — automático via `form_config_settings.programas`.

---

### 5. Verificações

- Linter Supabase após migration (RLS + GRANTs).
- Smoke test em build mode: criar ação como N2/N3, gerenciar como N4.1/N5, imprimir, alterar disponibilidade por programa em Configurar Formulários.

---

### Fora de escopo (não solicitado)

- Métricas no Dashboard / relatórios consolidados específicos do GPA (pode ser próxima entrega).
- Sync com Notion / BigQuery do GPA (manter consistência depois, em pedido separado).
- Memória do projeto: criar arquivo `mem://features/action-types/observacao-aula-gpa` ao final.
