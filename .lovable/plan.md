# Ações excluídas continuam aparecendo em Pendências

## O que está acontecendo

As exclusões estão sendo gravadas corretamente no banco (tanto em Registros quanto em Programação, os dados vinculados e a ação são apagados). O problema é de **atualização da tela**: a lista de Pendências (e o número no menu lateral) usa um cache próprio que nunca é avisado quando uma ação é excluída.

Confirmado no código:
- A consulta de pendências usa a chave `pendencias`, e essa chave não é atualizada em nenhum ponto do sistema após excluir, concluir ou reagendar uma ação.
- A configuração global de dados não recarrega nada ao entrar novamente numa página (`refetchOnMount: false`), então a lista antiga continua sendo exibida até o usuário recarregar o navegador inteiro.

## Correção proposta

1. Avisar a lista de Pendências sempre que uma ação mudar: após excluir (individual e em lote) em Registros, após excluir em Programação, e após registrar/concluir/reagendar uma ação.
2. Fazer a página de Pendências e o contador do menu buscarem dados atualizados ao serem abertos, mantendo o restante da navegação sem recarregamentos.
3. Proteção extra na própria lista: ignorar pendências cuja ação não exista mais, evitando linhas "fantasma" caso alguma exclusão aconteça por outro caminho.

## Detalhes técnicos

- `src/hooks/usePendencias.ts`: manter `placeholderData`, mas habilitar `refetchOnMount: 'always'` para essa consulta específica.
- Adicionar `queryClient.invalidateQueries({ queryKey: ['pendencias'] })` nos fluxos de mutação de `src/pages/admin/RegistrosPage.tsx` (exclusão individual, exclusão em lote, criação/atualização/reagendamento) e de `src/pages/admin/ProgramacaoPage.tsx` (exclusão individual e em lote, salvar registro/instrumento, reverter status).
- Nenhuma alteração de banco de dados, RLS ou regras de negócio é necessária.

## Verificação

Excluir uma ação do Programa Escolas e confirmar que ela desaparece da página Pendências e do contador do menu sem recarregar o navegador.
