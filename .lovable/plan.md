## Objetivo

Tornar todos os campos de texto livre **editáveis** nos diálogos de edição de ação, tanto em **Calendário** (`ProgramacaoPage`) quanto em **Registros → Gerenciar/Editar** (`RegistrosPage`), independentemente do tipo da ação (inclusive Monitoramento).

## Escopo dos campos

Campos de texto livre que devem estar sempre disponíveis na edição:

- **Título**
- **Descrição**
- **Tags**
- **Observações**
- **Avanços**
- **Dificuldades**
- **Encaminhamentos** (e seletor de Fechamento)

## Mudanças

### 1. `src/pages/admin/RegistrosPage.tsx` (diálogo "Editar Registro")

- Remover o gating `{!isMonitoramento && (...)}` (linha 2199) que esconde Título / Descrição / Tags em Monitoramento — passar a renderizar para todos os tipos.
- Substituir a condição `{showAvancoDificuldade && (...)}` (linhas 2636 e 2649) que esconde **Avanços** e **Dificuldades** — passar a exibir sempre.
- O bloco de **Observações** (linha 2624) já é incondicional, manter.
- O bloco de **Encaminhamentos / Fechamento** já é renderizado para Monitoramento (linhas 2445-2467); manter, mas também exibi-lo para os demais tipos (passar a ser sempre visível).
- `handleSaveEdit` já persiste `titulo`, `descricao`, `tags`, `observacoes`, `avancos`, `dificuldades`, `encaminhamentos`, `fechamento` — não precisa alterar a lógica de salvamento.

### 2. `src/pages/admin/ProgramacaoPage.tsx` (diálogo "Editar Programação")

- Remover o gating `{formData.tipo !== "monitoramento_acoes_formativas" && (...)}` (linha 2708) que esconde Título / Descrição / Tags em Monitoramento.
- Adicionar, no mesmo formulário de edição, três `<Textarea>` sempre visíveis: **Observações**, **Avanços**, **Dificuldades** (estados novos `formObservacoes`, `formAvancos`, `formDificuldades`, populados a partir do registro vinculado quando existir).
- Mover **Encaminhamentos** + **Fechamento** para fora do bloco específico de Monitoramento, exibindo sempre.
- Atualizar o `handleSubmit`/update para persistir esses campos no `registros_acao` (criando registro vinculado se ainda não existir, ou atualizando o existente).

## Detalhes técnicos

- Não alterar permissões (admin/N1-N5 mantidas) nem regras de RLS.
- Não alterar validações já existentes (ex.: trigger `validate_observacoes_aula_redes_submission` continua válida — só impacta status `enviado`).
- Manter o select **Fechamento** com as opções `MONIT_FECHAMENTO_OPTIONS` já definidas (vale para qualquer tipo).
- Em `ProgramacaoPage`, ler observações/avanços/dificuldades a partir do `registros_acao` correspondente (mesmo padrão já usado para `formEncaminhamentos`/`formFechamento` nas linhas 1034 / 1235).
- Salvamento: usar `upsert` em `registros_acao` por `programacao_id` quando o registro ainda não existir, espelhando o fluxo já presente no fluxo "Realizar".

## Fora de escopo

- Layout/ordem dos campos permanece o atual (apenas removendo gates).
- Sem alteração no banco — todas as colunas já existem.
