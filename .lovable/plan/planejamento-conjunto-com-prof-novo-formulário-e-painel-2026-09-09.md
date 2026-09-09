# Planejamento conjunto com prof. — novo formulário e painel

Reformular o registro da ação "Planejamento conjunto com prof." (Programa Escolas) e atualizar o painel "Relatório - Planejamento Conjunto com o Professor".

## Cadastro

- Ocultar o campo "Título" (preenchido automaticamente, como nas demais ações de Escolas).
- Demais campos permanecem: Consultor, Escola, Data, Professor, Segmento, Componente, Ano/Série e Turma.

## Novo formulário de registro (numerado)

Todas obrigatórias, exceto "Anotações":

1. Quantos estudantes Abaixo do Básico a turma possui? (número)
2. Quantos estudantes elegíveis a turma possui? (número)
3. Tema da aula (texto curto)
4. Nº da aula (MD/SP em ação) (número)
5. Qual o papel do professor no planejamento da aula? (Apenas validou / Trouxe sugestões ao planejamento elaborado pelo consultor / Participou ativamente na ideação, construção e validação do planejamento)
6. Link do planejamento (texto/URL)
7. Houve desafios na elaboração do planejamento? (Sim / Não)
   - Se "Sim": Relate os desafios (texto longo, obrigatório)
8. Quais as suas principais contribuições ao planejamento conjunto? (múltipla escolha: estudo do MD; consulta do Guia Priorizado; definição de expectativas e evidências de aprendizagem; domínio do objeto de conhecimento; recursos pedagógicos; estratégias didáticas; gestão de sala de aula)
9. Como essa aula será acompanhada? (Relato do professor / Gravação de vídeo / Observação de aula / Aula compartilhada / Outro)
   - Se "Outro": campo "Qual?" (texto curto, obrigatório)
10. Anotações (texto longo) — não obrigatória

Questões retiradas: Turma do VOAR; estudantes no Básico; estudantes proficientes; contribuições ao planejamento (texto); como a aula será monitorada; participação do professor; eficácia do Planejamento Conjunto e justificativa.

A validação bloqueia o envio indicando a pergunta pendente.

## Painel — Relatório - Planejamento Conjunto com o Professor

Passa a apresentar:

- Indicadores: total de planejamentos, escolas atendidas, professores distintos, média de estudantes Abaixo do Básico, média de elegíveis, % com desafios na elaboração.
- Quantidade por Componente (lista oficial do campo Componente do Programa Escolas).
- Quantidade por Ano/Série, contando apenas valores exatos da lista oficial (1º a 9º Ano; 1ª a 3ª Série); demais valores ignorados.
- Distribuições: papel do professor no planejamento; formas de acompanhamento da aula; contribuições ao planejamento (contagem por opção, múltipla); houve desafios (Sim/Não).
- Rankings por escola e por consultor (mantidos, sem as métricas removidas).
- Blocos qualitativos: Temas das aulas, Relatos de desafios e Anotações — cada item com consultor, escola e data.
- Registros detalhados e PDF refletindo os novos campos.

Saem do painel os blocos baseados nas questões removidas (VOAR, básico/proficientes, monitoramento, participação do professor, tabela de eficácia por consultor).

## Detalhes técnicos

- `src/components/formularios/PlanejamentoConjuntoContent.tsx`: novas chaves `papel_professor_planejamento`, `link_planejamento`, `houve_desafios`, `relato_desafios`, `contribuicoes` (array), `acompanhamento_aula`, `acompanhamento_aula_outro`, `anotacoes`; manter `estudantes_abaixo_basico`, `estudantes_elegiveis`, `tema_aula`, `numero_aula`; ampliar `validatePlanejamentoConjunto`.
- `ProgramacaoPage.tsx`: ocultar Título para `registro_planejamento_conjunto` (mesmo padrão de `alteracao_agenda_visita`) com título automático; validação já ligada em `ProgramacaoPage.tsx` e `RegistrosPage.tsx`.
- `RelatoriosPlanejamentoConjuntoPanelPage.tsx`: recalcular KPIs, distribuições, Componente (`APOIO_COMPONENTE_OPTIONS_ESCOLAS`), Ano/Série (`ANO_SERIE_OPTIONS_ESCOLAS`), blocos qualitativos e PDF.
- `RelatoriosGestaoEscolasPage.tsx`: ajustar indicadores dessa ação caso usem campos removidos.
- Sem migration: respostas seguem em `instrument_responses`; registros antigos permanecem salvos, campos descontinuados deixam de ser exibidos.
- Validação: `npx tsgo --noEmit -p tsconfig.app.json` e conferência no preview.
