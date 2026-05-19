## Objetivo
Liberar a página `/relatorio-instrumentos` para N2 (`gestor`) e N3 (`n3_coordenador_programa`) — incluindo quando Admin simula esses perfis — mantendo o escopo restrito ao(s) programa(s) do usuário. A regra de hierarquia para a lista de Atores permanece como hoje: qualquer ator com registros no programa selecionado.

## Diagnóstico
- `Sidebar.tsx` já lista o item em `managerMenuItems` (N2/N3) e em `adminMenuItems` — nada a alterar.
- `RelatorioInstrumentosPage.tsx` redireciona para `/unauthorized` durante simulação porque o guard interno checa `profile?.role` (papel real) em vez do papel efetivo:
  - Quando Admin simula N2/N3, `profile.role === 'admin'`, então `profile.role === 'gestor'` é falso e `isAdmin` (derivado de `effectiveRole`) também é falso → bloqueio indevido.
- O memo `userProgramas` usa `profile?.programas`, ignorando `simulatedPrograma`.

## Mudanças (apenas frontend)

### `src/pages/admin/RelatorioInstrumentosPage.tsx`
1. Trocar o guard de acesso por uma checagem baseada no papel efetivo do `useAuth`:
   - Consumir também `isManager` (e `effectiveProgramas`) do contexto.
   - `allowed = isManager` — isso já cobre `admin`, `gestor` e `n3_coordenador_programa` via `roleTier`, e respeita simulação.
2. Trocar a fonte de programas no memo `userProgramas`:
   - Admin sem simulação → todos os `PROGRAMAS`.
   - Demais (inclusive Admin simulando N2/N3) → `effectiveProgramas ?? []`.
3. Não mexer em nenhuma query, filtro de atores, RLS ou rota.

## Fora de escopo
- Não alterar Sidebar, App.tsx, RLS, edge functions ou regras de hierarquia de atores.
- Não criar nova lógica de "subordinados" — a lista de Atores continua mostrando todos os que tenham registros no programa selecionado, conforme escolhido.

## Validação manual
- Logado como Admin "real": vê os 3 programas, página carrega.
- Admin simulando N2 (`gestor`) com programa simulado X: página carrega; dropdown de Programa mostra somente X.
- Admin simulando N3 (`n3_coordenador_programa`): mesma coisa.
- Admin simulando N4/N5/N6/N7/N8: continua sendo redirecionado para `/unauthorized` (comportamento esperado, pois esses perfis não devem ver a página).
- N2/N3 reais (em produção): acessam normalmente, restritos aos seus `profile.programas`.
