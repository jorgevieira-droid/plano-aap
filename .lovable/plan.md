

# Sincronizar lista de ações entre Matriz e Configurar Formulários

## Problema

A ação **"Participa de Formações"** (`participa_formacoes`) aparece na Matriz de Ações mas não está disponível em Configurar Formulários.

Além disso, **"Engajamento e Solidez da Parceria"** (`engajamento_solidez`) existe em Configurar Formulários mas não tem correspondência na Matriz de Ações — pode ser um tipo legado ou erro.

## Alteração

### `src/hooks/useInstrumentFields.ts`
- Adicionar `{ value: 'participa_formacoes', label: 'Participa de Formações' }` ao array `INSTRUMENT_FORM_TYPES`.
- Remover `engajamento_solidez` caso não seja um tipo válido (ou manter se for usado como configuração de instrumento independente da Matriz).

## Arquivos impactados

| Arquivo | Alteração |
|---|---|
| `src/hooks/useInstrumentFields.ts` | Adicionar `participa_formacoes`, avaliar remoção de `engajamento_solidez` |

