# Extração de Bases: Encontros ET/EG e Professor (REDES) vindo vazios

## O que foi verificado
- O banco tem os formulários: 29 Encontros ET/EG e 59 Encontros Professor, todos do programa Redes Municipais e com status Realizada.
- A correção da última conversa já está na versão em edição: esses dois instrumentos passam a ler os formulários preenchidos.
- O site publicado (acompanhamento-aaps.org) ainda roda a versão antiga, que lê um lugar sem dados. Por isso a tela continua vazia.

## O que fazer
1. Publicar o app para levar a correção ao site.
2. Depois de publicar, abrir a Extração de Bases em Redes Municipais e gerar os dois instrumentos. Devem aparecer 29 e 59 registros.
3. Se algum continuar vazio depois de publicar, investigar as permissões do perfil que está extraindo.

Nenhuma mudança de código é necessária.
