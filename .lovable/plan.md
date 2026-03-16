

# Corrigir envio de relatório mensal por e-mail

## Diagnóstico

Identifiquei dois problemas:

1. **Sessão expirada**: O console mostra `Invalid Refresh Token: Refresh Token Not Found`. O frontend usa `getSession()` (que pode retornar um token expirado/cacheado) em vez de `refreshSession()` — mesma questão já documentada para outras edge functions do projeto.

2. **Erro genérico**: O catch block em `RelatoriosPage.tsx` (linha 209) mostra apenas `"Erro ao enviar relatório mensal"` sem detalhes. A resposta de erro da edge function (que pode ser 401, 403, 429, 500) é descartada.

## Alterações

### Arquivo: `src/pages/admin/RelatoriosPage.tsx`

**1. Trocar `getSession()` por `refreshSession()`** (linha 182):
```typescript
const { data: { session } } = await supabase.auth.refreshSession();
```

**2. Melhorar tratamento de erros** (linhas 201-211):
- Após `supabase.functions.invoke`, verificar o conteúdo da resposta de erro
- Extrair a mensagem real do backend (`data?.error` ou `error.message`)
- Exibir a mensagem específica no toast em vez do texto genérico

| Item | Detalhe |
|---|---|
| Arquivo | `src/pages/admin/RelatoriosPage.tsx` |
| Linhas afetadas | ~182, 201-211 |
| Migração DB | Nenhuma |
| Risco | Baixo |

