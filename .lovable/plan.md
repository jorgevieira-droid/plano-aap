# Finalizar Visualizações + Exportação Excel

As páginas `RelatorioConsultoriaVisualizacaoPage` e `RelatorioApoioPresencialPage` já foram criadas, mas ainda não estão acessíveis e não exportam Excel. Esta etapa finaliza as duas pendências.

## 1. Rotas — `src/App.tsx`

Adicionar imports e duas novas rotas dentro do `<AppLayout />`:

- `/visualizacao-consultoria` → `RelatorioConsultoriaVisualizacaoPage`
- `/visualizacao-apoio-presencial` → `RelatorioApoioPresencialPage`

## 2. Menu lateral — `src/components/layout/Sidebar.tsx`

Adicionar dois itens em `adminMenuItems` e `managerMenuItems` (após "Rel. Consultoria Pedagógica"):

- `Visualização Consultoria` → `/visualizacao-consultoria`
- `Visualização Apoio Presencial` → `/visualizacao-apoio-presencial`

N4–N8 não verão os itens (não estão nesses menus). A filtragem por programa segue a hierarquia já estabelecida.

## 3. Botão "Baixar Excel" nas duas visualizações

Adicionar um botão **"Baixar Excel"** ao lado do botão "Exportar PDF" em ambas as páginas, usando a biblioteca `xlsx` (SheetJS) já comum no projeto. Se ainda não estiver instalada, adicionar `xlsx` como dependência.

### Visualização Consultoria Pedagógica
Gera um `.xlsx` com as seguintes abas, respeitando os filtros aplicados (período, Consultor, Escola, hierarquia):

- **Resumo** — KPIs (Total Consultoria, Aulas observadas, Devolutivas, Aulas em parceria com coordenação, Devolutivas modelizadas, Devolutivas acompanhadas, ATPCs, Devolutivas de ATPC)
- **Registros** — uma linha por ação realizada com colunas: Data, Consultor, Escola, Tipo, Status, e cada métrica/contagem da consultoria
- **Qualitativo** — Boas práticas, Pontos de preocupação, Encaminhamentos (uma linha por entrada, com Data/Consultor/Escola)

### Visualização Apoio Presencial
Gera um `.xlsx` com:

- **Resumo** — KPIs (Aulas observadas total/MAT/LP/OE MAT/OE LP, Devolutivas mesmo dia, Devolutivas até 7 dias, Observações com coordenador, Aulas em turma padrão VOAR, Aulas em turmas adaptadas)
- **Registros** — uma linha por ação realizada: Data, Consultor, Escola, Componente, Tipo de turma, Devolutiva (sim/dias), Coordenador presente, Média geral, e colunas para cada item observado pontuado
- **Top/Bottom 3** — as 3 melhores e 3 piores ações por média (mesma lógica da tabela em tela)

### Detalhes técnicos

- Nome do arquivo: `visualizacao-consultoria-YYYY-MM-DD.xlsx` / `visualizacao-apoio-presencial-YYYY-MM-DD.xlsx`
- Cabeçalhos em negrito, larguras de coluna ajustadas
- Datas formatadas como `dd/MM/yyyy`
- Reaproveitar os dados já carregados pelos hooks da página (sem nova query) — o botão usa o mesmo dataset filtrado que alimenta os gráficos

## 4. Verificação

- Páginas carregam para admin/N1 e managers/N2/N3 com escopo correto
- Filtros aplicam hierarquia já estabelecida
- Excel respeita os mesmos filtros do que está em tela
- PDF mantém cabeçalho institucional Bússola + Parceiros da Educação

Nenhuma mudança de schema/RLS necessária.
