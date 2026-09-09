---
name: Registro de Planejamento Conjunto com o Professor
description: Ação exclusiva do Programa Escolas — campos de cadastro/registro e painel "Relatório - Planejamento Conjunto com o Professor"
type: feature
---
Tipo: `registro_planejamento_conjunto` (apenas programa `escolas`).

Cadastro: Escola, Data, Hora início/fim, Consultor, Professor (texto curto, `programacoes.apoio_professor_nome`), Turma (`apoio_turma`), Segmento, Componente, Ano-Série.
Componente usa a lista `APOIO_COMPONENTE_OPTIONS_ESCOLAS` (mesmas opções do Apoio Presencial sem VOAR: LP, OE LP, TUTOR LP, MAT, OE MAT, TUTOR MAT, REGENTE EFAI, COLABORATIVO EFAI, TUTOR EFAI), salva em `programacoes.apoio_componente` e mapeada para o enum base em `componente` (EFAI → polivalente). Descrição e Tags ocultos.

Registro (`instrument_responses`): `turma_voar`, `estudantes_abaixo_basico`, `estudantes_basico`, `estudantes_proficientes`, `estudantes_elegiveis`, `tema_aula`*, `numero_aula`, `contribuicoes_planejamento`*, `monitoramento_aula`*, `participacao_professor`, `eficacia_planejamento` (1–4), `eficacia_justificativa`. (* obrigatórios, validados via `validatePlanejamentoConjunto`.)

Formulário: `src/components/formularios/PlanejamentoConjuntoContent.tsx`.
Painel: `/relatorios-planejamento-conjunto` — indicadores (sem consultores envolvidos e sem média do nº da aula), números da turma, rankings, distribuições por segmento/componente/série, evolução mensal, tabela de eficácia por consultor e blocos qualitativos (tema, participação do professor, contribuições, monitoramento), com PDF.
