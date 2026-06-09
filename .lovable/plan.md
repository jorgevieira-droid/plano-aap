
# Nova ação: Visita Técnica — T@RL

Criar um novo tipo de ação `visita_tecnica_tarl`, disponível para os três programas (Escolas, Regionais, Redes Municipais), com formulário de cadastro (na Programação) e formulário de gerenciamento (Registros), além de aparecer em Configuração de Formulários e Matriz de Ações. Os campos preenchidos no cadastro persistem ao abrir o gerenciamento (mesmo padrão dos tipos REDES existentes).

## 1. Campos do CADASTRO DA AÇÃO (Programação)

Já cobertos pelos campos genéricos da Programação:
- Município / Rede → Entidade
- Nome da Escola → Entidade Filho
- Nome do(a) Técnico(a) Visitante → Ator do Programa
- Data da visita
- Horário início / Horário término

Campos novos específicos no cadastro (também editáveis no gerenciamento):
- Ano/Série — dropdown: 1º, 2º, 3º, 4º, 5º, 6º, 7º, 9º ano; 1ª, 2ª, 3ª série
- Turma — dropdown: A, B, C, D, E, F, G, H
- Modalidade — seleção única: "Estudante em Foco" | "Recrie"

## 2. Campos do GERENCIAMENTO DA AÇÃO (Registro)

Persiste tudo do cadastro + os campos abaixo:

**Contexto da turma**
- Qtd. estudantes matriculados na turma (número)
- Qtd. estudantes presentes na visita (número)
- Nome do(a) agente educacional observado(a) (texto)
- Agente participou da formação inicial? (Sim / Não / Parcial)
- Nível predominante – Língua Portuguesa: Iniciante / Letra / Palavra / Parágrafo / História / Compreensão
- Nível predominante – Matemática: Iniciante / 1 Dígito / 2 Dígitos / Subtração / Divisão
- Plano de aula preenchido e assinado? (Sim / Não / Parcial)
- Replanejamento/reagrupamento nos últimos 15 dias? (Sim / Não / Parcial)
- Observações iniciais (texto longo)

**Rubricas 1–4 (cada critério: nota 1–4 + evidência texto)**
Legenda das rubricas: 1 Insuficiente, 2 Em desenvolvimento, 3 Consolidado, 4 Avançado.

- D1 — Organização do Espaço e Gestão de Dados
  - D1.1 Agrupamento por Nível de Aprendizagem
  - D1.2 Visibilidade do Progresso dos Estudantes
  - D1.3 Organização e Acesso aos Materiais Metodológicos
- D2 — Implementação CAMaL (Aulas Dinâmicas)
  - D2.1 Estrutura da Aula em Três Momentos
  - D2.2 Atividades Multissensoriais
  - D2.3 Instrução Customizada por Nível de Grupo
  - D2.4 Uso Adequado dos Materiais do Caderno
- D3 — Clima de Aula e Engajamento
  - D3.1 Ambiente Seguro para Errar
  - D3.2 Participação Ativa dos Estudantes
  - D3.3 Cooperação entre Pares e Protagonismo
- D4 — Planejamento e Uso de Dados
  - D4.2 Uso Pedagógico dos Dados das Avaliações
  - D4.3 Registros de Acompanhamento da Aprendizagem
- D5 — Gestão da Rede
  - D5.1 Apoio e Engajamento da Gestão Escolar
  - D5.2 Receptividade às Devolutivas Formativas

**Síntese (calculada automaticamente)**
- Médias por dimensão e média geral (read-only, derivadas das notas).

**Avaliação geral da implementação na turma observada (seleção única)**
- Incipiente — necessita acompanhamento intensivo
- Em andamento — avanços visíveis, desafios significativos
- Consolidada — boas práticas com pontos isolados de melhoria
- Avançada — referência metodológica para a rede

## 3. Detalhes técnicos

**Migração de banco**
- Adicionar `'visita_tecnica_tarl'` ao enum `tipo_acao`.
- Criar tabela `relatorios_visita_tecnica_tarl` com colunas para todos os campos acima (notas como `smallint`, evidências como `text`, enums em `text`). FK `registro_id → registros_acao(id)`, `programacao_id → programacoes(id)`. RLS espelhando `relatorios_visita_tecnica_microciclos` (admin, gestor por programa, owner). GRANTs padrão (authenticated + service_role).
- Inserir registros em `instrument_fields` para o novo `form_type = 'visita_tecnica_tarl'` (14 critérios rating 1–4 + textos de evidência + campos de contexto, com `dimension` preenchida D1…D5).
- Inserir `form_config_settings` para o novo form com `programas = ['escolas','regionais','redes_municipais']`.
- Adicionar colunas em `programacoes`/`registros_acao` se ainda faltarem (`turma_ano`, `turma_letra`, `modalidade_tarl`); reutilizar campos existentes onde possível (ex.: `turma` para letra).

**Frontend — config e routing**
- `src/config/acaoPermissions.ts`: adicionar `'visita_tecnica_tarl'` ao union de tipos, ao `ACAO_DEFINITIONS` (label "Visita Técnica – T@RL", ícone), permissões por papel (espelhar `visita_tecnica_microciclos`), e ao mapa de tabelas de relatórios.
- `src/hooks/useAcoesByPrograma.ts`: incluir o tipo nos 3 programas.
- `src/hooks/useInstrumentFields.ts`: adicionar `{ value: 'visita_tecnica_tarl', label: 'Visita Técnica – T@RL' }` em `INSTRUMENT_FORM_TYPES`.
- `src/pages/admin/ListaPresencaPage.tsx`: NÃO incluir (visita não tem lista de presença).
- `src/pages/admin/ProgramacaoPage.tsx`: adicionar lógica de exibição dos campos Ano/Série, Turma e Modalidade quando `tipo === 'visita_tecnica_tarl'` (mesmo padrão dos blocos atuais condicionais por tipo).
- `src/pages/admin/MatrizAcoesPage.tsx`: o tipo aparece automaticamente via `ACAO_DEFINITIONS` + `form_config_settings`.

**Formulário de gerenciamento**
- Criar `src/components/formularios/VisitaTecnicaTarlForm.tsx` baseado em `VisitaTecnicaMicrociclosForm.tsx`:
  - Pré-popular com dados da `programacoes` (entidade, escola, ator, data, horários, ano/série, turma, modalidade).
  - Bloco "Contexto da turma" com os campos novos.
  - Bloco de rubricas usando `RubricAccordion` por dimensão (D1…D5) com 14 critérios + textarea de evidência por critério.
  - Bloco "Síntese" com médias calculadas em tempo real.
  - Seleção única final "Avaliação geral".
  - Validação de envio: todas as notas 1–4 preenchidas, modalidade obrigatória, avaliação geral obrigatória.
- `RegistrosPage.tsx`: rotear ações `visita_tecnica_tarl` para o novo form via `INSTRUMENT_TYPE_SET` (auto-routing) — sem fluxo bespoke.

**Impressão**
- Criar `src/components/print/VisitaTecnicaTarlPrintSection.tsx` análogo a `VisitaMicrociclosPrintSection.tsx`. Registrar em `AcaoPrintForm.tsx`.

**Relatórios**
- Incluir no enum/route de `RelatorioInstrumentosPage.tsx` para análise comparativa (escala 1–4, mesma estrutura dos demais instrumentos rubrica).

## Out of scope
- Não alterar fluxos de outros instrumentos.
- Não criar lista de presença (visita técnica é individual com agente observado).
- Não criar acompanhamento/devolutiva automática.
