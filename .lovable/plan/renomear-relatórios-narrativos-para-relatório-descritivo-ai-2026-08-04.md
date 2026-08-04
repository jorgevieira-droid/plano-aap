# Renomear "Relatórios Narrativos" para "Relatório Descritivo (AI)"

## O que muda

1. **Menu lateral**: o item passa a se chamar "Relatório Descritivo (AI)" e sobe para logo abaixo dos itens Dashboard / Painel / Meu Painel, dentro do grupo "Ferramentas de Gestão" (antes de Programação).
2. **Título da página**: o cabeçalho da página passa a exibir "Relatório Descritivo (AI)".
3. **Manual do Usuário**: a seção correspondente é renomeada e reposicionada na mesma ordem do menu.

Sem mudança de rota (`/relatorios-narrativos` continua igual), sem mudança de permissões nem de lógica de geração.

## Detalhes técnicos

- `src/components/layout/Sidebar.tsx`: mover o item de `/relatorios-narrativos` em `MASTER_GROUPS` para depois dos três itens de Dashboard e alterar o `label`.
- `src/pages/admin/RelatoriosNarrativosPage.tsx` (linha 287): novo texto do `<h1>`.
- `src/pages/admin/ManualUsuarioPage.tsx`: ajustar o `title` da seção `relNarrativos` e sua posição na lista de seções (mantendo a numeração contínua).
- Menções ao "Custo de Relatórios Narrativos" em `RelatorioAcessosPage.tsx` também são atualizadas para o novo nome, por consistência.
