# Bloco "Visita Técnica — Microciclos" no Painel/Relatórios

Criar um bloco de visualização das dimensões pontuadas (Q19–Q24, escala 1–4) do formulário "Visita Técnica — Microciclos", seguindo o mesmo padrão visual já usado em outros instrumentos pedagógicos (gráfico de barras + cards com ProgressRing).

## Onde aparece

Em todas as superfícies já usadas pelos blocos análogos (Visita Alfabetização, TaRL, GPA), respeitando os filtros de programa, hierarquia e período já existentes:

1. **Painel** (`/dashboard`) — `src/pages/admin/AdminDashboard.tsx`
2. **Meu Painel** (`/aap/dashboard`) — mesma página `AdminDashboard.tsx`
3. **Relatórios Gerais** (`/relatorios`) — `src/pages/admin/RelatoriosPage.tsx`
4. **PDF de relatório** — `src/components/reports/PdfReportContent.tsx`

Sem alterar permissões nem filtros: o bloco só renderiza quando houver pelo menos 1 registro de Microciclo no recorte filtrado (mesma regra `if (registros.length === 0) return null` dos outros blocos).

## O que mostrar

Seis dimensões pontuadas do formulário (rubrica 1–4), conforme `RUBRICAS` em `VisitaTecnicaMicrociclosForm.tsx`:

- Q19 – Intervenções alinhadas ao caderno/faixa de desempenho
- Q20 – Metodologias que favorecem a aprendizagem
- Q21 – Objetivo de aprendizagem claro e comunicado
- Q22 – Verificação da compreensão
- Q23 – Gerenciamento do tempo
- Q24 – Clima de colaboração e respeito

Layout idêntico ao print de referência (Observação de Aula GPA):

- Cabeçalho: ícone + título "Visita Técnica — Microciclos (N visitas)" + "Média geral: X.XX / 4"
- Lado esquerdo: gráfico de barras horizontal (Recharts `BarChart` layout `vertical`), eixo X 0–4, label da barra com média
- Lado direito: grid 2 colunas com cards `ProgressRing` (size 48, max 4) + pergunta completa + valor

Regra de média: ignorar registros sem nota (`null`/`0`) por questão, como já feito nos blocos existentes.

## Fonte de dados

Tabela `relatorios_visita_tecnica_microciclos`, colunas `nota_q17`…`nota_q22` (mapeadas para Q19–Q24 no UI), filtrado por `status = 'enviado'`. O fetch é adicionado no mesmo ponto onde os outros `relatorios_visita_tecnica_*` já são buscados em `AdminDashboard.tsx` e `RelatoriosPage.tsx`, reutilizando os mesmos filtros de programa/entidade/ator/período (`filteredRel...` segue o mesmo pattern).

Para o PDF, o array já filtrado é passado como prop, espelhando `relVisitaAlfa`/`relVisitaTarl`.

## Arquivos

**Novo**
- `src/components/dashboard/VisitaMicrociclosBlock.tsx` — componente do bloco, exporta `VisitaMicrociclosBlock` e tipo `RelVisitaMicrociclos`. Constante local `RUBRICAS_MICROCICLOS` com `{ key: 'nota_q17'..'nota_q22', numero: 19..24, pergunta }` (extraídas do form, sem duplicar níveis).

**Editados**
- `src/pages/admin/AdminDashboard.tsx` — novo state `relVisitaMicrociclos`, fetch da tabela, derivação `filteredRelVisitaMicrociclos` e renderização do bloco junto aos demais (para Painel e Meu Painel).
- `src/pages/admin/RelatoriosPage.tsx` — mesmo pattern do AdminDashboard; render do bloco no mesmo agrupamento de Visita Alfabetização/TaRL.
- `src/components/reports/PdfReportContent.tsx` — recebe `relVisitaMicrociclos` por prop e renderiza o bloco; ajustar tipagem da prop.

## Fora de escopo

- Não alterar o formulário, schema da tabela, permissões nem filtros existentes.
- Não tocar nas perguntas não-pontuadas (Q1–Q18, descritivas).
- Não criar export Excel, página nova ou rota nova.
