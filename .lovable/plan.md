# Tag "Sem formulário" em Registros

## O que muda
- Na coluna **Status** de Registros, abaixo da etiqueta de status, aparece uma etiqueta amarela **"Sem formulário"** quando a ação está **Realizada** e o formulário dela não foi preenchido.
- Só vale para tipos de ação que têm formulário (ações sem formulário, como Lista de Presença, nunca recebem a tag).
- Ações agendadas, canceladas ou reagendadas não recebem a tag (o formulário só é esperado depois de realizada).
- Novo filtro rápido **"Formulário: Todos / Preenchido / Sem formulário"** para listar só as pendentes.
- No Excel, nova coluna **"Formulário"** com "Preenchido" ou "Sem formulário".
- A tag some sozinha quando o formulário é salvo (mesma atualização automática já usada na página).

## Detalhes técnicos
- Em `RegistrosPage.tsx`, nova query paginada (lotes de 1.000) que lê só `registro_acao_id` de `instrument_responses` e das tabelas dedicadas (Microciclos, Visitas Técnicas, GPA, ETEG/Professor Redes etc., via `dedicatedTables.ts`), gerando um `Set` de registros com formulário.
- Regra "tem formulário" reutiliza a mesma lógica do quadro "Ações realizadas sem formulário" do Relatório de Gestão (tipos em `INSTRUMENT_TYPE_SET` + tipos dedicados), extraída para um helper compartilhado para os dois lugares contarem igual.
- Invalida a query após salvar/apagar formulário.
- Verificação: conferir que o Planejamento conjunto de 21/10 do Jefferson aparece com a tag e os de 07/10 e 14/10 não.
