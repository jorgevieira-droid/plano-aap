# Reabilitar página `/relatorios-apoio-coordenacao`

## Objetivo
Tornar novamente acessível no menu lateral a página "Relatório - Apoio com Coordenação" (`/relatorios-apoio-coordenacao`), que atualmente está no grupo `Desabilitados`.

## O que será feito
- Em `src/components/layout/Sidebar.tsx`:
  - Remover o item `Relatório - Apoio com Coordenação` (`/relatorios-apoio-coordenacao`) do grupo `Desabilitados`.
  - Inseri-lo no grupo `Ferramentas de Gestão`, ao lado dos demais relatórios de ação (Apoio Presencial, Formação Coletiva, Apoio ao Coordenador, Planejamento Conjunto, Aula Compartilhada).
  - Configurar `allowedTiers: ['admin', 'manager']` e `requiresAcao: ['registro_consultoria_pedagogica']` (ou o tipo técnico correspondente à ação "Registro de Apoio Presencial com Coordenação"), removendo a flag `disabled: true`.
- Verificar em `src/App.tsx` e `src/components/layout/AppLayout.tsx` se a rota `/relatorios-apoio-coordenacao` ainda está declarada e se há redirecionamentos que a excluam; manter ou ajustar conforme necessário.
- Garantir que a página `src/pages/admin/RelatoriosApoioCoordenacaoPanelPage.tsx` permaneça funcional (sem alterações, a menos que seja necessário reativar algum filtro de permissão removido durante a desabilitação).

## Não será feito
- Não recriar o componente da página nem a rota — ambos já existem.
- Não alterar os dados ou o formulário da ação "Registro de Apoio Presencial com Coordenação".
- Não reabilitar a página legada `/relatorio-consultoria`, que permanecerá em `Desabilitados`.

## Detalhes técnicos
- Ação técnica mapeada: `registro_consultoria_pedagogica` (antigo nome técnico da ação renomeada para "Registro de Apoio Presencial com Coordenação").
- Visibilidade: N1 (admin) e N2/N3 (manager), conforme padrão dos relatórios de ação do Programa Escolas.
- Programa: filtro por `requiresAcao` garante que o item só apareça quando a ação estiver habilitada para o programa do usuário.
