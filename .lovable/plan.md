## Diagnóstico

As pendências aparecem em **/pendencias** mas não em **/registros** filtrando `2026 / Março` porque o Supabase tem um **limite padrão de 1000 linhas por query**.

Verificado no banco:
- `registros_acao` tem **1080 registros** no total.
- **1006 registros** têm `data > 2026-03-31`.
- A query em `RegistrosPage.tsx` (linha 343) faz `select('*').order('data', { ascending: false })` sem `.range()` nem `.limit()`.

Resultado: o cliente recebe apenas as **1000 datas mais recentes** (todas posteriores a abril/2026). Os registros de março/2026 (e qualquer data anterior) são silenciosamente cortados — por isso a tabela mostra "Nenhum registro encontrado", enquanto a página de Pendências (que tem sua própria query) lista 276 itens incluindo março.

A mesma armadilha existe na query de `programacoes` (linha 428) — atualmente está abaixo do limite, mas vai quebrar quando crescer.

## Plano

**Arquivo:** `src/pages/admin/RegistrosPage.tsx`

1. **Paginar a busca de `registros_acao`** (linha 340–365): substituir o `select` único por um loop que busca em páginas de 1000 com `.range(from, to)` até esgotar os resultados, mantendo o `order('data', { ascending: false })` e o filtro `aap_id` quando não é admin/manager.

2. **Paginar a busca de `programacoes`** (linha 428–437) com o mesmo padrão, preservando o `select` específico de colunas já existente.

3. **(Opcional, leve)** Extrair um helper `fetchAllPaged(query, pageSize=1000)` no próprio arquivo para evitar duplicação entre as duas queries.

Sem mudanças de UI, schema, RLS ou filtros — apenas a forma como os dados são carregados.

## Detalhes técnicos

```ts
async function fetchAllPaged<T>(build: (from: number, to: number) => PostgrestBuilder<T[]>) {
  const pageSize = 1000;
  let from = 0;
  const all: T[] = [];
  while (true) {
    const { data, error } = await build(from, from + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return all;
}
```

## Fora do escopo

- Não mexer em `usePendencias`, dashboards ou relatórios (já investigados em loops anteriores).
- Não alterar regras de status "pendente", filtros, RLS ou tipos de ação.
- Não mexer em `presencas`, `avaliacoes_aula`, `escolas`, `profiles_directory` — verificar contagens só se o usuário relatar problema parecido nelas.