

# Três ajustes: menu "Registrar Ação", campos em branco no PDF, e preview de impressão

## Resumo

1. Remover "Registrar Ação" do menu lateral para todos exceto N1 (admin)
2. Adicionar campos em branco (Usuário, Entidade, Data, Hora, Programa) no cabeçalho do PDF gerado na Matriz de Ações
3. Substituir o download direto do PDF por uma janela de visualização de impressão (window.print)

## Alterações

### 1. `src/components/layout/Sidebar.tsx` — Remover "Registrar Ação" para N2-N8

O item `{ icon: FileText, label: 'Registrar Ação', path: '/aap/registrar' }` existe em `operationalMenuItems` (linha 76). Removê-lo desse array. O item já não existe nos menus `manager`, `local` e `observer`. Ele permanece acessível apenas para N1 via `adminMenuItems` (que não possui esse item atualmente, então verificar se precisa ser adicionado ou se N1 usa outra rota).

**Ação:** Remover a linha 76 de `operationalMenuItems`.

### 2. `src/pages/admin/MatrizAcoesPage.tsx` — Campos em branco no PDF

Na função `handlePrintBlankForm`, após o header (logos + título) e antes do conteúdo do formulário, adicionar campos com linhas em branco:

```
Usuário: ___________________________    Data: ____/____/________
Entidade: __________________________    Hora: ____:____
Programa: __________________________
```

Usar `pdf.text()` e `pdf.line()` para desenhar esses campos entre a linha separadora (linha 190) e o conteúdo do formulário (linha 192), ajustando o `startY` para acomodar o espaço extra (~25mm).

### 3. `src/pages/admin/MatrizAcoesPage.tsx` — Janela de visualização de impressão

Em vez de `pdf.save(...)` (linha 233), usar `pdf.output('bloburl')` para obter uma URL e abrir em nova janela com `window.open()`. Isso permite ao usuário visualizar o PDF e usar Ctrl+P ou o botão de impressão do navegador.

Alternativamente, abrir o blob URL em uma nova aba que automaticamente aciona `window.print()`.

**Código:**
```typescript
const blobUrl = pdf.output('bloburl');
const printWindow = window.open(blobUrl, '_blank');
if (printWindow) {
  printWindow.addEventListener('load', () => {
    printWindow.print();
  });
}
```

### Detalhes técnicos

- **Sidebar:** Apenas remover 1 linha do array `operationalMenuItems`
- **PDF campos:** Inserir ~15 linhas de código `pdf.text` / `pdf.line` entre as linhas 190-192 do MatrizAcoesPage
- **Print preview:** Substituir `pdf.save()` por `window.open(pdf.output('bloburl'))` com auto-print

