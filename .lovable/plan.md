

# Relatório de Acessos disponivel para N1 a N5

## Visao Geral

Tornar a pagina "Relatorio de Acessos" acessivel aos perfis N1 (Admin), N2 (Gestor), N3 (Coordenador de Programa), N4 (CPED/GPI) e N5 (Formador), aplicando filtros automaticos por programa do usuario logado.

## Alteracoes

### 1. Menu lateral (`src/components/layout/Sidebar.tsx`)

- Adicionar `{ icon: BarChart3, label: 'Relatorio de Acessos', path: '/relatorio-acessos' }` aos arrays `managerMenuItems` e `operationalMenuItems`.

### 2. Filtro por programa do usuario (`src/pages/admin/RelatorioAcessosPage.tsx`)

- Remover a restricao `isAdmin` e usar `profile` e `roleTier` do `useAuth()`.
- Para N1 (admin): exibir todos os usuarios (sem filtro).
- Para N2/N3 (manager): filtrar usuarios que compartilham pelo menos um programa com o usuario logado.
- Para N4/N5 (operational): filtrar usuarios que compartilham pelo menos um programa com o usuario logado.
- Os selects de filtro de programa tambem devem ser restritos aos programas do usuario logado (exceto admin que ve todos).
- A RLS da tabela `user_access_log` ja permite leitura para managers (`is_manager`). Sera necessario adicionar uma policy para perfis operacionais (N4/N5) verem logs de usuarios que compartilham programa.

### 3. Migration: RLS para N4/N5 na `user_access_log`

```sql
CREATE POLICY "N4N5 Operational view access_log"
ON public.user_access_log
FOR SELECT TO authenticated
USING (
  is_operational(auth.uid()) AND
  shares_programa(auth.uid(), user_id)
);
```

Tambem adicionar policy para N3:
```sql
CREATE POLICY "N3 Coord view access_log"
ON public.user_access_log
FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'n3_coordenador_programa') AND
  shares_programa(auth.uid(), user_id)
);
```

### 4. Rota (`src/App.tsx`)

A rota ja existe e nao possui restricao de role, entao nao precisa de alteracao.

| Arquivo | Alteracao |
|---|---|
| `src/components/layout/Sidebar.tsx` | Adicionar link em `managerMenuItems` e `operationalMenuItems` |
| `src/pages/admin/RelatorioAcessosPage.tsx` | Filtrar dados por programas do usuario logado para N2-N5 |
| Nova migration SQL | Policies de leitura em `user_access_log` para N3, N4/N5 |

