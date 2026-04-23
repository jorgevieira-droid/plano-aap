

## Limitar opções de "Turma" às turmas dos atores da entidade selecionada

### Comportamento atual
Em `ProgramacaoPage` e `RegistrosPage`, o select de Turma (para `encontro_professor_redes`, `encontro_eteg_redes` e `encontro_microciclos_recomposicao`) é populado com **todas as turmas distintas de TODOS os atores ativos do sistema**, ignorando a entidade selecionada.

### Comportamento desejado
A lista de turmas no select deve ser carregada dinamicamente a partir dos atores ativos da **entidade (escola) selecionada** no agendamento/edição:
- Mostrar apenas as turmas distintas de `professores.turma_formacao` onde `escola_id = entidade selecionada` e `ativo = true`.
- Sempre incluir a opção **"Todas"** (valor vazio) no topo.
- Se a entidade não tiver nenhum ator com `turma_formacao` preenchida, exibir **somente "Todas"**.
- Se nenhuma entidade estiver selecionada, exibir somente "Todas".

### O que será alterado

**1. `src/pages/admin/ProgramacaoPage.tsx`**
- Substituir o `useEffect` que carrega `distinctTurmasFormacao` globalmente (linhas 413-427) por um efeito que depende de `formData.escolaId` e do tipo de ação ser um dos 3 tipos REDES/Microciclos.
- Query: `SELECT turma_formacao FROM professores WHERE escola_id = ? AND ativo = true AND turma_formacao IS NOT NULL`.
- Quando `escolaId` mudar, resetar `formData.turmaFormacao` para `""` (Todas) para evitar valor órfão.

**2. `src/pages/admin/RegistrosPage.tsx`**
- Mesma mudança no `useEffect` de `editDistinctTurmasFormacao` (linhas 458-472): passar a depender de `editEscolaId` + `editTipo`.
- Resetar `editTurmaFormacao` para `""` quando `editEscolaId` mudar (apenas em interação do usuário, não no carregamento inicial da edição — preservando o valor já gravado).

### O que NÃO muda
- Lógica de filtro da lista de presença pelo `turma_formacao` salvo (continua funcionando igual).
- Estrutura/labels do select e textos auxiliares.
- Banco de dados, RLS, demais campos do agendamento.

### Resultado esperado
- Ao escolher uma entidade, o dropdown de Turma passa a refletir apenas as turmas reais dos atores daquela entidade.
- Entidades sem atores com turma cadastrada mostram apenas "Todas" — evitando confusão com turmas que não pertencem à escola.

