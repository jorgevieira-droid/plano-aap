

# Customizar diálogo de programação para Monitoramento de Ações Formativas

## Problema

O diálogo de programação usa o formulário genérico (Título, Descrição, Tags) para `monitoramento_acoes_formativas`. O documento especifica campos próprios: Frente de Trabalho, Público do Encontro, Local do Encontro (com lógica condicional), Fechamento e Encaminhamentos.

## Abordagem

Ocultar campos genéricos (Título, Descrição, Tags) para este tipo e exibir os campos específicos do documento diretamente no diálogo de programação. Os dados específicos serão salvos na tabela `relatorios_monit_acoes_formativas` no momento da criação da programação (pré-criando o registro).

O título será gerado automaticamente: `"Monitoramento de Ações Formativas – Regionais"`.

## Alterações

### 1. Migração SQL
- Adicionar colunas à tabela `programacoes` para armazenar os dados do formulário diretamente: `frente_trabalho (text)`, `publico_encontro (text[])`, `local_encontro (text)`, `local_escolas (text[])`, `local_outro (text)`, `fechamento (text)`, `encaminhamentos (text)`
- Isso evita criar o relatório antes do registro, mantendo o fluxo existente

### 2. `src/pages/admin/ProgramacaoPage.tsx`
- Adicionar estados: `formFrenteTrabalho`, `formPublicoEncontro` (array), `formLocalEncontro`, `formLocalEscolas` (array), `formLocalOutro`, `formFechamento`, `formEncaminhamentos`
- Buscar `entidades_filho` ao selecionar entidade (reutilizar lógica existente do `observacao_aula_redes`)
- **Ocultar** Título, Descrição e Tags quando `tipo === 'monitoramento_acoes_formativas'` — gerar título automaticamente
- **Inserir campos condicionais** após Entidade/Formador:
  - Frente de Trabalho (select único)
  - Público do Encontro (checkboxes multi-select)
  - Local do Encontro (select com lógica condicional para Escola(s) e Outro)
  - Fechamento com encaminhamentos (select único)
  - Principais encaminhamentos (textarea)
- Na função de salvar, incluir os novos campos no insert de `programacoes` e pré-criar o registro em `relatorios_monit_acoes_formativas`

### 3. `src/components/formularios/MonitoramentoAcoesFormativasForm.tsx`
- Ao abrir o formulário de registro, carregar dados pré-existentes de `relatorios_monit_acoes_formativas` se já houver um registro (preenchido na programação)
- Permitir edição/atualização em vez de apenas insert

## Arquivos impactados

| Arquivo | Alteração |
|---|---|
| Migração SQL | Novas colunas em `programacoes` |
| `src/pages/admin/ProgramacaoPage.tsx` | Campos condicionais no diálogo + lógica de salvamento |
| `src/components/formularios/MonitoramentoAcoesFormativasForm.tsx` | Suporte a upsert (carregar dados existentes) |

