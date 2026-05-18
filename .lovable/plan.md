## Contexto

Hoje, na página **Calendário/Programação**:
- **Editar Agendamento** (cadastro): já aparece para N2/N3 (e demais com permissão) em todos os status, inclusive `realizada`. ✓
- **Gerenciar** (formulário do instrumento): só aparece quando `status !== "realizada"`. Isso impede que N2/N3 reabram e editem o instrumento já preenchido a partir do Calendário.

Na página **Registros**, N2/N3 já conseguem reabrir o instrumento via `Gerenciar` (`canEdit` cobre `isManager`), e `handleOpenManage` já carrega as respostas existentes por `registro_acao_id`.

A matriz de permissões (`acaoPermissions.ts`) já dá `CRUD_PRG` para N2/N3 em praticamente todos os tipos. Mantemos as exceções atuais (`avaliacao_formacao_participante` e `participa_formacoes` continuam fora do alcance de N2/N3 — conforme escolha do usuário).

## Mudanças

### `src/pages/admin/ProgramacaoPage.tsx`

1. **Card do calendário (~linha 4302)** e **linha da tabela (~linha 4436)**: remover a condição `event.status !== "realizada"` / `prog.status !== "realizada"` do botão **Gerenciar**, deixando apenas `canEditProgramacao(...)`.
   - Resultado: para ações `realizada`, N2/N3 (e admin/owner) passam a ver os dois botões: **Gerenciar** (reabre formulário com dados preenchidos) e **Editar Agendamento** (cadastro).
   - O fluxo já existe: `handleEditAcaoClick` → quando `status === "realizada"`, chama `handleOpenEditRealizada` → `handleManageSubmit`, que roteia para o instrumento correto (instrumento padronizado, REDES, monitoramento regionais, consultoria, presença/avaliação) com as respostas existentes carregadas.

2. **Título do botão Gerenciar**: ajustar o `title` para algo como `"Editar formulário do instrumento"` quando `status === "realizada"` e manter `"Informar o acontecimento da ação"` para os demais — ou usar um título único `"Gerenciar / Editar formulário"`. (Detalhe pequeno; podemos padronizar como `"Gerenciar formulário"`.)

### Fora de escopo

- Matriz de permissões: nenhuma alteração. N2/N3 continuam **sem** permissão em `avaliacao_formacao_participante` e `participa_formacoes`.
- RegistrosPage: já funciona como esperado para N2/N3, sem mudanças.
- RLS no Supabase: já permite SELECT/UPDATE/INSERT/DELETE para N2/N3 nos instrumentos quando o registro pertence a um programa do usuário.
- Validação por programa do usuário no client: não é adicionada — a listagem já vem filtrada por RLS, então só aparecem ações dentro dos programas do N2/N3.

## Verificação após implementação

- Como N2/N3, na página Calendário, abrir uma ação `realizada` de programa do usuário → botão **Gerenciar** visível ao lado de **Editar Agendamento**.
- Clicar em **Gerenciar** → instrumento abre pré-preenchido com as respostas do autor original; salvar mantém alterações.
- Como N2/N3, ações de programa que **não** é do usuário não aparecem na lista (filtro por RLS).
- Tipos `avaliacao_formacao_participante` e `participa_formacoes` continuam sem botões de edição para N2/N3.
