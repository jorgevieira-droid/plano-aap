## Diagnóstico

Os filtros globais do topo (Programa, Entidade, Ator, Ano, Mês) são aplicados corretamente à maioria dos cards via `filteredRegistros`, `filteredProgramacoes`, `filteredAvaliacoes`, etc. (`AdminDashboard.tsx` linhas 465–540).

Porém, dois blocos consomem fontes próprias que **só** filtram por Ano/Mês — ignorando Programa, Entidade e Ator:

1. **Acompanhamento de Aula — Redes Municipais** (radar + barras)
   Fonte: `observacoesRedes` → `filteredObservacoesRedes` (linha 651).
   Hoje só checa `anoFilter`/`mesFilter`.

2. **Visita Técnica — Alfabetização (REDES)** (`VisitaAlfabetizacaoRedesBlock`)
   Fonte: `relVisitaAlfaRedes` → `filteredRelVisitaAlfaRedes` (linha 679).
   Mesmo problema.

Causa raiz: os `select(...)` dessas duas queries (linhas 251–252) **não trazem** `escola_id` nem `aap_id`, então não há como aplicar `escolaFilter`/`atorFilter`.

Bloco `MonitoramentoRegionaisBlock` já aplica os 4 filtros globais via props — OK.
Bloco "Horas por Ator" é, por natureza, uma agregação por ator e respeita os demais filtros — OK.

## Correções

### 1. Incluir colunas de filtro nos selects (`AdminDashboard.tsx`, linhas 251–252)

- `observacoes_aula_redes`: adicionar `id, escola_id, aap_id` ao select.
- `relatorios_visita_tecnica_alfabetizacao_redes`: adicionar `id, escola_id, aap_id` ao select.

(Programa não existe diretamente nessas tabelas — é derivado: ambas são exclusivas do programa "Redes Municipais". Quando `programaFilter` não inclui Redes, o bloco já é escondido por `showRedesModule`/condicional de presença de dados, então não é necessário filtrar por programa internamente.)

### 2. Aplicar `escolaFilter` e `atorFilter` nos filtros em memória

- `filteredObservacoesRedes` (linha 651): adicionar
  ```
  if (escolaFilter !== 'todos' && obs.escola_id !== escolaFilter) return false;
  if (atorFilter   !== 'todos' && obs.aap_id   !== atorFilter)   return false;
  ```
- `filteredRelVisitaAlfaRedes` (linha 679): mesma lógica.

### 3. Ajustar tipos

- `ObservacaoRedesDB` e `RelVisitaAlfaRedes`: incluir os campos opcionais `id`, `escola_id`, `aap_id` se ainda não estiverem.

## Arquivos afetados

- `src/pages/admin/AdminDashboard.tsx` (selects, tipos locais e dois `filter`).
- `src/components/dashboard/VisitaAlfabetizacaoRedesBlock.tsx` — sem mudanças (recebe os registros já filtrados pelo pai).

## Fora de escopo

- Reescrever as queries para filtrar no servidor (mantém-se filtragem em memória, padrão atual da página).
- Mexer em `MonitoramentoRegionaisBlock` e `HorasPorAtorCard` (já respeitam os filtros).
