# Painel - Microciclos: filtros Rede/Escola em dropdowns encadeados

## Objetivo
Substituir a busca por texto do Painel - Microciclos por dois dropdowns que se comunicam:
- **Rede (Entidade)**: lista todas as redes com dados no período.
- **Escola (Entidade Filho)**: ao selecionar uma Rede, mostra somente as escolas (entidades filho) daquela rede; sem Rede selecionada, mostra todas.

## Mudanças

### `src/pages/admin/PainelMicrociclosPage.tsx`
1. Remover o campo de busca por texto (`busca`) e o `rankingFiltrado` por texto.
2. Adicionar dois estados persistidos (`usePersistedState`):
   - `selectedRede` (padrão `'todas'`)
   - `selectedEscola` (padrão `'todas'`)
3. Opções dos dropdowns derivadas dos dados já carregados:
   - **Redes**: entidades presentes nos rankings (visitas/encontros no período), ordenadas A-Z com `localeCompare('pt-BR')`.
   - **Escolas**: entidades filho presentes nos dados; quando `selectedRede !== 'todas'`, filtrar só as escolas cuja Rede pai é a selecionada (vínculo via `registros_acao.escola_id` + `entidade_filho_id`).
4. Comportamento encadeado:
   - Ao trocar a Rede, se a Escola selecionada não pertencer à nova Rede, resetar para `'todas'`.
   - Ao selecionar uma Escola diretamente (sem Rede), aplicar filtro só por ela.
5. Filtragem dos rankings:
   - Aba **Por Rede**: filtra por `selectedRede` (e, se uma Escola estiver selecionada, mantém a Rede correspondente).
   - Aba **Por Escola**: filtra por `selectedRede` e/ou `selectedEscola`.
   - Cards de resumo e Exportar Excel respeitam os mesmos filtros.
6. Layout: os dois Selects ficam na barra de filtros existente (ao lado de período e programa), com rótulos "Rede" e "Escola".

## Sem mudanças
- Banco de dados, RLS, rotas e menu permanecem como estão.
- Memória de cálculo do indicador inalterada.

## Verificação
- tsgo sem erros.
- No preview: selecionar uma Rede e confirmar que o dropdown de Escola mostra só as filhas dela; trocar de Rede reseta a Escola; rankings, cards e Excel refletem a seleção.
