

## Alterar "Escolas" para "Entidades"

Alteracao simples em duas linhas no arquivo `src/pages/admin/EscolasPage.tsx`:

### Alteracoes

**Arquivo: `src/pages/admin/EscolasPage.tsx` (linhas 326-329)**

| De | Para |
|----|------|
| `Escolas` (titulo h1) | `Entidades` |
| `{escolas.length} escolas cadastradas` (subtitulo) | `{escolas.length} entidades cadastradas` |

Nenhuma outra alteracao necessaria -- o restante da pagina (variaveis internas, queries, etc.) permanece inalterado.

