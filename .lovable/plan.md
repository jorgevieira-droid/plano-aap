
# Revisar Permissoes de Criacao de Formacao

## Problema

Atualmente, a verificacao de permissao na pagina de Programacao (linha 560) usa `!isAdminOrGestor && !isAAP`, o que bloqueia perfis N3 (Coordenador do Programa), N4 e N5 de criar programacoes. A imagem mostra exatamente esse erro para um Coordenador do Programa.

Alem disso, o seletor "AAP / Formador" para o tipo `formacao` usa o modo legado que so lista perfis operacionais (N4/N5 e AAPs legados), quando deveria listar perfis N2 a N5.

## Alteracoes

### Arquivo: `src/pages/admin/ProgramacaoPage.tsx`

**1. Corrigir verificacao de permissao (linha 560)**

Substituir a verificacao fixa `!isAdminOrGestor && !isAAP` por uma verificacao baseada na matriz de permissoes, que ja esta configurada corretamente para `formacao` (N1-N5 podem criar):

```typescript
// De:
if (!isAdminOrGestor && !isAAP) {
  toast.error('Voce nao tem permissao para criar programacoes');
  return;
}

// Para:
const canCreate = canUserCreateAcao(profile?.role as AppRole, formData.tipo);
if (!canCreate) {
  toast.error('Voce nao tem permissao para criar programacoes');
  return;
}
```

Isso respeita a `ACAO_PERMISSION_MATRIX` que ja define corretamente que N1-N5 podem criar `formacao`.

**2. Atualizar a verificacao de visibilidade do botao "+ Nova Acao"**

O botao de criar acao tambem precisa verificar se o usuario tem algum tipo de acao criavel (`creatableAcoes.length > 0`) em vez de checar `isAdminOrGestor || isAAP`.

### Arquivo: `src/config/acaoPermissions.ts`

**3. Atualizar ACAO_FORM_CONFIG para `formacao` (linha 303-311)**

Ativar o seletor de Responsavel para `formacao`, listando perfis N2 a N5 como elegiveis:

```typescript
formacao: {
  eligibleResponsavelRoles: ['gestor', 'n3_coordenador_programa', 'n4_1_cped', 'n4_2_gpi', 'n5_formador'],
  useResponsavelSelector: true,
  requiresEntidade: true,
  showSegmento: true,
  showComponente: true,
  showAnoSerie: true,
  isCreatable: true,
  responsavelLabel: 'Responsavel',
},
```

Isso fara o formulario de `formacao` usar o seletor moderno de "Responsavel" que filtra corretamente por papel, programa e entidade, mostrando apenas perfis N2-N5.

### Resumo das mudancas

| Local | Antes | Depois |
|---|---|---|
| Verificacao de criacao | `isAdminOrGestor \|\| isAAP` fixo | `canUserCreateAcao()` baseado na matriz |
| Seletor de responsavel (formacao) | Modo legado (so AAPs/N4-N5) | Seletor moderno com N2-N5 elegiveis |
| Botao "+ Nova Acao" | Visivel so para Admin/Gestor/AAP | Visivel para quem tem acoes criaveis |
