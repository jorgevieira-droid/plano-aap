

# Incluir cargo 'PEC' na planilha modelo de subida em lote

## Problema

O cargo 'PEC' foi adicionado ao sistema mas não está presente na planilha modelo de importação em lote de Atores Educacionais. Falta em dois lugares:

1. **cargoMap** (linha ~530): não reconhece 'pec' ao importar a planilha.
2. **Valores Válidos** (linha ~734): não lista 'pec' como opção válida na aba de referência.

## Alterações

### `src/pages/admin/ProfessoresPage.tsx`

1. **cargoMap** (~linha 540): adicionar `'pec': 'pec'` ao mapa de parsing.
2. **valoresValidos** (~linha 734): adicionar `{ Campo: 'Cargo', Valor: 'pec', Descrição: 'PEC' }` após a entrada de `equipe_tecnica_sme`.

| Arquivo | Alteração |
|---|---|
| `src/pages/admin/ProfessoresPage.tsx` | Adicionar `pec` no `cargoMap` e na aba de valores válidos do template |

