# Painel - Microciclos + Filtro de Instrumento no Histórico de Presença

## Parte 1 — Filtro de Instrumento no 'Histórico de Presença'

Em `src/pages/admin/HistoricoPresencaPage.tsx`:

1. **Estado persistido**: novo `selectedInstrumento` via `usePersistedState('historico-presenca:selectedInstrumento', 'all')`.
2. **Consulta**: quando ≠ 'all', aplicar `formQuery.eq('tipo', selectedInstrumento)`; senão mantém o `.in('tipo', [...])` atual.
3. **UI**: novo `<Select>` "Instrumento" no grid de filtros (5 → 6 colunas em `lg`), após "Programa". Opções (A–Z): Encontro Formativo – Microciclos de Recomposição; Encontro Formativo ET/EG – REDES; Encontro Formativo Professor – REDES; Formação; + "Todos".
4. `selectedInstrumento` entra nas dependências do `useCallback` do `fetchData`.

Afeta as duas abas, o Excel e os diálogos (derivam de `formacoes`). Sem mudança no banco.

## Parte 2 — Nova página 'Painel - Microciclos'

### Objetivo
Visualizar Redes (entidades) e Escolas (entidades filho) com a melhor implementação do programa de microciclos, combinando três indicadores: avaliações das Visitas Técnicas, horas de formação e presença dos Encontros.

### Fontes de dados
- **Visitas Técnicas – Microciclos** (`relatorios_visita_tecnica_microciclos`, status `enviado`): notas q17–q22 (escala 1–4) → média de avaliação. Vínculo com Rede via `registros_acao.escola_id` e com Escola via `registros_acao.entidade_filho_id`.
- **Encontros Formativos – Microciclos** (`relatorios_microciclos_recomposicao` + `programacoes` tipo `encontro_microciclos_recomposicao` status `realizada`): horas via `calcularHorasFormacao` e presença via `presencas` (presentes/total por encontro). Hoje a tabela está vazia — a página precisa lidar com isso mostrando "—" nesses indicadores.

### Cálculo da nota composta (0–100)
Para cada entidade com pelo menos 1 visita ou 1 encontro:
- **Nota de avaliação** = média das notas q17–q22 das visitas, normalizada: `(média − 1) / 3 × 100`.
- **Nota de presença** = % média de presença dos encontros (0–100). Sem encontros: excluída da média, não zerada.
- **Nota de horas** = horas de formação da entidade ÷ maior total de horas entre entidades × 100 (normalizada; sem encontros: excluída da média).
- **Score final** = média simples dos indicadores disponíveis, arredondada.

### Página (`src/pages/admin/PainelMicrociclosPage.tsx`)
- **Filtros** (persistidos com `usePersistedState`): Período (data início/fim), Programa e busca de município/rede.
- **Aba "Por Rede"**: ranking (tabela ordenável por score) com: Posição, Rede, Visitas, Avaliação média (1–4), Encontros, Horas de Formação, Presença média %, Score (badge colorido). Barras de progresso horizontais para leitura rápida.
- **Aba "Por Escola"**: mesma estrutura agrupada pela entidade filho (`entidades_filho`), mostrando a Rede à qual pertence.
- **Resumo no topo**: cards com Total de Visitas, Avaliação média geral, Total de Encontros e Horas totais.
- Exportação **Excel** respeitando os filtros (uma aba por ranking).
- Padrões: `DataTable` com paginação existente, ordenação A–Z onde couber, `min-w-0 overflow-x-hidden`.

### Integração
- **Rota**: `/painel-microciclos` em `src/App.tsx`.
- **Menu**: grupo de Painéis no `Sidebar.tsx`, visível para N1, N2, N3 e N5 (estático, sem permissão para N4, N6–N8).
- **RLS**: as tabelas já têm policies de leitura para esses perfis; nenhuma migration necessária.

## Verificação
- `tsgo --noEmit` e build.
- No preview: abrir Histórico de Presença e filtrar por instrumento; abrir Painel - Microciclos, conferir ranking por Rede (as escolas dos registros antigos sem `entidade_filho_id` aparecem apenas no ranking de Redes), ordenação e Excel.
