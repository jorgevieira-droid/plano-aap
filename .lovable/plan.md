
# Pre-selecao de Questoes no Acompanhamento de Aula

## Resumo

Adicionar uma etapa intermediaria (modal/step) entre clicar na programacao de Acompanhamento de Aula e abrir o formulario de avaliacao. Nesta etapa o respondente visualiza todas as questoes disponiveis (baseadas no `form_field_config` do seu perfil), seleciona quais deseja responder (respeitando obrigatorias e minimo de 3 opcionais), e so entao avanca para o formulario filtrado.

## Fluxo UX

```text
Seleciona Programacao (Acompanhamento de Aula)
       |
       v
  [NOVO] Modal "Selecao de Questoes"
  - Questoes obrigatorias: pre-marcadas, bloqueadas
  - Questoes opcionais: desmarcadas por padrao
  - Validacao: obrigatorias + >= 3 opcionais
  - Botao "Iniciar Acompanhamento" (habilitado quando valido)
       |
       v
  Modal "Acompanhamento de Aula" (existente)
  - Mostra APENAS as questoes selecionadas
  - Fluxo normal de avaliacao
       |
       v
  Salva registro + questoes_selecionadas em JSONB
```

## Modelo de Dados

### 1. Nova coluna em `avaliacoes_aula`

Adicionar coluna JSONB para persistir a selecao:

- `questoes_selecionadas` (jsonb, nullable): array de objetos `{ field_key, obrigatoria }` representando as questoes escolhidas e seu status no momento do preenchimento.

Exemplo de valor:
```json
[
  {"field_key": "clareza_objetivos", "obrigatoria": true},
  {"field_key": "dominio_conteudo", "obrigatoria": true},
  {"field_key": "engajamento_turma", "obrigatoria": false},
  {"field_key": "gestao_tempo", "obrigatoria": false},
  {"field_key": "observacoes_professor", "obrigatoria": false}
]
```

### 2. Configuracao Admin: minimo de opcionais

Adicionar na tabela `form_field_config` ou criar uma tabela auxiliar simples `form_config_settings`:

- `form_key` (text, PK)
- `min_optional_questions` (integer, default 3)
- `updated_at`, `updated_by`

Alternativamente, reutilizar a tabela existente com um registro especial (field_key = '_settings'). A abordagem mais limpa e uma tabela separada.

## Etapas de Implementacao

### 1. Migracao de Banco

- Adicionar coluna `questoes_selecionadas` (jsonb, nullable) em `avaliacoes_aula`
- Criar tabela `form_config_settings` com `form_key` (PK), `min_optional_questions` (int default 3), `updated_at`, `updated_by`
- Seed: inserir `('observacao_aula', 3, now(), null)`
- RLS: SELECT para autenticados, ALL para admin
- Atualizar o trigger `validate_avaliacao_fields` para tambem validar:
  - Que todas as questoes marcadas como `required` no `form_field_config` estejam nas `questoes_selecionadas`
  - Que haja >= `min_optional_questions` questoes opcionais selecionadas
  - Resetar para default (3) os campos de rating que NAO estao nas questoes selecionadas

### 2. Hook: atualizar `useFormFieldConfig`

- Adicionar fetch de `form_config_settings` para obter `min_optional_questions`
- Exportar `minOptionalQuestions` no retorno do hook
- Adicionar helper `getRequiredFields()` e `getOptionalFields()` que retornam arrays filtrados

### 3. Componente: `QuestionSelectionStep`

Criar componente reutilizavel (dentro de `src/components/` ou inline no page):

- Recebe: lista de campos habilitados (do `form_field_config`), minimo de opcionais
- Exibe: lista de checkboxes agrupadas (Obrigatorias / Opcionais)
- Campos obrigatorios: checkbox marcado + desabilitado + badge "Obrigatoria"
- Campos opcionais: checkbox desmarcado + badge "Opcional"
- Contador: "X de Y opcionais selecionadas (minimo: 3)"
- Mensagem de validacao vermelha se < 3 opcionais
- Botao "Iniciar Acompanhamento" desabilitado ate validacao ok

### 4. Atualizar `AAPRegistrarAcaoPage.tsx`

- Adicionar estado `questionSelectionStep: boolean` (true quando modal de selecao esta aberto)
- Adicionar estado `selectedQuestions: string[]` (field_keys selecionadas)
- Ao clicar em programacao de Acompanhamento de Aula:
  - Abrir modal de selecao (em vez de ir direto ao formulario)
  - Pre-selecionar campos obrigatorios
- Ao confirmar selecao:
  - Fechar modal de selecao
  - Abrir modal de avaliacao existente
  - Filtrar `dimensoesAvaliacao` e campos de texto por `selectedQuestions`
- No `handleSubmit`:
  - Incluir `questoes_selecionadas` no insert de `avaliacoes_aula`
  - Montar array JSONB com `{ field_key, obrigatoria }` para cada questao selecionada

### 5. Tela Admin: configurar minimo de opcionais

Atualizar `FormFieldConfigPage.tsx`:
- Adicionar campo numerico "Minimo de questoes opcionais" acima da matriz
- Ao salvar, fazer upsert em `form_config_settings`
- Buscar valor atual via query ao carregar

### 6. Trigger Backend (atualizacao)

Atualizar `validate_avaliacao_fields`:
- Ler `questoes_selecionadas` do NEW record
- Verificar que todos os campos `required` do perfil estao incluidos
- Contar questoes opcionais e validar >= `min_optional_questions`
- Para campos NAO selecionados, resetar para default (3 para rating, null para texto)
- Se validacao falhar, RAISE EXCEPTION com mensagem clara

## Detalhes Tecnicos

### Estado no AAPRegistrarAcaoPage

```typescript
const [showQuestionSelection, setShowQuestionSelection] = useState(false);
const [selectedQuestionKeys, setSelectedQuestionKeys] = useState<string[]>([]);
```

### Fluxo ao selecionar programacao de Acompanhamento

```typescript
const handleSelectProgramacao = (prog) => {
  // ... existing setup ...
  if (prog.tipo === 'acompanhamento_aula' || prog.tipo === 'observacao_aula') {
    // Abrir etapa de selecao ao inves do formulario direto
    setShowQuestionSelection(true);
    // Pre-selecionar questoes obrigatorias
    const requiredKeys = OBSERVACAO_AULA_FIELDS
      .filter(f => isFieldEnabled(f.key) && isFieldRequired(f.key))
      .map(f => f.key);
    setSelectedQuestionKeys(requiredKeys);
  }
};
```

### Validacao no componente de selecao

```typescript
const enabledFields = OBSERVACAO_AULA_FIELDS.filter(f => isFieldEnabled(f.key));
const requiredFields = enabledFields.filter(f => isFieldRequired(f.key));
const optionalFields = enabledFields.filter(f => !isFieldRequired(f.key));
const selectedOptionalCount = selectedQuestionKeys.filter(k => 
  optionalFields.some(f => f.key === k)
).length;
const isValid = selectedOptionalCount >= minOptionalQuestions;
```

### Payload ao salvar

```typescript
const questoesSelecionadas = selectedQuestionKeys.map(key => ({
  field_key: key,
  obrigatoria: isFieldRequired(key),
}));

// No insert de avaliacoes_aula:
{ ...avaliacaoData, questoes_selecionadas: questoesSelecionadas }
```

### Trigger SQL atualizado

```sql
-- Dentro de validate_avaliacao_fields, adicionar:
IF NEW.questoes_selecionadas IS NOT NULL THEN
  -- Verificar obrigatorias
  FOR field_cfg IN
    SELECT field_key FROM form_field_config
    WHERE form_key = 'observacao_aula' AND role = user_role 
      AND enabled = true AND required = true
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM jsonb_array_elements(NEW.questoes_selecionadas) elem
      WHERE elem->>'field_key' = field_cfg.field_key
    ) THEN
      RAISE EXCEPTION 'Questao obrigatoria % nao selecionada', field_cfg.field_key;
    END IF;
  END LOOP;
  
  -- Verificar minimo opcionais
  SELECT min_optional_questions INTO min_opt 
  FROM form_config_settings WHERE form_key = 'observacao_aula';
  
  SELECT count(*) INTO opt_count
  FROM jsonb_array_elements(NEW.questoes_selecionadas) elem
  WHERE (elem->>'obrigatoria')::boolean = false;
  
  IF opt_count < COALESCE(min_opt, 3) THEN
    RAISE EXCEPTION 'Minimo de % questoes opcionais exigido', COALESCE(min_opt, 3);
  END IF;
END IF;
```
