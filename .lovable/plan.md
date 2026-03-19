

# Permitir GPI alterar entidades do CPed

## Problema atual

O GPI (N4.2, nível 4) vê o botão "Alterar papel" na página Atores, mas ao salvar:
- A RLS de `user_entidades` só permite escrita para `is_admin` ou `is_manager` (N1-N3)
- O dialog atual altera papel + programas + entidades juntos — GPI não deveria poder alterar o papel/programas do CPed, apenas as escolas vinculadas

## Plano

### 1. Novo botão "Alterar Entidades" na tabela de Atores

No `AtoresProgramaPage.tsx`, adicionar um terceiro `DialogMode` (`'entidades'`) e um botão com ícone (ex: `Building2`) visível **apenas** quando:
- O usuário logado é GPI (`n4_2_gpi`)
- O alvo é CPed (`n4_1_cped`)
- Ambos compartilham ao menos um programa

O dialog mostra apenas o nome do CPed e a lista de entidades (checkboxes), sem campos de papel, programa, segmento ou senha. Ao salvar, faz apenas o `delete` + `insert` em `user_entidades`.

### 2. Migration: RLS em `user_entidades` para GPI → CPed

Adicionar uma política que permite GPI gerenciar entidades de usuários CPed que compartilham programa:

```sql
CREATE POLICY "GPI can manage CPed entidades"
ON public.user_entidades
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'n4_2_gpi') AND
  has_role(user_id, 'n4_1_cped') AND
  shares_programa(auth.uid(), user_id)
)
WITH CHECK (
  has_role(auth.uid(), 'n4_2_gpi') AND
  has_role(user_id, 'n4_1_cped') AND
  shares_programa(auth.uid(), user_id)
);
```

### 3. Resumo de arquivos

| Arquivo | Alteração |
|---|---|
| `src/pages/admin/AtoresProgramaPage.tsx` | Novo `DialogMode = 'entidades'`, botão condicional para GPI→CPed, dialog simplificado, handler `handleSaveEntidades` |
| Migration SQL | Nova RLS policy em `user_entidades` |

