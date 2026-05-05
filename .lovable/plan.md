# Desabilitar tradução automática do navegador

## Problema
O tradutor automático do Google Chrome (e similares de outros navegadores) está reescrevendo textos da interface em tempo real. Quando o React tenta atualizar nós de texto que foram substituídos pelo tradutor, ocorre um erro clássico (`NotFoundError: Failed to execute 'removeChild' on 'Node'`) e partes da aplicação param de funcionar — botões somem, formulários travam, listas quebram.

## Solução
Sinalizar para o navegador que a aplicação **não deve ser traduzida automaticamente**. Isso é feito por meio de meta tags e atributos padronizados que Chrome, Edge, Safari e Firefox respeitam.

### Alterações em `index.html`

1. Adicionar no `<head>`:
   - `<meta name="google" content="notranslate" />` — instrui o Google Translate a ignorar a página.
   - Idioma do `<html>` ajustado de `en` para `pt-BR`, refletindo o idioma real do conteúdo (evita que o navegador detecte como inglês e ofereça tradução).

2. Adicionar no `<body>` (e/ou no `<html>`):
   - Atributo `translate="no"` e classe `notranslate` — bloqueia a tradução de toda a árvore DOM da aplicação.

### Resultado esperado
- A barra de "Traduzir esta página" do Chrome deixa de aparecer para a aplicação.
- Caso o usuário acione tradução manualmente em uma extensão, o `translate="no"` ainda é respeitado pela maioria dos engines.
- Erros de runtime causados pela substituição de nós de texto desaparecem.

## Detalhes técnicos
Mudanças apenas em `index.html`:
- `<html lang="en">` → `<html lang="pt-BR" translate="no">`
- Adicionar dentro de `<head>`: `<meta name="google" content="notranslate" />`
- `<body>` → `<body class="notranslate" translate="no">`

Sem mudanças em código React, sem migrações, sem impacto em outras funcionalidades.

## Comunicação ao usuário
Recomendar que usuários afetados:
1. Recarreguem a página após o deploy.
2. Se ainda virem o popup de tradução, cliquem em "Nunca traduzir este site" no Chrome.
