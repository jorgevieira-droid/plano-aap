# Coluna "Tema" na página Registros

## O que será feito
- Nova coluna **Tema** na tabela de Registros, logo após o título da ação.
- Para as **Formações Coletivas**, mostra o tema preenchido no formulário (ex.: "STEM em Ação: do Projeto à Aprendizagem").
- Nas demais ações, ou quando o formulário ainda não foi preenchido, a célula fica em branco.
- A mesma coluna entra na exportação em Excel.
- Nada muda nos dados salvos, filtros ou permissões.

## Detalhes técnicos
- Hoje o campo `tema` existe apenas nas respostas de `registro_formacao_coletiva` (`instrument_responses.responses.tema`, 30 registros).
- `src/pages/admin/RegistrosPage.tsx`: montar um mapa `registro_acao_id -> tema` a partir das respostas de instrumento já carregadas (paginadas em blocos de 1.000); se houver mais de uma resposta para a mesma ação, usar a mais recente.
- Adicionar a coluna no cabeçalho/linhas da tabela e no Excel (texto longo com quebra de linha, `break-words`).

## Verificação
Abrir Registros, conferir a Formação Coletiva de 17/09 (Tacila) com o tema exibido e uma ação de Apoio Presencial com a célula vazia; exportar o Excel e conferir a coluna.
