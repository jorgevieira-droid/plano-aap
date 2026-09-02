---
name: Registro de Planejamento Conjunto com o Professor
description: Ação exclusiva do Programa Escolas — campos de cadastro/registro e painel "Relatório - Planejamento Conjunto com o Professor"
type: feature
---
Tipo: `registro_planejamento_conjunto` (apenas programa `escolas`).

Cadastro: Escola, Data, Hora início/fim, Consultor, Professor (texto curto, `programacoes.apoio_professor_nome`), Turma (`apoio_turma`), Segmento, Componente, Ano-Série.
Componente usa lista própria salva em `programacoes.apoio_componente` (Língua Portuguesa, Matemática, Polivalente, OE Língua Portuguesa, OE Matemática, Tutor Língua Portuguesa, Tutor Matemática), mapeada para o enum base em `componente`. Descrição e Tags ocultos.

Registro (`instrument_responses`): `turma_voar`, `estudantes_abaixo_basico`, `estudantes_basico`, `estudantes_proficientes`, `estudantes_elegiveis`, `tema_aula`*, `numero_aula`, `contribuicoes_planejamento`*, `monitoramento_aula`*, `participacao_professor`, `eficacia_planejamento` (1–4), `eficacia_justificativa`. (* obrigatórios, validados via `validatePlanejamentoConjunto`.)

Formulário: `src/components/formularios/PlanejamentoConjuntoContent.tsx`.
Painel: `/relatorios-planejamento-conjunto` — indicadores (sem consultores envolvidos e sem média do nº da aula), números da turma, rankings, distribuições por segmento/componente/série, evolução mensal, tabela de eficácia por consultor e blocos qualitativos (tema, participação do professor, contribuições, monitoramento), com PDF.
