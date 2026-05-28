## Objetivo

Incluir um card/módulo de acompanhamento da ação **"Visita Técnica — Alfabetização (REDES)"** tanto no **Dashboard** quanto em **Relatórios**, exibindo as médias dos 12 critérios (escala 1–4) preenchidos no gerenciamento da ação, espelhando o módulo já existente "Acompanhamento de Aula — Redes Municipais".

## Fonte de dados

Os dados completos do gerenciamento ficam na tabela `relatorios_visita_tecnica_alfabetizacao_redes` (criada anteriormente), com 12 critérios (`nota_criterio_1` … `nota_criterio_12`, valores 1–4) agrupados em 4 dimensões. Serão considerados apenas os registros com `status = 'enviado'` (checklist concluído). Os rótulos e dimensões vêm de `CRITERIOS`/`DIMENSOES` em `visitaAlfabetizacaoRedesShared.ts`.

## Comportamento

- O card aparece quando houver dados enviados no período/escopo filtrado (mesmo padrão de "só mostra quando há dados").
- Respeita os filtros já existentes de **ano**, **mês** e **programa** de cada página.
- Como a ação coexiste em todos os programas, o card é exibido independentemente do filtro de programa (não restrito a `redes_municipais`), seguindo a regra de disponibilidade definida em "Configurar Formulário".
- Exclui registros vinculados a entidades de uso interno, consistente com o restante das métricas.

## Conteúdo do card

Título: **"Visita Técnica — Alfabetização (REDES) (N observações)"**, com:
1. **Gráfico radar** das médias por critério (12 critérios, domínio 0–4).
2. **Progress rings** com a média por critério (1–4), agrupados visualmente pelas 4 dimensões.
3. Médias calculadas ignorando notas nulas/zero (mesma lógica de `calcularMediaRedesCriterio`).

## Detalhes técnicos

**`src/pages/admin/AdminDashboard.tsx`**
- Adicionar estado `relatoriosVisitaAlfabetizacao` e incluir no `Promise.all` a busca:
  `supabase.from('relatorios_visita_tecnica_alfabetizacao_redes').select('nota_criterio_1..12, status, data, escola_id, registro_acao_id').eq('status','enviado')`.
- Aplicar a mesma filtragem por papel já usada para outras tabelas (escolas visíveis / programa do usuário) via os `registros_acao` correspondentes.
- Filtrar por `anoFilter`/`mesFilter`, calcular médias por critério.
- Renderizar o novo módulo após o módulo "Acompanhamento de Aula — Redes Municipais" (após linha ~1264), reutilizando `RadarChart`, `ProgressRing` e tokens semânticos existentes.

**`src/pages/admin/RelatoriosPage.tsx`**
- Mesma busca e cálculo de médias.
- Renderizar o módulo dentro do bloco `reportRef` (para entrar na exportação PDF), após "Instrumentos Pedagógicos"/"Presence by School".
- Acrescentar uma aba/planilha no `handleExport` (XLSX) com o resumo das médias dos 12 critérios.

**Reuso de rótulos**
- Importar `CRITERIOS` e `DIMENSOES` de `@/components/formularios/visitaAlfabetizacaoRedesShared` para gerar os rótulos curtos dos critérios e os agrupamentos por dimensão, evitando duplicação.

## Fora de escopo

- Nenhuma mudança de banco de dados (a tabela já existe).
- Sem alterações em formulários, impressão ou rotas — apenas leitura/visualização nas duas páginas.
