## Plano: Ajustes em "Programar Registro de Apoio Presencial"

### Mudanças no `src/pages/admin/ProgramacaoPage.tsx`

**1. Adicionar opções nos selects**
- `APOIO_COMPONENTE_OPTIONS`: incluir `"Polivalente"` e `"Não se Aplica"` ao final da lista atual (`LP`, `Mat`, `OE MAT`, `OE LP`, `Tutoria MAT`, `Tutoria LP`).
- `APOIO_ETAPA_OPTIONS`: incluir `"Não se Aplica"` ao final.

**2. Desvincular o dropdown "Professor" de Componente/Etapa**
- No bloco do select de Professor (linhas ~3107-3122), remover os filtros por `formApoioComponente` (mapeamento LP/Mat → componente do professor) e por `formApoioEtapa` (ano_serie).
- O dropdown passa a listar **todos** os professores carregados da entidade selecionada, sem filtragem por componente da aula nem etapa de ensino.

### Fora de escopo
- Sem mudanças no schema, RLS, validações de obrigatoriedade dos campos, ou no formulário de execução (`RegistroApoioPresencialForm`).
- Sem alterações no PDF/print.