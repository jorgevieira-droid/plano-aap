Plano de implementação

1. Carregar os dois tipos de instrumento
- Buscar configurações de campos de `observacao_aula` e `registro_apoio_presencial` na página `Evolução Professor`.
- Manter labels, dimensões, campos obrigatórios e escala separados por tipo, pois Observação de Aula usa escala até 4 e Registro de Apoio Presencial usa escala 0-3.

2. Buscar os registros do professor por tipo
- Alterar a consulta de `instrument_responses` para buscar respostas do professor selecionado com `form_type` em:
  - `observacao_aula`
  - `registro_apoio_presencial`
- Continuar usando `escola_id`, `professor_id` e `registros_acao.data` para filtrar e ordenar cronologicamente.
- Separar os dados em dois conjuntos independentes:
  - Histórico — Observação de Aula
  - Histórico — Registro de Apoio Presencial

3. Exibir somente se houver dados cadastrados
- Se o professor tiver apenas Observação de Aula, exibir somente essa seção.
- Se tiver apenas Registro de Apoio Presencial, exibir somente essa seção.
- Se tiver os dois, exibir as duas seções, com títulos e badges identificando o tipo.
- Se não houver nenhum registro para o professor no período selecionado, manter o estado vazio e ajustar o texto para indicar que não há dados de Observação de Aula nem de Registro de Apoio Presencial.

4. Reutilizar os componentes de evolução por seção
- Reutilizar `EvolucaoLineChart`, `EvolucaoMatrix` e `EvolucaoObservacoes` para cada tipo de registro.
- Ajustar os componentes, se necessário, para receber um título/label do tipo de registro e evitar textos fixos como “Visita” quando o contexto for Registro de Apoio Presencial.
- No Registro de Apoio Presencial, tratar corretamente notas `0` como valor válido, sem considerar como “sem resposta”.

5. Atualizar exportação em PDF
- O PDF passará a gerar seções separadas para cada tipo com dados no período.
- Cada bloco usará os labels, dimensões e escala corretos do seu respectivo instrumento.
- Se um tipo não tiver dados, ele não será incluído no PDF.
- O botão de exportação ficará habilitado quando houver qualquer dado válido em pelo menos um dos dois tipos.

Arquivos previstos
- `src/pages/admin/EvolucaoProfessorPage.tsx`
- `src/components/evolucao/EvolucaoLineChart.tsx`
- `src/components/evolucao/EvolucaoMatrix.tsx`
- `src/components/evolucao/EvolucaoObservacoes.tsx`
- `src/components/evolucao/EvolucaoPdfContent.tsx`

Validação
- Conferir que filtros de entidade, professor, ano e mês continuam funcionando.
- Conferir professor com dados apenas de Observação de Aula.
- Conferir professor com dados apenas de Registro de Apoio Presencial.
- Conferir professor com dados dos dois tipos.
- Conferir professor sem dados, garantindo que nenhum bloco vazio seja apresentado.
- Executar build para validar TypeScript e empacotamento.