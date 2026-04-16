

# Botão "Imprimir em Branco" na Matriz de Ações

## Resumo

Adicionar um botão "Imprimir PDF" ao lado do botão "Visualizar" na coluna "Formulário" da Matriz de Ações. Ao clicar, gera um PDF com o formulário completo em branco (campos vazios) usando `jsPDF` + `html2canvas`, renderizando o mesmo componente de preview já existente em um container temporário off-screen.

## Alterações

### 1. `src/pages/admin/MatrizAcoesPage.tsx`

- Importar `Printer` do lucide-react e `jsPDF` / `html2canvas`
- Adicionar função `handlePrintBlankForm(formType, label)` que:
  1. Cria um `div` temporário off-screen
  2. Renderiza o componente do formulário (InstrumentForm, RedesFormPreview, ou ConsultoriaPedagogicaForm) via `createRoot`
  3. Usa `html2canvas` para capturar
  4. Gera PDF A4 com header institucional (logos Parceiros + Bússola) e título do formulário
  5. Remove o container temporário
- Adicionar botão `Printer` icon ao lado do botão "Visualizar" na coluna Formulário, para cada ação que tenha formulário
- Estado de loading individual por tipo durante a geração

### Resultado esperado

Cada linha da tabela que possui formulário terá dois botões na coluna "Formulário": "Visualizar" (existente) e um ícone de impressora que gera o PDF em branco.

