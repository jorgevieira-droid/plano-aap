## Objetivo

Garantir que o botão "Editar Agendamento" — tanto na página Calendário/Programação quanto na página Registros — abra o **formulário de cadastro da ação** (data, horário, escola, ator, programa, etc.), e não o formulário do instrumento/realização.

## Situação atual

- **ProgramacaoPage** (`src/pages/admin/ProgramacaoPage.tsx`, linhas 4293 e 4427): o botão "Editar Agendamento" chama `handleOpenEditRealizada`, que abre o formulário da ação realizada (instrumento pré-preenchido), não o cadastro.
- **RegistrosPage** (`src/pages/admin/RegistrosPage.tsx`, linha 1556): o botão "Editar Agendamento" chama `handleOpenManage`, que é o mesmo handler do botão "Editar Formulário". Também não abre o cadastro.
- Já existe `handleOpenEditProgramacao(prog)` em ProgramacaoPage que abre corretamente o dialog de cadastro da programação.

## Mudanças

### 1. ProgramacaoPage.tsx
Trocar os dois `onClick` do botão "Editar Agendamento" (linhas ~4293 e ~4427) de `handleOpenEditRealizada(event)` / `handleOpenEditRealizada(prog)` para `handleOpenEditProgramacao(event)` / `handleOpenEditProgramacao(prog)`. Ajustar o `title` para "Editar o cadastro da ação".

### 2. Deep-link em ProgramacaoPage
Adicionar suporte ao query param `?editProgramacao={id}`:
- Ler `useSearchParams` no início do componente.
- Em `useEffect`, quando o param estiver presente e a lista `programacoes` já carregada, localizar o registro pelo id, chamar `handleOpenEditProgramacao(prog)` e limpar o param da URL para evitar reabertura.

### 3. RegistrosPage.tsx
Alterar o handler do botão "Editar Agendamento" (linha 1555-1561):
- Em vez de `handleOpenManage(registro)`, navegar via `useNavigate()` para `/programacao?editProgramacao={registro.programacao_id}`.
- O botão segue condicionado a `registro.programacao_id` existir e a `canEdit(registro)`.

## Fora de escopo

- Permissões, RLS, alterações no formulário de cadastro em si.
- Alterações no botão "Editar Formulário" (continua abrindo `handleOpenManage`).
- Mudanças visuais além do `title` do botão.
