---
name: Registro de Aula Compartilhada
description: Ação exclusiva do Programa Escolas — campos de cadastro/registro e painel "Relatório - Aula compartilhada com prof."
type: feature
---
Tipo: `registro_aula_compartilhada` (apenas programa `escolas`). Rótulo atual: "Aula compartilhada com prof.".

Cadastro: Consultor, Escola, Data, Professor (texto curto obrigatório → `programacoes.apoio_professor_nome`), Segmento, Componente (`APOIO_COMPONENTE_OPTIONS_ESCOLAS` → `programacoes.apoio_componente`), Ano/Série e Turma (`apoio_turma`). Descrição e Tags ocultos.

Registro (numerado; todas obrigatórias exceto Número MD e Anotações), chaves em `instrument_responses`:
1. `tema_aula` (texto curto)
2. `numero_md` (número, opcional)
3. `planejada_previamente` (Sim/Não)
4. `link_planejamento` (URL)
5. `ocorreu_planejado` (Sim / Em partes / Não) → se "Em partes"/"Não", `desafios_vivenciados` obrigatório
6. `tematizacao_posterior` (Sim/Não)
7. `anotacoes` (opcional)

Validação: `validateAulaCompartilhada` em `AulaCompartilhadaContent.tsx`, usada em `ProgramacaoPage.tsx` e `RegistrosPage.tsx`.
Campos descontinuados (registros antigos permanecem no banco, sem exibição): `turma_voar`, `alunos_presentes`, `inicio_real`, `motivo_nao_planejado`, `o_que_modelizado`, `papel_professor`, `conquistas_desafios`.

Painel `/relatorios-aula-compartilhada`: KPIs (total, escolas, professores, % planejadas previamente, % como planejado, % tematização), distribuições das 3 perguntas de seleção, quantidade por Ano/Série (somente valores exatos de `ANO_SERIE_OPTIONS_ESCOLAS`), rankings por escola/consultor, blocos qualitativos (temas, desafios, anotações) e PDF.
