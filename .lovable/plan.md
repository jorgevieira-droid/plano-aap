# Liberar "Extração de Bases - Instrumentos" para N5 (Formador)

## O que muda para o usuário
- O N5 passa a ver o item **Extração de Bases - Instrumentos** no menu (grupo Admin) e consegue abrir a página.
- O filtro **Programa** mostra apenas o(s) programa(s) do próprio N5; com um só programa, ele já vem selecionado.
- Instrumentos, atores, entidades e linhas extraídas vêm somente desse programa.
- Os outros perfis operacionais (N4.1 CPed, N4.2 GPI) continuam sem acesso. N6, N7 e N8 também não mudam.

## Observação sobre o alcance dos dados
O banco continua aplicando as regras de acesso que já valem para o N5. Por isso, ele verá os registros do seu programa aos quais já tem acesso hoje (as próprias ações e as das entidades ligadas a ele), e não os de todos os formadores do programa. Se quiser que o N5 veja tudo do programa, isso exige outra mudança nas regras do banco, que pode ser feita depois.

## Detalhes técnicos
- `AppLayout.tsx`: incluir `'/extracao-bases-instrumentos'` em `ALLOWED_ROUTES.operational`.
- `Sidebar.tsx`: o item passa a ter `allowedTiers: ['admin','manager','operational']` e `allowedRoles` / filtro que o restringe a `n5_formador` dentro do tier operacional. Se esse campo ainda não existir, será adicionado ao item e ao filtro do menu.
- `ExtracaoBasesInstrumentosPage.tsx`: `allowed = isManager || isRealAdmin || hasRole('n5_formador')`. `userProgramas` já usa `effectiveProgramas` para quem não é admin, e todas as consultas usam `.contains('programa',[programa])`, então o filtro por programa já vale.
- Não há mudança no banco.

## Verificação
Simular N5 e conferir o menu, a abertura da página e a lista de programas. Simular N4.1 e conferir que a página segue bloqueada.
