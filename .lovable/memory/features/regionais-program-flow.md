---
name: Regionais Program Cadastro & Management Flow
description: Programa Regionais permite cadastrar apenas Monitoramento de Ações Formativas; gerenciamento abre formulário de fechamento + rubrica opcional
type: feature
---

- Cadastro: o tipo `monitoramento_acoes_formativas` é o ÚNICO cadastrável sob o programa `regionais` (constante `REGIONAIS_CADASTRABLE_TIPOS` em `ProgramacaoPage.tsx`). `getProgramasForTipo` strip-a `'regionais'` para qualquer outro tipo.
- Cadastro mantém Título, Descrição e Tags livres (não há mais override fixo).
- Gerenciamento (`RegistrosPage.tsx` → `MonitoramentoRegionaisManageDialog.tsx`):
  1. Etapa 1 – formulário fixo obrigatório: `fechamento`, `encaminhamentos`, `observacoes`, `avancos`, `dificuldades` (persistidos em `relatorios_monit_acoes_formativas`).
  2. AlertDialog "Deseja preencher uma rubrica?".
  3. Se sim, seletor com rubricas vindas de `useAcoesByPrograma.getAcoesByPrograma('regionais')` filtradas por `INSTRUMENT_TYPE_SET` e excluindo `monitoramento_acoes_formativas` e `lista_presenca`. Resposta salva em `instrument_responses` (mesmo `registro_acao_id`).
- Tabela `relatorios_monit_acoes_formativas` ganhou colunas `observacoes`, `avancos`, `dificuldades`; `frente_trabalho` e `local_encontro` agora são NULL-able para permitir salvar somente o gerenciamento quando o cadastro foi importado sem esses campos.
