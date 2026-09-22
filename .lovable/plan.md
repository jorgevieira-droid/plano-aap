# Ajustes nos painéis do Programa Escolas

## 1. Relatórios - Apoio Presencial

### Novo gráfico: notas das rubricas de práticas essenciais
Gráfico de colunas com a quantidade de notas atribuídas por critério, separado por prática essencial:
- 0 - Nada efetivo
- 1 - Pouco efetivo
- 2 - Efetivo
- 3 - Muito efetivo

### Novo card: apoios com e sem observação de práticas essenciais
Card com duas contagens (e percentual): apoios em que houve observação de práticas essenciais e apoios sem observação, com base na resposta "Você observou práticas essenciais?".

### Agrupar os indicadores de práticas essenciais
Todos os blocos ligados às práticas essenciais ficam em sequência, em uma seção própria "Práticas essenciais":
1. Apoios com e sem observação de práticas essenciais
2. Quantidade de rubricas de práticas essenciais (já existe)
3. Quantidade de notas por critério (novo)
4. Evolução das rubricas de práticas essenciais (média por mês) — movida das "Matrizes mensais" para esta seção

A numeração das seções da página é reajustada em sequência.

### Download em Excel da devolutiva formativa
Botão "Exportar Excel" no cabeçalho da tabela "Devolutiva formativa — respostas registradas", gerando planilha com as mesmas colunas exibidas: Consultor(a), Escola, Data, Temas abordados, Encaminhamentos, Participação e engajamento — respeitando os filtros aplicados.

### PDF
O PDF do painel passa a incluir os dois novos blocos, na mesma ordem agrupada da tela.

## 2. Relatórios de Gestão - Programa Escolas

Nas tabelas "Escolas Atendidas" e "Apoios por Consultor(a)", incluir duas novas colunas de contagem:
- Apoio Presencial com a Coordenação
- Formação Coletiva

Essas ações passam a integrar a base de contagem dessas duas tabelas (hoje ela usa apenas Apoio Presencial, Planejamento Conjunto e Aula Compartilhada), e as exportações em Excel de ambas as tabelas recebem as mesmas colunas. Os totais por professor, por componente e por Ano/Série do bloco "Indicadores - Caê" permanecem como estão, pois essas duas ações não se referem a um professor observado.

## Detalhes técnicos

- `src/pages/admin/RelatoriosApoioPresencialPanelPage.tsx`: novos `useMemo` para distribuição de notas (`pratica_1_nota`…`pratica_3_nota`, valores 0–3) e para `observou_praticas`; gráfico de barras com Recharts (padrão já usado nos outros painéis); export XLSX com `xlsx` seguindo o padrão `saveSheet`; reordenação do JSX e das seções do PDF.
- `src/pages/admin/RelatoriosGestaoEscolasPage.tsx`: estender o tipo `Counts` e `bucketOf` com os buckets `coordenacao` (`registro_consultoria_pedagogica`) e `formacao` (`registro_formacao_coletiva`), incluindo esses form types apenas nos mapas de escola e consultor; atualizar cabeçalhos/células das duas tabelas e `exportEscolasExcel` / `exportConsultoresExcel`.
