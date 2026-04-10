

# Adicionar 'pec' à constraint do banco de dados

## Problema

O erro `new row for relation "professores" violates check constraint "professores_cargo_check"` ocorre porque a constraint no banco de dados só permite 5 valores de cargo e não inclui `'pec'`.

## Alteração

### Migration SQL

Criar uma nova migration para atualizar a constraint:

```sql
ALTER TABLE public.professores DROP CONSTRAINT IF EXISTS professores_cargo_check;

ALTER TABLE public.professores ADD CONSTRAINT professores_cargo_check
  CHECK (cargo = ANY (ARRAY[
    'professor'::text,
    'coordenador'::text,
    'vice_diretor'::text,
    'diretor'::text,
    'equipe_tecnica_sme'::text,
    'pec'::text
  ]));
```

| Arquivo | Alteração |
|---|---|
| Nova migration SQL | Adicionar `'pec'` à constraint `professores_cargo_check` |

