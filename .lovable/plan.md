## Mudança

Substituir o gráfico de barras "% de presença por tipo de encontro" do card "Frequência em Eventos Formativos" por uma **tabela cruzada** (matriz), no mesmo formato do exemplo enviado.

## Layout da tabela

- **Linhas**: tipos de evento formativo (Formação, Encontro Formativo ETAP – REDES, ETEG – REDES, Professor – REDES, Microciclos, Encontro Formativo – Microciclos de Recomposição), respeitando o filtro de programa atual (mesma lógica de `FORMACAO_TIPOS` que já existe).
- **Colunas**: entidades (Redes Municipais e Regionais) que aparecem em pelo menos um registro do escopo filtrado, ordenadas A–Z em pt-BR.
- **Células**: `XX%` de presença para aquele tipo × entidade. Quando não há registro daquele tipo naquela entidade, célula fica vazia (como no exemplo).
- **Tooltip/título** na célula: `presentes/total presenças` para contexto.
- Primeira coluna fixa (sticky left) com o nome do tipo em negrito; cabeçalho sticky no topo.
- Container com `overflow-x-auto` e `max-h-[420px] overflow-y-auto`, usando os tokens semânticos existentes (`bg-card`, `border-border`, `text-muted-foreground`, etc.).
- Subtítulo do bloco continua: "% de presença por tipo de encontro".

## Comportamento

- O segundo bloco "% de presença por turma de formação" é mantido como está, ao lado/abaixo da tabela.
- Empty state existente é mantido: se não houver entidades com registros de formação no escopo, mostrar "Nenhum evento formativo no período/escopo selecionado".
- Linhas de tipos sem nenhum dado em nenhuma entidade do escopo são ocultadas para não poluir a tabela (caso contrário a tabela fica toda vazia para programas não-REDES).

## Detalhes técnicos

Apenas em `src/pages/admin/AdminDashboard.tsx`:

1. Construir a matriz a partir de `filteredRegistros` + `filteredPresencas`:
   - Para cada registro cujo `tipo` esteja em `FORMACAO_TIPOS`, obter `escola_id` → mapear para `escolas` (já carregadas) → `nome` da entidade.
   - Acumular `{ presentes, total }` em `Map<tipo, Map<entidadeNome, {presentes,total}>>`.
2. Derivar `colunasEntidades` (lista única ordenada) e `linhasTipos` (somente tipos com pelo menos 1 célula com dado).
3. Renderizar `<table>` simples com Tailwind: `min-w-full text-sm`, `th` com `sticky top-0 bg-card`, primeira coluna `sticky left-0 bg-card font-semibold`, células `text-center` mostrando `${pct}%` ou vazio.
4. Substituir o bloco do `BarChart` (linhas ~1203–1218) pela tabela. Manter `frequenciaPorEncontro` apenas para detectar "tem algum dado" no empty state (ou trocar por `linhasTipos.length > 0`).

Sem mudanças de schema, backend ou regra de negócio — apenas presentation.