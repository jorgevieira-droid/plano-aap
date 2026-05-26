## Contexto
Atualmente, o item "Programação" (e variantes como "Meu Calendário" no perfil operacional) está dentro do bloco `sortByLabel(...)` em todas as definições de menu lateral. Isso faz com que ele seja ordenado alfabeticamente junto com os demais itens, em vez de ficar fixo logo abaixo de "Dashboard".

## Objetivo
Em todos os perfis de menu (`adminMenuItems`, `managerMenuItems`, `operationalMenuItems`, `localMenuItems`, `observerMenuItems`), remover o item de calendário/programação do array que é passado para `sortByLabel`, e inseri-lo manualmente como **2º item** (logo após o Dashboard / Meu Painel / Painel).

## Arquivo afetado
`src/components/layout/Sidebar.tsx`

## Detalhes técnicos

1. **adminMenuItems**
   - Remover `{ icon: Calendar, label: 'Programação', path: '/programacao' }` do array interno do `sortByLabel`
   - Adicionar como 2º item do array principal: `[Dashboard, Programação, ...sortByLabel([resto])]`

2. **managerMenuItems**
   - Mesmo procedimento com `{ icon: Calendar, label: 'Programação', path: '/programacao' }`

3. **operationalMenuItems**
   - Mesmo procedimento com `{ icon: Calendar, label: 'Meu Calendário', path: '/aap/calendario' }`

4. **localMenuItems**
   - Mesmo procedimento com `{ icon: Calendar, label: 'Programação', path: '/programacao' }`

5. **observerMenuItems**
   - Mesmo procedimento com `{ icon: Calendar, label: 'Programação', path: '/programacao' }`

## Ganhos / Perdas / Riscos
- **Ganhos**: Consistência visual conforme solicitado; item de programação sempre acessível em posição fixa.
- **Perdas**: Ordem alfabética pura é parcialmente quebrada para este item.
- **Riscos**: Nenhum — alteração puramente de layout/ordem, sem impacto em lógica de negócio.