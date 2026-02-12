

# Pagina "Atores dos Programas" com Visibilidade Hierarquica

## Resumo

Criar uma nova pagina `/atores` que exibe os usuarios do sistema de acordo com a hierarquia de niveis (N1-N8). Cada nivel ve apenas os usuarios abaixo do seu na hierarquia, filtrados por programa e entidade conforme suas permissoes. Apenas niveis superiores podem gerenciar (editar papel, redefinir senha).

---

## Regras de Visibilidade e Gestao

```text
Nivel   | Ve              | Filtra por             | Gerencia
--------|-----------------|------------------------|----------
N1      | Todos (N1-N8)   | Sem filtro             | Sim (todos)
N2      | N3 ate N8       | Seus programas         | Sim
N3      | N4 ate N8       | Seus programas         | Sim
N4      | N5 ate N8       | Programas + Entidades  | Sim
N5      | N6 ate N8       | Programas + Entidades  | Sim
N6      | N7 ate N8       | Programas + Entidades  | Nao
N7      | N7 ate N8       | Programas + Entidades  | Nao
N8      | N7 ate N8       | Programas + Entidades  | Nao
```

---

## Detalhes Tecnicos

### 1. Nova pagina: `src/pages/admin/AtoresProgramaPage.tsx`

**Dados carregados:**
- `profiles` (todos acessiveis via RLS)
- `user_roles` (para saber o nivel de cada usuario)
- `user_programas` (para filtrar por programa)
- `user_entidades` (para filtrar por entidade)
- `escolas` (para exibir nomes das entidades)

**Logica de filtragem (frontend):**
- Definir um mapa de "nivel numerico" por role: admin=1, gestor=2, n3=3, n4_1=4, n4_2=4, n5=5, n6=6, n7=7, n8=8
- Filtrar usuarios cujo nivel numerico >= nivel minimo visivel (conforme tabela acima)
- Para N2/N3: filtrar por intersecao de programas do usuario logado com programas do usuario listado
- Para N4-N8: filtrar por intersecao de programas E entidades

**Colunas da tabela:**
- Nome / Email
- Papel (com Badge colorido, reutilizando `getRoleTierColor` e `roleLabelsMap` do UsuariosPage)
- Programas vinculados
- Entidades vinculadas
- Acoes (condicional: so aparece se `canManage` for true)

**Acoes de gestao (para quem tem permissao):**
- Editar papel/programas/entidades (reutilizando o dialogo de role do UsuariosPage)
- Redefinir senha
- Os dialogos serao simplificados em relacao ao UsuariosPage (sem criacao/exclusao de usuario, apenas gestao de papel e senha)

**Filtros na pagina:**
- Busca por nome/email
- Filtro por papel (select com os roles visiveis)
- Filtro por programa (select com os programas do usuario logado, ou todos para N1)

### 2. Rota e navegacao

**App.tsx:** Adicionar rota `/atores` dentro do bloco `<AppLayout>`

**AppLayout.tsx:** Adicionar `/atores` nas rotas permitidas para todos os tiers (admin, manager, operational, local, observer)

**Sidebar.tsx:** Adicionar item "Atores dos Programas" (icone `Users`) nos menus de todos os perfis, posicionado proximo a "Gestao de Usuarios" (para admin) ou apos o dashboard (para demais)

### 3. Reutilizacao de codigo

Os seguintes elementos serao reutilizados do `UsuariosPage.tsx`:
- Constantes `ALL_ROLES`, `roleLabelsMap`, `tierColors`, `getRoleTierColor`
- Funcoes `needsProgramas`, `needsEntidades`
- Componentes de dialogo de papel e senha (extraidos ou duplicados de forma simplificada)
- Interface `UserWithRole`

Para evitar duplicacao excessiva, as constantes compartilhadas (`ALL_ROLES`, `roleLabelsMap`, `tierColors`, etc.) serao extraidas para um arquivo utilitario `src/config/roleConfig.ts`.

### 4. Novo arquivo: `src/config/roleConfig.ts`

Centraliza as constantes de roles que hoje estao duplicadas ou espalhadas:
- `ALL_ROLES` com value, label e tier
- `roleLabelsMap`
- `tierColors` e `getRoleTierColor`
- `ROLES_WITH_PROGRAMAS` e `ROLES_WITH_ENTIDADES`
- `needsProgramas()` e `needsEntidades()`
- Mapa de nivel numerico por role

### 5. Seguranca

- A filtragem de visibilidade e feita no frontend, mas os dados ja sao protegidos pelo RLS existente nas tabelas `profiles`, `user_roles`, `user_programas` e `user_entidades`
- Profiles: admins e managers veem todos; usuarios veem apenas o proprio
- User_roles: admins e managers veem todos; usuarios veem o proprio
- A pagina atual de "Gestao de Usuarios" (`/usuarios`) continua exclusiva para Admin (N1)
- A nova pagina `/atores` permite visualizacao para todos os niveis, mas acoes de gestao apenas para quem tem permissao

**Limitacao importante:** As politicas RLS atuais de `profiles` e `user_roles` permitem SELECT para admins, managers e o proprio usuario. Isso significa que perfis N4-N8 so conseguirao ver seus proprios dados via RLS. Para que a pagina funcione corretamente para esses niveis, sera necessario adicionar politicas RLS que permitam:
- Operacionais (N4/N5) verem profiles e user_roles dos usuarios vinculados as mesmas entidades
- Locais (N6/N7) e Observadores (N8) verem profiles e user_roles dos usuarios vinculados as mesmas entidades/programas

Novas politicas RLS necessarias na tabela `profiles`:
- "Operational users can view profiles of same entities" (SELECT para is_operational, filtrado por user_entidades em comum)
- "Local users can view profiles of same entities" (SELECT para is_local_user, filtrado por user_entidades em comum)
- "Observer users can view profiles of same programs" (SELECT para is_observer, filtrado por user_programas em comum)

Mesmas politicas equivalentes na tabela `user_roles`.

---

## Sequencia de Implementacao

1. Criar arquivo `src/config/roleConfig.ts` com constantes extraidas
2. Refatorar `UsuariosPage.tsx` para importar de `roleConfig.ts`
3. Criar novas politicas RLS para `profiles` e `user_roles` (permitir leitura hierarquica)
4. Criar pagina `AtoresProgramaPage.tsx` com tabela, filtros e dialogos de gestao
5. Adicionar rota `/atores` no `App.tsx`
6. Adicionar `/atores` nas rotas permitidas de todos os tiers no `AppLayout.tsx`
7. Adicionar item de menu "Atores dos Programas" no `Sidebar.tsx` para todos os perfis

