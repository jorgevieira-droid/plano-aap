## Regra: ação volta para "prevista" se formulário obrigatório não for preenchido

### Comportamento atual
Hoje, ao confirmar que uma ação aconteceu (Gerenciar), o sistema marca a `programacao` como `realizada` e cria o `registros_acao`, mesmo que o usuário feche o instrumento sem salvar. Isso gera o problema visto na ação "Acompanhamento de Indicadores Mensais" (08/05/2026), onde a ação fica "realizada" mas sem dados em `instrument_responses`.

### Comportamento desejado
Para tipos de ação que exigem instrumento pedagógico obrigatório (ex.: `qualidade_implementacao`, `observacao_aula`, `consultoria_pedagogica`, `monitoramento_*`, `apoio_presencial`, `microciclos`, etc.), se o formulário não for salvo:
- A ação deve **voltar para `agendada` (prevista)**.
- O `registros_acao` correspondente deve ser removido (ou nunca criado até o save do instrumento).
- O usuário continua podendo reabrir e tentar preencher mais tarde.

### Plano de implementação

1. **Mapear instrumentos obrigatórios por tipo de ação**
   - Reusar a lógica que já existe em `ProgramacaoPage.tsx` (`normalizeAcaoTipo` + `form_config_settings`) para identificar quais tipos exigem instrumento.
   - Criar helper `requiresInstrument(tipo)` em `src/lib/` para centralizar.

2. **Mudar fluxo do "Gerenciar" (handleManageSubmit)**
   - Para ações com instrumento obrigatório: **NÃO** marcar `programacao.status = 'realizada'` nem criar `registros_acao` ainda. Apenas abrir o diálogo do instrumento com os dados de presença/contexto em memória.
   - A confirmação como `realizada` + criação do `registros_acao` passa a acontecer **dentro do `handleSaveInstrument`**, em uma transação única (instrumento salvo → registro criado → programação marcada realizada).
   - Para ações sem instrumento obrigatório (ex.: Lista de Presença pura): manter o fluxo atual.

3. **Revert ao fechar/cancelar o diálogo do instrumento**
   - Para ações que **já estavam realizadas** (caso "Editar Agendamento") sem instrumento salvo: ao fechar o diálogo sem salvar, oferecer reverter para `agendada` e limpar `registros_acao` órfão.
   - Para ações novas (fluxo de Gerenciar): como nada foi persistido ainda, basta fechar.

4. **Limpeza dos dados existentes**
   - Identificar `programacoes` com `status='realizada'` cujo `registros_acao` não tem `instrument_responses` correspondente (e cujo tipo exige instrumento) → reverter para `agendada` e remover o `registros_acao` órfão.
   - Confirmar com você antes de executar a limpeza retroativa.

5. **Validação**
   - Testar com a ação problemática "Acompanhamento de Indicadores Mensais" (08/05/2026).
   - Verificar que ações sem instrumento obrigatório (Lista de Presença, Formação simples) continuam funcionando.

### Perguntas antes de implementar
1. **Limpeza retroativa:** quer que eu faça a limpeza das ações já marcadas como "realizada" sem instrumento (item 4)? Posso listar antes para você aprovar.
2. **Cancelar com dados parciais:** se o usuário começa a preencher o instrumento, fecha sem salvar — deve perder o que digitou e voltar para "prevista", ou queremos salvar como rascunho?
3. **Lista de tipos com instrumento obrigatório:** posso usar como referência todos os `form_type` cadastrados em `form_config_settings`, ou você tem uma lista específica em mente?
