---
name: Registro de Planejamento Conjunto com o Professor
description: Ação exclusiva do Programa Escolas — campos de cadastro/registro e painel "Relatório - Planejamento Conjunto"
type: feature
---
Tipo: `registro_planejamento_conjunto` (apenas programa `escolas`).

Cadastro: Escola, Data, Hora início/fim, Consultor, Professor (texto curto, obrigatório, salvo em `programacoes.apoio_professor_nome`), Turma (`apoio_turma`), Segmento, Componente, Ano-Série. Descrição e Tags ocultos.

Registro (instrumento em `instrument_responses`, chaves): `turma_voar` (Sim/Não), `estudantes_abaixo_basico`, `estudantes_basico`, `estudantes_elegiveis`, `tema_aula`, `numero_aula` (MD/SP em ação), `contribuicoes_planejamento`, `monitoramento_aula`.

Formulário: `src/components/formularios/PlanejamentoConjuntoContent.tsx` (roteado por `InstrumentFormRouter`).
Painel: `/relatorios-planejamento-conjunto` (N1 + N2/N3 do programa Escolas) — indicadores, números da turma, rankings por escola/consultor, distribuições, evolução mensal e blocos qualitativos, com PDF.
