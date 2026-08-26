---
name: Registro de Apoio ao Coordenador
description: Ação exclusiva do Programa de Escolas com foco múltiplo, tema, NPS e anotações, com relatório dedicado
type: feature
---
Tipo: `registro_apoio_coordenador` — exclusivo do Programa de Escolas.

Cadastro: Consultor (responsável), Escola, Data, Título e Coordenador (texto curto, gravado em `programacoes.coord_nome`). Campos Descrição e Tags ocultos; sem segmento/componente/ano-série.

Formulário de registro (`ApoioCoordenadorContent.tsx`, chaves em `instrument_responses.responses`):
- `foco` (array, seleção múltipla): Análise de resultados das avaliações / Discussão de Documentos Orientadores e Lives / Construção conjunta de pautas formativas / Outros (+ `foco_outros`)
- `tema_apoio` (texto longo)
- `nps` (nota 1-10)
- `anotacoes` (conquistas e desafios)

Relatório: `/relatorios-apoio-coordenador` (N1 e N2/N3 do Programa de Escolas) com KPIs (apoios, escolas, coordenadores, Nota média de NPS, NPS), distribuição de foco e de notas, rankings por escola e consultor, evolução mensal e registros detalhados expansíveis. NPS segue a fórmula oficial (% promotores − % detratores).
