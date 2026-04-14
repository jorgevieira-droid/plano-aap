

# Replicar formulário de cadastro na edição de ações (RegistrosPage)

## Problema

O dialog de edição em RegistrosPage usa um formulário simplificado com poucos campos (data, status, tipo, escola, responsável, segmento, ano/série, turma, local, observações, avanços, dificuldades). Já o formulário de cadastro em ProgramacaoPage tem campos adicionais: título, descrição, tags, horário início/fim, programa, turma de formação, público da formação, tipo ator presença, projeto Notion, entidade filho, e campos específicos de monitoramento.

## Abordagem

Substituir o dialog de edição atual por um formulário idêntico ao de cadastro, pré-preenchido com os dados existentes do `registro_acao` e da `programacao` vinculada.

## Alterações

### `src/pages/admin/RegistrosPage.tsx`

1. **Expandir estados de edição**: Adicionar estados para os campos que faltam: `editTitulo`, `editDescricao`, `editTags`, `editHorarioInicio`, `editHorarioFim`, `editPrograma`, `editTipoAtorPresenca`, `editProjetoNotion`, `editTurmaFormacao`, `editPublicoFormacao`, `editEntidadeFilhoId`, `editComponente`, campos de monitoramento (`editFrenteTrabalho`, `editPublicoEncontro`, `editLocalEncontro`, `editLocalEscolas`, `editLocalOutro`, `editFechamento`, `editEncaminhamentos`).

2. **Atualizar `handleOpenEdit`**: Carregar os dados da `programacao` vinculada (título, descrição, tags, horários, programa, local, turma_formacao, publico_formacao, tipo_ator_presenca, projeto_notion, entidade_filho_id, campos de monitoramento) além dos dados do registro.

3. **Buscar entidades filho**: Adicionar efeito para carregar `entidades_filho` quando `editEscolaId` muda e o tipo requer (igual ao cadastro).

4. **Substituir o dialog de edição**: Replicar a estrutura do formulário de cadastro de ProgramacaoPage (linhas 2030-2558), incluindo:
   - Programa (select)
   - Público da Formação (para encontro_eteg_redes)
   - Título, Descrição, Tags (condicionais a não ser monitoramento)
   - Data + Horário Início/Fim
   - Entidade + Entidade Filho
   - Turma (para observacao_aula_redes)
   - Campos de monitoramento (frente trabalho, público encontro, local, fechamento, encaminhamentos)
   - Responsável (com filtro por programa/entidade)
   - Segmento, Componente, Ano/Série (condicionais via ACAO_FORM_CONFIG)
   - Tipo Ator Presença, Turma Formação, Projeto Notion, Local
   - Status (manter, pois é campo de edição)
   - Observações, Avanços, Dificuldades

5. **Atualizar `handleSaveEdit`**: Persistir os campos adicionais tanto no `registros_acao` (programa, tags, componente) quanto na `programacoes` vinculada (título, descrição, horários, tags, programa, tipo_ator_presenca, projeto_notion, turma_formacao, publico_formacao, entidade_filho_id, campos de monitoramento).

| Arquivo | Alteração |
|---|---|
| `src/pages/admin/RegistrosPage.tsx` | Expandir estados de edição, carregar dados completos da programação vinculada, replicar formulário de cadastro no dialog de edição, atualizar `handleSaveEdit` para persistir todos os campos |

