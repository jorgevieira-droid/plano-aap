

# Permitir visualização e configuração do formulário Monitoramento e Gestão

## Problema

O formulário "Monitoramento e Gestão" é hardcoded (`MonitoramentoGestaoForm.tsx`) e não aparece em `INSTRUMENT_FORM_TYPES`, então:
1. Na **Matriz de Ações**, não tem botão "Visualizar" (aparece "—")
2. Não tem pré-visualização na dialog de preview

## Solução

### 1. Criar preview do Monitoramento e Gestão em `RedesFormPreview.tsx`

Adicionar um componente `MonitoramentoGestaoPreview` que exibe a estrutura do formulário em modo somente leitura (similar aos previews REDES existentes), mostrando:
- Campos de identificação (URE, Data, Horário)
- Público do Encontro (7 opções de checkbox)
- Frente de Trabalho (6 opções de rádio)
- Observação (texto)
- Campos condicionais PDCA (5 campos de texto)

Expandir o `REDES_FORM_TYPES` Set para incluir `monitoramento_gestao` e tratar o novo case no switch.

### 2. Atualizar `getFormTypeForAcao` em `MatrizAcoesPage.tsx`

Fazer a função reconhecer tanto os REDES forms quanto `monitoramento_gestao`, retornando o tipo correto para que o botão "Visualizar" apareça.

Atualizar `getFormLabel` para buscar o label também em `ACAO_TYPE_INFO` como fallback.

## Arquivos impactados

| Arquivo | Alteração |
|---|---|
| `src/components/instruments/RedesFormPreview.tsx` | Adicionar `MonitoramentoGestaoPreview` + incluir `monitoramento_gestao` no Set e switch |
| `src/pages/admin/MatrizAcoesPage.tsx` | `getFormTypeForAcao`: retornar tipo para REDES e monitoramento; `getFormLabel`: fallback para `ACAO_TYPE_INFO` |

