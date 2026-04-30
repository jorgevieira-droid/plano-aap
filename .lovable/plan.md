## Diagnóstico

- A rota `/aap/registrar` aponta para `AAPRegistrarAcaoPage`, que está renderizando em branco (provavelmente bugada e desatualizada). No menu admin (Sidebar.tsx, linha 30) ela aparece como "Registrar Ação".
- A rota `/registros` aponta para `RegistrosPage`, que funciona corretamente, já tem:
  - Filtro por programa (`programaFilter`, linha 205) e filtro por hierarquia: Admin vê tudo, Manager (N2/N3) é filtrado por `gestorProgramas`, e operacionais (N4.1, N4.2, N5) caem no ramo `if (!isAdmin && !isManager)` (linha 321) que filtra pelos próprios registros.
  - Já está presente na sidebar de **todos os tiers**: admin (linha 45), manager — N2/N3 (linha 60), operational — N4.1/N4.2/N5 (linha 85), local — N6/N7 (linha 96) e observer — N8 (linha 109).
- A rota `/aap/historico` usa `RegistrosPage` (App.tsx linha 84) e duplica a entrada "Histórico" no menu operacional (Sidebar.tsx linha 78) — também redundante.

## Correções

### 1. `src/components/layout/Sidebar.tsx`
- Remover do `adminMenuItems` a entrada `{ FileText, 'Registrar Ação', '/aap/registrar' }` (linha 30).
- Remover do `operationalMenuItems` a entrada duplicada `{ ClipboardList, 'Histórico', '/aap/historico' }` (linha 78). A entrada "Registros" → `/registros` (linha 85) já cobre a função.
- Remover o ícone `FileText` do import se não for mais usado em outro item (verificar antes).

### 2. `src/App.tsx`
- Remover a linha 83: `<Route path="/aap/registrar" element={<AAPRegistrarAcaoPage />} />`.
- Remover a linha 84: `<Route path="/aap/historico" element={<RegistrosPage />} />` (a sidebar não aponta mais para ela; quem digitar a URL antiga cai em NotFound, comportamento aceitável).
- Remover o import `import AAPRegistrarAcaoPage from "./pages/aap/AAPRegistrarAcaoPage";` (linha 29).

### 3. `src/pages/aap/AAPRegistrarAcaoPage.tsx`
- Excluir o arquivo (não terá mais referências).

## Verificação de hierarquia/filtros (já implementada — sem alterações)

A `RegistrosPage` já aplica corretamente:
- **Admin / Gestor (N1)**: lê todos os registros.
- **N2/N3 (manager)**: filtra `registros_acao` cujo `programa` intersecta com seus programas atribuídos em `user_programas`/`gestor_programas`.
- **N4.1, N4.2, N5 (operational)**: query restrita a `aap_id = user.id` (linha 321). Mantém o controle de hierarquia esperado.
- Filtro de programa (`programaFilter`) já disponível na UI para todos.

Nenhuma migração de banco/RLS é necessária.