# Lista de Presença — Incluir Encontros Formativos

Atualmente a página `/lista-presenca` só lista programações do tipo `formacao`. Vamos expandir para incluir também os 3 tipos de Encontros Formativos, mantendo o fluxo atual (filtros, seleção, impressão) e ajustando a busca de participantes elegíveis para cada tipo.

## Tipos de ação suportados

- `formacao` — Formação
- `encontro_microciclos_recomposicao` — Encontro Formativo Microciclos de Recomposição
- `encontro_eteg_redes` — Encontro Formativo ET/EG REDES
- `encontro_professor_redes` — Encontro Formativo Professor REDES

## Mudanças em `src/pages/admin/ListaPresencaPage.tsx`

1. **Query das programações**: trocar `.eq('tipo', 'formacao')` por `.in('tipo', [...])` com os 4 tipos. Trazer também os campos `tipo` e `turma_formacao` no select.

2. **Filtro adicional de tipo**: adicionar um `Select` "Tipo de Ação" no painel de filtros (Todos / Formação / Microciclos / ET-EG REDES / Professor REDES) para o usuário focar a lista.

3. **Lista de programações**: exibir um badge com o rótulo do tipo ao lado do título para diferenciar visualmente.

4. **Carregamento de participantes elegíveis** (lógica condicional por tipo, replicando o padrão já usado em `AAPRegistrarAcaoPage`):
   - **`formacao`**: comportamento atual — filtros por `componente`, `segmento`, `ano_serie` e `cargo` (quando `tipo_ator_presenca` específico).
   - **`encontro_professor_redes`** e **`encontro_eteg_redes`** e **`encontro_microciclos_recomposicao`**: listar todos os atores ativos da entidade; se a programação tiver `turma_formacao` preenchido, filtrar por `professores.turma_formacao = turma_formacao`; caso contrário, mostrar todos os atores da escola.

5. **Cabeçalho/copy**: ajustar título/descrição da página para "Gere listas de presença para impressão de formações e encontros formativos".

## Mudanças em `src/components/presenca/ListaPresencaPrint.tsx`

- Aceitar e exibir o `tipo` da ação no cabeçalho impresso (ex.: "Formação" / "Encontro Formativo — Microciclos de Recomposição"), para que a folha impressa identifique corretamente o tipo de evento. Sem mudanças estruturais no layout.

## Sem mudanças necessárias

- RLS / banco: as programações dos 4 tipos já usam a mesma tabela `programacoes` com as mesmas políticas.
- Tabela `presencas`: já é compartilhada entre formações e encontros.
