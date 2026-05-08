## Mudança

No card **"Total de Ações Programadas / Executadas"** do Dashboard:

1. **Excluir** programações com `status` `cancelada` ou `reagendada` das duas contagens (Programadas até hoje e Executadas).
2. Manter a regra atual de só contar Programadas com `data <= hoje` (já implementado em `filteredProgramacoes`).
3. **Adicionar o total geral** de ações programadas (todas as datas, mesmo escopo de filtros e hierarquia, também excluindo `cancelada`/`reagendada`) entre parênteses, em fonte menor, ao lado do número de "Programadas até hoje".

### Exemplo de exibição

```
Total de Ações Programadas / Executadas
469 (643)  /  268
Programadas até hoje (total geral) / Realizadas
```

## Detalhes técnicos

Apenas em `src/pages/admin/AdminDashboard.tsx` e `src/components/ui/StatCard.tsx`:

1. `AdminDashboard.tsx`:
   - `filteredProgramacoes`: adicionar filtro `status !== 'cancelada' && status !== 'reagendada'` (já filtra `data <= todayStr`).
   - Calcular `totalGeralProgramadas`: usar `programacoes` com os MESMOS filtros de UI (programa, escola, componente, ator, ano, mês), MESMO escopo de hierarquia, exceto a restrição `data <= todayStr`. Excluir `cancelada`/`reagendada`. Implementar como novo `useMemo`/cálculo paralelo a `filteredProgramacoes` (extrair predicado comum em um helper local).
   - Substituir o `value` do StatCard por uma estrutura JSX com:
     - número principal `programadasAteHoje` em fonte grande;
     - `(totalGeral)` ao lado, em fonte menor e com opacidade reduzida;
     - `/ executadas` em fonte grande.
   - Atualizar `subtitle` para `Programadas até hoje (total geral) / Realizadas`.

2. `StatCard.tsx`:
   - Trocar a tipagem de `value` de `string | number` para `ReactNode` para permitir o JSX customizado. Sem outras mudanças de estilo.

## O que NÃO muda

- Lógica de hierarquia (N1/N2/N3/N4/N5) e demais filtros — todos seguem aplicados.
- Demais cards e seções do dashboard.
- Schema do banco, edge functions, regras de negócio.