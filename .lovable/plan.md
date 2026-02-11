
## Reverter o swap de form_type entre Formacao e Acompanhamento de Formacoes

### Problema
O swap de dados realizado anteriormente estava ERRADO e inverteu os formularios. Os dados originais no banco estavam corretos:

- **formacao** deveria ter 8 campos (Tema, Objetivos, Conteudos, Metodologia, Engajamento, Evidencias, Pontos de Atencao, Proximos Passos) -- conforme o instrumento proprio da Formacao
- **acompanhamento_formacoes** deveria ter 6 campos (Objetivos, Metodologia, Engajamento, Evidencias, Pontos de Atencao, Proximos Passos) -- conforme descrito nas paginas 37-38 do documento

Apos o swap incorreto, os valores ficaram trocados. O documento de referencia confirma que "Acompanhamento - Formacoes" possui exatamente 6 campos (sem Tema e sem Conteudos).

### Solucao

Executar um novo swap para reverter o anterior, restaurando os dados originais corretos.

### Detalhes tecnicos

**Migracao SQL para reverter o swap:**

```text
-- Reverter swap em instrument_fields
UPDATE instrument_fields SET form_type = '_temp_formacao' WHERE form_type = 'formacao';
UPDATE instrument_fields SET form_type = 'formacao' WHERE form_type = 'acompanhamento_formacoes';
UPDATE instrument_fields SET form_type = 'acompanhamento_formacoes' WHERE form_type = '_temp_formacao';

-- Reverter swap em instrument_responses (se houver)
UPDATE instrument_responses SET form_type = '_temp_formacao' WHERE form_type = 'formacao';
UPDATE instrument_responses SET form_type = 'formacao' WHERE form_type = 'acompanhamento_formacoes';
UPDATE instrument_responses SET form_type = 'acompanhamento_formacoes' WHERE form_type = '_temp_formacao';

-- Reverter swap em form_field_config (se houver)
UPDATE form_field_config SET form_key = '_temp_formacao' WHERE form_key = 'formacao';
UPDATE form_field_config SET form_key = 'formacao' WHERE form_key = 'acompanhamento_formacoes';
UPDATE form_field_config SET form_key = 'acompanhamento_formacoes' WHERE form_key = '_temp_formacao';
```

**Nenhuma alteracao de codigo necessaria** -- o mapeamento 1:1 entre tipo de acao e form_type (em `getFormTypeForAcao` e `INSTRUMENT_FORM_TYPES`) esta correto. O problema esta exclusivamente nos dados.

### Resultado esperado

- **Formacao**: exibira formulario com 8 campos (Tema, Objetivos, Conteudos, Metodologia, Engajamento, Evidencias, Pontos de Atencao, Proximos Passos)
- **Acompanhamento Formacoes**: exibira formulario com 6 campos (Objetivos, Metodologia, Engajamento, Evidencias, Pontos de Atencao, Proximos Passos) -- conforme paginas 37-38 do documento
- Dados corretos tanto na Matriz de Acoes quanto no calendario
