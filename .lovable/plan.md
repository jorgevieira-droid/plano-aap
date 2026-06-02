## Objetivo
Para **Observação de Aula (GPA)**, remover o seletor de Entidade Filho do agendamento e movê-lo para dentro do formulário de execução (gerenciamento) como **campo obrigatório**.

## Mudanças

### 1. `src/pages/admin/ProgramacaoPage.tsx`
- Remover `'observacao_aula_gpa'` de `needsEntidadeFilho` (volta a ser apenas REDES + formação regionais).
- Remover `'observacao_aula_gpa'` da condição de renderização do seletor "Escola" no diálogo de agendamento.
- No diálogo de execução do GPA, deixar de passar `nomeEscola` (o form passa a controlar internamente).

### 2. `src/pages/admin/RegistrosPage.tsx`
- Remover `'observacao_aula_gpa'` de `editNeedsEntidadeFilho` e da renderização do seletor no formulário de edição da programação.
- No diálogo de execução do GPA, deixar de passar `nomeEscola`.

### 3. `src/components/formularios/ObservacaoAulaGpaForm.tsx`
- Receber as novas props: `escolaPaiId` (id da Entidade Pai) e `registroAcaoId` (já existe). Remover/ignorar prop `nomeEscola`.
- Buscar `entidades_filho` ativas vinculadas a `escolaPaiId` via Supabase.
- Substituir o `Input` desabilitado "Nome da Escola" por um `Select` obrigatório:
  - Placeholder: "Selecione a escola"
  - Validação Zod: obrigatório (mensagem "Escola é obrigatória").
- Ao salvar/enviar, persistir:
  - `nome_escola` = label da entidade filho selecionada (mantém compatibilidade com PDF/relatórios).
  - `entidade_filho_id` na tabela `observacoes_aula_gpa` (nova coluna — ver migração) e refletir no `registros_acao.entidade_filho_id` (já existente) para que filtros e relatórios continuem coerentes.
- Pré-carregar o valor a partir de `registros_acao.entidade_filho_id` em edições subsequentes.

### 4. Migração de banco
- Adicionar coluna `entidade_filho_id uuid` em `public.observacoes_aula_gpa` (nullable; sem FK forte para evitar bloqueio de exclusões). Indexar.
- Não altera RLS.

### 5. Persistência cruzada
- Ao salvar o formulário, atualizar também `registros_acao.entidade_filho_id` com a entidade filho escolhida (chave já existente na tabela). Isso garante que filtros/relatórios usem o mesmo identificador.

## Comportamento esperado
- No agendamento do GPA, o usuário escolhe apenas a **Entidade Pai** (rede/regional/escola).
- Ao abrir "Gerenciar", o formulário exige a seleção da **Escola** (entidade filho ativa da rede selecionada) antes de permitir o envio.
- O nome da escola escolhida aparece corretamente no formulário e no PDF; o slug do arquivo PDF (já baseado em `escolaNome`) continua refletindo a Entidade Pai (sem mudança aqui).

## Fora do escopo
- Alteração no slug do PDF.
- Mudanças em outras ações.
