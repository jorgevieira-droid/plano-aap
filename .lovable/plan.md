## Ajuste

No `src/pages/admin/RegistrosPage.tsx`, o botão recém-adicionado para os tipos de encontro formativo (`encontro_professor_redes`, `encontro_eteg_redes`, `encontro_microciclos_recomposicao`) hoje está com `title="Gerenciar Presenças"` e ícone `Users`, igual ao botão já existente para `formacao`/`lista_presenca`.

Para evitar duplicidade visual e textual, o novo botão passa a:

- **Title/tooltip:** `Editar Presenças`
- **Ícone:** `UserCheck` (do `lucide-react`) — distinto do `Users` usado pelo botão "Gerenciar Presenças"

Nenhuma outra mudança: a função `handleOpenPresencaOnly`, a condição de renderização (`ENCONTRO_PRESENCE_TYPES.has(registro.tipo) && canEdit(registro)`) e o comportamento do diálogo permanecem idênticos.
