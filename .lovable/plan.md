## Problema

Ao logar como ADM N1 e simular um usuário N2 do Programa Regionais, o cadastro de "Monitoramento de Ações Formativas (Regionais)" falha com toast:

> Permissão negada (simulação) — Programas do usuário: nenhum

## Causa

Em `src/pages/admin/ProgramacaoPage.tsx`, a função `guardOperation` envia `userProgramas: profile?.programas || []` para `checkSimulatedPermission`. Como o ADM real não possui `programas` cadastrados em `user_programas`, a checagem de escopo `programa` (N2/N3) acaba comparando `recordProgramas=['regionais']` contra `[]` e nega a operação.

O `AuthContext` já expõe `effectiveProgramas`, que durante a simulação retorna `[simulatedPrograma]` (ex.: `['regionais']`). Basta usá-lo como fonte de "programas do usuário" no guard.

## Mudança

**`src/pages/admin/ProgramacaoPage.tsx`**

- Importar `effectiveProgramas` do `useAuth()` (já consumido no arquivo).
- Em `guardOperation`, substituir:
  ```ts
  userProgramas: profile?.programas || [],
  ```
  por:
  ```ts
  userProgramas: (isSimulating ? (effectiveProgramas || []) : (profile?.programas || [])) as any,
  ```

Sem nenhuma outra alteração: o ADM real (não simulando) continua passando direto pela guarda (`isSimulating=false` → `allowed: true`); o ADM simulando N2 Regionais passa a ter `userProgramas=['regionais']`, satisfazendo o escopo `programa` para `monitoramento_acoes_formativas`.

## Fora de escopo

- Não altera `simulationGuard.ts`, RLS, permissões, fluxo de gerenciamento ou demais páginas.
