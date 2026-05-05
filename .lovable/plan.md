## Contexto

Em `/relatorios` (`src/pages/admin/RelatoriosPage.tsx`) há dois problemas:

1. O filtro **"Ator do Programa"** (em `src/components/forms/FilterBar.tsx`) lista TODOS os atores do sistema, independente do escopo do usuário. Um N3 (Coordenador de Programa) deveria ver apenas atores cujos programas se cruzam com os seus; um N4–N5 apenas a si mesmo.
2. Os cards de **Instrumentos Pedagógicos** (Acompanhamento Professor Tutor, Encontro Formativo – Microciclos de Recomposição, Liderança Pedagógica – Gestores PEI, Observação – Engajamento e Solidez, Observação de Aula, PEC Qualidade de Aula, Qualidade da Implementação, Registro de Apoio Presencial, Sustentabilidade e Aprendizado do Programa) continuam aparecendo com médias mesmo quando os filtros (Componente, Ator do Programa, Entidade Filho) deveriam zerá-los. Causa: o hook `useInstrumentChartData` só recebe `escolaFilter`, `anoFilter`, `mesFilter`, `programaFilter` — ignora `aapId`, `componente` e `entidadeFilho`. Quando há 0 respostas após o filtro completo, ele continua usando o conjunto sem esses filtros.

## Mudanças

### 1. `src/hooks/useInstrumentChartData.ts`

Aceitar e aplicar mais filtros opcionais:

- Estender `filters` com:
  - `aapFilter?: string`
  - `componenteFilter?: string`
  - `entidadeFilhoEscolaId?: string`
- Buscar de `instrument_responses` também `aap_id`.
- Buscar de `registros_acao` também `componente, escola_id` (já busca `data, programa`).
- Aplicar:
  - `aapFilter !== 'todos'` → `r.aap_id === aapFilter`
  - `componenteFilter !== 'todos'` → `registro.componente === componenteFilter`
  - `entidadeFilhoEscolaId` → `registro.escola_id === entidadeFilhoEscolaId`
- Confirmar que cada `formType` só entra em `chartDataList` se houver `typeResponses.length > 0` E `dimensions.length > 0` (já é o caso → garante o "card some sem dados").
- Incluir os novos filtros em `queryKey`.

### 2. `src/pages/admin/RelatoriosPage.tsx`

Repassar os filtros novos para o hook (na chamada da linha 175):

```ts
useInstrumentChartData({
  escolaFilter: filters.escolaId,
  aapFilter: filters.aapId,
  componenteFilter: componenteFilter !== 'todos'
    ? componenteFilter
    : (filters.componente !== 'todos' ? filters.componente : undefined),
  anoFilter,
  mesFilter,
  programaFilter,
  entidadeFilhoEscolaId,
});
```

### 3. `src/components/forms/FilterBar.tsx` — escopo do filtro "Ator do Programa"

Restringir a lista por papel do usuário logado:

- Buscar `role` via `user_roles` (ou usar `useAuth().profile`).
- N1 (admin): mantém todos (comportamento atual).
- N2 (gestor) / N3 (coordenador de programa): filtrar `aaps` para apenas usuários cujos programas em `user_programas` intersectam com os do logado em `gestor_programas`/`user_programas`.
- N4–N5 (operacionais), N6–N7 (locais), N8 (observador): mostrar apenas a si mesmo (já que só veem os próprios dados / dados das suas escolas — o filtro extra não muda nada útil; reduzir a um único item evita confusão).
- Buscar a lista de programas do usuário e cruzar com `user_programas` para listar apenas atores compartilhando programa.

Implementação:

```ts
// dentro do fetchData de FilterBar
const { data: { user } } = await supabase.auth.getUser();
const { data: roleRow } = await supabase.from('user_roles').select('role').eq('user_id', user.id).maybeSingle();
const role = roleRow?.role;

const isAdmin = role === 'admin';
const isManagerScope = role === 'gestor' || role === 'n3_coordenador_programa';

let allowedActorIds: Set<string> | null = null; // null = sem restrição
if (!isAdmin) {
  // pegar programas do logado
  const { data: myPrograms } = await supabase.from('user_programas').select('programa').eq('user_id', user.id);
  const myProgs = (myPrograms || []).map(p => p.programa);
  if (isManagerScope) {
    const { data: peers } = await supabase.from('user_programas').select('user_id').in('programa', myProgs);
    allowedActorIds = new Set((peers || []).map(p => p.user_id));
  } else {
    allowedActorIds = new Set([user.id]);
  }
}

// aplicar:
let filteredActors = atorProfiles;
if (allowedActorIds) {
  filteredActors = atorProfiles.filter(p => allowedActorIds!.has(p.id));
}
setAaps(filteredActors);
```

(Mantém ordenação A–Z por nome em pt-BR já existente.)

### 4. Estado vazio

Confirmar que cada card só aparece com dados (já implementado na página e hook):
- Summary Cards e Previsto vs Realizado: filtram por `Previstas > 0 || Realizadas > 0`. ✓
- Presença por Escola: `presencaPorEscola.some(e => e.totalPresencas > 0)`. ✓
- Instrumentos Pedagógicos: `chartData.length === 0` retorna `null`; cada formType só entra se houver respostas e dimensões com `count > 0`. ✓ (passa a respeitar os novos filtros após mudança 1+2.)

## Observações

- Sem alterações de schema/RLS.
- O dropdown "Ator do Programa" continua com a opção "Todos" — N4–N8 verão apenas a si mesmo + "Todos" (que para eles é equivalente).
- Comportamento dos filtros Programa, Ano, Mês e Componente do topo permanece intacto.
