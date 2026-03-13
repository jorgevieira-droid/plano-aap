
# Adicionar campos "Projeto (Notion)" e "Local" ao formulário de Formação

## Resumo

Adicionar duas caixas de texto não obrigatórias -- **Projeto (Notion)** e **Local** -- ao formulário de criação de programação, visíveis apenas quando o tipo selecionado for `formacao`.

## 1. Migração de banco de dados

Adicionar duas colunas na tabela `programacoes`:

```sql
ALTER TABLE public.programacoes
  ADD COLUMN projeto_notion text DEFAULT NULL,
  ADD COLUMN local text DEFAULT NULL;
```

Nenhuma política RLS adicional é necessária -- as colunas herdam as políticas já existentes na tabela.

## 2. Alterações no formulário (ProgramacaoPage.tsx)

### 2.1 Estado do formulário (~linha 206)

Adicionar `projetoNotion` e `local` ao tipo e estado inicial de `formData`:

```typescript
projetoNotion: string;  // novo
local: string;          // novo
```

Valor inicial: `''` para ambos.

### 2.2 Campos no JSX do dialog (~após linha 2028, depois do "Tipo de Ator Participante")

Renderizar condicionalmente quando `formData.tipo === 'formacao'`:

```text
{formData.tipo === 'formacao' && (
  <>
    <div className="col-span-2">
      <label>Projeto (Notion)</label>
      <input type="text" value={formData.projetoNotion} ... placeholder="Nome do projeto no Notion" />
    </div>
    <div className="col-span-2">
      <label>Local</label>
      <input type="text" value={formData.local} ... placeholder="Local da formação" />
    </div>
  </>
)}
```

Ambos os campos **não** terão o atributo `required`.

### 2.3 Dados de inserção (~linha 607)

Incluir os novos campos no objeto `insertData`:

```typescript
projeto_notion: formData.tipo === 'formacao' ? (formData.projetoNotion || null) : null,
local: formData.tipo === 'formacao' ? (formData.local || null) : null,
```

### 2.4 Reset do formulário (~linha 650)

Adicionar `projetoNotion: ''` e `local: ''` ao objeto de reset após submit bem-sucedido.

## Detalhes técnicos

| Item | Detalhe |
|---|---|
| Arquivo | `src/pages/admin/ProgramacaoPage.tsx` |
| Migração | 1 migration: ADD COLUMN `projeto_notion` text, ADD COLUMN `local` text |
| Campos condicionais | Visíveis apenas para `tipo === 'formacao'` |
| Obrigatoriedade | Ambos opcionais |
| RLS | Nenhuma alteração necessária |
