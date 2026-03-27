

# Corrigir Scroll Horizontal nas Telas

## Problema

O container principal (`<main>` no `SidebarProvider`) usa `flex-1` sem `min-w-0`, o que permite que tabelas largas expandam além da viewport, gerando barra de rolagem horizontal na página inteira. O scroll horizontal deve existir apenas dentro das tabelas individualmente (já têm `overflow-x-auto`), não na página.

## Solução

### `src/components/layout/Sidebar.tsx`

Adicionar `min-w-0 overflow-x-hidden` ao `<main>` (linha 275-278) para que o flex item não exceda o espaço disponível:

```
flex-1 min-w-0 min-h-screen overflow-y-auto overflow-x-hidden transition-all ...
```

Isso garante que:
- Tabelas com muitas colunas fazem scroll horizontal **dentro do próprio container** (`overflow-x-auto` do `DataTable` e dos wrappers de tabela)
- A página nunca mostra barra de rolagem horizontal

### Arquivo impactado
| Arquivo | Alteração |
|---|---|
| `src/components/layout/Sidebar.tsx` | Adicionar `min-w-0 overflow-x-hidden` ao `<main>` |

