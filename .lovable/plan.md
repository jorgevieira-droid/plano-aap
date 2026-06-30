# Plano: Corrigir erro ao salvar papel da Irene + bug recorrente em "Atores dos Programas"

## Diagnóstico

A Irene tem **duas linhas** em `user_roles` (deveria ter no máximo uma por usuário):

| role | created_at |
|---|---|
| `gestor` (N2) | 26/01/2026 |
| `n3_coordenador_programa` (N3) | 12/03/2026 |

Isso explica os dois sintomas:

1. **"Erro ao salvar papel"** — `AtoresProgramaPage.tsx` (linha 213) faz `.from('user_roles').select('id').eq('user_id', ...).maybeSingle()`. Com 2 linhas, `maybeSingle()` retorna erro PGRST116 e `data: null`. O código cai no `else` e tenta `INSERT { user_id, role: 'gestor' }`, que viola a UNIQUE `(user_id, role)` (já existe linha `gestor`). O `await` joga, e o toast genérico aparece.

2. **Sidebar mostra "Professor"** — `get_user_role()` faz `SELECT role ... LIMIT 1` **sem `ORDER BY`**, então o Postgres devolve qualquer uma das duas linhas. A cada login pode mudar o papel efetivo da usuária. (O rótulo "Professor" que ela vê é o label `n7_professor`/cargo padrão exibido — mas mesmo se não fosse, a permissão dela oscilaria entre N2 e N3.)

A causa raiz é o **fluxo de gravação** em `AtoresProgramaPage`: ele não normaliza para "uma linha por usuário" — ao trocar um papel já existente, em vez de `DELETE` + `INSERT` (ou `UPSERT` com chave por `user_id`), ele tenta detectar via `maybeSingle()` e isso quebra sempre que há histórico duplicado.

## Correção

### 1. Limpeza do dado da Irene (one-off)

Manter apenas `gestor` (N2 — o que o usuário confirmou ser o correto) e remover `n3_coordenador_programa`:

```sql
DELETE FROM public.user_roles
WHERE user_id = '7706625a-6a5c-4d60-8565-42c37aaef941'
  AND role = 'n3_coordenador_programa';
```

### 2. Higienização preventiva — auditar duplicidades existentes

Listar e remover quaisquer outros usuários com mais de uma linha em `user_roles`, mantendo a mais recente:

```sql
-- auditoria
SELECT user_id, array_agg(role ORDER BY created_at) AS roles, COUNT(*) AS n
FROM public.user_roles GROUP BY user_id HAVING COUNT(*) > 1;

-- limpeza (mantém a mais recente)
DELETE FROM public.user_roles ur
USING (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) AS rn
  FROM public.user_roles
) sub
WHERE ur.id = sub.id AND sub.rn > 1;
```

Esse passo é feito pelo `insert` tool após a auditoria (mostra a lista antes de apagar, para o usuário confirmar quais ficam).

### 3. Tornar a página à prova de duplicidade

Em `src/pages/admin/AtoresProgramaPage.tsx` (linhas 209–219), substituir o trecho `maybeSingle → update/insert` por **`DELETE` + `INSERT`** dentro do mesmo `try`:

```ts
// Update role (single source of truth: 1 linha por usuário)
await supabase.from('user_roles').delete().eq('user_id', selectedUser.id);
if (formData.role !== 'none') {
  const { error } = await supabase
    .from('user_roles')
    .insert({ user_id: selectedUser.id, role: formData.role });
  if (error) throw error;
}
```

E propagar a mensagem real do backend no `catch` (mesmo padrão já usado no app):

```ts
toast.error(error?.message ?? 'Erro ao salvar papel');
```

### 4. Garantia adicional no banco — ordenar `get_user_role`

Migração para tornar `get_user_role` determinístico (defesa em profundidade, caso volte a haver duplicidade):

```sql
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY created_at DESC
  LIMIT 1
$$;
```

### 5. Validação

- Reabrir o diálogo "Atribuir Papel" da Irene → salvar como N2 → confirmar sucesso e que ela permanece com apenas 1 linha em `user_roles`.
- Pedir para ela reentrar no sistema → sidebar deve mostrar permissões de N2 (Gestor), e o menu correto.

## Fora do escopo

- O label "Professor" exibido sob o nome no sidebar pode vir de outro campo (ex.: `professores`). Depois que a role estiver correta, verificamos se ainda aparece esse rótulo e tratamos em ticket separado se for o caso.
- Não vamos adicionar UNIQUE `(user_id)` em `user_roles` agora — o schema permite múltiplos papéis por design futuro; o controle por DELETE+INSERT na UI já evita o problema sem mudar a estrutura.