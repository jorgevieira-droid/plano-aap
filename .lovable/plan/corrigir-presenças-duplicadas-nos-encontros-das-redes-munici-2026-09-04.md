# Corrigir presenças duplicadas nos encontros das Redes Municipais

## O que foi verificado no banco

A duplicidade é real e está nos dados. Hoje existem **541 combinações de encontro + participante repetidas**, somando **1.137 linhas extras**, distribuídas em **26 encontros** — todos do programa Redes Municipais (`encontro_professor_redes`, `encontro_eteg_redes`, `encontro_microciclos_recomposicao`).

Exemplos: Bertioga 11/08 (o do anexo) tem cada participante gravado 2 vezes; Bertioga 10/08 chega a 9 cópias do mesmo participante; Descalvado 27/04 chega a 13.

Causa raiz: na tela de **Programação**, ao salvar a lista de presença, o sistema **sempre insere** as linhas novamente, sem apagar nem atualizar as já existentes. Ou seja, cada vez que a formadora reabre o encontro e salva de novo (para corrigir alguém ou completar o instrumento), toda a lista é gravada mais uma vez. Na tela de **Registros** o mesmo salvamento apaga antes de inserir e por isso não duplica.

Em 11 dos 541 casos as cópias divergem entre "presente" e "ausente" — nesses, vale o registro mais recente.

## O que será feito

1. **Corrigir a gravação na Programação**: antes de inserir, remover as presenças já existentes daquele encontro (mesmo comportamento já usado em Registros), de modo que salvar duas vezes não some linhas.
2. **Proteção no banco**: criar restrição de unicidade por encontro + participante, para que a duplicidade não volte por nenhum outro caminho.
3. **Limpeza dos dados atuais**: migração que consolida as 1.137 linhas extras, mantendo uma linha por participante em cada encontro, com o valor da gravação **mais recente** (nenhum encontro é apagado).
4. **Conferir os outros pontos de gravação** (Histórico de Presença) para garantir que passem a atualizar em vez de inserir.

## Detalhes técnicos

- `src/pages/admin/ProgramacaoPage.tsx` (~linha 3163): trocar o `insert` puro por `delete().eq('registro_acao_id', registroId)` + `insert`, ou `upsert` com `onConflict: 'registro_acao_id,professor_id'`.
- `src/pages/admin/HistoricoPresencaPage.tsx` (~linhas 256/277): alinhar ao mesmo padrão.
- Migração: deduplicação por `(registro_acao_id, professor_id)` mantendo `max(created_at)` + `UNIQUE (registro_acao_id, professor_id)` em `public.presencas`.

## Verificação

Após a correção: abrir o encontro de Bertioga 11/08 e conferir a lista sem repetições; salvar duas vezes seguidas e conferir que a contagem de presentes não muda; conferir o total no PDF da lista de presença.
