# Texto de exemplo do campo Título no Apoio Presencial

## O que muda
No formulário de cadastro (Programação/Adicionar Ação), quando a ação for **Registro de Apoio Presencial**, o texto de exemplo (placeholder) do campo **Título** passa a ser:

`Apoio da Profª Emily - 27/06`

Para os demais tipos de ação, o exemplo continua sendo "Ex: Formação em Alfabetização".

## Detalhes técnicos
- `src/pages/admin/ProgramacaoPage.tsx` (campo Título, ~linha 3777): placeholder condicional a `formData.tipo === "registro_apoio_presencial"`.
- Apenas mudança de placeholder; nenhuma alteração de validação, dados ou lógica.
