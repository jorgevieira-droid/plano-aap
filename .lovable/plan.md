## Problema

N4‑N5 (Consultor Pedagógico, GPI, Formador) abrem `/professores` e não conseguem cadastrar Atores Educacionais para as suas escolas. A UI já habilita o botão "Novo" para `isAAP`, mas o select de Escola fica vazio em vários casos.

## Causa

Em `src/pages/admin/ProfessoresPage.tsx → fetchData`, quando `isAAP` é verdadeiro, o código filtra escolas e professores usando **`aap_escolas`** (vínculo legado). Porém a RLS de `professores` (INSERT/SELECT) e de `escolas` (SELECT N4‑N5) usa a tabela **`user_entidades`** (`user_has_entidade`). Hoje há 167 vínculos em `user_entidades` que não existem em `aap_escolas`, então:

- O dropdown de escola na criação fica vazio (filtro client-side por `aap_escolas`).
- Mesmo com escola escolhida, qualquer INSERT cairia se faltar `user_entidades` — mas a RLS é de fato a fonte de verdade aceita pelo backend.

## Mudança

Arquivo: `src/pages/admin/ProfessoresPage.tsx` (linhas ~174‑232, função `fetchData`)

1. Remover a busca em `aap_escolas` e o filtro client‑side por `userAapEscolasIds` para escolas e professores.
2. Confiar nas RLS já existentes:
   - `escolas`: políticas N4N5/N6N7/N8/N2N3/Admin já restringem o `SELECT` ao escopo correto.
   - `professores`: políticas Operational (N4‑N5) permitem `SELECT/INSERT/UPDATE/DELETE` quando `user_has_entidade(auth.uid(), escola_id)` é verdadeiro.
3. Manter `aapEscolasIds` populado a partir das escolas retornadas, para não quebrar referências no restante do componente.

Resultado: N4‑N5 enxergam todas as escolas onde têm vínculo via `user_entidades` e conseguem cadastrar atores educacionais para elas. N2/N3, Admin, N6‑N8 não são afetados (caem em outros ramos das mesmas RLS).

## Observações

- Sem alterações de schema ou RLS — o backend já está correto.
- `canManageProfessores` continua incluindo `isAAP`, então botões "Novo", "Editar", "Importar" continuam visíveis para N4‑N5.
- Usuários N4‑N5 que ainda não tenham nenhum vínculo em `user_entidades` continuarão sem escolas — isso é configuração de dados, fora do escopo desta correção.
