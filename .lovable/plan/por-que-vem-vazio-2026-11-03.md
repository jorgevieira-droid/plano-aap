## Por que vem vazio
Os formulários de "Encontro Formativo ET/EG - REDES" (29 preenchidos) e "Encontro Formativo Professor - REDES" (59 preenchidos) ficam salvos no local geral de respostas, junto com as ações. A extração busca esses dois instrumentos em duas bases antigas, que estão vazias (0 linhas cada).

## Correção
Na página Extração de Bases - Instrumentos, esses dois instrumentos vão passar a ser extraídos do mesmo jeito que os outros: a página parte das ações registradas e junta as respostas preenchidas de cada uma. Assim, os filtros de Ator, Entidade, Status e Período passam a funcionar como nos demais instrumentos.

## Detalhes técnicos
- `ExtracaoBasesInstrumentosPage.tsx`: remover `encontro_eteg_redes` e `encontro_professor_redes` do mapa `DEDICATED_TABLES` (linhas 49-50). Com isso, o fluxo cai no ramo padrão `registros_acao` + `instrument_responses` (form_type = instrumento).
- As listas de atores e entidades e a detecção de instrumentos disponíveis já usam esse ramo padrão quando o tipo não é dedicado.
- `dedicatedTables.ts` fica como está (outras telas podem usar essas tabelas).
