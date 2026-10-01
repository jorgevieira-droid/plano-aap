# Corrigir "Editar o cadastro da ação" para N4

## Causa
Em Registros, o botão leva sempre para a página de Programação. Os perfis operacionais (N4.1, N4.2, N5) não têm acesso a essa página — eles usam "Meu Calendário", que é a mesma tela. Por isso o sistema os devolve para a página inicial, que no Programa Escolas é "Adicionar Ação".

## O que será feito
- O botão passará a abrir "Meu Calendário" para perfis operacionais e a Programação para os demais, já com o cadastro da ação aberto em modo de edição.
- Vou conferir no preview simulando o perfil N4.

## Detalhes técnicos
- `RegistrosPage.tsx` (~l.2012): a rota base depende de `roleTier`. Se for `operational`, vai para `/aap/calendario`; caso contrário, para `/programacao`. O parâmetro `?editProgramacao=<id>` continua o mesmo, e o mesmo componente `ProgramacaoPage` trata o link.
