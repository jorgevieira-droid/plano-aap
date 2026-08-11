# Novo texto de exemplo no campo Título

## O que muda
O placeholder do campo **Título** passa de "Ex: Formação em Alfabetização" para **"Informe o título da atividade que será desenvolvida"**.

Aplica-se ao formulário de Programação/Adicionar Ação e ao formulário de edição em Registros. O caso especial do Registro de Apoio Presencial ("Ex: Apoio da Profª Emily - 27/06") permanece como está.

## Detalhes técnicos
- `src/pages/admin/ProgramacaoPage.tsx` (linha 3853): trocar o texto do ramo padrão do placeholder condicional.
- `src/pages/admin/RegistrosPage.tsx` (linha 2677): trocar o placeholder.
- Apenas texto de placeholder; nenhuma mudança de validação ou dados.
