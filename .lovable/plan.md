

# Formadores do programa não aparecem no filtro — problema de RLS

## Diagnóstico

O problema é causado pelas políticas de segurança (RLS) do banco de dados. Um usuário N5 (Formador) só consegue ver os dados (`user_roles`, `user_programas`, `aap_programas`) de outros usuários que compartilham a mesma **entidade** (escola). Formadores do mesmo programa mas vinculados a entidades diferentes ficam invisíveis.

Por isso, apenas "Formador Regionais Teste" aparece — provavelmente é o único que compartilha uma entidade com o usuário logado.

## Solução

Adicionar políticas RLS que permitam usuários operacionais (N4/N5) ver os registros de outros usuários que compartilham o mesmo **programa** (não apenas entidade).

### Migração SQL

Três novas políticas SELECT:

```sql
-- 1. user_roles: operacionais podem ver roles de usuários do mesmo programa
CREATE POLICY "N4N5 Operational view roles same programs"
  ON public.user_roles FOR SELECT
  USING (is_operational(auth.uid()) AND shares_programa(auth.uid(), user_id));

-- 2. user_programas: operacionais podem ver programas de usuários do mesmo programa
CREATE POLICY "Operational view programas same programs"
  ON public.user_programas FOR SELECT
  USING (is_operational(auth.uid()) AND shares_programa(auth.uid(), user_id));

-- 3. aap_programas: operacionais podem ver programas de usuários do mesmo programa
CREATE POLICY "Operational view aap_programas same programs"
  ON public.aap_programas FOR SELECT
  USING (is_operational(auth.uid()) AND shares_programa(auth.uid(), aap_user_id));
```

### Nenhuma alteração de código necessária

A lógica do frontend já está correta — o problema é que os dados não chegam ao cliente por causa das restrições de acesso no banco.

| Recurso | Alteração |
|---|---|
| Migração SQL | 3 novas políticas RLS para visibilidade por programa |

