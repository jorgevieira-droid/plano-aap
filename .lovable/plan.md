# Ajuste de layout no cadastro de Planejamento Conjunto com o Professor

Reposicionar o campo **Turma** para ficar ao lado do campo **Ano/Série** no formulário de cadastro do tipo `registro_planejamento_conjunto`.

## Problema atual
- O campo **Turma** está renderizado junto com **Professor** (uma coluna cada).
- O campo **Ano/Série** ocupa a linha toda (`col-span-2`), abaixo de Professor/Turma.
- A solicitação é deixar **Ano/Série** e **Turma** lado a lado na mesma linha.

## Alterações previstas

Arquivo: `src/pages/admin/ProgramacaoPage.tsx`

1. **No bloco específico do tipo** (próximo à linha 4019), manter apenas o campo **Professor** e remover o campo **Turma** daquele grupo.
2. **No bloco dinâmico de Segmento/Componente/Ano/Série** (próximo à linha 4499), quando `formData.tipo === "registro_planejamento_conjunto"`:
   - Renderizar **Ano/Série** com largura de uma coluna (`col-span-1`) em vez de `col-span-2`.
   - Inserir o campo **Turma** logo ao lado, também com uma coluna (`col-span-1`), reaproveitando o estado `formApoioTurma` e o input já existente.

## Resultado esperado
- Layout de duas colunas: **Segmento** | **Componente** (linha 1); **Ano/Série** | **Turma** (linha 2).
- Professor permanece sozinho na linha superior, conforme já está.
- Nenhuma mudança de estado, validação ou persistência — apenas reposicionamento visual dos campos.
