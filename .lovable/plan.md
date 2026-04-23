
## Ajustes solicitados

### 1. Corrigir erro na inclusão de Entidade Filho

**Problema provável**
O erro aparece na busca do CODESC da Entidade Pai. Como N2/N3 passaram a poder cadastrar Entidades Filho, a busca atual por `.maybeSingle()` pode falhar quando a leitura da entidade pai retorna uma resposta inesperada/filtrada por permissões ou quando há inconsistência/duplicidade de CODESC. A tela mostra apenas “Erro na busca”, sem detalhar o motivo.

**Ajuste**
- Alterar a busca por CODESC em `src/pages/admin/EntidadesFilhoPage.tsx` para ser mais tolerante:
  - usar `.limit(1)` em vez de depender de `.maybeSingle()` diretamente;
  - exibir mensagem mais clara quando não encontrar a Entidade Pai;
  - preservar o comportamento de bloquear o salvamento quando a Entidade Pai não foi resolvida.
- Manter a regra de segurança: N2/N3 só conseguirão resolver e salvar Entidades Pai dentro do escopo dos próprios programas.
- Melhorar o tratamento de erro no salvamento para exibir a mensagem real do backend quando existir.

### 2. Adicionar filtro por Entidade Pai na visualização de Entidades Filho

**Ajuste**
- Em `src/pages/admin/EntidadesFilhoPage.tsx`, adicionar um novo dropdown/filtro **Entidade Pai** acima da tabela, ao lado da busca e do filtro “Mostrar inativos”.
- O filtro terá:
  - opção padrão **Todas as Entidades Pai**;
  - lista de Entidades Pai derivada das Entidades Filho visíveis ao usuário, ordenada A-Z por nome usando `localeCompare('pt-BR', { sensitivity: 'base' })`;
  - label com CODESC + nome quando o CODESC existir.
- Atualizar a lógica de filtragem da tabela para considerar:
  - texto digitado na busca;
  - status ativo/inativo;
  - Entidade Pai selecionada.
- Manter a tabela atual sem alterar colunas ou dados.

### 3. Adicionar botão para editar ação na visão de Programação

**Ajuste**
- Em `src/pages/admin/ProgramacaoPage.tsx`, adicionar um botão **Editar** nas ações de cada programação, tanto na visão de calendário quanto na visão de lista.
- O botão ficará disponível para usuários com permissão de edição conforme a matriz atual (`canUserEditAcao`) e dentro das permissões já aplicadas pela página:
  - Admin;
  - N2/N3 por programa;
  - papéis operacionais quando já possuem permissão de edição para o tipo de ação.
- Ao clicar em **Editar**:
  - abrir o mesmo modal de Programação reutilizado para criar ações;
  - preencher o formulário com os dados da ação existente;
  - ajustar o título do modal para **Editar [tipo da ação]**;
  - ocultar/desabilitar a troca de tipo para evitar transformar uma ação em outro tipo;
  - salvar com `UPDATE` em `programacoes`;
  - sincronizar os campos equivalentes em `registros_acao` vinculado, quando houver `programacao_id`, mantendo o padrão já usado na página de Registros.
- Campos específicos já existentes serão preservados no carregamento/edição:
  - `turma_formacao`, `local`, `projeto`, `publico_formacao`;
  - Entidade Filho e Ano/Série/Turma de Observação de Aula – REDES;
  - campos do Monitoramento de Ações Formativas;
  - campos do Registro de Apoio Presencial.
- Após salvar:
  - fechar modal;
  - limpar estado de edição;
  - recarregar a programação;
  - exibir toast de sucesso.

### Arquivos a alterar
- `src/pages/admin/EntidadesFilhoPage.tsx`
- `src/pages/admin/ProgramacaoPage.tsx`

### O que NÃO muda
- Estrutura do banco de dados.
- RLS/permissões no backend, exceto se a correção confirmar que há policy faltante para leitura da Entidade Pai; nesse caso será criada uma migration mínima apenas para corrigir essa permissão.
- Fluxo de criação de novas ações.
- Página de Registros, exceto pela sincronização indireta do registro vinculado ao editar pela Programação.

### Resultado esperado
- A inclusão de Entidade Filho deixa de falhar na busca do CODESC pai e mostra mensagens claras quando o CODESC não pertence ao escopo do usuário.
- A tela de Entidades Filho permite filtrar rapidamente por Entidade Pai.
- Na tela de Programação, usuários autorizados conseguem editar uma ação já programada diretamente pela visualização de calendário ou lista.
