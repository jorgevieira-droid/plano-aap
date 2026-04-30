## Objetivo

No dashboard principal (`/dashboard`), os gráficos **"Ações Previstas x Realizadas - Por Ator do Programa"** e **"Ações Previstas x Realizadas por Tipo"** atualmente compartilham uma linha em grid de 2 colunas. Vamos empilhá-los verticalmente, cada um em largura total.

## Mudança

Em `src/pages/admin/AdminDashboard.tsx`, no MÓDULO 2 (linhas ~841–898):

- Trocar o wrapper `<div className="grid grid-cols-1 lg:grid-cols-2 gap-6" data-tour="charts-section">` por `<div className="space-y-6" data-tour="charts-section">`.
- Adicionar `w-full` em cada um dos dois cards (`Por Ator do Programa` e `Por Tipo`).
- Manter as condicionais, alturas (`height={300}`), `ResponsiveContainer width="100%"` e o atributo `data-tour="charts-section"` intactos.

Nenhum dado, lógica de cálculo ou permissão será alterado — apenas o layout do MÓDULO 2.

## Arquivos editados

- `src/pages/admin/AdminDashboard.tsx`
