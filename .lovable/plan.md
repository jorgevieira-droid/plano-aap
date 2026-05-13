## Objetivo

Permitir que "Editar Agendamento" — que abre o formulário de cadastro com todos os dados pré-preenchidos para alterar data, horário, escola, responsável, etc. — esteja disponível em **todas** as ações:

1. Em **Programação → Calendário/Lista**, hoje só aparece quando `status === "prevista"`. Deve aparecer para ações **previstas, realizadas e canceladas**.
2. Em **Registros de Ações**, hoje só existe "Editar Formulário" e "Editar Presenças". Deve ser adicionado também o botão "Editar Agendamento".

## Mudanças

### 1) `src/pages/admin/ProgramacaoPage.tsx`

Remover a restrição `prog.status === "prevista"` dos dois pontos onde o botão "Editar Agendamento" é renderizado (visões Calendário linhas ~4199 e Lista linhas ~4333). Manter o gate de permissão `canEditProgramacao(prog)`.

```tsx
{canEditProgramacao(prog) && (
  <Button variant="ghost" size="sm" onClick={() => handleOpenEditProgramacao(prog)} title="Editar dados do agendamento (data/horário/escola)">
    <Edit size={14} className="mr-1" />
    Editar Agendamento
  </Button>
)}
```

A função `handleOpenEditProgramacao` já carrega todos os dados da programação no formulário e abre o dialog — não precisa mudança.

### 2) `src/pages/admin/RegistrosPage.tsx`

Adicionar, na coluna de ações da tabela (junto a "Editar Presenças" / "Editar Formulário"), um botão **"Editar Agendamento"** (ícone `CalendarClock`) que aparece quando `registro.programacao_id` existe e o usuário tem permissão de edição (`canEdit(registro)`).

O clique navega para `/programacao?editAgendamento=<programacao_id>`, usando `useNavigate` do react-router-dom.

```tsx
{registro.programacao_id && (
  <button
    onClick={() => navigate(`/programacao?editAgendamento=${registro.programacao_id}`)}
    className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
    title="Editar Agendamento"
  >
    <CalendarClock size={16} />
  </button>
)}
```

### 3) `src/pages/admin/ProgramacaoPage.tsx` — abrir dialog automaticamente via query param

Adicionar um `useEffect` que escuta `useSearchParams`:
- Se `editAgendamento=<id>` estiver presente e a lista `programacoes` já carregada, localiza a programação pelo id, chama `handleOpenEditProgramacao(prog)` e remove o parâmetro da URL para evitar reabertura.
- Se a programação não existe (foi excluída), exibe um `toast.error` e limpa o parâmetro.

## Considerações

- Editar Agendamento de uma ação **realizada** ou **cancelada** altera apenas os dados da programação (data, horário, escola, responsável, segmento, etc.). Não muda o status nem mexe no `registro_acao` vinculado, exceto pelos campos que `handleOpenEditProgramacao` já reaproveita (observações/avancos/dificuldades). É o mesmo comportamento já existente — apenas habilita-se para mais status.
- Permissões continuam controladas por `canEditProgramacao` (matriz N1-N8 + `created_by`/`aap_id`) na Programação e por `canEdit` no Registros.
- Nenhuma migração de banco ou alteração de RLS é necessária.