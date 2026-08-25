# Relatórios - Apoio Presencial: refinamento visual + tabelas antes dos gráficos

## 1. Nova ordem da página

```text
1. Cabeçalho (título, período ativo em "chip", botão Exportar PDF)
2. Cartão de filtros (Consultor, Escola, Data início, Data fim)
3. INDICADORES — 4 KPIs
4. NÚMEROS COMPLEMENTARES
   Apoios por segmento | Início da aula (faixas de atraso)
   Quantidade de rubricas de práticas essenciais
5. DETALHAMENTO POR ESCOLA E CONSULTOR(A)   <-- sobe para antes dos gráficos
   Apoios por Escola | Apoios por Consultor(a)  (A-Z)
6. GRÁFICOS DE EVOLUÇÃO
   Evolução das rubricas de observação (linhas)
   Evolução das práticas essenciais (linhas)
   Autoavaliação do consultor (barras, 1 a 4 com legenda)
7. MATRIZES MENSAIS (referência numérica dos gráficos)
```

## 2. Proposta visual (mesma linguagem do Painel de REI, mais polida)

- **Cabeçalho:** faixa superior com título, subtítulo e um chip com o período filtrado ("01/01/2026 – 25/08/2026") e o total de registros considerados, para o usuário saber na hora o recorte que está vendo.
- **KPIs:** cartões com barra de acento colorida no topo, ícone em círculo suave, número grande e rótulo em caixa alta menor. Cada KPI ganha uma cor semântica própria (apoios, devolutivas, VOAR, observadores) via tokens do design system.
- **Números complementares:** caixas internas viram "mini-cards" com número, rótulo e uma barra de proporção horizontal (percentual do total), tornando a leitura comparativa imediata em vez de só contagem seca.
- **Tabelas (Escola / Consultor):** cabeçalho fixo, linhas zebradas, coluna de quantidade com barra proporcional e badge do total no topo do cartão; busca não é adicionada (os filtros já cobrem).
- **Gráficos:** grade mais leve (só linhas horizontais), eixos discretos, pontos ativos maiores no hover, tooltip com fundo de card e legenda em duas colunas quando há muitas rubricas; altura maior para as rubricas de observação.
- **Autoavaliação:** barras horizontais com escala fixa 1–4, faixa de legenda ao pé do cartão e destaque leve na média geral.
- **Seções:** títulos de seção com numeração discreta e linha divisória, mantendo o ritmo vertical consistente (espaçamento uniforme entre blocos).
- **Estado vazio:** cada cartão sem dados mostra ícone + mensagem curta em vez de texto solto.

Sem mudança de cores da marca: tudo em tokens já existentes (azul institucional, verde, âmbar, violeta) para preservar o padrão Parceiros + Bússola.

## 3. PDF

O PDF passa a seguir exatamente a mesma nova ordem (indicadores → números complementares → tabelas por escola/consultor → gráficos → matrizes), mantendo o cabeçalho institucional azul e as quebras por seção.

## Detalhes técnicos

- Arquivo único: `src/pages/admin/RelatoriosApoioPresencialPanelPage.tsx`. Sem alterações de banco, RLS, permissões ou formulários.
- Reordenar o bloco `return` (mover a seção "Detalhamento por escola e consultor(a)" para antes de "Gráficos de evolução") e a mesma reordenação em `handleExport`.
- Ajustar `CountersCard` e as tabelas para incluir barra de proporção (`width: qtd/max*100%`) com `bg-primary/15`.
- KPIs recebem `accent` no card (borda superior de 3px via classe utilitária) e ícone em `rounded-full`.
- Refinar `LinesCard`: `CartesianGrid vertical={false}`, `activeDot`, `Tooltip contentStyle` com tokens, `Legend` compacta.
- Nenhuma cor hardcoded nova nos componentes de tela (apenas hex fixos no nó do PDF, como já é o padrão).
