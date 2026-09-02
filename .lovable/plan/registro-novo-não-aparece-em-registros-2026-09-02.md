# Registro novo não aparece em "Registros"

## O que foi verificado

O registro criado hoje (Apoio Presencial, 02/09/2026, escola ADALBERTO PRADO E SILVA) **existe no banco**, com status `realizada` e programa `escolas`. Portanto não é problema de gravação nem de permissão — é a tela de Registros mostrando uma lista em cache.

## Causa

- A lista de Registros usa cache de 5 minutos e está configurada para **não recarregar ao abrir a página**.
- O fluxo "Adicionar Ação" (cadastro direto), ao criar a ação, atualiza o calendário mas **não avisa a lista de Registros** que há dado novo.

Resultado: quem acabou de cadastrar por esse caminho só vê o registro depois de expirar o cache ou de dar F5.

## Correção

1. No fluxo de criação de ação (cadastro normal e cadastro direto), sinalizar que as listas de registros, presenças e programações precisam ser recarregadas.
2. Fazer a página de Registros sempre revalidar os dados ao ser aberta, mantendo o conteúdo em tela enquanto atualiza (sem tela branca e sem perder os filtros salvos).

## Detalhes técnicos

- `src/pages/admin/ProgramacaoPage.tsx`, `handleSubmit` (~linhas 1886-1933): após inserir em `programacoes` + `registros_acao`, chamar `queryClient.invalidateQueries` para `["registros_acao"]`, `["programacoes"]` e `["presencas"]` nos dois retornos (modo direto e agendamento).
- `src/pages/admin/RegistrosPage.tsx`, query `['registros_acao', ...]` (~linha 362): adicionar `refetchOnMount: 'always'` e `staleTime: 0`; o mesmo para as queries de `presencas` e `instrument_responses` usadas na listagem.
- Sem mudanças de banco de dados.
