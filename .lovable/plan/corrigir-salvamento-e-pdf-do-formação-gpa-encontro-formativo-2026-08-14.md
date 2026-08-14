# Corrigir salvamento e PDF do "Formação GPA" (Encontro Formativo REDES)

## O que foi verificado

O evento "Formação GPA" corresponde aos tipos `encontro_professor_redes` / `encontro_eteg_redes`. Consultando o banco, o encontro de hoje (Bertioga – Profs MAT Turma B, 10/08) **tem sim respostas gravadas** — mas gravadas em **duas linhas diferentes** para o mesmo registro. Outro registro do mesmo dia acumulou **cinco linhas**, várias delas parciais (só `item_1`, só `relato_objetivo`).

Causa raiz: existem dois caminhos de gravação para o mesmo instrumento.

- No fluxo de **lista de presença** (Programação), o instrumento é sempre **inserido** como nova linha, sem verificar se já existe.
- No fluxo de **instrumento pedagógico** (Programação) e em **Registros**, a leitura/gravação usa `maybeSingle()`, que **falha quando há mais de uma linha**.

Consequências observadas, exatamente como relatado:
1. Ao reabrir o formulário, ele volta **em branco** (a leitura falha) e um novo salvamento cria mais uma linha duplicada — para a formadora, "não salvou".
2. No **PDF** (Imprimir formulário da ação), a busca das respostas também usa `maybeSingle()` e retorna nulo, gerando o relatório **em branco** mesmo com os campos preenchidos.

## O que será feito

1. **Unificar a gravação**: no fluxo de presença, passar a fazer upsert (atualizar a linha existente do mesmo registro + tipo, em vez de inserir outra), mesclando com as respostas já salvas.
2. **Leitura tolerante a duplicidade**: em Registros, na Programação e no diálogo de impressão, trocar `maybeSingle()` por busca de lista ordenada, escolhendo a linha mais recente e **mesclando** as respostas parciais das demais, para não perder nada já preenchido.
3. **PDF**: além da correção acima, buscar as respostas também pelos demais registros da mesma programação (mesma estratégia em camadas já usada em Microciclos) e exibir o aviso "não localizamos um relatório preenchido" quando realmente não houver dados, em vez de gerar um PDF silenciosamente vazio.
4. **Limpeza dos dados existentes**: migração que consolida, por registro + tipo de formulário, as linhas duplicadas em uma única (mesclando os campos preenchidos, com prioridade para o valor mais recente) e remove as sobras. Nenhuma resposta é descartada.
5. **Prevenir reincidência**: índice único em `instrument_responses` por (`registro_acao_id`, `form_type`) quando não há professor vinculado, para que duplicidade não volte a acontecer nesse fluxo.

## Detalhes técnicos

- `src/pages/admin/ProgramacaoPage.tsx` — linha ~3115 (fluxo de presença): substituir o `insert` direto por leitura + `update`/`insert`; linha ~3278 (fluxo de instrumento): usar `order('created_at')` + `limit` em vez de `maybeSingle()`.
- `src/pages/admin/RegistrosPage.tsx` — linhas ~786 (carregamento) e ~1198 (gravação): mesma troca, com merge das respostas duplicadas.
- `src/components/print/AcaoPrintDialog.tsx` — linha ~90: buscar lista de `instrument_responses` (registro principal + registros da mesma programação), mesclar e escolher a mais completa; incluir aviso de PDF vazio para os tipos genéricos.
- Migração: consolidação das linhas duplicadas + índice único parcial `(registro_acao_id, form_type) WHERE professor_id IS NULL`.

## Verificação

Após a correção: reabrir o encontro de 10/08 (Bertioga) e conferir que o formulário volta preenchido; gerar o PDF do mesmo evento e conferir que traz itens e campos qualitativos.
