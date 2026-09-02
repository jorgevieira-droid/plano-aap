# Bloco "Indicadores - Caê" em Relatórios de Gestão - Programa Escolas

## Objetivo
Adicionar à página `/relatorios-gestao-escolas` um bloco full-width "Indicadores - Caê", alimentado pelo Registro de Apoio Presencial, reagindo aos filtros globais (período, consultor, escola) e sem botão "Visualizar Relatório".

## Visual aprovado (proposta v2 — data-rich grid)
Bloco full-width abaixo do grid de relatórios, em 3 zonas dentro de um card com header "Indicadores - Caê" + badge "Registro de Apoio Presencial":

```text
┌──────────────────────────────────────────────────────────────┐
│ INDICADORES - CAÊ          [Registro de Apoio Presencial]    │
├──────────────────────────────────────────────────────────────┤
│ [KPI Professores Atendidos]  │ Apoios por Ano/Série │ Professores Apoiados (lista) │
│ 142                          │ 1º Ano  ████░░ 24    │ Professor        | Escola    │
│                              │ 2º Ano  ██████ 38    │ (scroll, max-h)  |           │
│ Apoios por Componente        │ ... barras proporcionais ao maior valor              │
│ Língua Portuguesa ██░░ 58    │                                              │
│ Matemática        █░░░ 44    │                                              │
└──────────────────────────────────────────────────────────────┘
```

- Esquerda: KPI "Professores Atendidos" (nº de professores distintos, excluindo "Sem professor") + barras horizontais de "Apoios por Componente".
- Centro: "Apoios por Ano/Série" com linhas contendo barra de preenchimento proporcional à quantidade (pedido do usuário).
- Direita: tabela "Professores Apoiados" (Professor | Escola) com scroll (`max-h` + sticky header), ordenada A–Z (`localeCompare pt-BR`).
- Grid responsivo: 3 colunas no desktop (`lg:grid-cols-12` → 4/3/5), empilhado no mobile.

## Dados (origem: Registro de Apoio Presencial)
Reuso dos dados já carregados na página (`rows` filtrados, `formType === 'registro_apoio_presencial'`) — nenhuma query nova:
- Professores atendidos: `Set` de `resp.professor` (normalizado, exclui vazio/"Sem professor").
- Lista: pares professor/escola distintos.
- Por componente: contagem por `reg.componente` (label via `componenteLabels`).
- Por ano/série: contagem por `reg.ano_serie`.

## Detalhes técnicos
- `src/pages/admin/RelatoriosGestaoEscolasPage.tsx`: adicionar `segmento`/`componente`/`ano_serie` ao `Row` (select já traz via `registros_acao` — incluir no select), novo `useMemo` `cae` e novo `<Card>` full-width após o grid de blocos, dentro do mesmo loading.
- Barras: largura `%` = valor / máximo da distribuição; cores do padrão da página (`bg-[#1a3a5c]` e tons).
- Sem alteração de rotas, permissões ou backend.
- Validação: `bunx tsgo --noEmit -p tsconfig.json` e conferência visual via Playwright.
