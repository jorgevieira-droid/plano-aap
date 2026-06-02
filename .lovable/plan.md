## Plano

### Contexto
A aba "Evolução Professor" depende de um formulário atualmente inativo. Deve ser ocultada para N2-N8 e mantida visível somente para N1 (Admin), marcada como "Desabilitada".

### Mudanças

**`src/components/layout/Sidebar.tsx`**
- Estender `MenuItem` com um campo opcional `disabled?: boolean` (apenas visual, para o badge).
- Remover o item "Evolução Professor" de:
  - `managerMenuItems` (N2/N3 — Gestor/Coordenador)
  - `operationalMenuItems` (N4/N5 — CPed/GPI/Formador, inclui rota `/aap/evolucao`)
  - `localMenuItems` (N6/N7 — Coord. Pedagógico/Professor)
  - `observerMenuItems` (N8 — Equipe Técnica)
- Em `adminMenuItems`, manter o item e marcar `disabled: true`.
- No render de cada `<Link>` do menu (linhas ~287-300), quando `item.disabled` for `true`, exibir um badge "Desabilitada" à direita do label (mesmo padrão visual do badge de pendências, usando `bg-muted text-muted-foreground` ou `bg-warning/20`).

**`src/pages/admin/EvolucaoProfessorPage.tsx`**
- Bloquear acesso direto via URL para não-Admins: adicionar `useEffect` que verifica `!isAdmin` e redireciona para `/unauthorized` via `useNavigate` (mesmo padrão usado em `RelatorioInstrumentosPage`).

### Arquivos
- `src/components/layout/Sidebar.tsx`
- `src/pages/admin/EvolucaoProfessorPage.tsx`

Sem alterações de banco ou rotas em `App.tsx` (a rota continua existindo para o Admin).
