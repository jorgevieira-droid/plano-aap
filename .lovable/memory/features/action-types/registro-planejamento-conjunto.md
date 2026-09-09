---
name: Registro de Planejamento Conjunto com o Professor
description: Ação exclusiva do Programa Escolas — campos de cadastro/registro e painel "Relatório - Planejamento conjunto com prof."
type: feature
---
Tipo: `registro_planejamento_conjunto` (apenas programa `escolas`). Rótulo atual: "Planejamento conjunto com prof.".

Cadastro: Escola, Data, Hora início/fim, Consultor, Professor (texto curto, `programacoes.apoio_professor_nome`), Turma (`apoio_turma`), Segmento, Componente, Ano-Série. Título, Descrição e Tags ocultos (título automático "Planejamento conjunto com prof.").
Componente usa `APOIO_COMPONENTE_OPTIONS_ESCOLAS` (LP, OE LP, TUTOR LP, MAT, OE MAT, TUTOR MAT, REGENTE EFAI, COLABORATIVO EFAI, TUTOR EFAI), salvo em `programacoes.apoio_componente`.

Registro (numerado; todas obrigatórias exceto Anotações), chaves em `instrument_responses`:
1. `estudantes_abaixo_basico` (número)
2. `estudantes_elegiveis` (número)
3. `tema_aula` (texto curto)
4. `numero_aula` (número, MD/SP em ação)
5. `papel_professor_planejamento` (Apenas validou / Trouxe sugestões ao planejamento elaborado pelo consultor / Participou ativamente na ideação, construção e validação do planejamento)
6. `link_planejamento` (URL)
7. `houve_desafios` (Sim/Não) → se "Sim", `relato_desafios` obrigatório
8. `contribuicoes` (array, múltipla: Estudo do MD; Consulta do Guia Priorizado; Definição de expectativas e evidências de aprendizagem; Domínio do objeto de conhecimento; Recursos pedagógicos; Estratégias didáticas; Gestão de sala de aula)
9. `acompanhamento_aula` (Relato do professor / Gravação de vídeo / Observação de aula / Aula compartilhada / Outro → `acompanhamento_aula_outro`)
10. `anotacoes` (opcional)

Validação: `validatePlanejamentoConjunto` em `PlanejamentoConjuntoContent.tsx`, usada em `ProgramacaoPage.tsx` e `RegistrosPage.tsx`.
Campos descontinuados (registros antigos permanecem no banco, sem exibição): `turma_voar`, `estudantes_basico`, `estudantes_proficientes`, `contribuicoes_planejamento`, `monitoramento_aula`, `participacao_professor`, `eficacia_planejamento`, `eficacia_justificativa`.

Painel `/relatorios-planejamento-conjunto`: KPIs (total, escolas, consultores, média de elegíveis, % com desafios), perfil das turmas, distribuições por Componente, Segmento, Ano/Série (somente valores exatos de `ANO_SERIE_OPTIONS_ESCOLAS`), papel do professor, desafios, contribuições e forma de acompanhamento, rankings por escola/consultor, blocos qualitativos (temas, desafios, anotações) e PDF.
