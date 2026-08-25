# Relatórios - Apoio Presencial: ordem alfabética, novo layout e gráficos de linha

## 1. Ordem alfabética

- Tabelas "Apoios por Escola" e "Apoios por Consultor(a)" passam a ser ordenadas de A-Z (pt-BR), em vez de por quantidade.
- As listas dos filtros de Escola e Consultor(a) já estão A-Z e continuam assim.
- Linhas dos blocos de rubricas seguem a ordem oficial do instrumento (numeração), não alfabética.

## 2. Novo layout (números antes das listas)

Nova ordem da página, agrupando primeiro tudo que é número em caixas e só depois as listas/tabelas:

```text
1. Cabeçalho + botão Exportar PDF
2. Cartão de filtros (Consultor, Escola, Data início, Data fim)
3. INDICADORES (4 boxes)
   Apoios realizados | Devolutivas | Turmas VOAR | Outros observadores
4. NÚMEROS COMPLEMENTARES (boxes, 2 colunas)
   Apoios por segmento | Início da aula (faixas de atraso)
   Quantidade de rubricas de práticas essenciais (boxes)
5. GRÁFICOS
   Evolução das rubricas de observação (linhas)
   Evolução das práticas essenciais (linhas)
   Autoavaliação do consultor (barras, escala 1-4 com legenda)
6. LISTAS / TABELAS (por último)
   Apoios por Escola | Apoios por Consultor(a)
   Matrizes numéricas mês a mês das rubricas e das práticas (referência do gráfico)
```

Ajustes visuais: seções com título e linha divisória ("Indicadores", "Gráficos de evolução", "Detalhamento por escola e consultor(a)") para dar hierarquia, mantendo o mesmo estilo de cartões do Painel de Encaminhamentos Internos.

## 3. Gráficos de linha para a evolução das rubricas

Sim, é possível — os dados já são calculados por rubrica x mês.

- Gráfico de linhas (eixo X = meses do período, eixo Y = nota média 0-4) com uma linha por rubrica avaliada, pontos marcados e legenda clicável, no mesmo estilo do modelo em PDF enviado.
- Um segundo gráfico de linhas para as práticas essenciais (Retomada, 2ª, 3ª).
- Meses sem avaliação ficam com lacuna (sem ponto), evitando queda falsa para zero.
- As matrizes numéricas continuam abaixo dos gráficos, para leitura precisa dos valores.

## 4. PDF

O PDF passa a seguir exatamente a mesma ordem da tela: indicadores, números complementares, gráficos de linha, autoavaliação e por último as tabelas. Os gráficos são capturados da tela renderizada; se algum gráfico não estiver visível (sem dados no período), a seção é omitida em vez de sair em branco. Cabeçalho institucional padrão (Parceiros + Bússola, período, data de geração) mantido.

## Detalhes técnicos

- Arquivo: `src/pages/admin/RelatoriosApoioPresencialPanelPage.tsx` (única alteração; sem mudanças de banco, RLS ou formulários).
- `porEscola` / `porConsultor`: trocar o comparador para `sortPt(a.nome, b.nome)`.
- Novos componentes internos: `SectionTitle`, `EvolucaoLinesCard` usando `LineChart` do recharts (`connectNulls={false}`, `domain={[0, 4]}`), com dados pivotados para `[{ mes, [rubricaLabel]: media }]`.
- Reaproveitar `MatrizCard` e `CountersCard` já existentes, apenas reposicionados.
- Para o PDF: incluir os nós dos gráficos via referência de DOM (`ref` + `exportSectionsToPdf` com `node`/elemento), seguindo o padrão de captura já usado em `pdfExport.ts`; cores em hex fixo (`#1a3a5c`, `#059669`, `#d97706`, `#7c3aed`).
