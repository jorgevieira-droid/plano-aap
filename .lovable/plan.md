# Fix: erro ao criar Visita Técnica — T@RL

## Causa
Os check constraints `programacoes_tipo_check` e `registros_acao_tipo_check` listam explicitamente todos os tipos permitidos e **não incluem** `'visita_tecnica_tarl'`. A migração anterior do T@RL não atualizou essas constraints, por isso o INSERT falha com `violates check constraint "programacoes_tipo_check"`.

## Correção
Migração única que:

1. `ALTER TABLE public.programacoes DROP CONSTRAINT programacoes_tipo_check;`
2. Recria a constraint com a lista atual **+ `'visita_tecnica_tarl'`**.
3. Mesmo procedimento em `public.registros_acao` (`registros_acao_tipo_check`), para garantir que o registro também possa ser criado a partir da programação.

Sem alterações de frontend — o form e o routing já estão prontos. Apenas a constraint precisa aceitar o novo tipo.

## Out of scope
- Não mexer em RLS, GRANTs, ou outras colunas.
- Não alterar o enum `tipo_acao` (as colunas usam `text` + CHECK, não o enum).
