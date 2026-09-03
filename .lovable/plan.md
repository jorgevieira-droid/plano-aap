# Plano — Excluir EFAI de "Apoios por Componente" (Indicadores - Caê)

## Contexto
No bloco "Indicadores - Caê" da página `Relatórios de Gestão - Programa Escolas` (`src/pages/admin/RelatoriosGestaoEscolasPage.tsx`), a lista "Apoios por Componente" está exibindo a entrada "EFAI" (ex.: 6 apoios). EFAI não é um componente — não deve ser contabilizado nessa lista.

## Mudança
1. Em `src/pages/admin/RelatoriosGestaoEscolasPage.tsx`, no helper `normComponente` (~linha 328): quando o valor normalizado for EFAI, retornar `null` em vez do rótulo `'EFAI'`, para que o registro seja ignorado pela distribuição `dist` (mesmo comportamento de valores vazios).
2. Nenhuma outra visualização é afetada: "Apoios por Ano/Série", KPI de professores apoiados e a tabela Professor/Escola continuam iguais; os totais dos demais componentes (Língua Portuguesa, Matemática, etc.) não mudam — apenas a linha EFAI deixa de existir na lista.

## Validação
- Typecheck do projeto.
- Verificação via Playwright da página `/relatorios-gestao-escolas`: "Apoios por Componente" sem a entrada EFAI, com barras proporcionais mantidas.
