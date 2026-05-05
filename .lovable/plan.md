## Contexto

Em `/relatorios`, os filtros do topo (Programa, Entidade Filho) e o `FilterBar` (Escola, Ator do Programa) ainda exibem opções fora do escopo do usuário, e a página só restringe dados para `isGestor` e `isAAP`. Outros papéis (N3 Coordenador, N4–N8) precisam seguir a mesma hierarquia já estabelecida.

Hierarquia de visibilidade já vigente no projeto:
- N1 admin → tudo.
- N2 gestor / N3 coordenador → restrito aos `programas` em `gestor_programas` (N2) e `user_programas` (N3).
- N4–N5 operacionais (CPed, GPI, Formador, AAPs) → restritos às `user_entidades` (escolas) e a si mesmos.
- N6–N7 locais → escolas em `user_entidades`.
- N8 observador → programas em `user_programas`.

## Mudanças

### 1. `src/pages/admin/RelatoriosPage.tsx`

**a) Calcular `userPrograms` para qualquer papel não-admin** (não apenas `isGestor`/`isAAP`). Após a lógica atual, sempre cruzar com `user_programas` do usuário logado:

```ts
const { data: ups } = await supabase.from('user_programas').select('programa').eq('user_id', profile.id);
const fromUp = (ups || []).map(u => u.programa as ProgramaTypeDB);
userPrograms = [...new Set([...userPrograms, ...fromUp])];
```

**b) Restringir o dropdown "Programa"** para mostrar só os programas em `userProgramas` quando o usuário não é admin (linha ~1057):

```tsx
{Object.entries(programaLabels)
  .filter(([value]) => isAdmin || userProgramas.length === 0 || userProgramas.includes(value as ProgramaTypeDB))
  .map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
```

E pré-selecionar o único programa quando `userProgramas.length === 1` (regra "Program Selection Logic").

**c) Restringir lista de Entidades Filho** ao subset de escolas visíveis (`filteredEscolasData`) — a `entidadesFilhoRes` hoje vem completa. Aplicar:

```ts
const visibleEscolaIds = new Set(filteredEscolasData.map(e => e.id));
const filteredEntidadesFilho = (entidadesFilhoRes.data || [])
  .filter(e => visibleEscolaIds.has(e.escola_id));
setEntidadesFilho(filteredEntidadesFilho.map(...));
```

Para isso, antes de setar precisamos garantir `filteredEscolasData` também restrito por programa para os papéis N3/N8 (hoje só restringe via gestor/AAP). Adicionar bloco:

```ts
if (!isAdmin && !isGestor && !isAAP && userPrograms.length > 0) {
  filteredProgramacoesData = filteredProgramacoesData.filter(p => p.programa?.some(prog => userPrograms.includes(prog as ProgramaTypeDB)));
  filteredRegistrosData = filteredRegistrosData.filter(r => r.programa?.some(prog => userPrograms.includes(prog as ProgramaTypeDB)));
  filteredEscolasData = filteredEscolasData.filter(e => e.programa?.some(prog => userPrograms.includes(prog as ProgramaTypeDB)));
  const visibleSchoolIds = new Set(filteredEscolasData.map(e => e.id));
  filteredAvaliacoesData = filteredAvaliacoesData.filter(a => visibleSchoolIds.has(a.escola_id));
}
```

(RLS já restringe no servidor, mas garantir consistência client-side dos filtros/dados; reusa o conjunto que será usado por Entidades Filho.)

### 2. `src/components/forms/FilterBar.tsx`

**a) Restringir lista de Escolas** ao escopo do usuário:
- N1 admin: tudo.
- N2/N3: escolas cujo `programa` intersecta com `user_programas` do logado (`user_has_escola_via_programa` lógica espelhada client-side).
- N4–N7: escolas em `user_entidades` do logado.
- N8: escolas cujo `programa` intersecta com `user_programas` do logado.

Implementação: buscar `user_programas` do logado e `user_entidades` do logado. Se admin, manter todas. Caso contrário:

```ts
if (isOperationalOrLocal) {
  const { data: ents } = await supabase.from('user_entidades').select('escola_id').eq('user_id', user.id);
  const ids = new Set((ents||[]).map(e=>e.escola_id));
  escolasFiltered = escolasFiltered.filter(e => ids.has(e.id));
} else if (isManagerOrObserver) {
  const myProgs = (await supabase.from('user_programas').select('programa').eq('user_id', user.id)).data?.map(p=>p.programa) || [];
  // need escolas.programa — refetch with programa column
  const { data: escolasFull } = await supabase.from('escolas').select('id, nome, programa').eq('ativa', true).order('nome');
  escolasFiltered = (escolasFull||[]).filter(e => (e.programa||[]).some((p:string) => myProgs.includes(p)));
}
```

(Reaproveita o `roleRes` já buscado.)

**b) Lista de Atores** já foi restrita na rodada anterior — manter.

### 3. Hook `useInstrumentChartData` 

Já recebe `programaFilter` (do dropdown da página, agora restrito). Como o RLS limita `instrument_responses` no servidor, nenhuma mudança extra necessária.

## Observações

- Sem alteração de schema/RLS.
- Comportamento alinhado à hierarquia já documentada na memória do projeto.
- Após a aprovação, aplico tudo num único turno.
