

## Corrigir Scrollbar no Dialog de Visualizacao de Formularios

### Problema
O Dialog de preview do formulario nao esta exibindo a barra de rolagem corretamente, cortando o conteudo dos formularios mais extensos. A `ScrollArea` esta presente mas precisa de ajustes de layout para funcionar.

### Solucao

Atualizar o `DialogContent` e `ScrollArea` em `src/pages/admin/MatrizAcoesPage.tsx` (linhas 149-164):

- Remover `max-h-[90vh]` do `DialogContent` e usar `h-[85vh]` para dar altura fixa ao dialog
- Usar `overflow-hidden` no `DialogContent` para que o scroll fique exclusivamente na `ScrollArea`
- Ajustar a `ScrollArea` para ocupar todo o espaco disponivel com `flex-1 min-h-0` (o `min-h-0` e essencial para que o flex shrink funcione e o scroll apareca)
- Remover o `style={{ maxHeight: '70vh' }}` inline da ScrollArea, deixando o flexbox controlar a altura

### Resultado esperado

O Dialog abrira com altura de 85vh, o cabecalho e rodape ficam fixos, e o conteudo do formulario tera uma barra de rolagem vertical visivel no lado direito, permitindo navegar por formularios extensos sem corte de conteudo.

