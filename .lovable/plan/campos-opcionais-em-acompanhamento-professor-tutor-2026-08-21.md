# Campos opcionais em "Acompanhamento Professor Tutor"

Incluir dois campos **opcionais** no formulário de cadastro/gerenciamento dessa ação:

1. **Escola** (entidade filho) — lista suspensa filtrada pela **Entidade** selecionada na própria ação. Fica desabilitada enquanto nenhuma entidade for escolhida.
2. **Professor** — campo de texto curto (nome livre).

Ambos sem obrigatoriedade: a ação continua podendo ser salva em branco nesses campos.

## Onde aparece
- Diálogo de cadastro/edição da ação em Programação/Calendário (inclusive no modo "Adicionar Ação" direto).
- Os valores ficam visíveis ao reabrir/editar a ação e acompanham a ação quando ela é registrada.

## Detalhes técnicos
- `src/pages/admin/ProgramacaoPage.tsx`:
  - Adicionar `acomp_professor_tutor` à condição que renderiza o select de Escola (entidade filho), sem `required` e sem validação de submit.
  - Renderizar o input de texto "Professor" (estado `formApoioProfessorNome`, já existente) também para `acomp_professor_tutor`, com rótulo sem asterisco e sem validação.
  - No submit, gravar `entidade_filho_id` (já suportado) e `apoio_professor_nome` para esse tipo; ao editar, os campos são recarregados como já ocorre hoje.
- Sem alteração de schema: `programacoes.entidade_filho_id` e `programacoes.apoio_professor_nome` já existem, assim como `registros_acao.entidade_filho_id`.
