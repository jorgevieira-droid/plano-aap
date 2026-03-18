

# Corrigir erro de envio do relatório mensal

## Diagnóstico

Dois problemas na configuração de CORS em `supabase/functions/_shared/cors.ts`:

1. **Domínio de produção ausente**: O usuário acessa via `https://acompanhamento-aaps.org` (visível nos logs de autenticação), mas esse domínio não está na lista `allowedOrigins`. Isso faz a edge function rejeitar a requisição preflight CORS.

2. **Headers CORS incompletos**: Faltam headers que o SDK do Supabase envia automaticamente (`x-supabase-client-platform`, etc.), causando bloqueio do preflight.

## Alteração

### Arquivo: `supabase/functions/_shared/cors.ts`

1. Adicionar `https://acompanhamento-aaps.org` à lista `allowedOrigins`
2. Atualizar `Access-Control-Allow-Headers` para incluir todos os headers requeridos pelo SDK

Após a edição, **reimplantar todas as edge functions** que usam esse módulo compartilhado.

| Item | Detalhe |
|---|---|
| Arquivo | `supabase/functions/_shared/cors.ts` |
| Deploy | Todas as edge functions (usam o `_shared/cors.ts`) |
| Migração DB | Nenhuma |
| Risco | Baixo |

