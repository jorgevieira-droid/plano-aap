## Contexto

O filtro "Entidade" em `src/pages/admin/ProgramacaoPage.tsx` (linha ~4528) usa `MultiSelectFilter` (`src/components/forms/MultiSelectFilter.tsx`), que em tese suporta seleção múltipla. Porém, na prática a marcação de mais de um item não persiste.

Duas causas prováveis (a serem confirmadas ao aplicar):

1. **Colisão de `value` no cmdk (mais provável):** cada `CommandItem` é montado com `value={opt.label}`. O cmdk usa esse `value` como chave interna (normalizado em minúsculas). Como as entidades REDES têm rótulos longos com prefixos muito parecidos (ex.: `181371 - Rede Municipal de ...`), qualquer duplicidade ou colisão normalizada faz o cmdk tratar dois itens como o mesmo — clicar em um novo alterna o anterior, dando a sensação de "single-select".
2. **Reset por cascata:** o `useEffect` em `ProgramacaoPage.tsx` (linhas 1109-1111) faz `setEntidadeFilters(prev => prev.filter(v => availableEntidadeIds.has(v)))`. Se `availableEntidadeIds` não contiver momentaneamente o item recém-selecionado (por dependência circular do `passesUiFilters`), a seleção é apagada.

## Mudanças

### 1) `src/components/forms/MultiSelectFilter.tsx`
- Trocar `value={opt.label}` por `value={opt.value}` no `CommandItem`, garantindo identificador único por opção.
- Manter a busca funcionando adicionando `keywords={[opt.label]}` no `CommandItem` para que a filtragem por texto continue casando pelo rótulo visível.

### 2) `src/pages/admin/ProgramacaoPage.tsx`
- No `useEffect` de reset (linhas 1109-1114), incluir salvaguarda para não apagar seleções enquanto `availableEntidadeIds` estiver vazio/carregando (mesmo padrão para `entidadeFilho`). Só filtra quando o conjunto disponível estiver populado.

## Validação
- Abrir Programação → Calendário, aplicar `Programa = Redes Municipais`, abrir o dropdown "Todas as Entidades" e marcar 2+ entidades — confirmar que ambas ficam com checkbox marcado e o rótulo do trigger mostra "N Entidades selecionados".
- Repetir com o filtro "Entidades Filho" para garantir que a mudança em `MultiSelectFilter` não regrediu outros filtros multi-select da mesma tela (Programa, Tipo, Formador, Consultor, GPI).
- Verificar que a busca dentro do popover continua filtrando pelo rótulo.

## Escopo
Somente ajuste do componente `MultiSelectFilter` e do efeito de cascata do filtro de entidade. Nenhuma alteração em regras de negócio, RLS, dashboards ou relatórios.