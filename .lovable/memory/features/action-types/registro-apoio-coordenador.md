---
name: Reunião com a coordenação
description: Ação exclusiva do Programa de Escolas com foco múltiplo, tema, participação do coordenador e encaminhamentos, com relatório dedicado
type: feature
---
Tipo técnico: `registro_apoio_coordenador` — rótulo visual "Reunião com a coordenação" (antes "Registro de Apoio ao Coordenador"). Exclusivo do Programa de Escolas.

Cadastro: Consultor (responsável), Escola, Data e Coordenador (texto curto, gravado em `programacoes.coord_nome`). Ocultos: Título (preenchido automaticamente como "Reunião com a coordenação"), Descrição, Tags, Hora Início e Hora Fim.

Formulário de registro (`ApoioCoordenadorContent.tsx`, chaves em `instrument_responses.responses`) — todas obrigatórias, exceto Anotações; validação em `validateApoioCoordenador`:
1. `foco` (array, múltipla): Análise de resultados das avaliações / Discussão de Documentos Orientadores e Lives / Construção conjunta de pautas formativas / Acompanhamento formativo de professores / Acompanhamento da aplicação de avaliações / Acompanhamento de projetos/ações de recomposição / Outros (+ `foco_outros`)
2. `tema_apoio` (texto longo) — rótulo "Tema da reunião"
3. `participacao_coordenador`: Descompromissada / Parcialmente descompromissada / Parcialmente compromissada / Compromissada
4. `encaminhamentos` (Sim/Não) → em "Sim" abre `encaminhamentos_quais` (texto longo, obrigatório)
5. `anotacoes` (opcional)

NPS foi removido desta ação (registros antigos mantêm a chave `nps` no banco, mas ela não é mais exibida).

Relatório: `/relatorios-apoio-coordenador` (N1 e N2/N3 do Programa de Escolas) com KPIs (reuniões, escolas, coordenadores, reuniões com encaminhamentos), distribuições de foco, participação do coordenador e encaminhamentos, rankings por escola e consultor e registros detalhados expansíveis (tema, encaminhamentos e anotações).
