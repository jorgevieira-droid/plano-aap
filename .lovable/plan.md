## Objetivo
Esconder no formulário de cadastro de `/programacao` os 5 campos (Fechamento, Encaminhamentos, Observações, Avanços, Dificuldades) quando o tipo da ação for **Monitoramento de Ações Formativas (Regionais)**. Esses dados continuam sendo coletados apenas no fluxo de gerenciamento (`MonitoramentoRegionaisManageDialog`).

## Mudanças

**`src/pages/admin/ProgramacaoPage.tsx`**
- Envolver os 5 blocos de campos atualmente "sempre visíveis" (linhas ~3153–3214: Fechamento, Encaminhamentos, Observações, Avanços, Dificuldades) em uma condicional `formData.tipo !== "monitoramento_acoes_formativas"`. Para os demais tipos o comportamento permanece idêntico.
- No handler de submit (linhas ~1378–1435), garantir que quando o tipo for `monitoramento_acoes_formativas` os campos `fechamento`, `encaminhamentos`, `observacoes`, `avancos`, `dificuldades` sejam enviados como `null`/não tocados, evitando que o estado residual do formulário seja persistido. (O registro completo desses campos passa a vir somente do dialog de gerenciamento.)
- Limpar os states (`setFormFechamento('')`, `setFormEncaminhamentos('')`, `setFormObservacoes('')`, `setFormAvancos('')`, `setFormDificuldades('')`) ao abrir o cadastro com tipo `monitoramento_acoes_formativas`, para evitar herança visual em edições subsequentes.

## Fora de escopo
- Sem alterações no `MonitoramentoRegionaisManageDialog` (gerenciamento continua como hoje).
- Sem alterações em outros tipos (Formação, Consultoria etc.) — eles continuam exibindo os campos no cadastro.
- Sem migração de banco.