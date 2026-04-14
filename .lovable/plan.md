

# Adicionar dropdown "Projeto" ao Encontro Formativo Professor – REDES

## Resumo

Adicionar um campo "Projeto" (dropdown) ao tipo `encontro_professor_redes` com 3 opções. Para "Instituto Alfa e Beto" e "Teaching at The Right Level", o gerenciamento pula o Instrumento Pedagógico e vai direto para confirmação de presença. Para "Gestão para aprendizagem", o fluxo segue inalterado.

## Alterações

### 1. Migração SQL — adicionar coluna `projeto` à tabela `programacoes`

```sql
ALTER TABLE public.programacoes ADD COLUMN projeto text;
```

A tabela `registros_acao` já possui a coluna `projeto`.

### 2. `src/pages/admin/ProgramacaoPage.tsx`

**Formulário de cadastro (após "Programa", linha ~2076):**
- Adicionar dropdown "Projeto" visível quando `formData.tipo === 'encontro_professor_redes'`, com opções:
  - Instituto Alfa e Beto
  - Teaching at The Right Level
  - Gestão para aprendizagem
- Adicionar campo `projeto` ao `formData` state.

**Insert na criação (linha ~781):**
- Salvar `projeto` na `programacoes` quando tipo for `encontro_professor_redes`.

**Insert do registro (handleSavePresencas, linha ~1500):**
- Salvar `projeto` no `registros_acao` ao criar o registro.

**Gerenciamento (linha ~1523, TIPOS_COM_INSTRUMENTO_PRESENCA):**
- Para `encontro_professor_redes`, verificar se `selectedProgramacao.projeto` é "Gestão para aprendizagem". Se NÃO for, pular o instrumento pedagógico (não salvar `instrument_responses`).

**Dialog de presença (linha ~3539):**
- Condicionar a exibição do `InstrumentForm` para `encontro_professor_redes`: só mostrar quando `selectedProgramacao.projeto === 'Gestão para aprendizagem'`.

### 3. `src/pages/aap/AAPRegistrarAcaoPage.tsx`

**REDES Form Dialog (linha ~1183):**
- Quando `selectedProgramacao.tipo === 'encontro_professor_redes'` e o projeto NÃO for "Gestão para aprendizagem":
  - Em vez de abrir o `EncontroProfessorRedesForm`, abrir um fluxo simplificado de presença (reutilizando a lógica de `PRESENCE_TYPES`) onde o usuário confirma presença dos atores filtrados pela turma.
- Quando o projeto for "Gestão para aprendizagem" (ou vazio), manter o fluxo atual com `EncontroProfessorRedesForm`.

### 4. `src/pages/admin/RegistrosPage.tsx`

- No formulário de edição, adicionar dropdown "Projeto" para `encontro_professor_redes` (pré-preenchido com valor existente).
- Salvar no `handleSaveEdit` tanto em `registros_acao.projeto` quanto em `programacoes.projeto`.

| Arquivo | Alteração |
|---|---|
| Migração SQL | Adicionar coluna `projeto` à `programacoes` |
| `ProgramacaoPage.tsx` | Dropdown Projeto no cadastro; condicionar instrumento no gerenciamento |
| `AAPRegistrarAcaoPage.tsx` | Fluxo simplificado (só presença) para projetos não-Gestão |
| `RegistrosPage.tsx` | Dropdown Projeto na edição |

