# Indicadores - Caê: consolidar Apoio Presencial + Planejamento Conjunto

## O que muda

Hoje o bloco "Indicadores - Caê" usa apenas os registros de **Apoio Presencial**. Passará a considerar também **Planejamento conjunto com prof.**, e a tabela de professores ganha duas colunas novas.

### Tabela "Professores Apoiados"
Colunas: **Professor | Escola | Componente | Qtd de apoios**

- Cada linha agrupa professor + escola + componente.
- "Qtd de apoios" = número de registros das duas ações (Apoio Presencial + Planejamento Conjunto) para aquela combinação.
- Ordenação alfabética pelo nome do professor (pt-BR).
- Componente segue a lista oficial do campo Componente (com a normalização já existente: legado "COLABORATIVO TUTOR EFAI" vira "COLABORATIVO EFAI"; valores fora da lista viram "Outros"; sem valor mostra "—").
- Rodapé continua exibindo a quantidade de linhas.

### Demais indicadores do bloco
- **Professores Atendidos**: contagem de professores distintos nas duas ações.
- **Apoios por Componente** e **Apoios por Ano/Série**: passam a somar as duas ações.
- O selo do topo do bloco muda de "Apoio Presencial" para "Apoio Presencial + Planejamento Conjunto".
- Tudo continua reagindo aos filtros de período, consultor e escola, sem botão "Visualizar Relatório".

## Detalhes técnicos

Arquivo único: `src/pages/admin/RelatoriosGestaoEscolasPage.tsx`

- No `useMemo` `cae`, trocar a base `byType.get('registro_apoio_presencial')` por concatenação com `byType.get('registro_planejamento_conjunto')`.
- Trocar o mapa `profEscola` por um agregador com chave `professor|escola|componenteNormalizado`, acumulando `qtd`.
- O nome do professor continua vindo de `programacoes.apoio_professor_nome` com fallback `resp.professor`; o componente de `programacoes.apoio_componente` com fallback `registros_acao.componente` (lógica já existente no mapeamento de `Row`).
- `dist(...)` passa a iterar sobre a lista combinada.
- Ajustar `colSpan` do estado vazio para 4 e manter o cabeçalho sticky opaco.
- Validar com `npx tsgo --noEmit -p tsconfig.app.json`.
