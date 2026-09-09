# Remover cards do Relatório - Reunião com a coordenação

## Diagnóstico
- Os dois itens dos prints — o card **"Distribuição das notas (NPS)"** e o gráfico **"Evolução mensal"** — estão na página **Relatório - Reunião com a coordenação** (`/relatorios-apoio-coordenador`), arquivo `src/pages/admin/RelatoriosApoioCoordenadorPanelPage.tsx`. Confirmado: é o único arquivo que renderiza esses dois blocos juntos.
- Na página **Relatório - Apoio Presencial com a Coordenação** (`/relatorios-apoio-coordenacao`), o gráfico "Evolução mensal" **já foi removido** na alteração anterior — não existe mais no código. O print da "Evolução mensal" corresponde a uma versão antiga (cache/publicado) dessa página.

## Alteração
Arquivo: `src/pages/admin/RelatoriosApoioCoordenadorPanelPage.tsx` (somente ele)

1. **Remover "Distribuição das notas (NPS)"**
   - UI: remover `<CountersCard titulo="Distribuição das notas (NPS)" .../>` (linha ~599)
   - PDF: remover o bloco `renderCounters('Distribuição das notas (NPS)', porNota)` (linha ~324)
   - Remover o cálculo `porNota` se ficar sem uso

2. **Remover gráfico "Evolução mensal"**
   - UI: remover `<SectionTitle numero="4">Evolução mensal</SectionTitle>` + `<Card>` com o `LineChart` (linhas ~607–645)
   - PDF: remover a seção `data-pdf-section` com o gráfico (linhas ~332–351)
   - Remover código de apoio que ficar sem uso: `evolucaoData`, `LINHAS_EVOLUCAO`, imports do Recharts (`LineChart`, `Line`, `XAxis`, `YAxis`, `CartesianGrid`, `Tooltip`, `Legend`, `ResponsiveContainer`) se não usados em outro bloco da página
   - Renumerar os `SectionTitle` seguintes (ex.: "Registros detalhados" passa a ser a última seção numerada corretamente)

## Validação
- `npx tsgo --noEmit -p tsconfig.app.json`
- Verificação visual via Playwright em `/relatorios-apoio-coordenador`: confirmar ausência de "Distribuição das notas (NPS)" e "Evolução mensal" na tela.

## Observação
Após o deploy/atualização do preview, o gráfico antigo da página "Apoio Presencial com a Coordenação" deve sumir — o código já está sem ele. Se ainda aparecer, é cache do navegador/versão publicada.
