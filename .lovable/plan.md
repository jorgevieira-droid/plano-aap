# Simulação de Programa para Admin

Hoje o Admin pode simular outros perfis (ex.: N3 Coordenador), mas a simulação assume sempre o "programa" do próprio Admin (visualização agregada). Como muitas telas (Dashboard, Relatórios, Entidades, Calendário) renderizam blocos diferentes por programa (Escolas, Regionais, Redes Municipais), o Admin precisa também simular um programa específico para ver exatamente o que um usuário daquele programa veria.

## O que muda

### 1. `AuthContext` — novo estado de simulação

- Adicionar `simulatedPrograma: ProgramaType | null` e `setSimulatedPrograma`.
- Adicionar `effectiveProgramas: ProgramaType[] | undefined`:
  - Se `isSimulating && simulatedPrograma` → `[simulatedPrograma]`.
  - Caso contrário → `profile?.programas`.
- Limpar `simulatedPrograma` automaticamente quando `simulatedRole` voltar para `null` (sair da simulação).

### 2. `Sidebar` — UI da simulação

Logo abaixo do select "Simular perfil", adicionar um segundo select "Simular programa" (visível apenas quando `isRealAdmin` e `simulatedRole` já estiver selecionado):

- Opções: "Todos os programas (admin)", "Escolas", "Regionais de Ensino", "Redes Municipais".
- Atualiza `setSimulatedPrograma`.
- O título do header (`getProgramLabel`) passa a refletir o programa simulado.

### 3. Páginas que dependem de `userProgramas`

Substituir a leitura local de `userProgramas` (vinda do DB) pelo `effectiveProgramas` do contexto **quando estiver simulando**, mantendo o fetch original como fonte para usuários reais. Padrão:

```ts
const programasEfetivos = isSimulating && simulatedPrograma
  ? [simulatedPrograma]
  : userProgramas;
```

Aplicar em:

- `src/pages/admin/AdminDashboard.tsx` — usar `programasEfetivos` no auto-select do `programaFilter`, no select "Programa" e nas filtragens visuais já condicionadas a `userProgramas`.
- `src/pages/admin/RelatoriosPage.tsx` — idem (auto-select + opções do select).
- `src/pages/admin/EntidadesFilhoPage.tsx` — usar `programasEfetivos` no `showProgramaFilter` e auto-seleção.
- `src/pages/admin/ProgramacaoPage.tsx` (calendário), `src/pages/admin/EscolasPage.tsx` e demais páginas que já chavem por `userProgramas`/`isAdmin` para esconder/mostrar blocos: aplicar a mesma substituição.

Nenhuma alteração em RLS/SQL: a simulação é apenas client-side (já é assim para perfil). O Admin continua tendo acesso aos dados; os filtros visuais é que se restringem ao programa simulado.

### 4. `ProtectedRoute` / permissões

Sem mudanças. A camada de permissão por ação continua usando `effectiveRole`. A simulação de programa só afeta as visualizações condicionadas a programa.

## Detalhes técnicos

- `ProgramaType` já está exportado do `AuthContext`.
- `useAcoesByPrograma` já recebe `programa` por parâmetro nas páginas — não precisa mudar.
- O select de programa simulado fica desabilitado quando `simulatedRole === null` (faz sentido apenas dentro de uma simulação de perfil), com tooltip "Selecione um perfil para simular".
- Persistência: manter em memória (igual à simulação de perfil hoje); reset ao recarregar a página.
