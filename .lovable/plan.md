

# Incluir Monitoramento de Ações Formativas na Configuração de Formulários

## Problema

O tipo `monitoramento_acoes_formativas` não está listado em `INSTRUMENT_FORM_TYPES` no arquivo `src/hooks/useInstrumentFields.ts`, por isso não aparece na página de Configuração de Formulários.

## Alteração

### `src/hooks/useInstrumentFields.ts`
- Adicionar `{ value: 'monitoramento_acoes_formativas', label: 'Monitoramento de Ações Formativas – Regionais' }` ao array `INSTRUMENT_FORM_TYPES`.
- Isso automaticamente faz o tipo aparecer tanto na Configuração de Formulários quanto em qualquer outra tela que usa essa lista.
- A lista já é ordenada alfabeticamente na `FormFieldConfigPage` via `sortedFormTypes`, então a ordenação será mantida.

## Arquivos impactados

| Arquivo | Alteração |
|---|---|
| `src/hooks/useInstrumentFields.ts` | Adicionar entrada no array `INSTRUMENT_FORM_TYPES` |

