## Bug encontrado

Em `src/pages/admin/RegistrosPage.tsx` (linhas 1388–1417), o botão **Excluir** (lixeira) está **aninhado dentro do bloco `canEdit(registro)`**:

```tsx
{canEdit(registro) && (
  <>
    <button>Gerenciar</button>
    <button>Editar</button>
    {canDelete(registro) && (
      <button>Excluir</button>   // ❌ só aparece se canEdit também for true
    )}
  </>
)}
```

Como N4.1 (CPed) tem `canUserEditAcao` retornando `false` para alguns tipos de ação (ou em momentos onde a matriz de ação não casa exatamente), a lixeira desaparece — mesmo quando o usuário tem permissão de DELETE pela RLS e por `canDelete()`.

## Correção

Mover o `{canDelete(registro) && ...}` para **fora** do bloco `canEdit`, mantendo-o no mesmo container `flex` dos outros botões. Resultado:

```tsx
{canEdit(registro) && (
  <>
    <button>Gerenciar</button>
    <button>Editar</button>
  </>
)}
{canDelete(registro) && (
  <button>Excluir</button>   // ✅ aparece independente de canEdit
)}
```

Sem mudanças de RLS, banco ou tipos. Apenas reestruturação do JSX em um único arquivo.