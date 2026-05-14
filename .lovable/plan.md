# Filtrar N2/N3 por programa no seletor de Responsável

## Problema

No cadastro da ação **Monitoramento e Gestão** (e demais ações que usam o seletor de "Responsável"), os usuários N2 (Gestor) e N3 (Coordenador de Programa) aparecem na lista **independente do programa selecionado**. O comportamento esperado é: só aparecer N2/N3 que estejam vinculados ao programa da ação.

## Causa

Em `src/pages/admin/ProgramacaoPage.tsx` (filtro `filteredAaps`, linhas ~867-872), N2/N3 (e admin) recebem um bypass do filtro de programa:

```ts
const isManager = u.roles.some(r => ["admin","gestor","n3_coordenador_programa"].includes(r));
return isManager || u.programas.some(p => formData.programa.includes(p));
```

Além disso, os programas dos N2 (gestor) ficam em `gestor_programas`, que **não é carregada** no `fetch` de usuários — só `user_programas` e `aap_programas` são lidas. Para a maioria dos N2 isso já está espelhado em `user_programas`, mas para garantir consistência precisamos mesclar também a `gestor_programas`.

## Mudanças (apenas frontend)

**Arquivo:** `src/pages/admin/ProgramacaoPage.tsx`

1. **Carregar `gestor_programas`** no bloco de fetch (linhas ~667-675) e mesclar no array `programas` de cada usuário (linhas ~686-692), junto com `aap_programas` e `user_programas`.

2. **Remover o bypass de N2/N3** no filtro por programa do seletor de Responsável (linhas ~867-872): manter apenas `admin` com bypass (admins sempre podem). N2/N3 passam a ser filtrados pelo cruzamento de `u.programas` com `formData.programa`, igual aos N4/N5.

   ```ts
   // antes
   const isManager = u.roles.some(r => ["admin","gestor","n3_coordenador_programa"].includes(r));
   return isManager || u.programas.some(p => formData.programa.includes(p));

   // depois
   const isAdminUser = u.roles.includes("admin");
   return isAdminUser || u.programas.some(p => formData.programa.includes(p));
   ```

3. **Manter** o bypass de N2/N3 no filtro por entidade (linhas ~875-880), pois N2/N3 não têm vínculo de entidade — só de programa.

## Escopo

- Vale para todas as ações que usam `useResponsavelSelector: true`, incluindo Monitoramento e Gestão. Comportamento desejado e consistente entre elas.
- Sem mudanças em RLS, banco, ou em outros componentes.
