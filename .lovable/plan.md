# Relatórios - Registro de Apoio Presencial

Nova página no menu lateral, visível apenas para N2/N3 (e N1) com o Programa de Escolas, no mesmo padrão visual do Painel de Encaminhamentos Internos, com exportação em PDF (cabeçalho institucional padrão).

## Filtros (topo, em cartão)

- Consultor(a) — seleção múltipla
- Escola — seleção múltipla
- Data início / Data fim

Filtros persistidos (sem recarregar a página) e listas ordenadas A-Z em pt-BR.

## Miolo — Página 1 do modelo

Cartões de indicadores:
- Total de apoios realizados
- Total de devolutivas realizadas
- Total de apoios em turmas adaptadas VOAR
- Quantidade de apoios realizados com outros observadores

Duas tabelas lado a lado:
- Apoios por Escola
- Apoios por Consultor(a)

Blocos complementares:
- Quantidade de apoio por segmento (EFAI / EFAF / EM)
- Quantidade de apoios em que a aula inicia em: até 10 min / entre 10 e 13 / entre 13 e 15 / mais de 15 min

## Miolo — Página 2 do modelo

- Evolução das rubricas de observação: matriz rubrica x mês com a nota média do período (mesma leitura de heatmap já usada na Evolução do Professor).
- Quantidade de rubricas de práticas essenciais: contagem de vezes que cada prática (Retomada, 2ª, 3ª) foi avaliada.
- Evolução das rubricas de práticas essenciais: matriz prática x mês com média.

## Miolo — Página 3 do modelo

- Autoavaliação do consultor: gráfico de barras por consultor(a) com a média da pergunta "Como você avalia o apoio presencial realizado?" (escala 1 a 4), com legenda 1 nada eficaz a 4 muito eficaz.

## Exportação

Botão "Exportar PDF" gera o arquivo com o cabeçalho azul padrão (Parceiros + Bússola, título, período, data de geração) e o miolo com o mesmo layout da tela, quebrando por seções para não cortar blocos.

## Detalhes técnicos

- Nova página `src/pages/admin/RelatoriosApoioPresencialPanelPage.tsx`, rota `/relatorios-apoio-presencial` em `src/App.tsx`, item no `Sidebar.tsx` e liberação em `ALLOWED_ROUTES` (manager) em `AppLayout.tsx`.
- Permissão: `isAdmin || ((gestor || n3_coordenador_programa) && programas inclui 'escolas')`, mesmo padrão da página existente de visualização.
- Dados: `instrument_responses` com `form_type = 'registro_apoio_presencial'`, join em `registros_acao` (data, aap_id, escola_id, status, profiles, escolas) e em `programacoes` (`apoio_etapa` para segmento, `apoio_turma_voar`, `apoio_escola_voar`); apenas registros com status `realizada` e programa `escolas`.
- Campos do JSON `responses` usados: `devolutiva_realizada`, `turma_voar`, `outros_observadores`, `diferenca_horario`, `rubrica_1_key`/`rubrica_1_nota`, `rubrica_2_key`/`rubrica_2_nota`, `pratica_1_nota`/`pratica_2_nota`/`pratica_3_nota`, `avaliacao_apoio`.
- Rótulos de rubricas e práticas vindos de `apoioPresencialShared.ts` (`RUBRICAS`, `PRATICAS_ESSENCIAIS`).
- PDF via `exportSectionsToPdf` com nós inline (hex fixos: `#1a3a5c`, `#059669`, `#d97706`, bordas `#e5e7eb`), padrão já usado no painel de REI.
- Sem alterações de banco, RLS ou nos formulários de coleta. A página antiga "Visualização de Apoio Presencial" continua como está (apenas N1/Desabilitados).
