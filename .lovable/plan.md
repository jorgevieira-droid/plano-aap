

# Formulários REDES e Lista de Presença na Configuração

## Problema
Na página "Configurar Formulários", ao selecionar os instrumentos REDES (Observação de Aula REDES, Encontro ET/EG REDES, Encontro Professor REDES) ou Lista de Presença, aparece "Nenhum campo cadastrado" porque esses formulários não possuem registros na tabela `instrument_fields`.

## Solução
Criar uma migração SQL que insere os campos (`instrument_fields`) para os 3 formulários REDES e para Lista de Presença, com base nos critérios já definidos no código:

### 1. `observacao_aula_redes` — 9 campos rating (escala 1-4)
Critérios já definidos em `REDES_OBSERVACAO_CRITERIA`: alinhamento ao caderno, objetivo claro, repertório de explicação, metodologias, participação ativa, intervenções, verificação de compreensão, clima da sala, gestão do tempo.

### 2. `encontro_eteg_redes` — 8 campos rating (escala 0-2, binário Sim/Não/Parcial)
Itens já definidos em `ETEG_ITEMS`: uso da plataforma, entendimento dos dados, quórum, metodologia SAEB, reunião com CP, acompanhamentos, planos de ação, evidências.

### 3. `encontro_professor_redes` — 8 campos rating (escala 0-2, binário)
Itens já definidos em `PROFESSOR_ITEMS`: participação ativa, clareza de objetivos, quórum, participação de outros atores, material didático, dados da plataforma, resultados de avaliação, conteúdo da pauta.

### 4. `lista_presenca` — sem campos de avaliação
Este formulário é apenas de presença e não tem campos configuráveis. Será removido de `INSTRUMENT_FORM_TYPES` para evitar confusão na tela de configuração, já que não há campos para configurar.

## Alterações

| Arquivo/Recurso | Ação |
|---|---|
| **Migração SQL** | INSERT de ~25 registros em `instrument_fields` para os 3 form types REDES |
| `src/hooks/useInstrumentFields.ts` | Remover `lista_presenca` de `INSTRUMENT_FORM_TYPES` (não tem campos configuráveis) |

Os formulários REDES continuarão usando seus componentes dedicados (ObservacaoAulaRedesForm, EncontroETEGRedesForm, EncontroProfessorRedesForm) para renderização, mas agora o admin poderá habilitar/desabilitar campos por perfil na tela de configuração.

