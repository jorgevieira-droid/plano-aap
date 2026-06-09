# Campos extras no cadastro de Visita Técnica — Alfabetização (REDES)

Hoje a ação "Visita Técnica — Alfabetização (REDES)" é cadastrada apenas com os campos genéricos (entidade pai, data, horário, etc.). Vamos incluir três novos campos no formulário de agendamento, no mesmo padrão já utilizado pela "Observação de Aula (REDES)":

- **Escola (Entidade Filho)** — selecionada a partir das escolas vinculadas à Rede/Regional escolhida no campo "Entidade".
- **Ano** — `1º ano` ou `2º ano` (somente essas duas opções, conforme escopo do programa de Alfabetização).
- **Turma** — `A`, `B`, `C`, `D`, `E`, `F`, `G` ou `H`.

Os três campos serão **obrigatórios** ao agendar essa ação.

## Onde a mudança acontece

Arquivo único: `src/pages/admin/ProgramacaoPage.tsx`.

1. **UI do formulário** (bloco condicional dentro do diálogo de cadastro):
   - Estender a condição que renderiza o seletor **Escola (Entidade Filho)** para incluir `tipo === "visita_tecnica_alfabetizacao_redes"` (hoje cobre só `observacao_aula_redes` e `formacao` em Regionais).
   - Adicionar bloco de **Ano** e **Turma** para esse tipo, reaproveitando os estados `formAnoSerieRedes` / `formTurmaRedes` já existentes. As opções de Ano serão restritas a `1º ano` e `2º ano`; Turma usa a mesma lista A-H da Observação REDES (sem "Não se aplica", já que os campos são obrigatórios).

2. **Persistência (insert/update)**:
   - Incluir o tipo na lógica que grava `entidade_filho_id`.
   - Gravar `ano_serie` e `turma_formacao` na `programacoes` quando o tipo for `visita_tecnica_alfabetizacao_redes` (colunas já existem na tabela).

3. **Edição** (`handleEdit`): popular `formEscolaFilhoId`, `formAnoSerieRedes` e `formTurmaRedes` a partir da programação ao reabrir uma visita já cadastrada (a lógica atual já cobre `observacao_aula_redes`; só estender a condição).

4. **Validação**: bloquear o envio com `toast.error` caso Escola, Ano ou Turma estejam vazios para esse tipo.

## Fora de escopo

- Nenhuma alteração no formulário do relatório (`VisitaTecnicaAlfabetizacaoRedesForm.tsx`) nem na tabela `relatorios_visita_tecnica_alfabetizacao_redes`. Os campos servem apenas para qualificar o agendamento.
- Nenhuma migration: as colunas `entidade_filho_id`, `ano_serie` e `turma_formacao` já existem em `programacoes`.
- Filtros/relatórios e impressão permanecem como estão (já leem esses campos quando presentes).
