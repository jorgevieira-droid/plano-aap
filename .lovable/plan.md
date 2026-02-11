
## Corrigir Visualizacao de Formularios e Ocultar "Participa de Formacoes"

### Problema 1: Formularios sem botao "Visualizar"
Os tipos `obs_implantacao_programa` e `lista_presenca` nao aparecem na lista `INSTRUMENT_FORM_TYPES` (em `src/hooks/useInstrumentFields.ts`), que e usada pela funcao `getFormTypeForAcao` para determinar se o botao "Visualizar" deve aparecer. Por isso, a coluna Formulario mostra "—" em vez do botao.

**Solucao:** Adicionar ambos os tipos na lista `INSTRUMENT_FORM_TYPES`:
- `{ value: 'obs_implantacao_programa', label: 'Observacao - Implantacao do Programa (Por Escola)' }`
- `{ value: 'lista_presenca', label: 'Lista de Presenca (Formacao)' }`

**Arquivo:** `src/hooks/useInstrumentFields.ts`

### Problema 2: "Participa de Formacoes" visivel na tabela
Mesmo com todas as permissoes zeradas (NONE), a acao ainda aparece na tabela. Ela precisa ser completamente ocultada.

**Solucao:** Filtrar `participa_formacoes` do array `ACAO_TIPOS` na renderizacao da tabela em `MatrizAcoesPage.tsx`. Na linha onde se faz `ACAO_TIPOS.map(...)`, adicionar um `.filter()` para excluir esse tipo:

```
ACAO_TIPOS.filter(t => t !== 'participa_formacoes').map(...)
```

**Arquivo:** `src/pages/admin/MatrizAcoesPage.tsx` (linha 107)

### Resumo das alteracoes
| Arquivo | Alteracao |
|---|---|
| `src/hooks/useInstrumentFields.ts` | Adicionar 2 entries na lista INSTRUMENT_FORM_TYPES |
| `src/pages/admin/MatrizAcoesPage.tsx` | Filtrar `participa_formacoes` do loop da tabela |
