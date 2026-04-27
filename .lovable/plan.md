## Adicionar "Não se aplica" em Ano/Série e Turma — Programar Observação de Aula REDES

No formulário de agendamento de **Observação de Aula – REDES** (`src/pages/admin/ProgramacaoPage.tsx`), os dropdowns de **Ano/Série** e **Turma** atualmente só aceitam valores numéricos/letras pré-definidos. Vamos adicionar a opção **"Não se aplica"** em ambos.

### Alteração

**Arquivo:** `src/pages/admin/ProgramacaoPage.tsx` (linhas 2836–2872)

- No dropdown **Ano/Série**: adicionar `"Não se aplica"` como primeira opção da lista, antes de `"1º ano"`.
- No dropdown **Turma**: adicionar `"Não se aplica"` como primeira opção da lista, antes de `"A"`.

A validação obrigatória atual (`if (!formAnoSerieRedes)`) continuará funcionando normalmente, pois "Não se aplica" é um valor válido (não vazio). O valor será persistido em `ano_serie` e no campo `turma` do registro associado, exatamente como os demais valores.

Nenhuma outra mudança é necessária (nem em tipos, nem no formulário de registro, nem em relatórios — eles já tratam o campo como string livre).
