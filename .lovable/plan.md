Plano para inserir em `Pendências` um botão para enviar por e-mail a ação pendente ao usuário responsável.

## O que será alterado

1. **Página Pendências**
   - Adicionar um botão de envio de e-mail em cada linha da tabela de pendências, ao lado do botão atual de “Ver registros”.
   - O botão ficará desabilitado enquanto o envio daquela pendência estiver em andamento.
   - Exibir feedback com toast de sucesso ou erro após o envio.
   - Manter o botão disponível para perfis de gestão já autorizados: Admin, N2/Gestor e N3/Coordenador de Programa.

2. **Envio para uma pendência específica**
   - Ajustar a função de envio de notificações de pendências para aceitar um `registroId` opcional.
   - Quando `registroId` for enviado, a função enviará e-mail apenas para o responsável daquela ação pendente, em vez de enviar o lote completo.
   - Se a ação não estiver mais pendente, retornar mensagem clara informando que não há envio a fazer.

3. **Segurança e escopo por papel**
   - Validar no backend que o usuário logado pode disparar o envio.
   - Admin poderá enviar para qualquer pendência.
   - N2 e N3 só poderão enviar pendências pertencentes aos programas vinculados ao próprio usuário.
   - A validação será feita no backend, não apenas pela interface.

4. **Feedback na interface**
   - Mensagens sugeridas:
     - Sucesso: “E-mail enviado para o responsável pela ação pendente.”
     - Sem ação válida: “Esta ação não está mais pendente.”
     - Sem permissão: “Você não tem permissão para enviar esta pendência.”
     - Erro: mostrar o detalhe retornado pelo backend sempre que disponível.

## Detalhes técnicos

- Arquivos principais:
  - `src/pages/admin/PendenciasPage.tsx`
  - `supabase/functions/send-pending-notifications/index.ts`

- A função existente de envio de pendências já envia e-mails consolidados para responsáveis e coordenadores. Ela será reutilizada, evitando criar uma nova infraestrutura.
- A chamada da página usará a sessão autenticada do usuário e enviará o ID da pendência selecionada.
- O comportamento atual de envio em lote continuará funcionando para os fluxos existentes.
- Após alterar a função backend, ela precisará ser redeployada para que a mudança entre em vigor.