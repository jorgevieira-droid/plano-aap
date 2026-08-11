# Rubricas do Registro de Apoio Presencial

Atualizar as 14 rubricas de observação do instrumento **Registro de Apoio Presencial** com os textos oficiais do documento enviado, substituindo os conteúdos hoje marcados como "A ser desenvolvido".

## O que muda

1. **Textos completos das 14 rubricas**
   Hoje apenas a rubrica 1 tem descrição real; as outras 13 aparecem como "A ser desenvolvido" nos quatro níveis. Todas passam a ter título, frase-resumo e as quatro descrições (3 Muito efetivo / 2 Efetivo / 1 Pouco efetivo / 0 Nada efetivo) conforme o documento.

2. **Ordem corrigida conforme o documento**
   A numeração atual diverge do documento entre os itens 5 e 9. Nova ordem:

   ```text
   FOCO: PLANEJAMENTO, DOMÍNIO DE CONTEÚDO E RECURSOS PEDAGÓGICOS
     1  Conteúdo alinhado ao currículo e foco nos pré-requisitos
     2  Objetivo de aprendizagem claro e significado com os estudantes
     3  Domínio conceitual (explicações, exemplificações e adaptações)
     4  Uso intencional dos recursos pedagógicos

   FOCO: ESTRATÉGIAS DIDÁTICAS
     5  Estratégias de aprendizagem ativas e adequadas ao objetivo
     6  Abordagem alcança estudantes com lacunas de aprendizagem
     7  Checagem da compreensão para retomada ou avanço
     8  Circulação em sala e mediação problematizadora
     9  Organização do conteúdo em tempos adequados (começo, meio e fim)

   FOCO: GESTÃO DE SALA DE AULA
     10 Engajamento dos estudantes para iniciar a aula
     11 Gerenciamento do tempo (sequência didática, dúvidas, sistematização)
     12 A maior parte dos alunos participa da aula
     13 Clima de colaboração, respeito mútuo e favorável à aprendizagem
     14 Intervenções respeitosas em dispersão, conflito e indisciplina
   ```

   A rubrica 1 também tem o texto do nível 0 e do nível 3 ajustado ao documento.

3. **Agrupamento por Foco na seleção**
   No campo de seleção de rubrica do formulário, os itens passam a aparecer agrupados sob os três rótulos de FOCO acima, facilitando a escolha. A mecânica do formulário (escolher 1 rubrica obrigatória + 1 opcional, com nota de 0 a 3) permanece exatamente como está.

4. **Práticas essenciais** continuam como estão (o documento não trata delas).

## Impacto em dados existentes

Existem apenas 2 registros de Apoio Presencial com rubrica preenchida. Como a numeração 5–9 muda, esses dois registros passariam a exibir uma rubrica diferente da originalmente marcada. Confirmo antes de aplicar se prefere que eu reescreva a chave desses dois registros para manter a rubrica originalmente escolhida — caso contrário, sigo apenas com a atualização de textos.

## Detalhes técnicos

- Arquivo principal: `src/components/formularios/apoioPresencialShared.ts` — substituir `RUBRICA_TITULOS` + geração `tbdNiveis()` por um array `RUBRICAS` explícito com `key` (`rubrica_1`…`rubrica_14`), `numero`, `titulo`, `resumo`, `foco` e os 4 `niveis` com descrição completa.
- Novo campo `foco` na interface `RubricaDef`; constante `RUBRICA_FOCOS` com os três rótulos.
- `src/components/formularios/RegistroApoioPresencialContent.tsx` — no `RubricaSelector`, renderizar `SelectGroup`/`SelectLabel` por foco (apenas apresentação).
- Sem migração de schema: as respostas continuam em `instrument_responses.responses` com as mesmas chaves.
