

# Ajustes no formulário de Programação de Observação de Aula – REDES

O problema é que as alterações anteriores foram feitas apenas no formulário de **registro** (`ObservacaoAulaRedesForm.tsx`), mas a tela que aparece no screenshot é o **diálogo de programação** em `ProgramacaoPage.tsx`, que usa a configuração de `ACAO_FORM_CONFIG` para decidir quais campos exibir.

## Alterações

### 1. `src/config/acaoPermissions.ts` — Config do tipo `observacao_aula_redes`

Alterar a configuração para ocultar Segmento, Componente e Ano/Série, e usar rótulo correto:

```typescript
observacao_aula_redes: {
  eligibleResponsavelRoles: [],
  useResponsavelSelector: false,
  requiresEntidade: true,
  showSegmento: false,    // era true
  showComponente: false,  // era true
  showAnoSerie: false,    // era true
  isCreatable: true,
  responsavelLabel: 'Formador',
}
```

### 2. `src/pages/admin/ProgramacaoPage.tsx` — Rótulos condicionais + campos adicionais

**a) Rótulo "Entidade" → "Rede"** para tipos REDES:
- Na seção do select de Entidade (~linha 2073), usar rótulo condicional: se o tipo for `observacao_aula_redes`, exibir "Rede *" em vez de "Entidade *".

**b) Dropdown "Escola" (entidade filho):**
- Adicionar estado `formEscolaFilhoId` e lista `entidadesFilho`.
- Após seleção da Rede (entidade), buscar `entidades_filho` filtradas por `escola_id`.
- Exibir select "Escola *" logo após o campo Rede, visível apenas para `observacao_aula_redes`.

**c) Dropdown "Turma":**
- Adicionar estado `formTurma` com opções fixas A–H.
- Exibir logo após Escola, visível apenas para `observacao_aula_redes`.

**d) Rótulo "AAP / Formador" → "Formador":**
- Já resolvido pela config `responsavelLabel: 'Formador'` acima.

**e) Persistência:** Salvar `entidade_filho_id` e `turma` na tabela `programacoes` (campos `entidade_filho_id` e `turma_ano` — verificar se existem, caso contrário criar migração).

### 3. Possível migração de banco

Verificar se a tabela `programacoes` já possui os campos `entidade_filho_id` e `turma_ano`. Caso não, criar migração para adicioná-los.

## Arquivos impactados

| Arquivo | Alteração |
|---|---|
| `src/config/acaoPermissions.ts` | Ocultar Segmento/Componente/AnoSérie para `observacao_aula_redes`, rótulo Formador |
| `src/pages/admin/ProgramacaoPage.tsx` | Rótulo "Rede", dropdowns Escola e Turma condicionais |
| Migração SQL (se necessário) | Campos `entidade_filho_id` e `turma_ano` em `programacoes` |

