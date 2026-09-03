# Indicadores - Caê: componentes conforme a lista do campo "Componente"

## Contexto
No bloco "Indicadores - Caê" (página `Relatórios de Gestão - Programa Escolas`), a seção "Apoios por Componente" hoje agrupa os valores em categorias genéricas (Língua Portuguesa, Matemática, Polivalente etc.). O usuário quer que a contagem use exatamente os valores da lista do campo "Componente" do Registro de Apoio Presencial (`APOIO_COMPONENTE_OPTIONS_NEW` em `src/components/formularios/apoioPresencialShared.ts`):

- MAT, OE MAT, TUTOR MAT, MAT VOAR
- LP, OE LP, TUTOR LP, LP VOAR
- TUTOR EFAI, REGENTE EFAI, COLABORATIVO TUTOR EFAI

## Mudança
1. Em `src/pages/admin/RelatoriosGestaoEscolasPage.tsx`, substituir o agrupamento atual de `normComponente` (~linha 328):
   - Se o valor do registro pertence à lista `APOIO_COMPONENTE_OPTIONS_NEW` (importada de `apoioPresencialShared`), exibir o próprio valor (ex.: "OE MAT").
   - Valores legados/enumerados (chaves de `componenteLabels`, ex.: `lingua_portuguesa`, `matematica`) continuam mapeados para o rótulo amigável correspondente, para não perder histórico.
   - Remover a regra que excluía "EFAI" — agora TUTOR EFAI, REGENTE EFAI e COLABORATIVO TUTOR EFAI aparecem como componentes próprios (fazem parte da lista oficial do campo).
   - Valores vazios continuam ignorados; o que não casar com nada cai em "Outros".
2. Ordenação A–Z com `localeCompare('pt-BR')` e barras proporcionais ao maior valor — sem mudança visual de layout.
3. Nada muda no KPI de professores, na tabela Professor/Escola nem em "Apoios por Ano/Série".

## Validação
- Typecheck do projeto.
- Playwright na página `/relatorios-gestao-escolas`: "Apoios por Componente" exibindo os itens da lista do campo (MAT, OE MAT, TUTOR MAT, LP, OE LP, TUTOR LP, MAT VOAR, LP VOAR, TUTOR EFAI, REGENTE EFAI, COLABORATIVO TUTOR EFAI) conforme os dados existentes.
