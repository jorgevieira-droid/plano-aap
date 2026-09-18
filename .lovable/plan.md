# Corrigir acesso da pendência ao registro para exclusão

## Diagnóstico confirmado
- A ação do print existe: **Apoio Presencial com a Coordenação**, entidade **EUDORO VILLELA**, responsável **Tatianne de Almeida Medeiros**, prevista para **01/09/2026**, com status **Agendada**.
- Ela também possui o cadastro de programação vinculado e está no Programa Escolas.
- O botão de abrir na página **Pendências** leva apenas para `/registros`, sem informar qual ação deve ser localizada.
- A página **Registros** mantém filtros anteriores de busca, programa, entidade, responsável, tipo, status, ano e mês; qualquer um deles pode ocultar essa ação quando a página é aberta.

## Alteração proposta
1. Fazer o botão da linha em **Pendências** abrir **Registros** com o identificador exato da ação selecionada.
2. Na página **Registros**, reconhecer esse acesso direcionado, limpar somente os filtros que impedem a exibição da ação e posicioná-la na página correta da tabela.
3. Destacar temporariamente a linha encontrada para facilitar a identificação.
4. Manter as regras atuais de permissão: o botão de exclusão continuará disponível apenas para quem já tem autorização para excluir a ação.
5. Validar o fluxo completo do print: Pendências → abrir ação → localizar em Registros → botão de exclusão visível para perfil autorizado.

## Detalhes técnicos
- O vínculo será feito por parâmetro de URL com o `id` do registro, sem alterar dados ou políticas de acesso.
- A consulta continuará respeitando o escopo atual de usuário, programa e entidade.
- Os demais acessos à página continuarão usando normalmente os filtros persistidos.
