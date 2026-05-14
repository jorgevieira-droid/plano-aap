## Objetivo

No cadastro (agendamento) da ação **Monitoramento e Gestão**, exibir apenas o formulário próprio da ação — sem os campos genéricos de fechamento — seguindo o mesmo padrão já usado por *Monitoramento de Ações Formativas - Regionais*.

Os campos específicos (Público, Frente de Trabalho, Observação, PDCA) continuam sendo preenchidos no fluxo de **gerenciamento** (quando o usuário confirma que a ação ocorreu), através do `MonitoramentoGestaoForm` já existente.

## Mudanças

### `src/pages/admin/ProgramacaoPage.tsx`

1. **Esconder o bloco genérico no agendamento** (linha 3492):
   - Atualizar a condição `formData.tipo !== "monitoramento_acoes_formativas"` para também excluir `"monitoramento_gestao"`.
   - Resultado: ao programar uma ação de Monitoramento e Gestão, os campos *Fechamento, Encaminhamentos, Observações, Avanços, Dificuldades* deixam de aparecer.

2. **Validação / payload de criação**:
   - Garantir que o submit de cadastro de `monitoramento_gestao` não exige nem persiste esses campos genéricos (passar `undefined` conforme padrão do projeto).
   - Verificar bloco de validação em `handleSave`/`handleSubmit` (próximo às linhas 1280–1290 onde já existe ramo para `monitoramento_acoes_formativas`) e replicar comportamento mínimo: somente exigir data, horário, entidade e programa.

3. **Edição de agendamento existente**:
   - Mesma regra: ao reabrir um agendamento de `monitoramento_gestao`, não mostrar nem reaproveitar os campos genéricos.

## Fora do escopo

- O `MonitoramentoGestaoForm` (preenchimento durante o gerenciamento) já está implementado e não muda.
- Lógica de reverter status para "prevista" quando o instrumento não é salvo permanece igual.
- Permissões e visibilidade do tipo no seletor "Nova Ação" permanecem inalteradas.
