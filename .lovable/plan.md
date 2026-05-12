## Objetivo

Adaptar o cadastro e o gerenciamento de ações para o programa **Regionais**: deixar disponível apenas a ação "Monitoramento de Ações Formativas – Regionais", simplificar o cadastro, redesenhar o fluxo de gerenciamento em duas etapas (formulário fixo + rubrica opcional escolhida entre os instrumentos do programa Regionais).

---

## 1. Cadastro de ações (ProgramacaoPage)

Quando `programa = regionais` no cadastro/edição de uma programação:

- O dropdown "Tipo de ação" passa a oferecer **apenas** `monitoramento_acoes_formativas` (forçar seleção e bloquear demais opções).
- Campos exibidos, todos obrigatórios exceto onde indicado:
  - Programa*
  - Título* (livre, deixa de ser fixo "Monitoramento de Ações Formativas – Regionais")
  - Descrição (opcional)
  - Tags (opcional) — reabilitar input de tags para esse tipo
  - Data*, Hora Início*, Hora Fim*
  - Entidade* (entidade Regional)
  - Frente de Trabalho/Projeto*
  - Público do Encontro*
  - Local do Encontro* (com sub-fluxos atuais: escolas / outro)
- Remover do cadastro qualquer outro campo que hoje aparece para esse tipo (segmento/componente/ano-série continuam não exibidos, como já estão).
- Validar todos os obrigatórios; remover a sobrescrita do título e o `tagsArray = []` para esse tipo.

## 2. Gerenciamento da ação (RegistrosPage)

Substituir o fluxo atual (que hoje cai no instrumento padrão) por um diálogo dedicado para `tipo = monitoramento_acoes_formativas`:

### Etapa 1 — Formulário fixo (todos obrigatórios)
1. **Foi possível realizar o fechamento gerando encaminhamentos?*** — opções `Sim`, `Parcialmente`, `Não`
2. **Principais encaminhamentos da ação*** — textarea
3. **Observações*** — textarea
4. **Avanços*** — textarea
5. **Dificuldades*** — textarea

Persistir em `relatorios_monit_acoes_formativas` (acrescentando colunas `observacoes`, `avancos`, `dificuldades`; `fechamento` e `encaminhamentos` já existem). Atualizar `status = 'enviado'`.

### Etapa 2 — Rubrica opcional
Após salvar a Etapa 1, exibir um `AlertDialog`: **"Deseja preencher uma rubrica?"** (Sim / Não).

- **Não** → encerra o gerenciamento e fecha o diálogo.
- **Sim** → exibe um seletor com a lista das ações habilitadas para o programa **Regionais** em `form_config_settings`, **excluindo** `monitoramento_acoes_formativas` e `lista_presenca`. A lista é dinâmica (sempre reflete a configuração atual). Após selecionar a rubrica, abre o `InstrumentForm` correspondente (mesmo componente já usado em outros gerenciamentos), salvando em `instrument_responses` com `form_type` da rubrica escolhida e `registro_acao_id` da ação atual.

## 3. Detalhes técnicos

- **Migração** (`supabase--migration`): em `relatorios_monit_acoes_formativas` adicionar colunas `observacoes text`, `avancos text`, `dificuldades text`. Não alterar RLS existente.
- **`ProgramacaoPage.tsx`**:
  - Restringir `tipo` quando programa = `regionais` (auto-seleciona `monitoramento_acoes_formativas` e oculta/desabilita as demais).
  - Reabilitar `Título`, `Descrição` e `Tags` editáveis para esse tipo (remover override de `tituloFinal` e `tagsArray = []`).
- **`RegistrosPage.tsx`**:
  - Em `handleOpenManage`, interceptar `tipo === 'monitoramento_acoes_formativas'` antes da rota de "instrument type" e abrir um novo diálogo dedicado (nova flag `isMonitRegionaisManaging`).
  - Novo componente `MonitoramentoRegionaisManageDialog` com as duas etapas (formulário fixo → confirmação → seleção de rubrica → `InstrumentForm`).
  - Reaproveitar `useAcoesByPrograma` (`getAcoesByPrograma('regionais')`) e `INSTRUMENT_TYPE_SET` para montar a lista de rubricas, filtrando `monitoramento_acoes_formativas` e `lista_presenca`.
  - Salvar a rubrica via mesmo fluxo já utilizado por `handleSaveInstrumentManage` (insert/update em `instrument_responses`).
- O cadastro mantém os campos atuais de `frente_trabalho`, `publico_encontro`, `local_encontro` etc., apenas exibindo agora também título/descrição/tags livres.

## Arquivos afetados

- Migração SQL para `relatorios_monit_acoes_formativas` (3 colunas novas).
- `src/pages/admin/ProgramacaoPage.tsx` (restrição de tipo, título/tags livres).
- `src/pages/admin/RegistrosPage.tsx` (novo fluxo de gerenciamento + diálogos).
- Novo `src/components/formularios/MonitoramentoRegionaisManageDialog.tsx`.
