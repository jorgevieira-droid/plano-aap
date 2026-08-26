# Nova Ação: Registro de Aula Compartilhada (Programa Escolas)

Nova ação/formulário exclusiva do Programa de Escolas, seguindo o mesmo padrão já usado em "Registro de Planejamento Conjunto" e "Registro de Apoio ao Coordenador", mais um painel de resultados.

## 1. Cadastro da ação

Campos exibidos ao agendar/registrar (Descrição e Tags ocultos):
- Consultor (responsável)
- Escola
- Data
- Professor (texto curto)
- Segmento
- Componente
- Ano/Série e Turma (lado a lado)

## 2. Formulário de registro

- Turma do VOAR? (Sim / Não)
- Quantidade de alunos presentes (número)
- O início real da aula aconteceu em: (Em até 10 min / Entre 10 e 13 min / Entre 13 e 15 min / Mais de 15 min)
- A aula compartilhada aconteceu como planejado? (Sim / Em partes / Não)
  - Se "Em partes" ou "Não": Motivo (texto longo)
- O que foi modelizado ao professor nessa aula? (texto longo)
- Qual o papel do professor durante a modelização? (Observador / Participante / Outro)
  - Se "Outro": campo de texto curto para especificar
- Conquistas e desafios vivenciados na aula compartilhada (texto longo)

## 3. Relatório - Registro de Aula Compartilhada

Nova página no menu (visível para N1 e N2/N3 do programa Escolas), no mesmo formato de "Relatórios - Apoio Presencial":

- **Filtros:** período, escola, consultor, segmento/componente.
- **KPIs:** total de aulas compartilhadas, escolas atendidas, professores distintos, média de alunos presentes, % em turmas VOAR, % de aulas que ocorreram como planejado.
- **Distribuições (barras horizontais):** início real da aula (4 faixas), aula como planejado (3 opções), papel do professor (3 opções).
- **Evolução mensal (linha):** volume de aulas compartilhadas e % "como planejado" por mês.
- **Rankings (tabelas ordenadas A-Z / por volume):** por escola e por consultor, com quantidade, média de presentes e % planejado.
- **Blocos qualitativos:** listas de "O que foi modelizado", "Motivos de não ocorrer como planejado" e "Conquistas e desafios", agrupados por escola/data.
- **Registros expansíveis** com todas as respostas e **exportação em PDF** com a marca dupla Parceiros + Bússola.

## Detalhes técnicos

- Migração: incluir `registro_aula_compartilhada` em `programacoes_tipo_check` e `registros_acao_tipo_check`; inserir linha em `form_config_settings` com `programas = {escolas}`.
- Reuso de colunas existentes em `programacoes`: `apoio_professor_nome`, `apoio_turma`, segmento/componente/ano_serie.
- Novo componente `src/components/formularios/AulaCompartilhadaContent.tsx`, registrado em `InstrumentFormRouter` e em `DEDICATED_CONTENT_TYPES`.
- Respostas salvas em `instrument_responses` com chaves: `turma_voar`, `alunos_presentes`, `inicio_real`, `ocorreu_planejado`, `motivo_nao_planejado`, `o_que_modelizado`, `papel_professor`, `papel_professor_outro`, `conquistas_desafios`.
- Registrar o tipo em `src/config/acaoPermissions.ts` e em `useInstrumentFields.ts` (extração de bases).
- Ajustes de cadastro em `ProgramacaoPage.tsx` (campos e ocultação de Descrição/Tags).
- Nova página `RelatoriosAulaCompartilhadaPanelPage.tsx` + rota `/relatorios-aula-compartilhada` em `App.tsx`, whitelist em `AppLayout.tsx` e item no `Sidebar.tsx`.
- Memória do projeto em `.lovable/memory/features/action-types/registro-aula-compartilhada.md`.
