# Opção "Multisseriado" no campo Ano/Série (ações do programa Escolas)

## O que muda
- No campo **Ano/Série**, a opção **Multisseriado** aparece depois de "3ª Série" nestas ações:
  - Aula Compartilhada
  - Apoio Presencial
  - Apoio Presencial com a Coordenação
  - Aula Compartilhada com Prof.
  - Registrar Planejamento conjunto com prof.
- A opção vale ao criar e ao editar a ação, tanto na Programação quanto em "Adicionar Ação".
- Os relatórios dessas ações passam a mostrar "Multisseriado" como uma categoria própria nos gráficos e tabelas por Ano/Série. Hoje esses relatórios ignoram valores que não estão na lista. Isso vale também para a Reunião Mensal.
- Nenhum registro existente é alterado.

## Detalhes técnicos
- Incluir `'Multisseriado'` ao final de `ANO_SERIE_OPTIONS_ESCOLAS` em `apoioPresencialShared.ts`. Essa lista é a fonte única dos selects dessas ações em `ProgramacaoPage.tsx` e dos painéis de relatório.
- Conferir se algum desses formulários usa a lista local `APOIO_ETAPA_OPTIONS` em `ProgramacaoPage.tsx`. Se usar, incluir a opção nela também, antes de "Não se Aplica".
- Não precisa mudar o banco de dados: o campo é texto livre.
