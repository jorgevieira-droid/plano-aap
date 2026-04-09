

# Formulário na Matriz de Ações + Ordenação Alfabética

## Problema
1. O tipo `monitoramento_acoes_formativas` não aparece no botão "Visualizar" formulário na Matriz de Ações porque não está registrado em `REDES_FORM_TYPES`.
2. As ações não estão ordenadas alfabeticamente em nenhuma das listas (Matriz, Programação, Configuração de Formulário).

## Alterações

### 1. `src/components/instruments/RedesFormPreview.tsx`
- Adicionar `'monitoramento_acoes_formativas'` ao `REDES_FORM_TYPES` Set.
- Adicionar case `'monitoramento_acoes_formativas'` no switch do componente `RedesFormPreview`, renderizando um preview estático com os campos do formulário (Frente de Trabalho, Público do Encontro, Local do Encontro, Fechamento, Encaminhamentos).

### 2. `src/pages/admin/MatrizAcoesPage.tsx`
- Ordenar `visibleAcaoTipos` alfabeticamente pelo label: `.sort((a, b) => ACAO_TYPE_INFO[a].label.localeCompare(ACAO_TYPE_INFO[b].label))`.

### 3. `src/config/acaoPermissions.ts`
- Ordenar o array `ACAO_TIPOS` alfabeticamente pelo label (ou pela chave, mantendo consistência).
- Nas funções `getCreatableAcoes` e `getViewableAcoes`, ordenar o resultado por label antes de retornar.

### 4. `src/pages/admin/ProgramacaoPage.tsx`
- Na lista de tipos de ação do dropdown de criação, ordenar por label alfabeticamente.

## Arquivos impactados

| Arquivo | Alteração |
|---|---|
| `src/components/instruments/RedesFormPreview.tsx` | Preview do formulário + registro no Set |
| `src/pages/admin/MatrizAcoesPage.tsx` | Sort alfabético |
| `src/config/acaoPermissions.ts` | Sort nas funções de listagem |
| `src/pages/admin/ProgramacaoPage.tsx` | Sort no dropdown de tipos |

