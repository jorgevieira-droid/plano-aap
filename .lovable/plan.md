## Diagnóstico

Em `src/pages/admin/ProgramacaoPage.tsx` (linha 202) há um `Set` que define quais tipos de ação podem ser cadastrados quando o programa é **Regionais**:

```ts
const REGIONAIS_CADASTRABLE_TIPOS = new Set<string>(["monitoramento_acoes_formativas"]);
```

Hoje só `Monitoramento de Ações Formativas` aparece. Como `monitoramento_gestao` está configurado em `form_config_settings` com `programas = {regionais}`, ele é filtrado pelo `getProgramasForTipo`, que remove `regionais` para qualquer tipo fora do Set — por isso o Calendário não oferece "Monitoramento e Gestão" ao criar nova ação em Regionais.

A matriz de permissões já dá CRUD aos N2/N3 para `monitoramento_gestao` (linha 223), portanto basta liberar o tipo para o programa Regionais.

## Mudança

Em `src/pages/admin/ProgramacaoPage.tsx`, atualizar o Set:

```ts
const REGIONAIS_CADASTRABLE_TIPOS = new Set<string>([
  "monitoramento_acoes_formativas",
  "monitoramento_gestao",
]);
```

E ajustar o comentário acima para refletir que agora há dois tipos cadastráveis sob Regionais.

Nenhuma migração de banco é necessária (o tipo já existe em `form_config_settings` com `regionais`). Nenhuma alteração de RLS é necessária.