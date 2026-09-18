# Revisão do card “Ações Pendentes”

## Objetivo
Fazer o card do Dashboard, Painel e Meu Painel apresentar a mesma contagem e os mesmos registros válidos da página de Pendências, respeitando o SLA de 7 dias e os filtros aplicados.

## Diagnóstico confirmado
- O card do painel calcula pendências separadamente da página de Pendências.
- Para ações reagendadas, o card usa a data original; a página de Pendências usa a nova data. Existe atualmente ao menos um registro que entra indevidamente no card por essa diferença.
- O card não aplica os filtros de Componente e Ator do Programa, embora eles estejam disponíveis no painel.
- A navegação do card abre Registros, cuja regra de pendência também usa a data original, em vez de abrir a lista específica de Pendências.
- O painel mantém os dados em memória por até cinco minutos, podendo exibir uma contagem antiga após alterações.
- A exclusão de ações desabilitadas não é aplicada de forma uniforme entre card, menu e página de Pendências.

## Alterações
1. Centralizar a regra de pendência usada pelo card, menu, página de Pendências e filtro de Registros:
   - status `agendada` ou `reagendada`;
   - data relevante igual à nova data quando reagendada, ou à data original nos demais casos;
   - atraso de 7 dias completos;
   - exclusão de ações desabilitadas.
2. Fazer o card reagir a todos os filtros do painel: Programa, Entidade, Componente, Ator do Programa, Ano e Mês, usando a data relevante da pendência.
3. Exibir no resumo do card a ação, entidade, responsável, data prevista correta e dias de atraso.
4. Direcionar o card e seu resumo para `/pendencias`, mantendo a mesma visão detalhada da contagem apresentada.
5. Evitar contagem antiga no painel após criar, concluir, reagendar, cancelar ou excluir uma ação, sem reativar atualização automática por mudança de foco.
6. Manter permissões e escopo atuais por nível, programa e entidade.

## Validação
- Comparar a contagem do card, o indicador do menu e a página de Pendências sem filtros e com cada filtro do painel.
- Testar ação agendada, concluída, cancelada, excluída e reagendada antes/depois do limite de 7 dias.
- Confirmar que ações desabilitadas não aparecem e que alterações são refletidas sem recarregar a página inteira.
- Verificar Dashboard, Painel e Meu Painel nos perfis N1, N2/N3 e perfis operacionais com acesso restrito.
