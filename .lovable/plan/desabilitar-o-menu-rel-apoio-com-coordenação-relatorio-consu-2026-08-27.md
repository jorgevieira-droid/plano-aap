# Desabilitar o menu "Rel. Apoio com Coordenação" (/relatorio-consultoria)

O item que continua aparecendo no menu não é o mesmo desabilitado antes. Existem duas páginas parecidas:

- `/relatorios-apoio-coordenacao` — já movida para "Desabilitados".
- `/relatorio-consultoria` — ainda no grupo de gestão, rotulada "Rel. Apoio com Coordenação" (é a da imagem, com 165 formações, vinda dos dados legados).

## O que será feito

- Remover o item `/relatorio-consultoria` do grupo de gestão no menu lateral.
- Adicioná-lo ao grupo "Desabilitados" (visível apenas para N1/admin, com selo "Desabilitada").
- Manter a rota e o componente intactos, sem perda de dados.

## Detalhes técnicos

Em `src/components/layout/Sidebar.tsx`: mover a entrada da linha 72 para a lista do grupo `Desabilitados`, trocando `allowedTiers`/`requiresAcao` por `disabled: true`.
