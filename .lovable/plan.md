## Ajuste

Trocar o destino do clique em "Editar Agendamento" para abrir o **formulário do instrumento** da ação (já pré-preenchido), em vez do diálogo genérico de cadastro de agendamento.

## Mudanças

### `src/pages/admin/ProgramacaoPage.tsx`

Nos dois pontos onde o botão "Editar Agendamento" é renderizado (Calendário e Lista), trocar:

```tsx
onClick={() => handleOpenEditProgramacao(prog)}
```
por
```tsx
onClick={() => handleEditAcaoClick(prog)}
```

Assim o botão usa o mesmo roteador do "Gerenciar":
- `realizada` → `handleOpenEditRealizada` → dispara `handleManageSubmit`, que abre o formulário do instrumento (Observação / Formação / Consultoria / Monitoramento / Apoio Presencial / etc.) com os dados existentes carregados.
- `prevista` → `handleOpenManageDialog` (passa pela pergunta "ação realizada?" antes de abrir o instrumento).
- `cancelada` → `handleOpenEditProgramacao` (não há instrumento; cai no cadastro do agendamento).

Remover o `useEffect` do query param `editAgendamento` e o import `useSearchParams` (agora desnecessários).

### `src/pages/admin/RegistrosPage.tsx`

O botão "Editar Agendamento" passa a chamar `handleOpenManage(registro)` diretamente — mesma função usada por "Editar Formulário", que já carrega o instrumento prefilled. Remover o uso de `useNavigate`.

## Considerações

- "Gerenciar" e "Editar Agendamento" passam a abrir o mesmo fluxo, conforme escolhido. Mantemos os dois botões visíveis (escolha do usuário).
- Não há mudanças de banco/RLS.