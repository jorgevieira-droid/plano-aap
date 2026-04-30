## Objetivo

Inserir um novo gráfico de barras no Dashboard principal (`AdminDashboard`), na área sem card abaixo dos blocos existentes, exibindo por **Programa** (Escolas, Regionais, Redes Municipais) duas colunas lado a lado:

- **Cadastrados**: total de usuários atribuídos àquele programa
- **Ativos**: usuários daquele programa com pelo menos 1 acesso registrado nos últimos 7 dias

## Escopo dos usuários

Considerar **todos** os usuários do sistema com programa atribuído, unificando as três fontes:

- `user_programas` (N2-N8 hierarquia geral)
- `aap_programas` (Consultor/Gestor/Formador)
- `gestor_programas` (Gestor por programa)

Cada `user_id` será contado **uma única vez por programa** (deduplicação via `Set` por `programa + user_id`).

## Definição de "Ativo"

Usuário é considerado ativo quando existe ao menos 1 registro em `user_access_log` com `accessed_at >= now() - 7 days` para aquele `user_id`.

## Implementação

### 1. `src/pages/admin/AdminDashboard.tsx`

- Adicionar novo `useState`: `usuariosPorPrograma: { name: string; cadastrados: number; ativos: number }[]`.
- Em `fetchData` (ou função paralela), executar em paralelo via `Promise.all`:
  - `supabase.from('user_programas').select('user_id, programa')`
  - `supabase.from('aap_programas').select('aap_user_id, programa')`
  - `supabase.from('gestor_programas').select('gestor_user_id, programa')`
  - `supabase.from('user_access_log').select('user_id').gte('accessed_at', sevenDaysAgoISO)`
- Construir `Map<programa, Set<user_id>>` para cadastrados.
- Construir `Set<user_id>` de ativos (últimos 7 dias).
- Para cada programa em `['escolas','regionais','redes_municipais']`, calcular `cadastrados = set.size` e `ativos = [...set].filter(uid => activeSet.has(uid)).length`.
- Mapear chave para label amigável: Escolas, Regionais, Redes Municipais.

### 2. Renderização do bloco

Inserir como novo módulo do Dashboard (após "MÓDULO 3: Professores e Presença por Componente e Ciclo", antes de "MÓDULO 4"), seguindo o padrão visual existente (`bg-card rounded-xl border border-border p-6`). Usar `recharts` (já importado): `BarChart` vertical agrupado com 2 `Bar` (`cadastrados` e `ativos`).

```text
┌──────────────────────────────────────────────┐
│ Usuários por Programa (últimos 7 dias)       │
│                                              │
│ Escolas          ████████ 42  ████ 18        │
│ Regionais        ██████ 30    ██ 9           │
│ Redes Municipais ██████████ 55 ██████ 27     │
│                  ▇ Cadastrados ▇ Ativos      │
└──────────────────────────────────────────────┘
```

- `XAxis` numérico, `YAxis` categórico (programa) — consistente com os demais gráficos horizontais do dashboard.
- Cores: `hsl(var(--muted-foreground))` para Cadastrados, `hsl(var(--primary))` para Ativos (mesmo padrão do gráfico Previstas x Realizadas).
- `Tooltip` e `Legend` no padrão dos demais gráficos.
- Visibilidade controlada por `moduleVisibility` (adicionar flag `showUsuariosPrograma`, default `true`) — opcional, manter sempre visível se preferir simplicidade.

## Considerações

- **Permissões**: o módulo aparece apenas no `AdminDashboard` (rota admin), portanto roda com sessão N1 e tem acesso completo às 3 tabelas de programa e ao `user_access_log` via RLS.
- **Performance**: 4 queries leves em paralelo; `user_access_log` filtra por janela de 7 dias para reduzir payload.
- **Sem mudanças de schema**: usa apenas tabelas existentes.
- Não altera `/aaps` nem outras páginas.
