

# Mover "Público da Formação" para logo abaixo de "Programa"

## Alteração

### `src/pages/admin/ProgramacaoPage.tsx`

1. **Remover** o bloco do dropdown "Público da Formação" da posição atual (linhas 2256-2271).
2. **Inserir** o mesmo bloco logo após o fechamento do campo "Programa" (após linha 1982), mantendo a condição `formData.tipo === 'encontro_eteg_redes'`.

Nenhuma outra alteração necessária — apenas reposicionamento do campo no formulário.

