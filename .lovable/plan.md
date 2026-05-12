# Integração de ações Regionais (Monitoramento + rubricas vinculadas) no Dashboard e Relatório

## Escopo confirmado
- **Ações consideradas:** apenas `registros_acao` do tipo `monitoramento_acoes_formativas` com `programa @> '{regionais}'` + rubricas (`instrument_responses` com `form_type` ≠ `monitoramento_acoes_formativas` e ≠ `lista_presenca`) gravadas no MESMO `registro_acao_id` (que é como o fluxo de gerenciamento já as vincula hoje).
- **Locais afetados:** Dashboard (`MonitoramentoRegionaisBlock`) e Relatório (`/relatorio-regionais`).
- **Pendência:** mostrar **Atrasadas** e **Pendentes** como dois indicadores separados, alinhado ao módulo global de pendências.

## Definições de status
Aplicadas a cada `registro_acao` Monitoramento dentro do filtro de período/entidade/frente:
- **Programadas:** total no período (`status` em qualquer valor).
- **Realizadas:** `status = 'realizada'`.
- **Previstas (em aberto):** `status` em `('agendada','reagendada')` cuja data efetiva (`reagendada_para` se houver, senão `data`) é **futura ou hoje**.
- **Atrasadas:** `status` em `('agendada','reagendada')` com data efetiva já passada **mas dentro de 2 dias** (não virou pendência ainda).
- **Pendentes:** `status` em `('agendada','reagendada')` com data efetiva ≥ 3 dias no passado (mesma regra do `usePendencias`: `relevantDate <= today − 2 dias`).
- **Canceladas:** `status = 'cancelada'` (mostradas separadamente, não entram em "programadas" para taxa de realização).
- **Com rubrica vinculada:** Monitoramentos que possuem ≥ 1 registro em `instrument_responses` (excluindo `monitoramento_acoes_formativas` e `lista_presenca`) com mesmo `registro_acao_id`.
- **Total de rubricas respondidas:** soma das respostas vinculadas (uma ação pode ter mais de uma rubrica).

## Mudanças no Dashboard — `MonitoramentoRegionaisBlock.tsx`
1. Buscar `status` e `reagendada_para` em `registros_acao` (já busca `status`, falta `reagendada_para`).
2. Calcular os 6 buckets acima em memória após aplicar filtros locais.
3. Substituir os StatCards atuais por:
   - Programadas · Realizadas · Taxa de realização · Previstas em aberto · **Atrasadas** · **Pendentes** · Canceladas · Com rubrica · Rubricas respondidas · Presenças.
   - Layout em 2 linhas de cards (`grid-cols-2 md:grid-cols-3 xl:grid-cols-5`).
4. Gráfico "Evolução mensal" passa a plotar 3 séries: Previstas (programadas no mês), Realizadas, Pendentes (acumuladas no mês de referência).
5. Mantém os bar charts por Frente e Entidade (já existem).

## Mudanças no Relatório — `RelatorioRegionaisPage.tsx`
1. Header de cards ganha os mesmos indicadores de status (Programadas, Realizadas, Taxa, Previstas, Atrasadas, Pendentes, Canceladas) ao lado dos já existentes (rubricas, presenças, média).
2. Lista de ações:
   - Mostrar **todas** as ações Monitoramento do escopo (não só as realizadas), com `StatusBadge` em cada cartão.
   - Adicionar filtro de status (Todas / Realizadas / Previstas / Atrasadas / Pendentes / Canceladas).
   - Para ações sem fechamento, omitir bloco "Encaminhamentos"; manter cabeçalho + rubricas se houver.
3. Exportações:
   - **Excel:** nova aba "Status" com contagens por bucket; aba "Ações" ganha colunas `Status`, `Dias de atraso`.
   - **PDF:** seção de resumo no topo lista os 7 indicadores de status antes do detalhamento.

## Estrutura técnica
- Helper compartilhado novo: `src/lib/regionaisActionStatus.ts`
  ```ts
  export type RegionaisBucket = 'realizada' | 'prevista' | 'atrasada' | 'pendente' | 'cancelada';
  export function classifyRegionaisAction(r: { status: string; data: string; reagendada_para: string | null }): RegionaisBucket;
  export const PENDENTE_THRESHOLD_DAYS = 2; // > 2 dias = pendente
  ```
  Reutilizado por `MonitoramentoRegionaisBlock` e `RelatorioRegionaisPage` para garantir consistência.
- Sem migração de banco — todas as colunas necessárias já existem (`status`, `reagendada_para`).
- Mantém os 3 filtros locais (Período, Frente de trabalho, Entidade); adiciona filtro de Status no relatório.

## Arquivos afetados
- **Novo:** `src/lib/regionaisActionStatus.ts`
- **Editado:** `src/components/dashboard/MonitoramentoRegionaisBlock.tsx`
- **Editado:** `src/pages/admin/RelatorioRegionaisPage.tsx`

## Fora de escopo
- Incluir outras ações do programa Regionais que não estejam vinculadas a um Monitoramento.
- Mudanças no fluxo de cadastro/gerenciamento (`MonitoramentoRegionaisManageDialog`).
- Notificações por e-mail específicas para Regionais (continua usando o sistema global de pendências).
