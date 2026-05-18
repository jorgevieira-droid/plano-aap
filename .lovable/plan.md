## Objetivo

Disponibilizar o botão "Editar Agendamento" também para ações com status **Prevista** (hoje só aparece para Realizada), mantendo o mesmo comportamento: abrir o dialog de cadastro da ação via `handleOpenEditProgramacao`.

## Situação atual

Em `src/pages/admin/ProgramacaoPage.tsx`, na visão de calendário (linha ~4302-4313) e na tabela (linha ~4436-4447), a renderização atual é:

- `status !== "realizada"` → botão **Gerenciar** (abre formulário do instrumento).
- `status === "realizada"` → botão **Editar Agendamento** (abre cadastro da ação).

Ações com status `prevista` (e também `agendada`/`reagendada`, que são previstas no calendário) ficam sem acesso ao cadastro.

## Mudanças

### `src/pages/admin/ProgramacaoPage.tsx`

Em ambos os blocos (cartão do calendário ~4293-4313 e linha da tabela ~4427-4447):

1. Manter o botão **Gerenciar** apenas para status não realizada (como já está).
2. Alterar a condição do botão **Editar Agendamento** para aparecer sempre que `canEditProgramacao(event)` for verdadeiro, removendo a restrição `status === "realizada"`. Assim ele passa a aparecer também para ações Previstas / Agendadas / Reagendadas, além de Realizadas.

Resultado: ações previstas terão dois botões — **Gerenciar** (registrar o que aconteceu) e **Editar Agendamento** (ajustar data/escola/ator/programa do cadastro). Ações realizadas continuam exibindo apenas **Editar Agendamento**.

## Fora de escopo

- `RegistrosPage`: só lista ações já realizadas; o botão "Editar Agendamento" lá já funciona via deep-link e não precisa de ajuste.
- Permissões/RLS, formulário de cadastro em si, demais botões.
