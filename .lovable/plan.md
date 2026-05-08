## Problema

No Dashboard de Redes (e ADM), o card "Frequência em Eventos Formativos" só exibe o tipo "Microciclos de Recomposição". Os demais tipos (Formação, Encontro Formativo Professor – REDES, Encontro Formativo ETEG – REDES, Encontro Formativo ETAP – REDES, Microciclos) não aparecem.

## Causa

Em `src/pages/admin/AdminDashboard.tsx` (linhas 658–671), a lista `frequenciaPorEncontro` aplica `.filter(item => item.total > 0)`, que esconde todo tipo cujos registros ainda não tenham `presencas` lançadas. Hoje no banco:
- `encontro_microciclos_recomposicao` → 221 presenças (aparece)
- `formacao` → 5 presenças (filtradas porque não pertencem a Redes quando o filtro é Redes)
- `encontro_professor_redes`, `encontro_eteg_redes` → 0 presenças (somem)

Além disso os labels usados no card (ex.: "Encontro Professor REDES") não batem com os nomes oficiais usados no resto do app ("Encontro Formativo Professor – REDES").

## O que será feito

Apenas presentation/UI em `src/pages/admin/AdminDashboard.tsx`:

1. Remover o filtro `.filter(item => item.total > 0)` para que todos os tipos de formação/encontro do programa selecionado apareçam sempre.
2. Para tipos sem presenças, mostrar o card com `0%` e o rótulo `0/0 presenças` (cinza), para deixar claro que ainda não há frequência registrada — em vez de simplesmente sumir.
3. Alinhar `FORMACAO_TIPOS` aos rótulos oficiais usados nas demais telas:
   - `formacao` → "Formação"
   - `encontro_etap_redes` → "Encontro Formativo ETAP – REDES"
   - `encontro_eteg_redes` → "Encontro Formativo ETEG – REDES"
   - `encontro_professor_redes` → "Encontro Formativo Professor – REDES"
   - `encontro_microciclos` → "Microciclos"
   - `encontro_microciclos_recomposicao` → "Encontro Formativo – Microciclos de Recomposição"
4. Filtrar os tipos exibidos conforme o programa selecionado:
   - Quando filtro = Redes: mostrar apenas os 5 tipos REDES + `formacao`.
   - Quando filtro = todos / Admin: mostrar todos.
   - Outros programas: apenas `formacao`.
5. Manter o bloco "% por turma de formação" como está, apenas garantindo que turmas com 0 presenças não apareçam (já é o comportamento atual).
6. Quando a lista final estiver totalmente vazia (nenhum registro do tipo formação no escopo), mostrar mensagem "Nenhum evento formativo no período/escopo selecionado".

Sem mudanças em backend, schema ou lógica de negócio — apenas exibição.
