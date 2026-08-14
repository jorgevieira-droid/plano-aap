# Corrigir acesso de gestores a "Entidades Filho"

## Problema

O menu "Entidades Filho" é exibido para perfis N1 (admin) e gestores/N2-N3 (`Sidebar.tsx:79`), e a própria página já permite admin, gestor e N3 (`EntidadesFilhoPage.tsx:229`). Porém a lista de rotas permitidas do layout (`ALLOWED_ROUTES.manager` em `src/components/layout/AppLayout.tsx`) não inclui `/entidades-filho`. Com isso, ao clicar no menu, o gestor é redirecionado para a rota padrão (dashboard ou visualização de apoio presencial).

## Correção

Adicionar `/entidades-filho` à lista de rotas permitidas do tier `manager` em `AppLayout.tsx`. Nenhuma outra mudança é necessária: o controle de permissão dentro da página já está correto e a rota já existe em `App.tsx`.

## Detalhes técnicos

- Arquivo: `src/components/layout/AppLayout.tsx`
- Alteração: incluir `'/entidades-filho'` no array `ALLOWED_ROUTES.manager` (junto de `/escolas` e `/professores`).
- Tiers `operational`, `local` e `observer` permanecem sem acesso, coerente com `allowedTiers` do menu.
