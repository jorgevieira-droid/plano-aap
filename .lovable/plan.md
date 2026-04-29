## Objetivo

Na página **Consultor / Gestor / Formador** (`/aaps`), tornar a edição das **entidades vinculadas** (escolas / regionais / redes municipais) confiável para todos os atores listados — incluindo N4.1 (CPed), N4.2 (GPI), N5 (Formador) e os papéis legados `aap_inicial`, `aap_portugues`, `aap_matematica`.

## Problemas identificados

Hoje a página lista todos esses papéis, mas o diálogo de edição tem limitações que impedem editar entidades corretamente:

1. **Select de "Tipo" só oferece papéis legados** (`aap_inicial`, `aap_portugues`, `aap_matematica`). Ao editar um N4.1/N4.2/N5, o `formData.tipo` é forçado para `aap_inicial`, e ao salvar o papel original do usuário é sobrescrito.
2. **Filtro de entidades disponíveis** (`availableEscolas`) depende de `formData.programas`. Para usuários N4/N5, se os programas vierem vazios ou desalinhados, a lista de entidades fica vazia e não dá para alterar a vinculação.
3. **Não há botão dedicado "Editar Entidades"**, então o fluxo atual mistura edição de senha/email/papel com vinculação de entidades, dificultando o uso.

## Mudanças propostas

### 1. `src/pages/admin/AAPsPage.tsx`
- Ampliar `AAPRole` e `tipoLabels` para incluir `n4_1_cped`, `n4_2_gpi`, `n5_formador` com rótulos legíveis (ex.: "CPed (N4.1)", "GPI (N4.2)", "Formador (N5)").
- Mostrar o papel real na coluna **Tipo** e no select do diálogo, mantendo o papel atual ao abrir em modo edição.
- No `handleOpenDialog`, garantir que `formData.programas` seja inicializado a partir de `aap.programas` (já é) **e**, se vazio, cair para `gestorProgramas`/`['escolas']` apenas para criação. Em edição, se o usuário não tem programas cadastrados, exibir aviso pedindo para o admin associar um programa antes.
- Ajustar `availableEscolas` para considerar **todas as entidades já vinculadas** ao usuário em edição, mesmo que o programa delas não esteja em `formData.programas` (evita "perder" vínculos ao reabrir).
- Adicionar uma ação rápida "Editar Entidades" (ícone `School`) na coluna de ações que abre o mesmo diálogo já focado/rolado para a seção **Entidades Vinculadas** (sem alterar email/senha).

### 2. `supabase/functions/manage-aap-user/index.ts`
- No `case 'update'`, quando `role` chegar como um dos novos papéis (`n4_1_cped`, `n4_2_gpi`, `n5_formador`) já está coberto por `ALL_MANAGEABLE_ROLES`. Apenas garantir que **não exigimos `role`** quando a chamada vier só para atualizar `escolasIds` (o código já trata `if (role)`), e validar que o array vazio em `escolasIds` realmente desvincula tudo (já faz).
- Sem alterações de schema.

### 3. Permissões
- Sem mudanças em RLS. Continua admin + gestor + N3 podendo editar (via `is_manager`), com escopo por programa para não-admins. Restrição de programa do solicitante segue intacta.

## Detalhes técnicos

```text
Fluxo de edição:
  [Lista /aaps] -> click "Editar Entidades"
        -> abre Dialog com tipo/programas pré-preenchidos do usuário
        -> seção "Entidades Vinculadas" mostra:
              (A) entidades já vinculadas (mesmo de outros programas)
              (B) entidades elegíveis pelos programas selecionados
        -> Salvar chama edge `manage-aap-user` action=update
              somente com { userId, escolasIds, role (preservado), programas (inalterados) }
```

## Fora do escopo
- Não alteramos a lógica de criação de novos atores.
- Não mexemos na lista de papéis manejáveis na edge function (já inclui N4/N5).
- Não alteramos a página `/atores` (diretório N1–N8).

Aprovando o plano, implemento as alterações nos arquivos listados.