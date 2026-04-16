

# Ajustar diálogos à resolução e restringir programas no cadastro de Atores

## Resumo

Duas correções: (1) garantir que todos os diálogos/formulários se ajustem à tela com scroll vertical, e (2) restringir os programas disponíveis no cadastro de Atores Educacionais aos programas do usuário logado.

## Alterações

### 1. `src/components/ui/dialog.tsx` — Classe base responsiva

Adicionar `max-h-[85vh] overflow-y-auto` ao `DialogContent` base, garantindo que **todos** os diálogos da aplicação respeitem a altura da tela e mostrem scrollbar quando necessário. Isso elimina a necessidade de ajustar cada dialog individualmente.

Linha 43 — alterar a classe base de:
```
"fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg ..."
```
para incluir:
```
"fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg max-h-[85vh] overflow-y-auto ..."
```

### 2. `src/pages/admin/ProfessoresPage.tsx` — Restringir programas ao usuário

Na seção de checkboxes de "Programas" (linha ~1222), filtrar a lista `['escolas', 'regionais', 'redes_municipais']` para mostrar apenas os programas que o usuário possui (`profile?.programas`), exceto para admins que veem todos.

**Antes:**
```tsx
{(['escolas', 'regionais', 'redes_municipais'] as ProgramaType[]).map(prog => (
```

**Depois:**
```tsx
{(['escolas', 'regionais', 'redes_municipais'] as ProgramaType[])
  .filter(prog => isAdminOrGestor || !profile?.programas || profile.programas.includes(prog))
  .map(prog => (
```

Também ajustar o `formData.programa` default ao abrir o diálogo para novo ator: pré-selecionar apenas os programas do usuário (em vez de `['escolas']` fixo).

### 3. Remover classes `max-h` / `overflow-y-auto` duplicadas dos dialogs individuais

Como a classe base já inclui `max-h-[85vh] overflow-y-auto`, remover duplicações em:
- `AAPsPage.tsx` (linha 356)
- `AtoresProgramaPage.tsx` (linhas 627, 714)
- Outros dialogs que já tinham essas classes

Isso padroniza o comportamento em toda a aplicação.

