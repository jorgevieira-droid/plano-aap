

# Corrigir UX de Scroll Horizontal em Tabelas Longas

## Problema

Quando a tabela tem muitas colunas (como Atores Educacionais), o `overflow-x-auto` no wrapper da tabela só mostra a scrollbar horizontal na parte inferior do container. Se a lista tem muitos registros, o usuário precisa rolar até o final da página para acessar a scrollbar — UX péssima.

## Solução

Aplicar `max-height` com `overflow-y-auto` no container da tabela (`DataTable`) para que o corpo da tabela faça scroll vertical internamente, mantendo a scrollbar horizontal sempre visível. O header da tabela ficará fixo (sticky) no topo.

### `src/components/ui/DataTable.tsx`

1. No wrapper `div.overflow-x-auto`, adicionar `max-h-[70vh] overflow-y-auto` para limitar a altura e habilitar scroll vertical interno
2. Tornar o `<thead>` sticky com `sticky top-0 z-10 bg-card` para que os cabeçalhos fiquem fixos enquanto o usuário rola verticalmente
3. Isso garante que a scrollbar horizontal fique sempre acessível (visível na viewport) sem precisar rolar até o final da lista

### Resultado esperado

- O container da tabela nunca ultrapassa ~70% da viewport em altura
- Headers ficam fixos no topo ao rolar verticalmente
- Scrollbar horizontal fica sempre visível na base do container (dentro da viewport)
- A paginação permanece fora do scroll, sempre visível abaixo da tabela

## Arquivo impactado

| Arquivo | Alteração |
|---|---|
| `src/components/ui/DataTable.tsx` | `max-h-[70vh] overflow-y-auto` no wrapper + `sticky top-0` no `thead` |

