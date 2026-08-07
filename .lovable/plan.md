# Apoio Presencial: professor em texto + Adicionar Ação em tela única

## 1. Professor vira campo de texto no Apoio Presencial

Hoje o cadastro do "Registro de Apoio Presencial" exige selecionar um professor da lista da escola (e o campo fica bloqueado até escolher a entidade). Passa a ser um campo de texto curto, digitado livremente, sem depender do cadastro de professores.

- Campo "Professor *" com digitação livre, obrigatório.
- O nome digitado aparece no cabeçalho de dados do cadastro dentro do formulário de registro e nos relatórios/impressões que já mostram o professor.
- Registros antigos que têm professor vinculado continuam exibindo o nome do professor cadastrado.

## 2. Adicionar Ação: cadastro e registro na mesma tela

Hoje, ao escolher uma ação em "Adicionar Ação", abre-se só o cadastro; depois de salvar, o sistema leva para Registros e abre o formulário de gerenciamento em um segundo passo.

Passa a ser uma tela única, para todas as ações:

- Bloco 1 — Cadastro: os mesmos campos de hoje, específicos de cada tipo de ação.
- Bloco 2 — Registro: logo abaixo, o formulário de gerenciamento/instrumento daquela ação, já visível.
- O bloco de registro fica desabilitado (esmaecido, com aviso "Preencha e salve o cadastro para liberar o registro") até que os campos obrigatórios do cadastro estejam válidos e a ação seja criada; a criação acontece automaticamente ao concluir o cadastro, sem sair da tela.
- Um único fluxo de conclusão: ao salvar o registro, a ação é marcada como realizada e o usuário volta para a lista de Registros.
- Ações que hoje não têm instrumento/formulário de gerenciamento continuam encerrando no cadastro.
- O fluxo normal de Programação/Calendário (agendar antes, registrar depois) não muda.

## Detalhes técnicos

Banco:
- Nova coluna `apoio_professor_nome` (text) em `programacoes` e, se necessário para leitura direta, em `registros_acao`. `apoio_professor_id` é mantida para histórico.

Frontend:
- `src/pages/admin/ProgramacaoPage.tsx`: troca do `<select>` de professor (linhas ~4150-4170) por `<input type="text">`; estado `formApoioProfessorNome` substitui `formApoioProfessorId` na gravação/prefill; validação obrigatória por texto não vazio.
- `RegistroApoioPresencialForm` / `RegistroApoioPresencialContent`: `cadastro.professorNome` passa a vir da nova coluna, com fallback para o nome do professor vinculado; `professor_id` só é gravado em `instrument_responses` quando existir.
- Modo direto (`?direto=1`) em `ProgramacaoPage`: em vez de `navigate('/registros?manage=...')`, o dialog mantém-se aberto e renderiza abaixo o `InstrumentFormRouter` (ou o bloco de gerenciamento correspondente ao tipo) usando o `registros_acao.id` recém-criado, com `directRegistroId` em estado. Navegação para `/registros` só no `onSuccess` do formulário de registro.
- `AdicionarAcaoPage` continua apenas navegando com `?novaAcao=&direto=1`; nenhuma mudança de permissão.
- Impressão/relatórios que leem professor do Apoio Presencial (`AcaoPrintForm`, `RelatorioApoioPresencialPage`, `ExtracaoBasesInstrumentosPage`) passam a usar o nome textual com fallback.
