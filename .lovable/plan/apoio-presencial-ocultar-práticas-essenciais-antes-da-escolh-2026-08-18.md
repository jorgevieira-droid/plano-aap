# Apoio Presencial: ocultar práticas essenciais antes da escolha da rubrica

Hoje o bloco "7. Rubrica da Primeira Prática Essencial — Retomada" aparece assim que o formulário abre, mesmo sem nenhuma rubrica selecionada no bloco 5.

## Mudança

O formulário passa a ser progressivo também nessa etapa:

1. Bloco 5 (Escolha da Rubrica de Observação) — o card com os níveis e a nota só aparece após escolher a rubrica (já é o comportamento atual).
2. A pergunta "Existe outra rubrica escolhida?" só aparece depois que a primeira rubrica for selecionada.
3. Bloco 6 (segunda rubrica) — inalterado: só quando a resposta for "Sim".
4. Bloco 7 (Prática Essencial — Retomada) só aparece depois que o caminho das rubricas estiver resolvido: rubrica 1 selecionada e resposta "Não" em "Existe outra rubrica escolhida?", ou resposta "Sim" com a segunda rubrica selecionada.
5. Blocos 8 e 9 (2ª e 3ª práticas) continuam condicionados às respostas "Sim", agora só visíveis a partir do bloco 7.

Em modo de leitura (registros já preenchidos), os blocos continuam sendo exibidos quando houver dado salvo, para não esconder histórico.

## Detalhe técnico

Alteração apenas em `src/components/formularios/RegistroApoioPresencialContent.tsx`: condicionar a renderização do `SimNaoField` de segunda rubrica a `r.rubrica_1_key` e envolver os blocos 7–9 em uma condição derivada (`rubricasResolvidas`), com escape para `readOnly`/valores já salvos.
