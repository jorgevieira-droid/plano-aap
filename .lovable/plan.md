

# Exclusao em Lote de Registros de Atividade

## Resumo

Adicionar funcionalidade de selecao multipla (checkboxes) na tabela de registros de acao, permitindo que Administradores e Gestores selecionem varios registros e os excluam de uma so vez.

---

## O que muda para o usuario

1. Uma coluna de checkbox aparece a esquerda da tabela (visivel apenas para Admin/Gestor)
2. Um checkbox "Selecionar todos" no cabecalho da tabela
3. Uma barra de acoes flutuante aparece quando ha itens selecionados, mostrando a contagem e um botao "Excluir selecionados"
4. Um dialogo de confirmacao com a quantidade de registros a serem excluidos
5. Exclusao sequencial de todos os registros selecionados com feedback de progresso

---

## Detalhes Tecnicos

### Arquivo: `src/pages/admin/RegistrosPage.tsx`

**Novos estados:**
- `selectedIds: Set<string>` -- IDs dos registros selecionados
- `isBatchDeleting: boolean` -- controle de loading durante exclusao em lote

**Nova coluna na tabela:**
- Coluna de checkbox como primeira coluna (condicional: so aparece para Admin/Gestor)
- Header com checkbox "selecionar todos" que opera sobre os registros filtrados visiveis

**Logica de selecao:**
- Checkbox individual alterna o ID no Set
- "Selecionar todos" adiciona/remove todos os IDs filtrados (respeitando `canDelete`)
- Limpar selecao ao mudar filtros

**Barra de acoes (batch action bar):**
- Aparece fixada acima da tabela quando `selectedIds.size > 0`
- Mostra: "{N} registro(s) selecionado(s)" + botao "Excluir selecionados" + botao "Limpar selecao"

**Exclusao em lote (`handleBatchDelete`):**
- Dialogo de confirmacao com AlertDialog
- Para cada registro selecionado, executa a mesma logica de exclusao existente (deletar presencas, avaliacoes_aula, instrument_responses, registros_alteracoes e por fim o registro)
- Usa `Promise.allSettled` ou loop sequencial para evitar sobrecarga
- Ao final, invalida queries e exibe toast com resultado (ex: "5 registros excluidos com sucesso")
- Limpa a selecao apos conclusao

**Restricoes de seguranca:**
- Apenas registros que o usuario pode excluir (`canDelete`) terao checkbox habilitado
- A funcionalidade inteira so aparece para Admin e Gestor (mesma logica ja existente)
- RLS no backend continua garantindo que apenas registros permitidos sejam deletados

### Componente DataTable

Nenhuma alteracao necessaria no componente generico `DataTable`. A coluna de checkbox sera adicionada diretamente no array `columns` da pagina de Registros, seguindo o padrao ja existente.

---

## Sequencia de Implementacao

1. Adicionar estados de selecao (`selectedIds`, `isBatchDeleting`)
2. Adicionar coluna de checkbox na tabela
3. Implementar barra de acoes com contagem e botoes
4. Criar funcao `handleBatchDelete` reutilizando logica existente
5. Adicionar AlertDialog de confirmacao para exclusao em lote
6. Limpar selecao ao mudar filtros

