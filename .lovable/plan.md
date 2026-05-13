## Problema

Para N2 (Gestor) e N3 (Coordenador) — tier `manager` — os menus "Visualização Consultoria" e "Visualização Apoio Presencial" aparecem no sidebar e apontam para `/visualizacao-consultoria` e `/visualizacao-apoio-presencial`, mas o guard em `src/components/layout/AppLayout.tsx` (`ALLOWED_ROUTES.manager`) não inclui essas rotas. Resultado: o `<Navigate>` redireciona para `/dashboard`. Para N1 (admin) funciona porque `ALLOWED_ROUTES.admin = []` (sem restrição).

## Mudança

Em `src/components/layout/AppLayout.tsx`, adicionar `'/visualizacao-consultoria'` e `'/visualizacao-apoio-presencial'` à lista `manager` em `ALLOWED_ROUTES`.

Sem outras alterações — as rotas já existem em `App.tsx` e os itens já estão no sidebar `managerMenuItems`. As páginas já aplicam seus próprios filtros por programa/hierarquia.
