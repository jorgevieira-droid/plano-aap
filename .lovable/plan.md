

## Adicionar Visualizacao de Formularios na Matriz de Acoes

### Resumo
Adicionar um botao "Visualizar Formulario" em cada linha da tabela da Matriz de Acoes. Ao clicar, abre um Dialog exibindo o formulario do instrumento correspondente em modo somente leitura (em branco), permitindo ver a estrutura completa de cada instrumento pedagogico. Isso facilitara a captura de screenshots para o manual do usuario.

### O que sera feito

**1. Atualizar `src/pages/admin/MatrizAcoesPage.tsx`**

- Adicionar uma nova coluna "Formulario" na tabela
- Para cada tipo de acao que possui instrumento configurado (os 13 tipos listados em `INSTRUMENT_FORM_TYPES`), exibir um botao com icone `Eye` ("Visualizar")
- Ao clicar, abrir um `Dialog` com:
  - Titulo com o nome do instrumento
  - O componente `InstrumentForm` ja existente, renderizando todos os campos em branco, em modo `readOnly`
  - Botao "Fechar"
- Para tipos que nao possuem instrumento (ex: `lista_presenca`), o botao ficara desabilitado ou ausente

**2. Componentes reutilizados**

- `InstrumentForm` de `@/components/instruments/InstrumentForm` -- ja suporta `readOnly` e renderiza todos os campos baseado no `formType`
- `Dialog` de `@/components/ui/dialog`

### Detalhes tecnicos

- Um estado `previewFormType` controlara qual tipo de formulario esta aberto no Dialog (ou `null` se fechado)
- O mapeamento entre `AcaoTipo` e `formType` usara o `normalizeAcaoTipo` existente e verificara se o tipo esta em `INSTRUMENT_FORM_TYPES`
- O `InstrumentForm` buscara os campos do banco automaticamente via `useInstrumentFields`
- Respostas serao um objeto vazio `{}` (formulario em branco)
- Nenhuma alteracao no banco de dados e necessaria

