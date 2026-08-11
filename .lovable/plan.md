# Ocultar campo "Programa" quando há apenas 1 opção

## Objetivo
No formulário de Programação/Registro, o campo "Programa" deixa de ser exibido quando só existe uma opção possível para o usuário. O programa continua sendo preenchido automaticamente nos bastidores.

## Regra
O campo fica oculto quando a lista final de opções (programas do usuário cruzada com os programas permitidos para o tipo de ação) tiver exatamente 1 item. Nesse caso o valor é aplicado automaticamente ao formulário.

O campo continua visível quando:
- Há 2 ou mais opções (ex.: N1/admin, ou usuário com múltiplos programas).
- O usuário não possui nenhum programa atribuído — nesse caso segue aparecendo o aviso "Você não possui nenhum programa atribuído".

## Detalhes técnicos
- Arquivo: `src/pages/admin/ProgramacaoPage.tsx`, bloco do campo "Programa *" (~linhas 3698-3741).
- Extrair a lógica de opções hoje duplicada (dentro de `disabled` e do `SelectContent`) para um único cálculo memoizado `programaOptions`, dependente de `formData.tipo`, `isAdmin`, `isAAP`, `isGestor/isManager`, `gestorProgramas`, `aapProgramas`.
- Se `programaOptions.length === 1`: não renderizar o bloco e garantir, via efeito, que `formData.programa` seja `[programaOptions[0]]` (inclusive ao trocar o tipo de ação, que pode alterar os programas permitidos).
- Se `programaOptions.length === 0`: manter o aviso atual.
- Nenhuma mudança em validação de submit, permissões ou backend.
