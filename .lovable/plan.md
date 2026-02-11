

## Corrigir fluxo de Acompanhamento de Formacao

### Problema 1: Acompanhamento de Formacao abrindo lista de presenca
No arquivo `AAPRegistrarAcaoPage.tsx`, o tipo `acompanhamento_formacoes` esta incluido em `PRESENCE_TYPES` (linha 86) e `HYBRID_TYPES` (linha 87), fazendo com que o dialog de registro mostre a lista de presenca + instrumento. Porem, conforme o documento de referencia, Acompanhamento de Formacoes nao requer lista de presenca -- deve exibir apenas seu formulario de instrumento (6 campos).

### Problema 2: Campos Data/Inicio/Fim nao pre-preenchidos
No `ProgramacaoPage.tsx`, ao marcar o checkbox "Agendar Acompanhamento de Formacao" no dialog de gerenciamento de uma Formacao concluida, os campos Data, Inicio e Fim ficam vazios. O usuario espera que eles venham pre-preenchidos com os mesmos valores da formacao de origem.

### Solucao

**Arquivo: `src/pages/aap/AAPRegistrarAcaoPage.tsx`**

1. Remover `acompanhamento_formacoes` de `PRESENCE_TYPES` (linha 86): ficara apenas `['formacao', 'lista_presenca']`
2. Remover `HYBRID_TYPES` (linha 87) completamente, ja que nao tera mais nenhum tipo hibrido
3. Remover toda logica que referencia `HYBRID_TYPES` / `isHybridType` (por volta das linhas 233, 443-460)
4. `acompanhamento_formacoes` ja esta em `INSTRUMENT_TYPE_SET` (via `INSTRUMENT_FORM_TYPES`), entao passara a ser tratado como tipo de instrumento puro -- exibindo apenas o formulario de instrumento com 6 campos, sem lista de presenca

**Arquivo: `src/pages/admin/ProgramacaoPage.tsx`**

1. Quando o checkbox "Agendar Acompanhamento" for ativado, pre-preencher automaticamente:
   - `acompanhamentoData` com `selectedProgramacao.data`
   - `acompanhamentoHorarioInicio` com `selectedProgramacao.horario_inicio`
   - `acompanhamentoHorarioFim` com `selectedProgramacao.horario_fim`

### Detalhes tecnicos

**AAPRegistrarAcaoPage.tsx - Mudancas:**

```text
// Linha 86: Remover acompanhamento_formacoes
const PRESENCE_TYPES = new Set(['formacao', 'lista_presenca']);

// Linha 87: Remover HYBRID_TYPES
// (deletar linha)

// Linha 233: Remover isHybridType
// (deletar linha)

// Linhas ~443-460: Remover bloco de salvamento hibrido
// (remover o if (isHybridType && normalizedTipo) {...})
```

**ProgramacaoPage.tsx - Mudanca no checkbox de agendar acompanhamento (~linha 2153-2154):**

```text
onCheckedChange={(checked) => {
  setAgendarAcompanhamento(checked as boolean);
  if (checked && selectedProgramacao) {
    setAcompanhamentoData(selectedProgramacao.data);
    setAcompanhamentoHorarioInicio(selectedProgramacao.horario_inicio || '');
    setAcompanhamentoHorarioFim(selectedProgramacao.horario_fim || '');
  }
}}
```

### Resultado esperado

- Acompanhamento de Formacao: abrira apenas o formulario de instrumento (6 campos de texto), sem lista de presenca
- Ao agendar acompanhamento a partir de uma formacao concluida, Data/Inicio/Fim virao pre-preenchidos com os valores da formacao original (editaveis)
