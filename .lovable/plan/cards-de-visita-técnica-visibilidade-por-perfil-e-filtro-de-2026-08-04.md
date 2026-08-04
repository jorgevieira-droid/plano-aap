# Cards de Visita Técnica: visibilidade por perfil e filtro de programa

## Objetivo

1. O card **Visita Técnica — IAB (REDES)** deve aparecer somente para o N1 (admin) e apenas quando o filtro de programa estiver em **Redes Municipais** ou **Todos os Programas**.
2. Todos os cards/módulos de Visita Técnica (IAB/REDES, Alfabetização, T@RL, Microciclos) devem respeitar o filtro de programa selecionado, tanto em tela quanto no PDF.

## Situação atual

- Em `AdminDashboard` (usado por Dashboard, Painel e Meu Painel), o bloco IAB é renderizado sem nenhuma condição de perfil ou programa; seu filtro considera apenas ano, mês, entidade e ator — o filtro de programa não é aplicado.
- Em `Relatórios Gerais`, os quatro blocos de visita são filtrados apenas por data (`filterByDate`), sem filtro de programa.
- O bloco de Microciclos no dashboard já aplica o filtro de programa (via `registros_acao.programa`); esse é o padrão a replicar.

## Mudanças

### Dashboard / Painel / Meu Painel (`src/pages/admin/AdminDashboard.tsx`)

- Aplicar ao `filteredRelVisitaAlfaRedes` o mesmo padrão do bloco de Microciclos: resolver o `registro_acao_id` no conjunto de registros visíveis e descartar linhas cujo `programa` não contenha o programa selecionado (quando diferente de "Todos").
- Renderizar o bloco IAB apenas quando: usuário for N1 (admin efetivo) **e** o filtro de programa for `redes_municipais` ou `todos`.

### Relatórios Gerais (`src/pages/admin/RelatoriosPage.tsx`)

- Substituir o `filterByDate` puro dos quatro conjuntos (`relVisitaAlfaRedes`, `relVisitaAlfa`, `relVisitaTarl`, `relVisitaMicrociclos`) por um filtro que também cruze o `registro_acao_id` com os registros visíveis e valide o programa selecionado.
- Aplicar a mesma regra de exibição do bloco IAB (N1 + Redes/Todos), inclusive na aba/exportação.

### PDF (`src/components/reports/PdfReportContent.tsx`)

- Nenhuma lógica nova de filtro: o PDF recebe os conjuntos já filtrados. Adicionar a prop de controle para omitir o bloco IAB quando ele não estiver visível em tela, garantindo paridade entre tela e PDF.

## Detalhes técnicos

- Chave de ligação: `relatorios_*` → `registro_acao_id` → `registros_acao.programa` (array `programa_type`).
- Registros sem `registro_acao_id` correspondente na lista visível são descartados quando há filtro de programa ativo (mesmo comportamento já usado em Microciclos).
- Perfil N1 = `isAdmin` do `AuthContext`, respeitando a simulação de perfil já existente (ao simular N2–N8, o card IAB deixa de aparecer).
