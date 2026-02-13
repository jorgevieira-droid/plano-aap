
# Corrigir erro "IDs de entidade invalidos" ao criar usuario N3

## Problema
Ao criar um usuario N3 (Coordenador do Programa), o sistema envia `entidadeIds: null` para a funcao backend. A validacao no backend verifica `if (entidadeIds !== undefined)`, e como `null !== undefined` e verdadeiro, tenta validar `null` como array de UUIDs, o que falha com o erro "IDs de entidade invalidos".

## Causa raiz
No `UsuariosPage.tsx`, o campo `entidadeIds` e enviado como `null` quando o perfil nao requer entidades:

```typescript
entidadeIds: needsEntidades(formData.role) ? formData.entidadeIds : null,
```

No backend (`manage-users/index.ts`), a validacao nao trata `null`:

```typescript
if (entidadeIds !== undefined) {
  const validIds = validateUUIDArray(entidadeIds);
  if (validIds === null) {
    return jsonResponse({ error: 'IDs de entidade invalidos' }, 400);
  }
}
```

## Correcao

### Arquivo: `supabase/functions/manage-users/index.ts` (linha 204)
Ajustar a condicao para tambem ignorar `null`:

```typescript
if (entidadeIds !== undefined && entidadeIds !== null) {
```

### Arquivo: `src/pages/admin/UsuariosPage.tsx` (linha 250)
Enviar `undefined` em vez de `null` para evitar que o campo chegue ao backend:

```typescript
entidadeIds: needsEntidades(formData.role) ? formData.entidadeIds : undefined,
```

Ambas as correcoes serao aplicadas para garantir robustez.
