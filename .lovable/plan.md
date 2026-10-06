# Painel - Microciclos: gráfico, clique na Rede e PDF

## 1. Gráfico com alternância de métricas
- Fica abaixo dos cards de resumo e da memória de cálculo, antes do ranking.
- É um gráfico de barras que mostra as entidades da aba aberta (Redes ou Escolas). As entidades seguem os filtros aplicados e aparecem em ordem decrescente.
- Os botões de alternância são: **Score** (0–100), **Encontros**, **Horas**, **Avaliação** (escala 1–4, indicada no eixo) e **Visitas**.
- O gráfico mostra no máximo 20 entidades, com o aviso "Mostrando as 20 primeiras".
- A métrica escolhida fica salva ao navegar entre as páginas, como os demais filtros.

## 2. Clique na Rede para listar as escolas
- Na aba **Por Rede**, ao clicar no nome da Rede (ou na linha), a página:
  - seleciona essa Rede no filtro;
  - abre a aba **Por Escola**, com apenas as escolas dessa Rede.
- Aparece o botão **"Voltar para todas as Redes"**, que limpa o filtro de Rede e volta para a aba Por Rede.
- Acima da tabela fica a dica discreta: "Clique em uma Rede para ver as escolas".
- Cada Rede passa a mostrar **"X de Y escolas com dados"**.

## 3. Botão "Exportar PDF"
O PDF segue os filtros aplicados (período, programa, Rede e Escola).

**Página de resumo:**
- Cabeçalho com as marcas Parceiros e Bússola, os filtros aplicados e a data de emissão.
- Cards consolidados.
- Memória de cálculo.
- Gráfico na métrica selecionada.
- Ranking de todas as Redes filtradas.

**Uma página por Rede** (cada Rede começa em uma página nova):
- Nome da Rede, score e seus componentes (avaliação, presença e horas), além da cobertura de escolas.
- Tabela das Escolas: Score, Visitas, Avaliação, Encontros, Horas e Presença.
- Tabelas longas são divididas em blocos, repetindo o cabeçalho com "(continuação)". Assim, nenhuma linha fica cortada entre páginas.

Com uma Rede selecionada, o PDF tem o resumo e apenas o detalhamento dela. Com todas as Redes, tem o resumo e uma página por Rede. Uma barra mostra o andamento: "Gerando PDF... X%".

## Detalhes técnicos
- Arquivo: `src/pages/admin/PainelMicrociclosPage.tsx`.
- Gráfico: Recharts `BarChart`, com cores dos tokens do tema e um estado persistido `chartMetric`.
- Clique: `setSelectedRede(rede)` e `setTab('escola')`.
- PDF: a mesma técnica do relatório de Apoio Presencial. Um contêiner oculto usa blocos `data-pdf-section` e é capturado bloco a bloco com html2canvas e jsPDF. Cada Rede é um bloco que força a quebra de página. As escolas são divididas com `chunkRows(escolas, 15)`, e o cabeçalho é repetido. Os estilos são inline, para evitar páginas pretas.
- Sem mudança no banco nem nas regras de acesso.

## Verificação
No preview: testar as cinco métricas, o clique em uma Rede e o botão de voltar. Gerar o PDF com uma Rede e com todas, convertê-lo em imagens e conferir que não há cortes nem páginas pretas.
