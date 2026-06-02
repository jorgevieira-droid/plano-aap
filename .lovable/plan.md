
## Ajustes particionados (4 entregas independentes)

Cada item é uma entrega autônoma e pode ser revisada/aprovada em sequência.

---

### 1) Alterar alerta de pendência: 2 → 7 dias corridos

Hoje a regra "ação atrasada/pendente" usa `setDate(today - 2)` em vários pontos. Vou consolidar para **7 dias corridos** em todas as ocorrências (frontend + edge function + textos visíveis).

**Arquivos a alterar:**
- `src/lib/regionaisActionStatus.ts` — `PENDENTE_THRESHOLD_DAYS = 7`
- `src/hooks/usePendencias.ts` — `twoDaysAgo → sevenDaysAgo` (linhas 49–65)
- `src/pages/admin/PendenciasPage.tsx` — texto "mais de 2 dias" → "mais de 7 dias" (l. 111)
- `src/pages/admin/RegistrosPage.tsx` — 4 ocorrências (l. 556–562, 1584–1605, 1964–1990) incluindo textos visíveis
- `src/pages/admin/AdminDashboard.tsx` — l. 255–256
- `src/pages/admin/RelatoriosPage.tsx` — texto descritivo do botão de envio (l. 1021)
- `supabase/functions/send-pending-notifications/index.ts` — variável `twoDaysAgo` (l. 139–141, 159) + textos dos e-mails (HTML, assuntos, l. 461 e 545)

> Observação: o pg_cron que dispara o e-mail continua diário — apenas a janela de "pendente" passa a ser 7 dias.

---

### 2) Filtros do topo da página de Dashboard devem atuar em toda a página

Hoje os filtros do topo (`programaFilter`, `anoFilter`, `mesFilter`, `escolaFilter`, `atorFilter`, `componenteFilter`) são aplicados na maior parte da página, mas os blocos `MonitoramentoRegionaisBlock` e `VisitaAlfabetizacaoRedesBlock` **mantêm seus próprios filtros internos** (data início/fim, frente, entidade) e ignoram os filtros do topo.

**Mudanças:**
- Tornar `MonitoramentoRegionaisBlock` e `VisitaAlfabetizacaoRedesBlock` controlados via props vindas do `AdminDashboard`:
  - `programaFilter`, `escolaFilter`, `atorFilter`, `anoFilter`, `mesFilter`
  - Converter `anoFilter`/`mesFilter` em intervalo `dataInicio`/`dataFim` no componente pai e passar adiante
- Remover os controles internos de data (já redundantes); manter apenas filtros **complementares** específicos do bloco (frente de trabalho), aplicados em cima do escopo já filtrado
- Aplicar `aap_id = atorFilter` e `escola_id = escolaFilter` nas queries dos blocos
- Esconder bloco Regionais quando `programaFilter` for `escolas` ou `redes_municipais` (já parcialmente feito); idem para Redes

---

### 3) Novo card: "Horas por Ator do Programa" (visível para N1, N2, N3)

Card no Dashboard listando cada Ator (`n4_1`, `n4_2`, `n5`) dentro do escopo dos filtros do topo, com a **soma de horas das ações sob sua responsabilidade**.

**Regras:**
- Visibilidade: apenas `is_admin`, `is_gestor` (N2) e `has_role('n3_coordenador_programa')`
- Universo: `registros_acao` realizadas + `programacoes` agendadas no intervalo (respeita filtros do topo: programa, escola, ano/mês, ator)
- Responsável = `aap_id` da ação (filtrar perfis com `app_role IN ('n4_1_*', 'n4_2_*', 'n5_*')`)
- Horas = `(horario_fim - horario_inicio)` de cada `programacao` vinculada (em horas decimais); ações sem horário não somam e aparecem com aviso "X ações sem horário"
- Apresentação: tabela/lista ordenada A-Z por nome, com colunas **Ator | Nível | Qtd. ações | Horas totais (hh:mm)**

**Arquivos:**
- Novo: `src/components/dashboard/HorasPorAtorCard.tsx`
- Novo hook: `src/hooks/useHorasPorAtor.ts` (consulta join `registros_acao` + `programacoes` + `profiles`/`user_roles`)
- Integração em `src/pages/admin/AdminDashboard.tsx` com gate `isAdmin || isGestor || hasRole('n3_coordenador_programa')`

---

### 4) Corrigir contagem de ações/formulários do Programa de Regionais

**Diagnóstico (confirmado em produção):**
O `MonitoramentoRegionaisBlock` consulta apenas `tipo = 'monitoramento_acoes_formativas'`, mas o Programa Regionais hoje possui 6 tipos de ação:

| tipo | registros_acao | instrument_responses |
|---|---|---|
| monitoramento_acoes_formativas | 94 | 1 |
| lideranca_gestores_pei | 124 | 79 |
| pec_qualidade_aula | 79 | 47 |
| acomp_professor_tutor | 37 | 41 |
| monitoramento_gestao | 27 | 21 |
| visita_voar | 14 | 17 |

Resultado: ~85% das ações e ~88% dos formulários de Regionais ficam de fora da contagem. Isso explica o "antes da alteração da mecânica" — quando havia só `monitoramento_acoes_formativas`, todos os registros eram contemplados.

**Correção:**
- Em `MonitoramentoRegionaisBlock` (e nas queries de KPI relacionadas), trocar `.eq('tipo', 'monitoramento_acoes_formativas')` por filtro inclusivo: **toda ação com `'regionais' = ANY(programa)`**
- Ajustar a query de `relatorios_monit_acoes_formativas` para também buscar nas demais tabelas-relatório vinculadas (ou contar apenas via `instrument_responses` + `presencas`, que cobrem todos os tipos)
- Revisar `RUBRICA_EXCLUDED` para refletir o universo correto (manter exclusão apenas de tipos sem rubrica real)
- Atualizar rótulos/legendas do bloco para "Programa de Regionais" (não apenas "Monitoramento")

---

### Ordem de execução sugerida

1. Item 1 (mecânico, baixo risco)
2. Item 4 (correção de dados visíveis — alto impacto, isolado)
3. Item 2 (refactor de filtros, base para o item 3)
4. Item 3 (novo card, depende dos filtros globais)

Confirma se posso começar pelo item 1?
