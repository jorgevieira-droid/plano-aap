## Objetivo

Disponibilizar a seleção de **Entidade Filho (Nome da Escola)** no gerenciamento da ação **Observação de Aula (GPA)** (Programação e Registros), filtrada pela **Entidade Pai** (rede/regional) já escolhida. O nome da escola filho selecionado deve aparecer também no formulário de execução e no PDF, no lugar do nome da rede que hoje é replicado.

## Mudanças

### 1. `src/pages/admin/ProgramacaoPage.tsx`
- Adicionar `'observacao_aula_gpa'` na lista `needsEntidadeFilho` (linha ~527), para que as entidades filho sejam buscadas quando a Entidade Pai for selecionada.
- Adicionar `'observacao_aula_gpa'` na condição de renderização do seletor "Escola" (linha ~3532), reaproveitando o mesmo `<select>` já existente (vinculado a `formEscolaFilhoId` / `entidadesFilho`).
- Na abertura do diálogo de execução do GPA (linha ~5565), passar `nomeEscola` a partir da entidade filho vinculada à programação quando existir; caso contrário, manter o nome da Entidade Pai como fallback.

### 2. `src/pages/admin/RegistrosPage.tsx`
- Adicionar `'observacao_aula_gpa'` na lista `editNeedsEntidadeFilho` (linha ~491).
- Adicionar `'observacao_aula_gpa'` na condição de renderização do seletor "Escola" em edição (linha ~2626).
- Ao montar o `ObservacaoAulaGpaForm` (linha ~3323), passar `nomeEscola` derivado da entidade filho da programação/registro quando existir.

### 3. PDF / Print
- Nenhum ajuste estrutural necessário: `ObservacaoAulaGpaPrintSection` já lê `nome_escola` do registro. Como `nome_escola` passa a ser preenchido com o nome da Entidade Filho selecionada no formulário, o PDF refletirá automaticamente o valor correto.
- O slug do nome do arquivo PDF já inclui `escolaNome` (parente). Opcional: anexar também o nome da entidade filho se presente — confirmar se desejado.

## Comportamento esperado

- Ao agendar/editar uma Observação de Aula (GPA) para uma rede com entidades filho cadastradas, o usuário verá um seletor **"Escola"** (entidade filho), desabilitado até a Entidade Pai ser escolhida e populado apenas com filhos ativos daquela rede.
- O valor selecionado é persistido em `programacoes.entidade_filho_id` (coluna já existente, sem necessidade de migração).
- No formulário de execução, o campo "Nome da Escola" exibirá o nome da entidade filho.
- O PDF gerado refletirá o mesmo nome de escola.

## Fora do escopo
- Tornar o campo obrigatório (mantém comportamento atual — opcional).
- Alterações no fluxo de outras ações.
