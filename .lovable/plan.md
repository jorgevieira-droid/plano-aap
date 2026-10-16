# Reunião Mensal — período por Data início / Data fim no topo e semanas sem duplicar

## O que muda
1. **Filtro do topo:** o campo "Mês" é trocado por **Data início** e **Data fim**, ao lado de Escola e Consultor(a). Ele vale para todos os módulos (1 a 9).
   - O filtro próprio do módulo 9 sai, porque o módulo passa a usar o filtro do topo.
   - Um atalho "Mês" continua ao lado das datas. Ao escolher um mês, as datas são preenchidas com as semanas desse mês, pela regra abaixo. Depois disso, as datas podem ser ajustadas à mão.
   - Padrão: as semanas do mês anterior.
2. **Cada semana pertence a um único mês:** uma semana (segunda a sexta) conta no mês que tem a maioria dos seus dias úteis, ou seja, o mês da quarta-feira.
   - Exemplo: 31/08 a 04/09 conta só em **setembro**.
   - Exemplo: 28/09 a 02/10 conta em **setembro**, com 3 dias contra 2.
   - Setembro/2026 fica de 31/08 a 02/10, sem repetir semanas com agosto ou outubro.
3. **Módulo 4 (Apoios x Devolutivas por mês):** os meses do ano seguem a mesma regra de semanas, então um registro de 31/08 conta em setembro. Os valores manuais continuam por mês.
4. **Títulos, PDF e PowerPoint** mostram o período ("31/08/2026 a 02/10/2026"). O nome do arquivo usa o mês do atalho.

## Detalhes técnicos
- Em `ReuniaoMensalEscolasPage.tsx`, criar o helper `mesDaSemana(data)` = `format(addDays(startOfWeek(d,{weekStartsOn:1}),2),'yyyy-MM')` e o helper `periodoDoMes(yyyy-MM)`, que devolve a segunda da primeira semana e a sexta da última semana do mês.
- Estado `periodo {ini, fim}` via `usePersistedState`. A filtragem `doMes` passa a ser `data >= ini && data <= fim`. A busca das aulas usa `ini`/`fim`. Remover `aulasPeriodo`.
- No módulo 4, o agrupamento anual passa a usar `mesDaSemana(r.data)` em vez de `data.slice(0,7)`.
- Teste unitário de `mesDaSemana`/`periodoDoMes`: 2026-08-31 → 2026-09; setembro/2026 → 2026-08-31 a 2026-10-02.
