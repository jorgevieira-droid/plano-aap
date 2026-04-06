

# Adicionar campo "Local" aos formulários REDES (ET/EG e Professor)

## Contexto
O campo "Local - Local da Formação" existe na ação "Formação" (tabela `programacoes.local`), mas não está presente nos formulários REDES de Encontro ET/EG e Encontro Professor. As tabelas `relatorios_eteg_redes` e `relatorios_professor_redes` também não possuem essa coluna.

## Alterações

### 1. Migração de banco de dados
Adicionar coluna `local` (tipo `text`, nullable) nas duas tabelas:
- `relatorios_eteg_redes`
- `relatorios_professor_redes`

### 2. `RedesFormProps` (ObservacaoAulaRedesForm.tsx)
Adicionar prop opcional `local?: string` à interface `RedesFormProps` para receber o local da programação.

### 3. `EncontroETEGRedesForm.tsx`
- Adicionar `local` ao schema Zod (string opcional)
- Definir valor default com o `local` recebido via props (da programação)
- Adicionar campo "Local" na seção de Identificação (input text, editável)
- Incluir `local` no payload de envio

### 4. `EncontroProfessorRedesForm.tsx`
- Mesmas alterações do item 3

### 5. `AAPRegistrarAcaoPage.tsx`
- Passar `local: selectedProgramacao.local` no `formProps` para que os formulários REDES recebam o local previamente cadastrado na programação

## Arquivos impactados

| Arquivo | Alteração |
|---|---|
| Migração SQL | Adicionar coluna `local` nas duas tabelas |
| `src/components/formularios/ObservacaoAulaRedesForm.tsx` | Adicionar `local?` à interface `RedesFormProps` |
| `src/components/formularios/EncontroETEGRedesForm.tsx` | Campo "Local" no schema, form e payload |
| `src/components/formularios/EncontroProfessorRedesForm.tsx` | Campo "Local" no schema, form e payload |
| `src/pages/aap/AAPRegistrarAcaoPage.tsx` | Passar `local` no `formProps` |

