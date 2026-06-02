
Seguindo a ordem combinada (item 1 já entregue). Vou executar os 3 itens restantes em sequência.

---

### Item 4 — Corrigir contagem de Regionais

**Problema confirmado:** `MonitoramentoRegionaisBlock` filtra apenas `tipo='monitoramento_acoes_formativas'`, deixando de fora ~85% das ações de Regionais (lideranca_gestores_pei, pec_qualidade_aula, acomp_professor_tutor, monitoramento_gestao, visita_voar).

**Correção:**
- Remover o filtro `.eq('tipo', 'monitoramento_acoes_formativas')` na query principal — passar a buscar **todas as ações com `'regionais' = ANY(programa)`**
- KPIs (Realizadas/Previstas/Atrasadas/Pendentes, taxa, formulários, presenças) passam a refletir o universo completo
- Bloco "Fechamento / Avanços / Dificuldades / Encaminhamentos" continua usando `relatorios_monit_acoes_formativas` (só existe para esse tipo) — adicionar nota "Apenas para Monitoramento de Ações Formativas"
- Atualizar título/legenda do bloco para "Programa de Regionais"
- Filtro "Frente de trabalho" continua válido (vem do relatório); aplicar somente no recorte de Monitoramento

---

### Item 2 — Filtros globais do Dashboard

**Mudança:** Os blocos `MonitoramentoRegionaisBlock` e `VisitaAlfabetizacaoRedesBlock` passam a receber filtros via props do `AdminDashboard`:
- `programaFilter`, `escolaFilter`, `atorFilter`, `anoFilter`, `mesFilter`
- Conversão `ano/mes → dataInicio/dataFim` feita no pai
- Remover os controles internos duplicados de data (mantém apenas filtros específicos do bloco: frente de trabalho)
- Aplicar `aap_id` e `escola_id` nas queries dos blocos

---

### Item 3 — Card "Horas por Ator do Programa" (N1, N2, N3)

**Componente novo** integrado ao Dashboard, respeitando os filtros globais.

- Visibilidade: `isAdmin || isGestor || hasRole('n3_coordenador_programa')`
- Universo: ações em `registros_acao` cujo `aap_id` pertença a um ator N4.1/N4.2/N5, dentro do escopo dos filtros do topo
- Horas: `(programacoes.horario_fim - horario_inicio)` da `programacao` vinculada via `programacao_id`. Ações sem horário/sem programação não somam — exibir contador "X ações sem horário"
- Tabela ordenada A-Z (localeCompare pt-BR): **Ator | Nível | Qtd. ações | Horas totais (hh:mm)**

**Arquivos:**
- Novo: `src/hooks/useHorasPorAtor.ts`
- Novo: `src/components/dashboard/HorasPorAtorCard.tsx`
- Integrar em `src/pages/admin/AdminDashboard.tsx` com o gate de visibilidade

---

Posso prosseguir com a implementação na ordem 4 → 2 → 3.
