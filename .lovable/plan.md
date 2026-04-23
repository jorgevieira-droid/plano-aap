

## Adicionar campo "Turma" (opcional) ao agendamento de "Encontro Formativo – Microciclos de Recomposição"

### Contexto
Hoje a ação `encontro_microciclos_recomposicao` não exibe o campo **Turma** no cadastro e a lista de presença usa todos os atores da entidade. O pedido reverte parcialmente isso: adicionar a seleção de **Turma** (não obrigatória) que referencia `professores.turma_formacao`, mantendo o mesmo padrão já usado em "Encontro Professor REDES" e "Encontro ET/EG REDES".

### O que será alterado

**1. Formulário de agendamento (`src/pages/admin/ProgramacaoPage.tsx`)**
- Incluir `encontro_microciclos_recomposicao` na condição que renderiza o select de **Turma de Formação** (linha ~3165), usando a mesma lista `distinctTurmasFormacao` já carregada de `professores`.
- Texto do label: "Turma" — opção padrão "Todas" (vazio = sem filtro), não obrigatório.
- Texto auxiliar: "Filtra participantes pela turma na lista de presença".
- Atualizar o `INSERT` em `programacoes` (linha ~1039) para também gravar `turma_formacao` quando o tipo for `encontro_microciclos_recomposicao`.

**2. Edição da programação (`src/pages/admin/RegistrosPage.tsx`)**
- Onde já existe o bloco condicional para Local nos tipos REDES (linha ~2575), adicionar também o select de Turma para `encontro_microciclos_recomposicao`, espelhando o comportamento dos outros encontros REDES.

**3. Lista de presença filtrada por turma (`src/pages/admin/ProgramacaoPage.tsx`)**
- Na query de carregamento de professores para presença (linha ~1339), o tratamento `isRedesTipo` já cobre os 3 tipos REDES — basta garantir que `encontro_microciclos_recomposicao` esteja no conjunto `isRedesTipo`. Verificar o local onde `isRedesTipo` é definido e incluir o tipo se faltar.
- Comportamento esperado: se `turma_formacao` na programação estiver preenchida → filtra `professores.turma_formacao IN (...)`; se vazia → mostra todos os atores da entidade (comportamento atual).

**4. Memória do projeto**
- Atualizar `mem://features/action-types/encontro-microciclos-recomposicao` removendo a frase "campo TURMA desconsiderado conforme pedido" e registrando que o campo Turma agora existe no agendamento (opcional) e filtra a lista de presença, igual aos demais encontros REDES.

### O que NÃO muda
- Banco de dados: a coluna `programacoes.turma_formacao` já existe (text nullable). **Nenhuma migration necessária.**
- Estrutura do formulário de registro do encontro (`EncontroMicrociclosForm`).
- Permissões / RLS.
- Demais campos do agendamento (Local, Programa, Formador, etc.).

### Resultado esperado
- Ao agendar "Encontro Formativo – Microciclos de Recomposição", o usuário verá o campo **Turma** (opcional) com as turmas distintas dos atores cadastrados.
- Se selecionada, a lista de presença passa a exibir somente atores daquela turma. Se deixada em "Todas", mantém o comportamento atual (todos os atores da entidade).
- Funciona também ao editar uma programação existente.

