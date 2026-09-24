# Título editado não atualiza em Registros

## Causa (confirmada)
A alteração é gravada corretamente: no banco, o apoio de 17/09 já está como "Apoio à professora Eliane" (salvo hoje às 14:07). O problema é só de exibição: a página Registros guarda em memória a lista de títulos das ações e não a recarrega ao ser reaberta. Quando a edição é feita pela Programação/Calendário/Adicionar Ação, essa memória não é avisada da mudança, então Registros continua mostrando o título antigo até a página ser recarregada.

## Correção
- Ao salvar, editar, excluir ou criar uma ação pela Programação/Calendário (e Adicionar Ação), avisar também a lista de Registros para buscar os dados novos.
- A lista de títulos em Registros passa a ser sempre recarregada ao abrir a página, para cobrir qualquer outro caminho de edição.
- Nada muda nos dados já salvos nem nos filtros.

## Detalhes técnicos
- `src/pages/admin/ProgramacaoPage.tsx`: em todos os pontos que hoje invalidam `['programacoes']`/`['registros_acao']`, invalidar também `['programacoes_for_registros']`.
- `src/pages/admin/RegistrosPage.tsx`: na query `programacoes_for_registros`, definir `refetchOnMount: 'always'` (sobrepõe o `refetchOnMount: false` global de `App.tsx`).
