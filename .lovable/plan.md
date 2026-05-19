## Mudança

Remover o filtro de **Status** do `Relatório de Instrumentos`. Os resultados passam a trazer todos os registros do instrumento selecionado, independentemente do status da ação (`agendada`, `realizada`, `cancelada`, `adiada` etc.).

## Arquivo afetado

`src/pages/admin/RelatorioInstrumentosPage.tsx`

### Alterações

1. **Remover o controle de filtro Status** (Select "Status") da barra de filtros.
2. **Remover o estado `status`** (`useState<string>('todos')`) e referências em `queryKey`.
3. **Remover os predicados** `q.eq('registros_acao.status', status)` tanto no ramo `dedicated` quanto no ramo `instrument_responses` da query `rel-instr-rows`.
4. **Manter a coluna "Status"** na tabela e no XLSX exportado (apenas como informação, sem filtragem).
5. **Não alterar** `STATUS_OPTIONS`/`statusLabel` (continuam sendo usados pela coluna).

### Fora do escopo

- Outros relatórios (`RelatorioConsultoriaPage`, `RelatorioRegionaisPage`, `RelatorioApoioPresencialPage`).
- Lógica de instrumentos disponíveis (`rel-instr-formtypes`) e atores (`rel-instr-atores`) — já não filtram por status.
- Qualquer mudança em formulários ou no schema do banco.
