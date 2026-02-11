

## Corrigir criacao do Acompanhamento de Formacao

### Problema
Quando uma Formacao e marcada como "realizada", o fluxo redireciona para o dialog de presenca (linha 689-731) e faz `return` antes de chegar ao codigo que cria o acompanhamento (linha 838-880). O acompanhamento nunca e criado.

### Solucao
Mover a logica de criacao do acompanhamento para dentro do submit do dialog de presenca, que e onde o fluxo da Formacao realmente termina.

### Alteracoes em `src/pages/admin/ProgramacaoPage.tsx`

#### 1. Preservar o estado de acompanhamento ao transitar para o dialog de presenca
Os estados `agendarAcompanhamento`, `acompanhamentoAapId`, `acompanhamentoData`, `acompanhamentoHorarioInicio` e `acompanhamentoHorarioFim` ja existem e nao sao resetados quando o dialog de presenca abre. Isso significa que os valores selecionados pelo usuario no dialog de gerenciamento ainda estao disponiveis quando o submit de presenca e executado.

#### 2. Adicionar criacao do acompanhamento no submit de presenca
Apos inserir as presencas com sucesso (por volta da linha 1105), verificar se `agendarAcompanhamento` esta ativo e `selectedProgramacao.tipo === 'formacao'`. Se sim:
- Inserir nova `programacao` com tipo `acompanhamento_formacoes`, herdando dados da formacao e usando `acompanhamentoAapId`
- Inserir `registro_acao` correspondente
- Ajustar a mensagem de toast para informar que o acompanhamento tambem foi agendado

#### 3. Resetar estados de acompanhamento apos o submit de presenca
Apos a conclusao, resetar os estados: `agendarAcompanhamento`, `acompanhamentoAapId`, `acompanhamentoData`, `acompanhamentoHorarioInicio`, `acompanhamentoHorarioFim`.

### Arquivo modificado
- `src/pages/admin/ProgramacaoPage.tsx` - unico arquivo alterado

