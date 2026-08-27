# Propagar filtros da visão consolidada para cada relatório

## Objetivo

Em `/relatorios-gestao-escolas`, ao clicar em "Visualizar Relatório", a página de destino já abre com os mesmos filtros aplicados (Consultor(a), Escola, Data Início, Data Fim).

## Como funciona

As 7 páginas de relatório já leem seus filtros do `sessionStorage` via `usePersistedState`, com chaves idênticas por página, mudando apenas o prefixo:

| Relatório | Prefixo |
|---|---|
| Apoio Presencial | `relatorios-apoio-presencial` |
| Apoio c/ Coordenação | `relatorios-apoio-coordenacao` |
| Apoio ao Coordenador | `relatorios-apoio-coordenador` |
| Planejamento Conjunto | `relatorios-planejamento-conjunto` |
| Formação Coletiva | `relatorios-formacao-coletiva` |
| Aula Compartilhada | `relatorios-aula-compartilhada` |
| Encaminhamentos Internos | `painel-encaminhamentos-internos` |

Cada uma usa as chaves `<prefixo>:dataInicio`, `<prefixo>:dataFim`, `<prefixo>:consultorIds` (array de ids), `<prefixo>:escolaIds` (array de ids) — exatamente os mesmos 4 filtros da visão consolidada.

## Mudanças

1. **`src/hooks/usePersistedState.ts`** — adicionar um helper exportado `writePersistedFilters(prefix, { dataInicio, dataFim, consultorIds, escolaIds })` que grava as 4 chaves (`filters:<prefixo>:...`) no `sessionStorage`, no mesmo formato JSON que o hook já usa.

2. **`src/pages/admin/RelatoriosGestaoEscolasPage.tsx`**:
   - Incluir o `prefix` de cada relatório no objeto `Bloco` (junto de `path`).
   - No clique de "Visualizar Relatório", antes do `navigate(bloco.path)`, chamar o helper gravando os filtros atuais (`dataInicio`, `dataFim`, `consultorIds`, `escolaIds`) sob o prefixo do relatório de destino.

## Comportamento resultante

- O relatório abre já filtrado; o usuário pode ajustar os filtros lá dentro normalmente (a página de destino continua soberana sobre seus próprios filtros depois da abertura).
- Ao voltar à visão consolidada, os filtros dela permanecem como estavam (já persistidos).
- Sem mudanças de banco, rotas ou permissões; apenas frontend.

## Validação

- Aplicar filtros na visão consolidada (datas + consultor + escola), abrir cada um dos 7 relatórios e conferir que os filtros chegam preenchidos e os dados coerentes.
- `npx tsgo --noEmit -p tsconfig.app.json`.
