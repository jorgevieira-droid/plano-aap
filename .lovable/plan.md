## Plano de correção

1. **Ajustar o salvamento do Instrumento Pedagógico**
   - Em `ProgramacaoPage.tsx`, trocar o salvamento atual por lógica de atualização/criação.
   - Se já existir resposta em `instrument_responses` para o `registro_acao_id` + `form_type`, atualizar a resposta existente.
   - Se não existir, criar a resposta normalmente.
   - Isso evita duplicidades e garante que uma ação realizada editada mantenha o mesmo formulário preenchido.

2. **Tratar ação realizada sem formulário salvo**
   - Para a ação informada (`Acompanhamento Indicadores Mensais`, 08/05/2026, `LUIS GONZAGA TRAVASSOS DA ROSA`), confirmei que ela está como `realizada`, mas não possui registro em `instrument_responses`.
   - Por isso o formulário abre em branco: existe o registro da ação, mas não existe o formulário preenchido salvo no banco para essa ação.
   - Vou manter a abertura do instrumento correto (`qualidade_implementacao`) para permitir preenchimento/edição, e salvar esse formulário na mesma ação realizada.

3. **Melhorar o carregamento no Editar Agendamento**
   - Ao clicar em `Editar Agendamento`, buscar o registro realizado vinculado à programação e carregar as respostas existentes quando houver.
   - Se não houver respostas, abrir o instrumento correto vazio, sem quebrar o fluxo.

4. **Validar o fluxo específico**
   - Verificar que a ação `Acompanhamento Indicadores Mensais` continua abrindo o formulário de `Qualidade da Implementação`.
   - Depois que o usuário preencher e salvar, uma nova abertura em `Editar Agendamento` deverá carregar os dados preenchidos.