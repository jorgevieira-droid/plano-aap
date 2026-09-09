# Aula compartilhada com prof. — novo formulário e painel

Reformular o registro da ação "Aula compartilhada com prof." (Programa Escolas) e atualizar o painel "Relatório - Registro de Aula Compartilhada".

## Novo formulário de registro (numerado)

Todas obrigatórias, exceto onde indicado:

1. Tema da aula (texto curto)
2. Número MD (número) — não obrigatória
3. Aula planejada previamente com prof.? (Sim / Não)
4. Link do planejamento (texto/URL)
5. A aula aconteceu como planejado? (Sim / Não / Em partes)
   - Se "Não" ou "Em partes": Quais os desafios vivenciados? (texto longo, obrigatório)
6. Houve tematização da aula posteriormente? (Sim / Não)
7. Anotações (texto longo) — não obrigatória

Perguntas retiradas: Turma do VOAR, Quantidade de alunos presentes, Início real da aula, O que foi modelizado, Papel do professor, Conquistas e desafios.

Validação bloqueia o envio com mensagem apontando a pergunta pendente.

## Painel — Relatório - Registro de Aula Compartilhada

Passa a apresentar:

- Indicadores: total de aulas compartilhadas, escolas atendidas, professores distintos, % planejadas previamente, % que aconteceram como planejado, % com tematização posterior.
- Quantidade realizada por Ano/Série, contando apenas valores exatos da lista oficial (1º a 9º Ano; 1ª a 3ª Série); demais valores são ignorados.
- Distribuições: "Aula planejada previamente" (Sim/Não), "Aconteceu como planejado" (Sim/Em partes/Não), "Houve tematização" (quantidade de Sim e de Não).
- Rankings por escola e por consultor (mantidos).
- Blocos qualitativos: Temas das aulas, Desafios vivenciados e Anotações — cada item com consultor, escola e data.
- Registros detalhados e exportação em PDF refletindo os novos campos.

Saem do painel os blocos baseados nas perguntas removidas (média de alunos presentes, início real, papel do professor, VOAR, modelização, conquistas).

## Detalhes técnicos

- `src/components/formularios/AulaCompartilhadaContent.tsx`: novos campos com chaves `tema_aula`, `numero_md`, `planejada_previamente`, `link_planejamento`, `ocorreu_planejado`, `desafios_vivenciados`, `tematizacao_posterior`, `anotacoes`; exportar `validateAulaCompartilhada`.
- Ligar a validação nos fluxos de envio em `ProgramacaoPage.tsx` e `RegistrosPage.tsx` (mesmo padrão de Planejamento Conjunto / Apoio com Coordenação).
- `src/pages/admin/RelatoriosAulaCompartilhadaPanelPage.tsx`: recalcular KPIs, distribuições, Ano/Série (usando `ANO_SERIE_OPTIONS_ESCOLAS`), blocos qualitativos e PDF.
- `RelatoriosGestaoEscolasPage.tsx`: ajustar os indicadores dessa ação caso usem campos removidos.
- Sem migration: respostas continuam em `instrument_responses`.
- Registros antigos permanecem salvos; campos descontinuados deixam de ser exibidos.
- Validação: `npx tsgo --noEmit -p tsconfig.app.json` e conferência no preview.
