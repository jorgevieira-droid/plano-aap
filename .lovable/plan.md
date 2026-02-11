

## Corrigir Fluxo: Formacao = Presenca / Acompanhamento = Instrumento

### Problema Atual

As ultimas alteracoes adicionaram o formulario de instrumento pedagogico de Formacao (8 campos) dentro do dialog de presenca da Formacao. O usuario nao deseja isso. O fluxo correto e:

- **Formacao**: o ator marca como realizada, informa a presenca dos professores, salva. O card aparece como "Realizada" e exibe o botao "Acompanhamento de Formacao".
- **Acompanhamento de Formacao**: o ator abre, marca como realizado, preenche APENAS o instrumento pedagogico (6 campos de texto), sem lista de presenca.

### Mudancas Necessarias

#### 1. `src/pages/admin/ProgramacaoPage.tsx`

**Remover o InstrumentForm do dialog de presenca (formacao)**

- Linhas ~2656-2669: Remover o bloco que renderiza `<InstrumentForm formType="formacao" .../>` dentro do dialog de presenca
- Linhas ~1125-1142: Remover a logica de salvar `instrument_responses` para `formacao` dentro de `handleSavePresencas`

**Resultado**: o dialog de presenca volta a ter apenas a lista de professores com checkboxes de presente/ausente, sem formulario de instrumento.

#### 2. `src/pages/aap/AAPRegistrarAcaoPage.tsx`

**Remover `formacao` do `INSTRUMENT_TYPE_SET` na logica de renderizacao**

- Linha 230: Ajustar `isInstrumentType` para excluir `formacao` explicitamente, ja que Formacao nao deve exibir formulario de instrumento na pagina de registro (apenas presenca)
- Linhas 442-456: Remover a logica de salvar `instrument_responses` dentro do bloco de presenca (hybrid type) que foi adicionada na ultima edicao

**Resultado**: ao registrar uma Formacao na AAPRegistrarAcaoPage, o ator ve apenas a lista de presenca. Ao registrar um Acompanhamento de Formacao, ve apenas o formulario de instrumento (6 campos).

### Resumo do Fluxo Final

```text
Formacao (realizada)
  -> Dialog de presenca (apenas checkboxes de professores)
  -> Salva presencas
  -> Card mostra "Realizada" com botao "Acompanhamento de Formacao"

Acompanhamento de Formacao (realizado)
  -> Dialog de instrumento (6 campos de texto)
  -> Salva instrument_responses
  -> Card mostra "Realizada"
```
