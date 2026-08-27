# Desabilitar menu "Relatório - Apoio com Coordenação"

## Objetivo
Remover do menu lateral o acesso ao relatório cujos dados vêm da ação "Registro de Apoio Presencial com Coordenação" (antigo "Registro de Formação do Coordenador"), conforme solicitado.

## O que será feito
- Mover o item de menu `Relatório - Apoio com Coordenação` (rota `/relatorios-apoio-coordenacao`) do grupo `Ferramentas de Gestão` para o grupo `Desabilitados` em `src/components/layout/Sidebar.tsx`.
- Manter o item com a flag `disabled: true`, seguindo o padrão já existente para páginas descontinuadas no menu.
- Preservar a rota e o componente da página (`/relatorios-apoio-coordenacao`) no código, permitindo reativação futura sem recriar arquivos.
- Verificar se há algum redirecionamento de entrada (AppLayout/App.tsx) que leve o usuário para essa rota; se houver, ajustar para não enviar o usuário a uma página desabilitada.

## Não será feito
- Não removeremos o componente da página nem sua rota.
- Não alteraremos a ação "Registro de Apoio Presencial com Coordenação" em si nem seus dados.
