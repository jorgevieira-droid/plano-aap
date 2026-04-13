

# Rastreamento de Acessos e Relatório de Uso

## Visão Geral

Criar uma tabela de log de acessos no banco, registrar cada login do usuário, exibir contagem de acessos e último acesso na página de Usuários, e criar uma nova página de Relatório de Acessos com filtro por programa (enviável por email a N2/N3).

## Alterações

### 1. Nova tabela `user_access_log` (migration)

```sql
CREATE TABLE public.user_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  accessed_at timestamptz NOT NULL DEFAULT now(),
  ip_address text
);

ALTER TABLE public.user_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage access_log" ON public.user_access_log
  FOR ALL TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Managers view access_log" ON public.user_access_log
  FOR SELECT TO authenticated
  USING (is_manager(auth.uid()));

CREATE POLICY "Users insert own access" ON public.user_access_log
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_user_access_log_user_id ON public.user_access_log (user_id);
CREATE INDEX idx_user_access_log_accessed_at ON public.user_access_log (accessed_at DESC);
```

### 2. Registrar acesso no login (`src/contexts/AuthContext.tsx`)

No handler de `onAuthStateChange`, quando o evento for `SIGNED_IN`, inserir um registro em `user_access_log`.

### 3. Exibir dados na página de Usuários (`src/pages/admin/UsuariosPage.tsx`)

- No `fetchUsers`, buscar de `user_access_log` agregado: contagem de acessos e último acesso por `user_id`.
- Adicionar campos `accessCount` e `lastAccess` ao `UserWithRole`.
- Adicionar colunas "Acessos" e "Último Acesso" à tabela de listagem.

### 4. Nova página de Relatório de Acessos (`src/pages/admin/RelatorioAcessosPage.tsx`)

- Filtros: programa (multi-select), período (data início/fim).
- Tabela: Nome, Email, Papel, Programas, Qtd Acessos, Último Acesso.
- Botão "Exportar CSV" para download.
- Botão "Enviar por Email" que usa edge function para enviar relatório filtrado aos N2/N3 do programa selecionado.

### 5. Rota e menu

- `src/App.tsx`: adicionar rota `/relatorio-acessos`.
- `src/components/layout/Sidebar.tsx`: adicionar link no menu administrativo.

### 6. Edge function para envio de email (opcional, fase 2)

Usar a edge function existente de email (Resend) para enviar o relatório consolidado.

| Arquivo | Alteração |
|---|---|
| Nova migration SQL | Tabela `user_access_log` com RLS e índices |
| `src/contexts/AuthContext.tsx` | Inserir log de acesso no `SIGNED_IN` |
| `src/pages/admin/UsuariosPage.tsx` | Buscar e exibir contagem/último acesso |
| `src/pages/admin/RelatorioAcessosPage.tsx` (novo) | Página de relatório com filtros e export |
| `src/App.tsx` | Nova rota |
| `src/components/layout/Sidebar.tsx` | Link no menu |

