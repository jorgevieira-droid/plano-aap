

# Alterar campo "Equipe" para dropdown no formulário ET/EG REDES

## Alteração

### `src/components/formularios/EncontroETEGRedesForm.tsx`

Substituir o campo de texto livre `equipe` (linha 145-147) por um `Select` dropdown com as três opções fixas:

- **Equipe Técnica**
- **Equipe Gestora**
- **Equipe Técnica + Equipe Gestora**

O schema Zod já valida `equipe` como string obrigatória — não precisa de alteração. O label será atualizado para "Público da Formação*". Nenhuma migração de banco necessária (a coluna já é `text`).

## Arquivo impactado

| Arquivo | Alteração |
|---|---|
| `src/components/formularios/EncontroETEGRedesForm.tsx` | Trocar `Input` por `Select` no campo `equipe` com as 3 opções |

