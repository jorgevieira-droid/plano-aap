

# Fix: Erro "Programas inválidos" ao cadastrar administradores

## Problema
Quando o admin cria um usuário com role `admin`, o frontend envia `programas: null` (porque admin não precisa de programas). Na edge function, a validação `if (programas !== undefined)` captura `null`, e `validateProgramas(null)` falha porque `Array.isArray(null)` retorna `false`, resultando no erro "Programas inválidos".

## Solução
Alterar a validação na edge function `manage-users` para ignorar `null` além de `undefined`:

**Arquivo**: `supabase/functions/manage-users/index.ts`, linha 196

Mudar de:
```typescript
if (programas !== undefined) {
```
Para:
```typescript
if (programas !== undefined && programas !== null) {
```

Mesma correção para `entidadeIds` na linha 204 (já trata `null`, mas por consistência).

## Impacto
- Correção de uma linha na edge function
- Nenhuma alteração no frontend
- Administradores poderão ser cadastrados normalmente

