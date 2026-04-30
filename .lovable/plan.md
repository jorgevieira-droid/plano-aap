## Objetivo

No dashboard principal (`/dashboard`), o gráfico **"Professores por Componente e Ciclo"** atualmente divide a linha em 2 colunas com o gráfico **"% Presença em Formações por Componente e Ciclo"**, ficando estreito. Vamos colocá-lo em largura total.

## Mudança

Em `src/pages/admin/AdminDashboard.tsx`, no MÓDULO 3 (linhas ~900–959), reestruturar o bloco para que cada gráfico ocupe sua própria linha (largura total), em vez de dividi-los em grid de 2 colunas.

- Remover o wrapper `<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">`.
- Renderizar **"Professores por Componente e Ciclo"** em um container `w-full` próprio.
- Renderizar **"% Presença em Formações por Componente e Ciclo"** logo abaixo, também em container próprio com `w-full` e `mt-6`.
- Manter as condicionais de exibição (`professoresPorComponenteCiclo.length > 0` e `presencaPorComponenteCiclo.length > 0`) intactas.
- Manter altura `height={350}` e `ResponsiveContainer width="100%"` — com a largura do card agora total, o gráfico se expandirá naturalmente.

Nenhum dado, lógica de cálculo ou permissão será alterado — apenas o layout do MÓDULO 3.

## Arquivos editados

- `src/pages/admin/AdminDashboard.tsx`
