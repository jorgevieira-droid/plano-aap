# Desabilitar do menu lateral: "Relatório Descritivo (AI)" e "Relatórios Gerais"

Os dois itens estão hoje no grupo "Ferramentas de Gestão" do menu lateral:

- "Relatório Descritivo (AI)" → `/relatorios-narrativos`
- "Relatórios Gerais" → `/relatorios`

## O que será feito

- Mover os dois itens para o grupo "Desabilitados" (visível apenas para N1/admin, com selo "Desabilitada"), seguindo o mesmo padrão dos itens já desabilitados.
- Manter rotas e componentes intactos — nenhuma página deixa de existir, os acessos diretos por URL continuam funcionando.

## Detalhes técnicos

Em `src/components/layout/Sidebar.tsx`:

- Remover as entradas `Relatório Descritivo (AI)` e `Relatórios Gerais` do grupo "Ferramentas de Gestão" (`MASTER_GROUPS`).
- Adicioná-las ao array de itens do grupo "Desabilitados" com `disabled: true` (sem `allowedTiers`/`requiresAcao`), na mesma linha dos itens existentes como `Evolução Professor` e `Pontos Observados`.

Nenhuma alteração em `AppLayout.tsx`, rotas ou páginas — apenas o menu muda.
