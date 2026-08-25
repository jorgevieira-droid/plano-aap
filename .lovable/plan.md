# Verificação da origem do "Total de apoios realizados"

## Contexto
A página **Relatórios - Registro de Apoio Presencial** (`src/pages/admin/RelatoriosApoioPresencialPanelPage.tsx`) apresenta o indicador **Total de apoios realizados**. A expectativa é que esse número (e as demais informações do relatório) sejam originados exclusivamente do formulário/ação **Registro de Apoio Presencial**.

## Diagnóstico atual
- O total é calculado em `kpis.total = filtered.length` (linha 127).
- A fonte de dados é `instrument_responses` filtrado por `form_type = 'registro_apoio_presencial'`.
- Cada response é vinculada a um `registros_acao` que deve estar com `status = 'realizada'` e ter o programa `'escolas'`.
- Consulta de verificação no banco:
  - `instrument_responses` com `form_type = 'registro_apoio_presencial'`: **258**
  - `registros_acao` com `tipo = 'registro_apoio_presencial'`, `status = 'realizada'` e `programa` contendo `'escolas'`: **258**
- Os valores coincidem, portanto cada ação realizada possui exatamente um formulário correspondente.

## Ação proposta
Confirmar e manter a origem dos dados exclusivamente no formulário/ação Registro de Apoio Presencial. Caso algum indicador esteja consumindo outra tabela, ajustá-lo para refletir somente os dados desse formulário.

## Escopo
- Arquivo: `src/pages/admin/RelatoriosApoioPresencialPanelPage.tsx`.
- Sem alterações em banco de dados, RLS ou formulários de coleta.
- Nenhuma mudança de rota ou menu.
