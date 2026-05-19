## Objetivo

Garantir que todos os botões do card de ação (visualização Calendário) — Imprimir, Gerenciar, Editar Agendamento, Acompanhamento, Excluir — fiquem sempre visíveis, mesmo em larguras estreitas (sidebar do calendário, telas pequenas), permitindo quebra em 2 linhas.

## Mudanças

**Arquivo:** `src/pages/admin/ProgramacaoPage.tsx`

1. **Card do calendário (linhas ~4281-4339)** — a linha de ações hoje é `flex items-center justify-between` com um inner `flex items-center gap-1`. Em cards estreitos os botões transbordam e ficam cortados.
   - Trocar o wrapper externo para permitir quebra: `flex flex-wrap items-center justify-between gap-2`.
   - Trocar o inner por `flex flex-wrap items-center gap-1 justify-end` para que os botões quebrem para uma 2ª linha quando faltar espaço, mantendo alinhamento à direita.

2. **Card da List View (linhas ~4427+)** — manter como está (já tem `overflow-x-auto` na tabela). Sem mudanças, fora do escopo do pedido.

## Fora de escopo
- Lógica de permissões, labels, ícones ou comportamento dos botões.
- Tabela da List View.
- Diálogos de Gerenciar/Editar.