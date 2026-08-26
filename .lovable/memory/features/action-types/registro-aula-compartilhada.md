---
name: Registro de Aula Compartilhada
description: Ação exclusiva do Programa Escolas — campos de cadastro/registro e painel "Relatório - Aula Compartilhada"
type: feature
---
Tipo: `registro_aula_compartilhada` (apenas programa `escolas`).

Cadastro: Consultor, Escola, Data, Professor (texto curto obrigatório → `programacoes.apoio_professor_nome`), Segmento, Componente, Ano/Série e Turma (`apoio_turma`, ao lado do Ano/Série). Descrição e Tags ocultos.

Registro (chaves em `instrument_responses`): `turma_voar` (Sim/Não), `alunos_presentes`, `inicio_real` (Em até 10 min / Entre 10 e 13 min / Entre 13 e 15 min / Mais de 15 min), `ocorreu_planejado` (Sim / Em partes / Não) com `motivo_nao_planejado` condicional, `o_que_modelizado`, `papel_professor` (Observador / Participante / Outro) com `papel_professor_outro`, `conquistas_desafios`.

Formulário: `src/components/formularios/AulaCompartilhadaContent.tsx` (roteado por `InstrumentFormRouter`).
Painel: `/relatorios-aula-compartilhada` (N1 + N2/N3 do programa Escolas) — KPIs, distribuições (início real, planejado, papel do professor, VOAR), rankings por escola/consultor, evolução mensal e blocos qualitativos, com PDF.
