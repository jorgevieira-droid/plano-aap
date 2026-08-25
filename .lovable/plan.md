# Desabilitar páginas de visualização e ajustar o Registro de Apoio Presencial

## 1. Páginas desabilitadas

"Visualização Apoio Presencial" e "Visualização Formação do Coordenador" saem do grupo atual do menu e passam para o grupo "Desabilitados" (visível apenas para N1), com o selo "Desabilitada", igual a "Evolução Professor" e "Pontos Observados". N2/N3 deixam de ver os dois itens.

Observação: hoje usuários N2/N3 exclusivamente do Programa de Escolas entram no sistema direto em "Visualização de Apoio Presencial". Como a página passa a ser desabilitada, esses usuários passarão a entrar no Dashboard.

## 2. Formulário de cadastro (Programação / Adicionar Ação)

Para o tipo "Registro de Apoio Presencial", os campos **Descrição** e **Tags** ficam ocultos (permanecem para os outros tipos de ação).

## 3. Formulário de gerenciamento (realização)

Bloco "2. Dados da Realização":
- Nova primeira pergunta: **"Turma do VOAR"** (Sim / Não).
- Remover **Data da observação**.
- Remover **Horário previsto para início da aula** e **Horário real de início da aula**.
- Nova pergunta em lista de seleção: **"Qual a diferença entre o horário previsto e o horário real de início da aula?"** — Até 10 minutos / Entre 10 e 13 minutos / Entre 13 e 15 minutos / Mais de 15 minutos.
- Mantêm-se: alunos presentes, outros observadores, devolutiva realizada (e seus campos condicionais).

Bloco "4. Devolutiva Formativa" — substituir as quatro perguntas atuais por três campos de texto longo:
- Temas abordados na devolutiva
- Encaminhamentos combinados com o Professor
- Participação e engajamento do Professor na devolutiva

Fluxo das práticas essenciais:
- Depois de "5. Escolha da Rubrica de Observação" (e da segunda rubrica, quando houver), entra a pergunta **"Você observou práticas essenciais?"** (Sim / Não).
- "Sim" abre o bloco "Rubrica da Primeira Prática Essencial — Retomada" e segue o fluxo atual (segunda e terceira prática por pergunta encadeada).
- "Não" pula direto para a avaliação final.

Nova pergunta final:
- **"Como você avalia o apoio presencial realizado?"** — 1 nada eficaz / 2 pouco eficaz / 3 eficaz / 4 muito eficaz, gravada como nota numérica (contabilizável em relatórios).
- Campo de texto longo **"Justifique a sua resposta"**.

Registros antigos continuam abrindo normalmente; os campos removidos apenas deixam de ser exibidos (dados preservados no histórico).

## Detalhes técnicos

- `src/components/layout/Sidebar.tsx`: mover os dois itens para o grupo `Desabilitados` (`adminOnly`, `disabled: true`).
- `src/components/layout/AppLayout.tsx`: ajustar `getDefaultRoute` para não mandar manager de "escolas" a `/visualizacao-apoio-presencial`.
- `src/pages/admin/ProgramacaoPage.tsx`: condicionar a renderização dos blocos Descrição e Tags a `formData.tipo !== 'registro_apoio_presencial'`.
- `src/components/formularios/RegistroApoioPresencialContent.tsx`: novos campos `turma_voar`, `diferenca_horario`, `devolutiva_temas`, `devolutiva_encaminhamentos`, `devolutiva_participacao`, `observou_praticas`, `avaliacao_apoio` (1–4) e `avaliacao_apoio_justificativa`; remoção da exibição de `data_observacao`, `horario_previsto`, `horario_real` e dos quatro campos antigos da devolutiva; renumeração dos blocos.
- `src/components/formularios/RegistroApoioPresencialForm.tsx`: retirar a validação obrigatória de `data_observacao`.
- Nenhuma alteração de banco: as respostas já são gravadas em `instrument_responses.responses` (JSONB).
