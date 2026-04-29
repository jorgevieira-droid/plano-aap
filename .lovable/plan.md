## Objetivo

Restringir a página **Pendências** (`/pendencias`) para que usuários **N4.1 (CPed)** e **N5 (Formador)** vejam apenas as suas próprias ações pendentes (cujo `aap_id = user.id`), ao invés de todas as pendências das escolas/entidades onde têm acesso.

## Diagnóstico

- O hook `src/hooks/usePendencias.ts` busca todos os registros com status `agendada` ou `reagendada` e depende apenas das políticas de RLS para escopar.
- N4.1 e N5 têm escopo `CRUD_ENT` (entidade): pelo RLS, enxergam pendências de todos os atores que atuam nas mesmas escolas. O usuário quer limitar à própria autoria.
- N4.2 (GPI) é mantido como está (continua vendo pendências do time, alinhado ao papel de gestão de parceria).
- Admin, Gestor (N2), Coordenador (N3) e Observadores continuam com a visão atual.

## Mudança

Arquivo: `src/hooks/usePendencias.ts`

1. Importar `profile` além de `user` do `useAuth`.
2. Incluir `profile?.role` na `queryKey` para garantir invalidação ao trocar simulação/usuário.
3. Quando `profile?.role` for `n4_1_cped` ou `n5_formador`, adicionar `.eq('aap_id', user.id)` na query do `registros_acao`.

Trecho alvo (linhas 25-39):

```ts
export function usePendencias(filters?: UsePendenciasFilters) {
  const { user, profile } = useAuth();

  const query = useQuery({
    queryKey: ['pendencias', user?.id, profile?.role, filters],
    queryFn: async (): Promise<Pendencia[]> => {
      let baseQuery = supabase
        .from('registros_acao')
        .select('id, data, tipo, escola_id, aap_id, status, reagendada_para, programa')
        .in('status', ['agendada', 'reagendada']);

      // N4.1 (CPed) e N5 (Formador) só veem suas próprias pendências
      if (user && (profile?.role === 'n4_1_cped' || profile?.role === 'n5_formador')) {
        baseQuery = baseQuery.eq('aap_id', user.id);
      }

      const { data: registros, error } = await baseQuery;
      if (error) throw error;
      if (!registros || registros.length === 0) return [];
      ...
```

## Efeito colateral positivo

O contador de pendências do menu lateral (badge no `Sidebar`) também passará a refletir só as pendências próprias para N4.1 e N5, já que vem do mesmo hook.

## Verificação pós-mudança

- Logar como N4.1 → `/pendencias` lista apenas linhas onde a coluna "Consultor / Gestor / Formador" é o próprio usuário.
- Logar como N5 → mesmo comportamento.
- Logar como N4.2 / N3 / N2 / Admin → visão inalterada.
