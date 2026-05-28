# Não aceitar registros sem data

## Objetivo
Impedir que qualquer registro de ação seja criado ou salvo sem uma data válida, exibindo um aviso claro ao usuário em vez de deixar o banco devolver um erro técnico (ou causar o travamento "Invalid time value").

## Contexto
- A coluna `data` da tabela `registros_acao` já é `date NOT NULL` no banco, então registros sem data sempre falham — porém hoje a falha acontece no servidor, sem mensagem amigável e sem bloqueio antecipado.
- Não há validação no cliente nos dois pontos principais que gravam registros:
  - Criação/edição via formulário de Programação (`handleSubmit` em `ProgramacaoPage.tsx`).
  - Edição direta do registro (`handleSaveEdit` em `RegistrosPage.tsx`).

## Mudanças

### 1. Programação — `src/pages/admin/ProgramacaoPage.tsx`
- No início do bloco de validações de `handleSubmit` (antes de montar `insertData`), adicionar verificação: se `formData.data` estiver vazio/ausente, exibir `toast.error("Informe a data da ação")`, encerrar a função e resetar o estado de envio.

### 2. Edição de registro — `src/pages/admin/RegistrosPage.tsx`
- No início de `handleSaveEdit`, adicionar verificação: se `editData` estiver vazio, exibir `toast.error("Informe a data do registro")` e interromper o salvamento (resetando o estado de envio).

## Fora de escopo
- Sem alterações de banco de dados (o `NOT NULL` já garante a regra no servidor).
- Sem alterações em layout, estilos ou outros formulários, já que estes já passam uma data válida obrigatoriamente.

## Validação
- Tentar salvar uma programação e uma edição de registro com o campo de data vazio e confirmar que o salvamento é bloqueado com a mensagem de aviso, sem chamada ao banco e sem travamento da tela.
