## Diagnóstico

A tabela `programacoes` tem **1.126 registros**, mas o calendário em `/programacao` usa:

```ts
supabase.from("programacoes").select("*").order("data", { ascending: true })
```

O PostgREST/Supabase aplica um limite padrão de **1000 linhas por requisição**. Como o `order` é ascendente por `data`, as ações mais recentes (junho/2026 em diante) ficam fora desse corte — por isso o dia 10/06 aparece vazio no calendário, mesmo havendo ações cadastradas (como as "Formação GPA | Bertioga" e "Formação GPA | Pinhal" visíveis na Lista de Presença, que usa outra query).

Para o N1 (admin), o RLS não filtra nada — então a única causa do "sumiço" é o teto de 1000 linhas.

## Correção

Em `src/pages/admin/ProgramacaoPage.tsx`, função `fetchProgramacoes` (linhas 586-599):

- Buscar em páginas de 1000 com `.range(from, to)` em loop, até esgotar.
- Concatenar e setar `setProgramacoes(all)`.

Mantém o resto da página intocado (filtros, manipulação, useEffect com `currentMonth` continuam iguais).

### Pseudocódigo

```ts
const PAGE = 1000;
let all: ProgramacaoDB[] = [];
let from = 0;
while (true) {
  const { data, error } = await supabase
    .from("programacoes")
    .select("*")
    .order("data", { ascending: true })
    .range(from, from + PAGE - 1);
  if (error) throw error;
  if (!data || data.length === 0) break;
  all = all.concat(data);
  if (data.length < PAGE) break;
  from += PAGE;
}
setProgramacoes(all);
```

## Arquivos alterados

- `src/pages/admin/ProgramacaoPage.tsx` — apenas a função `fetchProgramacoes`.

Sem mudanças em RLS, banco ou demais páginas.