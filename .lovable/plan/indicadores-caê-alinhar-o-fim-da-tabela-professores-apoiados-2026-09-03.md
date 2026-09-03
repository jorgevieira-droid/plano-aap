# Indicadores - Caê: alinhar o fim da tabela "Professores Apoiados" ao box do 9º ano

## Contexto
Na página `/relatorios-gestao-escolas`, a tabela "Professores Apoiados" está definindo a altura da linha do grid do bloco "Indicadores - Caê" (o contêiner rolável tem altura intrínseca do conteúdo, ~27 linhas), fazendo a tabela passar do fim da lista "Apoios por Ano/Série" (termina no box do 9º Ano).

## Alteração
Arquivo: `src/pages/admin/RelatoriosGestaoEscolasPage.tsx` (coluna direita do bloco, ~linha 552)

- Na coluna da direita (`flex flex-col lg:col-span-5`), adicionar `lg:h-0 lg:min-h-full`. Esse padrão faz a coluna deixar de contribuir para o cálculo da altura da linha do grid (que passa a ser definida pelas colunas à esquerda/centro, ou seja, pela lista de Ano/Série) e, ao mesmo tempo, esticar até essa altura.
- A tabela (já com `min-h-0 flex-1 overflow-y-auto`) passa a rolar internamente e termina exatamente no nível do box do 9º Ano, com a barra "Exibindo N registros" colada nesse limite.
- Em telas pequenas (uma coluna) o comportamento normal é preservado, pois o ajuste vale só a partir de `lg`.

Sem mudanças de dados, consultas ou permissões — apenas layout.

## Validação
- TypeScript passando.
- Playwright: medir que o rodapé "Exibindo N registros" fica no mesmo nível do fim da lista de Ano/Série e que a tabela rola internamente (conteúdo maior que a área visível).
