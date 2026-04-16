

User wants alphabetical (A-Z) ordering of "Ações/Eventos" and "Usuários" everywhere — both on-screen lists/tables and dropdowns. Already in Core memory: "Sort all action types and pedagogical instruments alphabetically using `localeCompare('pt-BR')`." So actions are partially done, but apparently not consistently. Users sorting may not exist yet.

Let me search for places that list actions and users to understand scope.

I'll plan based on the rule, and locate inconsistencies during implementation.

# Ordenação A-Z consistente para Ações/Eventos e Usuários

## Objetivo

Garantir que **toda lista** (tela e dropdown) de:
- **Ações/Eventos** (tipos de ação, programações, registros)
- **Usuários** (atores, AAPs, perfis, responsáveis, formadores, consultores, etc.)

esteja ordenada alfabeticamente A-Z usando `localeCompare('pt-BR')` (sensível a acentos).

## Escopo de varredura

Vou localizar e padronizar a ordenação nos seguintes pontos (lista preliminar — confirmarei cada um lendo os arquivos):

### Ações/Eventos
- Dropdowns de seleção de tipo de ação (agendamento, filtros)
- Tabela da Matriz de Ações
- Tabela de Registros
- Tabela de Programação
- Filtros por tipo de ação em Dashboard, Relatórios, Pendências, Histórico de Presença
- Configurar Formulário (lista de instrumentos)
- Permissões por ação (`AcaoPermissoes`)

### Usuários
- Página de Usuários (`/usuarios`)
- Página de Atores (`/atores`)
- Página de AAPs / Atores do Programa
- Página de Professores
- Dropdowns de "Responsável", "Consultor", "Formador", "GPI" em formulários de agendamento
- Filtros por usuário em Calendário, Relatórios, Dashboard
- Seleção de participantes em formulários (ex: Lista de Presença)
- Atribuição de entidades a usuários

## Abordagem técnica

Padrão único de ordenação:
```ts
.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }))
```

Para ações, usar o `label` do `ACAO_TYPE_INFO`:
```ts
.sort((a, b) => ACAO_TYPE_INFO[a].label.localeCompare(ACAO_TYPE_INFO[b].label, 'pt-BR'))
```

Quando a lista vier do banco, aplicar `.order('nome', { ascending: true })` na query do Supabase **e** um `.sort` defensivo no cliente (em caso de merges/junções).

## Plano de execução

1. **Auditoria** — varredura via `search_files` por:
   - `ACAO_TIPOS`, `ACAO_TYPE_INFO`, mapeamentos de tipo de ação
   - Queries `from('profiles')`, `from('user_roles')`, `from('user_entidades')`
   - Componentes `Select`/`Combobox` que listam usuários ou ações
   - Tabelas (`DataTable`) renderizando essas entidades

2. **Identificação** — listar onde a ordenação está ausente, parcial, ou usando `sort()` simples (não-locale).

3. **Padronização** — aplicar `localeCompare('pt-BR')` em todos os pontos identificados, tanto na query (quando cabível) quanto na renderização.

4. **Validação** — verificar que ordem persiste após filtros/refresh.

## Arquivos prováveis de edição

- `src/config/acaoPermissions.ts` (já parcialmente ordenado — confirmar consumidores)
- `src/pages/admin/UsuariosPage.tsx`, `AtoresProgramaPage.tsx`, `ProfessoresPage.tsx`, `AAPsPage.tsx`
- `src/pages/admin/MatrizAcoesPage.tsx`, `RegistrosPage.tsx`, `ProgramacaoPage.tsx`, `AdminDashboard.tsx`, `RelatoriosPage.tsx`, `PendenciasPage.tsx`, `HistoricoPresencaPage.tsx`
- `src/components/forms/FilterBar.tsx`
- Formulários em `src/components/formularios/*` (dropdowns de Consultor/Formador/GPI/responsável)
- Diálogos de seleção de participantes / atribuição de entidades

A lista exata será fechada na fase de auditoria.

## Resultado

Toda lista de Ações/Eventos e de Usuários renderizada na UI (tabelas, cards, selects, autocompletes, filtros) será exibida em ordem alfabética A-Z consistente, respeitando acentuação do português.

