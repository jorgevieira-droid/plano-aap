

# Filtro de Entidade por Programa + Entidade Filho + PEC no formulário de Formação

## Contexto

No formulário de agendamento/registro de ações do tipo **Formação**, a lista de entidades não é filtrada pelo programa selecionado. Além disso, quando o programa é **Regionais**, falta o campo cascata de **Entidade Filho** (com rótulo "Escola"), e a opção **PEC** não aparece no seletor de "Tipo de Ator Participante".

## Alterações

### `src/pages/admin/ProgramacaoPage.tsx`

1. **Filtrar entidades por programa no formulário**: Na renderização do `<select>` de Entidade (~linha 2177), filtrar `escolas` pelo programa selecionado em `formData.programa`. Ex: se `formData.programa` inclui `'regionais'`, mostrar apenas escolas cujo `programa` inclui `'regionais'`.

2. **Adicionar campo Entidade Filho para Formação + Regionais**: Após o select de Entidade (~linha 2182), quando `formData.tipo === 'formacao'` e `formData.programa` inclui `'regionais'`, exibir o campo cascata de Entidade Filho (rótulo "Escola"), desabilitado até selecionar a entidade pai. Reutilizar a lógica já existente (`entidadesFilho`, `formEscolaFilhoId`, `setFormEscolaFilhoId`).

3. **Expandir fetch de entidades_filho**: No `useEffect` que busca entidades_filho (~linha 327), incluir `formacao` na lista de tipos que acionam o fetch (quando programa inclui `'regionais'`).

4. **Salvar entidade_filho_id para formação regionais**: Na lógica de submit (~linha 800), incluir `formacao` com programa `regionais` como condição para salvar `entidade_filho_id`.

5. **Adicionar opção PEC no "Tipo de Ator Participante"** (~linha 2484): Adicionar `<option value="pec">PEC</option>` após a opção de Vice-Diretor.

6. **Rótulo dinâmico da Entidade**: Quando `formData.tipo === 'formacao'` e programa inclui `'regionais'`, alterar o rótulo de "Entidade" para "Regional" (~linha 2169).

### Reflexo na Matriz de Ações

A Matriz de Ações não possui formulário de preview para o tipo "Formação" (não é um instrumento). As alterações acima afetam diretamente o formulário de agendamento/programação, que é o mesmo utilizado para registrar ações. Se o usuário quer que a Matriz exiba informações sobre os campos do formulário de Formação, seria necessário criar um componente de preview adicional — mas o escopo principal já cobre o cadastro e a programação.

| Arquivo | Alteração |
|---|---|
| `src/pages/admin/ProgramacaoPage.tsx` | Filtro de entidades por programa, campo Entidade Filho para formação+regionais, opção PEC no tipo de ator, rótulo dinâmico |

