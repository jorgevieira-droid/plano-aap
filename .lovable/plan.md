## Problema

Ao gerar Relatório Narrativo para "Visitas Técnicas - Microciclos" (Redes), aparece:
`column observacoes_aula_redes.nota_q17 does not exist`.

## Causa

O hook `src/hooks/useNarrativeReport.ts` mantém um mapa `DEDICATED_TABLES` desatualizado. A chave `observacao_aula_redes` aponta para a tabela antiga `observacoes_aula_redes`, mas os `instrument_fields` desse instrumento já foram migrados para o esquema de Microciclos (Q19–Q24 / `nota_q17`...), cujas colunas só existem em `relatorios_visita_tecnica_microciclos`.

O mapa equivalente em `RelatorioInstrumentosPage.tsx` já foi corrigido anteriormente para essa tabela; o hook do narrativo ficou para trás.

## Verificação dos demais relatórios

Comparei linha a linha os dois mapas. Todas as outras entradas batem (consultoria, monitoramentos, alfabetização REDES, ETEG, professor REDES, observação GPA, alfabetização, TaRL, reunião acompanhamento, microciclos recomposição, observação_aula → avaliacoes_aula). Só o `observacao_aula_redes` está divergente. Portanto, nenhum outro instrumento deve disparar o mesmo erro hoje — a correção pontual resolve todos os casos conhecidos.

## Correção

Em `src/hooks/useNarrativeReport.ts`, alterar 1 linha:

- `observacao_aula_redes: "observacoes_aula_redes"` → `observacao_aula_redes: "relatorios_visita_tecnica_microciclos"`

Sem migração de banco. Sem impacto em outras telas.

## Validação

1. Gerar Narrativo de "Visitas Técnicas - Microciclos" em Redes Municipais → não pode mais lançar erro de coluna.
2. Gerar Narrativo dos demais instrumentos (Consultoria, GPA, Alfabetização, TaRL, ETEG, Professor REDES, Microciclos Recomposição, Monitoramentos, Reunião Acompanhamento) → continuar funcionando normalmente.
