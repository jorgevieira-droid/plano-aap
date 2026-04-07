

# Adicionar "Público da Formação" ao agendamento de Encontro ET/EG REDES

## Problema
O dropdown "Público da Formação" foi adicionado apenas no formulário de instrumento (`EncontroETEGRedesForm`), mas não aparece no formulário de **agendamento** (`ProgramacaoPage`), que é onde o usuário está (screenshot).

## Alterações

### 1. Migração SQL
Adicionar coluna `publico_formacao` (text, nullable) à tabela `programacoes`:
```sql
ALTER TABLE public.programacoes ADD COLUMN publico_formacao text;
```

### 2. `src/pages/admin/ProgramacaoPage.tsx`

**a) State do formulário (~linha 217):** adicionar `publicoFormacao: string` ao tipo e valor inicial `''`.

**b) Campo no formulário (~após linha 2224, junto aos campos REDES):** exibir dropdown "Público da Formação" quando `formData.tipo === 'encontro_eteg_redes'`, com as opções:
- Equipe Técnica
- Equipe Gestora
- Equipe Técnica + Equipe Gestora

**c) INSERT (~linha 725):** salvar `publico_formacao` quando o tipo for `encontro_eteg_redes`.

**d) Pré-popular ao editar:** ao abrir uma programação existente, carregar `publico_formacao` no formData.

## Arquivos impactados

| Arquivo | Alteração |
|---|---|
| Migração SQL | `ALTER TABLE programacoes ADD COLUMN publico_formacao text` |
| `src/pages/admin/ProgramacaoPage.tsx` | State, campo dropdown, persistência e carregamento |

