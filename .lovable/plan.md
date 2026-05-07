## Contexto

A ação **"Observação de Aula - REDES"** (`observacao_aula_redes`) tem dois problemas:

1. **Nome do Professor não fica acessível na edição.** O formulário em si (`ObservacaoAulaRedesForm.tsx`) já tem o campo `nome_professor`, mas o diálogo de **edição/gerenciamento** em `RegistrosPage.tsx` (que é o ponto onde o coordenador organiza a ação) não exibe esse input — só mostra Escola, Ano/Série e Turma. Precisamos adicionar um input de texto livre lá.

2. **Os campos qualitativos não abrem no "Gerenciar".** Hoje, ao clicar em **Gerenciar** numa ação `observacao_aula_redes`, o sistema cai no diálogo genérico **"Gerenciar Presenças"** (linha 1849 do `RegistrosPage.tsx`), que só lista professores. O usuário esperava abrir o **formulário REDES completo** com os 9 critérios, evidências e os 4 campos qualitativos (Pontos Fortes, Aspectos a Fortalecer, Estratégias Sugeridas, Combinação para Acompanhamento). Esses campos existem no formulário, na tabela `observacoes_aula_redes`, mas não são acessíveis via "Gerenciar".

## O que muda

### 1. Campo "Nome do Professor" no diálogo de edição (`RegistrosPage.tsx`)

- Adicionar estado `editNomeProfessor` (string).
- No bloco "Ano/Série e Turma - observacao_aula_redes" (linha 2310), incluir um terceiro input `<Input>` chamado **"Nome do Professor(a)"** (texto livre, opcional).
- Pré-popular via `openEditDialog` lendo da última `observacoes_aula_redes` vinculada ao `registro_acao_id` da ação (busca por `registro_acao_id` na tabela; se não existir registro ainda, deixar vazio).
- Ao salvar a edição, fazer `upsert` em `observacoes_aula_redes` apenas com `nome_professor` quando o valor for alterado e já existir registro; quando não houver registro de observação ainda, salvar somente quando o usuário preencher (cria stub `status='rascunho'`).

### 2. "Gerenciar" da Observação REDES abre o formulário completo

Hoje o roteamento do botão Gerenciar é binário: `acompanhamento_aula` abre dialog de avaliação; tudo o mais cai em **Gerenciar Presenças**. Vamos adicionar um terceiro caso para `observacao_aula_redes`.

- Criar um novo dialog `Dialog open={isManaging && selectedRegistro?.tipo === 'observacao_aula_redes'}` no `RegistrosPage.tsx`, ao lado dos dois existentes.
- Conteúdo do dialog: renderizar o componente `ObservacaoAulaRedesForm` já existente (`src/components/formularios/ObservacaoAulaRedesForm.tsx`) dentro de `<DialogContent className="w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">`.
- Para reaproveitar o formulário no fluxo de gerenciamento (que pode ter um rascunho/registro existente), estender o `ObservacaoAulaRedesForm` com 2 props opcionais novas:
  - `existingRegistroId?: string` — quando informado, faz `select` em `observacoes_aula_redes` filtrando por `registro_acao_id` (com `.maybeSingle()`) e aplica `form.reset(...)` com os valores salvos.
  - `registroAcaoId?: string` — usado no `persist` para gravar `registro_acao_id` no insert/upsert. Trocar `insert` por **upsert** baseado em `registro_acao_id` quando esse id estiver presente, evitando duplicatas a cada "Salvar".
- Adicionar a coluna `registro_acao_id uuid` em `observacoes_aula_redes` (migration), com índice único parcial para suportar o upsert. Backfill não é necessário (registros antigos ficam órfãos).
- Excluir do diálogo de "Gerenciar Presenças" o tipo `observacao_aula_redes` (alterar a condição `open={isManaging && selectedRegistro?.tipo !== 'acompanhamento_aula'}` para também excluir `observacao_aula_redes`).

### 3. Garantir que o PDF da ação (print) já inclua os 4 campos qualitativos da REDES

Ao corrigir o item 2, o registro passa a existir em `observacoes_aula_redes` com `registro_acao_id`. Atualizar `src/components/print/AcaoPrintDialog.tsx` para, quando `formType === 'observacao_aula_redes'`, ler os 4 campos qualitativos + `nome_professor` da tabela e adicioná-los a `textFields` (Pontos Fortes / Aspectos a Fortalecer / Estratégias Sugeridas / Combinação para Acompanhamento), usando o mesmo padrão do bloco `consultoria_pedagogica_respostas`. Quando a ação ainda não foi realizada, esses campos seguem aparecendo em branco no PDF (pois `textFields` já renderiza `<Blank />` quando vazio).

## Detalhes técnicos

- **Tabela:** `observacoes_aula_redes` já tem todas as colunas necessárias (`nome_professor`, `pontos_fortes`, `aspectos_fortalecer`, `estrategias_sugeridas`, `combinacao_acompanhamento`). Falta só `registro_acao_id` e índice único parcial:
  ```sql
  ALTER TABLE observacoes_aula_redes ADD COLUMN registro_acao_id uuid;
  CREATE UNIQUE INDEX observacoes_aula_redes_registro_acao_uniq
    ON observacoes_aula_redes(registro_acao_id) WHERE registro_acao_id IS NOT NULL;
  ```
- **RLS:** a policy atual de `observacoes_aula_redes` (`Authenticated users can manage observacoes_aula_redes`) já cobre todos os roles autenticados, então não precisa alterar.
- **Reuso:** `ObservacaoAulaRedesForm` segue funcionando no fluxo de criação atual (props novas são opcionais). Quando `existingRegistroId` é fornecido o componente entra em modo "edição".
- **Persistência idempotente:** `persist` usa `.upsert(payload, { onConflict: 'registro_acao_id' })` quando `registroAcaoId` está presente; senão mantém `.insert`.
- **Não há mudança em RLS, types do Supabase serão regenerados automaticamente após a migration.**
