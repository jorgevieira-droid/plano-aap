## Diagnóstico

A tabela tem 9.247 registros (Abril 1.612, Maio 6.306, Junho 1.329), mas o cliente está recebendo apenas ~1.000 (limite de linhas do PostgREST), todos do topo do `order by accessed_at desc` — daí o gráfico mostrar só Junho. O `.range(0, 49999)` não está vencendo o teto do servidor.

## Solução: agregar no servidor

Criar uma função SQL `get_acessos_por_mes_programa()` que devolve **(mes, programa, total)** já agregado — eliminando totalmente o problema de paginação e ficando mais rápido.

### Migration

```sql
CREATE OR REPLACE FUNCTION public.get_acessos_por_mes_programa()
RETURNS TABLE (mes date, programa programa_type, total bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    date_trunc('month', l.accessed_at)::date AS mes,
    up.programa,
    COUNT(*)::bigint AS total
  FROM public.user_access_log l
  JOIN public.user_programas up ON up.user_id = l.user_id
  GROUP BY 1, 2
  ORDER BY 1, 2;
$$;

REVOKE ALL ON FUNCTION public.get_acessos_por_mes_programa() FROM public;
GRANT EXECUTE ON FUNCTION public.get_acessos_por_mes_programa() TO authenticated;
```

Apenas Admin (N1) chega na página `/relatorio-acessos`, mas como a função é `SECURITY DEFINER` e retorna apenas contagens agregadas (sem PII), `GRANT` a `authenticated` é seguro e cobre o uso futuro de N2-N5 já restrito pela rota.

### Mudanças em `src/pages/admin/RelatorioAcessosPage.tsx`

1. Adicionar um novo estado `monthlyAggregates: { mes: string; programa: ProgramaType; total: number }[]`.
2. Em `fetchData`, fazer uma 5ª chamada em paralelo: `supabase.rpc('get_acessos_por_mes_programa')` e armazenar em `monthlyAggregates`.
3. Reescrever `chartData` para consumir `monthlyAggregates` (em vez de `rawAccessLog` + `userProgramasMap`), respeitando apenas o filtro de **Programa**. Continua ignorando filtros de data, como combinado.
4. Manter `rawAccessLog` apenas se ainda for usado pela tabela; caso contrário, remover para limpeza (verificar uso).

## Fora de escopo

- Sem mudanças nos filtros, na tabela ou no CSV.
- Sem mexer em RLS de `user_access_log` (a função já faz o trabalho).
