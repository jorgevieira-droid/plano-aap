# Apoio Presencial com a Coordenação — novo formulário e painel

Simplificar a ação para um formulário curto, numerado e totalmente obrigatório (exceto Anotações), e refazer o painel para refletir apenas os novos dados.

## Cadastro da ação

- Ocultar o campo **Título** (gerado automaticamente, como já ocorre em "Alterações de agenda da visita").
- Manter: Escola, Data, Nome do Coordenador, Responsável.
- Substituir **Etapa** por **Componente**, com a mesma lista do Apoio Presencial: LP; OE LP; Tutor LP; Mat; OE Mat; Tutor Mat; Regente EFAI; Colaborativo EFAI; Tutor EFAI.
- Incluir **Ano/Série** (1º a 9º Ano; 1ª a 3ª Série).
- Componente e Ano/Série são obrigatórios e ficam logo após o Nome do Coordenador.

## Formulário de registro (perguntas numeradas, todas obrigatórias exceto a última)

1. O que predominou nos registros da coordenação? (mesmas opções de hoje)
2. A devolutiva foi realizada com o coordenador? (Sim / Não)
   - Se **Sim**: 3. A devolutiva foi finalizada com combinados/encaminhamentos? (Sim / Não)
     - Se **Sim**: 4. Houve Tematização da devolutiva posteriormente? (Sim / Não)
   - Se **Não**: nenhuma das duas aparece.
5. Anotações (texto longo, opcional)

Perguntas retiradas: Turma do VOAR; observou a aula do início ao fim; fez registros de observação; devolutiva planejada; data da devolutiva; participação do coordenador na devolutiva; motivo da não realização; pergunta de avaliação 1–4 e justificativa; pergunta sobre habilidades/práticas do coordenador (vira "Anotações").

O botão de salvar só é liberado com todas as perguntas visíveis respondidas.

## Painel "Relatório - Apoio Presencial com a Coordenação"

Indicadores (reagem aos filtros de consultor, escola e período):

- Total de apoios realizados
- Devolutivas realizadas com o coordenador
- Devolutivas finalizadas com combinados/encaminhamentos
- Tematização posterior

Visualizações:

- Quantidade por **Componente**
- Quantidade por **Ano/Série**
- Quantidade por **O que predominou nos registros da coordenação**
- Apoios por escola e por consultor (mantidos)
- Evolução mensal: registros no mês, % devolutivas realizadas, % finalizadas com combinados, % tematização
- Lista de **Anotações** com Consultor, Escola, Data e texto

Removidos do painel: cartões e listas de VOAR, observou início ao fim, devolutivas planejadas, participação na devolutiva, motivos da não devolutiva e a tabela de avaliação 1–4 por consultor. O PDF acompanha a mesma estrutura.

## Detalhes técnicos

- `ProgramacaoPage.tsx`: ocultar Título para `registro_consultoria_pedagogica` com título automático; trocar `etapa_simples` por `apoio_componente` (`APOIO_COMPONENTE_OPTIONS_ESCOLAS`) e adicionar `apoio_ano_serie` (`ANO_SERIE_OPTIONS_ESCOLAS`) na gravação em `programacoes`/`registros_acao`.
- `OlharParceiroContents.tsx` (`FormacaoCoordenadorContent`): reescrever com as 5 perguntas numeradas; novas chaves `devolutiva_com_coordenador`, `devolutiva_combinados`, `tematizacao_posterior`, `anotacoes`; validação de obrigatoriedade no salvamento do instrumento.
- Impressão/visualização completa: ajustar a seção correspondente em `AcaoPrintForm.tsx` para as novas perguntas.
- `RelatoriosApoioCoordenacaoPanelPage.tsx`: novos KPIs, agrupamentos por componente/ano-série vindos de `registros_acao`, lista de anotações e PDF atualizado.
- Sem migração de banco: os dados continuam em `instrument_responses.responses` (JSON) e em colunas já existentes de `registros_acao`. Registros antigos permanecem salvos, apenas deixam de ser exibidos nos blocos removidos.
