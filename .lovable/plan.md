## Objetivo

No tipo de ação **Monitoramento e Gestão** (Regionais):

1. Tornar o campo **Entidade** opcional no cadastro.
2. No campo **Responsáveis**, incluir também usuários N2 (Gestor) e N3 (Coordenador de Programa) — hoje só aparecem perfis operacionais (AAP, N4.1, N4.2, N5).

## Mudanças

### 1. `src/config/acaoPermissions.ts` — bloco `monitoramento_gestao`

```ts
monitoramento_gestao: {
  eligibleResponsavelRoles: ['gestor', 'n3_coordenador_programa', 'n4_1_cped', 'n4_2_gpi', 'n5_formador'],
  useResponsavelSelector: true,
  requiresEntidade: false,
  showSegmento: false,
  showComponente: false,
  showAnoSerie: false,
  isCreatable: true,
  responsavelLabel: 'Responsável',
},
```

- `useResponsavelSelector: true` + lista de roles elegíveis: passa a usar o seletor novo (mesmo padrão de `monitoramento_acoes_formativas`), que já filtra por programa e inclui N2/N3 sem exigir vínculo de entidade (managers passam direto pelo filtro).
- `requiresEntidade: false`: remove a obrigatoriedade do campo Entidade — o seletor de Responsável deixa de ficar desabilitado quando não há entidade, e a UI passa a esconder o asterisco.

### 2. `src/pages/admin/ProgramacaoPage.tsx` — submissão do cadastro

- No `handleSubmit` da criação/edição, permitir `formData.escolaId` vazio quando `formConfig.requiresEntidade === false`.
- Ajustar o `insertData.escola_id` para enviar `null` nesse caso (em vez de string vazia).
- Manter validação obrigatória dos demais campos (data, horário, programa).
- Verificar/ajustar pontos onde a UI ainda renderiza `*` no rótulo "Entidade" para esconder quando opcional.

### 3. Migração de schema

A coluna `programacoes.escola_id` hoje é `NOT NULL`. Para permitir agendamento de Monitoramento e Gestão sem entidade, será necessária uma migração:

```sql
ALTER TABLE public.programacoes ALTER COLUMN escola_id DROP NOT NULL;
```

Impacto: nenhum dado existente é alterado; passa a aceitar `NULL` apenas para os tipos onde a UI permitir. Demais fluxos continuam exigindo entidade pela validação no front-end (`requiresEntidade !== false`).

## Fora do escopo

- `MonitoramentoGestaoForm` (formulário de gerenciamento) permanece inalterado — o campo "URE (Entidade)" continua exibido como informativo, mostrando "Selecione na programação" quando não houver entidade vinculada.
- Permissões de visualização, fluxo de "ação ocorreu sim/não" e regra de fechar sem salvar permanecem como estão.
