# Garantir o botão "Editar o cadastro da ação" para N4

## Diagnóstico (verificado no código)

O botão (ícone de calendário) em **Registros** aparece quando `canEdit(registro)` é verdadeiro e o registro tem `programacao_id`. Para N4.1 (CPed) e N4.2 (GPI):

- A matriz de permissões já permite edição (`CRUD_ENT`) na maioria dos tipos de ação.
- Mas `canEdit` em `RegistrosPage.tsx` exige que o registro seja **do próprio usuário** (`registro.aap_id === user.id`) para quem não é N1/N2/N3.

Ou seja: hoje o botão aparece para N4 **somente nos registros em que ele é o responsável (aap_id)**. Se o cadastro da ação foi criado por outra pessoa (ex.: N3 agendou para o CPed), ou se o `aap_id` do registro difere do usuário logado, o botão não aparece.

Na página de **Programação**, a regra é mais permissiva: `canEditProgramacao` aceita `aap_id === user.id` **ou** `created_by === user.id`. Há uma inconsistência entre as duas telas.

## O que será feito

1. **Alinhar a regra em Registros com a da Programação**: o botão "Editar o cadastro da ação" passa a aparecer para N4 também quando o usuário é o criador da programação vinculada (`created_by`), não apenas o responsável (`aap_id`).
2. **Manter o escopo**: N4 continua vendo o botão apenas em ações do seu próprio escopo (suas entidades/programas) — nada muda para registros de terceiros fora do escopo.
3. **Verificação ponta a ponta**: entrar no preview com uma conta N4 (ou simulação), abrir Registros, confirmar que o botão aparece nos registros do próprio N4, clicar e confirmar que a Programação abre o cadastro da ação em modo de edição e que o salvamento funciona.

## Detalhes técnicos

- `src/pages/admin/RegistrosPage.tsx` (~l.709): `canEdit` passa a considerar também o `created_by` da programação vinculada (via `programacoes` já carregadas na página), espelhando `canEditProgramacao` de `ProgramacaoPage.tsx` (~l.1313).
- Sem mudança no banco de dados nem na matriz de permissões (`acaoPermissions.ts`) — N4 já tem `canEdit` nos tipos relevantes.
- O deep-link `?editProgramacao=` em `ProgramacaoPage.tsx` (~l.1416) já abre o diálogo de edição e o salvamento já é permitido para N4 (`canEditProgramacao`).
