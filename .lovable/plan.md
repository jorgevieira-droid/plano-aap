## Problema

Ao imprimir uma ação do tipo `encontro_microciclos_recomposicao` já realizada, o PDF é gerado em branco. O `AcaoPrintDialog` não busca os dados da tabela própria desse formulário (`relatorios_microciclos_recomposicao`) e o `AcaoPrintForm` não tem renderização dedicada para esse tipo — então ele cai no fluxo genérico de `instrument_fields`, que não existe para esse formulário, resultando em PDF vazio.

## Solução

Tratar `encontro_microciclos_recomposicao` no fluxo de impressão da mesma forma que já é feito para `observacao_aula_redes`, `visita_tecnica_alfabetizacao_redes` e `observacao_aula_gpa`: buscar o registro na tabela própria e renderizar uma seção de impressão dedicada.

### 1. Nova seção de impressão
Criar `src/components/print/EncontroMicrociclosRecomposicaoPrintSection.tsx` que recebe os dados do registro (`relatorios_microciclos_recomposicao`) e renderiza, com os mesmos estilos das outras seções print:

- Cabeçalho: município, data, formador, horário, local, ponto focal da rede.
- 10 itens de verificação (`item_1`..`item_10`) usando rótulos do `MICROCICLOS_ITEMS` e escala 0/1/2 (`BINARY_SCALE_OPTIONS`).
- Relato objetivo.
- Uso da Plataforma Trajetórias (acesso, quizzes, observações) com os mesmos rótulos do formulário.
- Encaminhamentos: pontos fortes, aspectos a fortalecer, encaminhamentos acordados, prazo, responsável.
- Próximo encontro: data + pauta.
- Quando o valor estiver nulo/vazio, exibir traço/linha em branco (mesmo padrão das outras seções).
- Marcar blocos com `data-pdf-section` para quebras de página corretas no `pdfExport`.

### 2. Carregar os dados em `AcaoPrintDialog.tsx`
Adicionar bloco análogo aos atuais (mesma estratégia em camadas usada para `observacao_aula_redes`):
1. Buscar `relatorios_microciclos_recomposicao` por `registro_acao_id` da programação.
2. Fallback: buscar registros pelo `programacao_id` e fazer `.in('registro_acao_id', ids)`.
3. Fallback final: mesma `escola_id` + mesma `data` + `tipo = 'encontro_microciclos_recomposicao'`.
4. Usar o mesmo `pickBest` (prioriza `status='enviado'` e mais recente).
5. Guardar em `data.encontroMicrociclos` e passar como prop para `AcaoPrintForm`.
6. Adicionar aviso quando a ação for `realizada` e nada for encontrado (mesmo texto/estilo dos demais).

### 3. Integrar em `AcaoPrintForm.tsx`
- Aceitar nova prop `encontroMicrociclos`.
- Detectar `programacao.tipo === 'encontro_microciclos_recomposicao'` e renderizar a nova seção em vez do instrumento genérico (mesma lógica de short-circuit já usada para as outras seções dedicadas).

## Arquivos afetados

- `src/components/print/EncontroMicrociclosRecomposicaoPrintSection.tsx` (novo)
- `src/components/print/AcaoPrintDialog.tsx`
- `src/components/print/AcaoPrintForm.tsx`

Nenhuma alteração de banco, RLS ou edge function.
