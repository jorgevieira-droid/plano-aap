-- 1) Adiciona o novo tipo aos check constraints
ALTER TABLE public.programacoes DROP CONSTRAINT programacoes_tipo_check;
ALTER TABLE public.programacoes ADD CONSTRAINT programacoes_tipo_check CHECK (tipo = ANY (ARRAY[
  'formacao'::text, 'visita'::text, 'acompanhamento_aula'::text, 'acompanhamento_formacoes'::text,
  'agenda_gestao'::text, 'autoavaliacao'::text, 'devolutiva_pedagogica'::text,
  'obs_engajamento_solidez'::text, 'obs_implantacao_programa'::text, 'observacao_aula'::text,
  'obs_uso_dados'::text, 'participa_formacoes'::text, 'qualidade_acomp_aula'::text,
  'qualidade_implementacao'::text, 'qualidade_atpcs'::text, 'sustentabilidade_programa'::text,
  'avaliacao_formacao_participante'::text, 'lista_presenca'::text, 'observacao_aula_redes'::text,
  'encontro_eteg_redes'::text, 'encontro_professor_redes'::text, 'lideranca_gestores_pei'::text,
  'monitoramento_gestao'::text, 'acomp_professor_tutor'::text, 'pec_qualidade_aula'::text,
  'visita_voar'::text, 'monitoramento_acoes_formativas'::text,
  'registro_consultoria_pedagogica'::text, 'registro_apoio_presencial'::text,
  'encontro_microciclos_recomposicao'::text, 'visita_tecnica_alfabetizacao_redes'::text,
  'observacao_aula_gpa'::text, 'visita_tecnica_tarl'::text,
  'reuniao_acomp_alfabetizacao'::text,
  'visita_tecnica_secretaria_sme'::text
]));

ALTER TABLE public.registros_acao DROP CONSTRAINT registros_acao_tipo_check;
ALTER TABLE public.registros_acao ADD CONSTRAINT registros_acao_tipo_check CHECK (tipo = ANY (ARRAY[
  'formacao'::text, 'visita'::text, 'acompanhamento_aula'::text, 'acompanhamento_formacoes'::text,
  'agenda_gestao'::text, 'autoavaliacao'::text, 'devolutiva_pedagogica'::text,
  'obs_engajamento_solidez'::text, 'obs_implantacao_programa'::text, 'observacao_aula'::text,
  'obs_uso_dados'::text, 'participa_formacoes'::text, 'qualidade_acomp_aula'::text,
  'qualidade_implementacao'::text, 'qualidade_atpcs'::text, 'sustentabilidade_programa'::text,
  'avaliacao_formacao_participante'::text, 'lista_presenca'::text, 'observacao_aula_redes'::text,
  'encontro_eteg_redes'::text, 'encontro_professor_redes'::text, 'lideranca_gestores_pei'::text,
  'monitoramento_gestao'::text, 'acomp_professor_tutor'::text, 'pec_qualidade_aula'::text,
  'visita_voar'::text, 'monitoramento_acoes_formativas'::text,
  'registro_consultoria_pedagogica'::text, 'registro_apoio_presencial'::text,
  'encontro_microciclos_recomposicao'::text, 'visita_tecnica_alfabetizacao_redes'::text,
  'observacao_aula_gpa'::text, 'visita_tecnica_tarl'::text,
  'reuniao_acomp_alfabetizacao'::text,
  'visita_tecnica_secretaria_sme'::text
]));

-- 2) Campos novos do CADASTRO em programacoes (preenchidos no momento do agendamento)
ALTER TABLE public.programacoes
  ADD COLUMN IF NOT EXISTS nucleo_departamento text,
  ADD COLUMN IF NOT EXISTS observador_nome text;

-- 3) form_config_settings — disponível para os 3 programas
INSERT INTO public.form_config_settings (form_key, programas, min_optional_questions)
VALUES ('visita_tecnica_secretaria_sme', ARRAY['escolas','regionais','redes_municipais']::programa_type[], 0)
ON CONFLICT (form_key) DO UPDATE SET programas = EXCLUDED.programas;

-- 4) instrument_fields — 10 critérios (escala 0–3) em 4 dimensões
DELETE FROM public.instrument_fields WHERE form_type = 'visita_tecnica_secretaria_sme';

WITH criterios(num, dim, label, descricao, l0, l1, l2, l3) AS (
  VALUES
  (1, 'DIMENSÃO 1 — ACESSO E ORGANIZAÇÃO DOS DADOS',
   'A equipe técnica da rede acessou a plataforma CAED e localizou a seção de resultados da Fluência Leitora?',
   'O técnico precisa demonstrar domínio operacional mínimo da plataforma para extrair os dados corretamente.',
   'Não acessou ou não tem conhecimento da plataforma.',
   'Acesso pontual, sem domínio. Localizou a plataforma, mas não sabe navegar ou interpretar as seções.',
   'Acessou, mas com apoio ou dificuldade. Consegue localizar os dados, mas depende de orientação.',
   'Acessou autonomamente, navega na plataforma e utiliza os dados disponíveis com segurança.'),
  (2, 'DIMENSÃO 1 — ACESSO E ORGANIZAÇÃO DOS DADOS',
   'Os relatórios do município e das escolas foram baixados e organizados por escola, turma e ano?',
   'Sem organização adequada dos dados, o trabalho de análise não é possível. Organização é pré-requisito para uso pedagógico.',
   'Não organizou ou não baixou os relatórios.',
   'Dados soltos, sem sistematização clara.',
   'Organização parcial (ex.: apenas por escola, sem desdobrar por turma).',
   'Dados organizados por escola, turma e ano (planilha ou sistema estruturado).'),
  (3, 'DIMENSÃO 1 — ACESSO E ORGANIZAÇÃO DOS DADOS',
   'A equipe técnica da rede analisou a estrutura da avaliação (tipos de leitura, compreensão e conceitos de alfabetização)?',
   'Compreender o que cada parte avalia é fundamental para interpretar os resultados corretamente e orientar a rede com precisão.',
   'Não compreende a estrutura da avaliação.',
   'Entendimento superficial — sabe que é uma avaliação de leitura, mas não domina os componentes.',
   'Compreensão geral, mas com lacunas em aspectos específicos (ex.: não distingue precisão de prosódia).',
   'A equipe compreende claramente o que cada parte da avaliação mede e sabe relacionar ao currículo.'),
  (4, 'DIMENSÃO 2 — ANÁLISE E INTERPRETAÇÃO DOS RESULTADOS',
   'A equipe técnica da rede identificou os estudantes por perfil de desempenho (Pré-leitor, Leitor Iniciante, Leitor Fluente)?',
   'Pergunta essencial. Cada perfil deve conter lista nominal com os alunos classificados.',
   'Não identificou perfis.',
   'Identificação genérica, sem precisão — percepção geral sem listagem nominal.',
   'Classificação parcial ou com inconsistências (alguns perfis identificados, outros não).',
   'Todos os alunos classificados corretamente por perfil, com lista nominal disponível.'),
  (5, 'DIMENSÃO 2 — ANÁLISE E INTERPRETAÇÃO DOS RESULTADOS',
   'A equipe técnica da rede relacionou os perfis de desempenho dos estudantes com as práticas pedagógicas atuais da escola?',
   'A resposta deve contemplar evidências do tipo de intervenção para cada perfil e da efetiva orientação à rede.',
   'Não relaciona os perfis às práticas pedagógicas.',
   'Relação superficial ou desconectada, e sem indícios/evidências de orientação da rede.',
   'Relação genérica (precisa melhorar leitura) e indícios/evidências de orientação da rede.',
   'Relaciona perfis com práticas concretas (intervenção específica) e demonstra orientação efetiva para a rede.'),
  (6, 'DIMENSÃO 2 — ANÁLISE E INTERPRETAÇÃO DOS RESULTADOS',
   'A equipe técnica da rede analisou os componentes da fluência leitora (precisão, velocidade/automaticidade e prosódia)?',
   'Análise diferenciada por componente permite intervenções mais precisas.',
   'Não analisa os componentes da fluência.',
   'Cita os componentes sem análise real — apenas menciona que existem, sem desdobrar.',
   'Analisa parcialmente (ex.: só velocidade), sem considerar os demais componentes.',
   'Analisa precisão, velocidade e prosódia separadamente, com dados distintos para cada componente.'),
  (7, 'DIMENSÃO 3 — ESTRATIFICAÇÃO E QUANTIFICAÇÃO DOS DADOS',
   'Os resultados foram organizados (estratificados) por turma, ano e perfil de desempenho?',
   'Sem estratificação, não é possível planejar intervenções direcionadas.',
   'Não estratificou os dados.',
   'Tentativa de organização sem consistência — dados parcialmente agrupados.',
   'Estratificação incompleta (ex.: só por ano, sem desdobrar por turma e perfil).',
   'Dados organizados por turmas, anos e perfis de forma visível e utilizável para planejamento.'),
  (8, 'DIMENSÃO 3 — ESTRATIFICAÇÃO E QUANTIFICAÇÃO DOS DADOS',
   'A equipe quantificou o número de alunos em cada perfil de desempenho?',
   'Sem quantificação, não existe gestão da aprendizagem.',
   'Não quantificou os alunos por perfil.',
   'Estimativa ou percepção (tem muitos pré-leitores) sem dados concretos.',
   'Quantificação parcial — alguns perfis ou turmas quantificadas, outras não.',
   'Número de alunos claro por perfis, turmas e escolas — dados numéricos disponíveis.'),
  (9, 'DIMENSÃO 4 — PLANEJAMENTO E MONITORAMENTO',
   'A equipe técnica da rede elaborou ações ou estratégias específicas para cada grupo de alunos (ex.: Pré-leitores, Leitores Iniciantes)?',
   'Planejar intervenções diferenciadas por perfil é o objetivo final da análise dos dados.',
   'Não planejou intervenções.',
   'Ideias iniciais sem estrutura — intenção declarada, mas sem plano concreto.',
   'Ações gerais, sem foco por grupo — estratégias que valem para todos, sem diferenciação.',
   'Ações específicas por perfil com descrição clara (ex.: plano estruturado para pré-leitores).'),
  (10, 'DIMENSÃO 4 — PLANEJAMENTO E MONITORAMENTO',
   'Foram definidas formas de acompanhamento (metas, rotina ou agenda estratégica) para monitorar os avanços dos alunos?',
   'O monitoramento garante que o planejamento seja implementado e ajustado.',
   'Não monitora ou não definiu formas de acompanhamento.',
   'Intenção sem prática — declaração de que irão monitorar, mas sem mecanismo definido.',
   'Monitoramento irregular — há alguma forma de acompanhamento, mas sem consistência.',
   'Há rotina definida com agenda, metas e acompanhamento contínuo documentado.')
)
INSERT INTO public.instrument_fields (form_type, field_key, label, description, field_type, scale_min, scale_max, scale_labels, dimension, sort_order, is_required)
SELECT
  'visita_tecnica_secretaria_sme',
  'nota_criterio_' || num,
  num || '. ' || label,
  'Foco: ' || descricao,
  'rating',
  0, 3,
  jsonb_build_array(
    jsonb_build_object('value', 0, 'label', '0 — Não realizado', 'description', l0),
    jsonb_build_object('value', 1, 'label', '1 — Inicial',       'description', l1),
    jsonb_build_object('value', 2, 'label', '2 — Parcial',       'description', l2),
    jsonb_build_object('value', 3, 'label', '3 — Consolidado',   'description', l3)
  ),
  dim, num * 10, true
FROM criterios;

-- 5) Evidências (10 textareas)
INSERT INTO public.instrument_fields (form_type, field_key, label, field_type, dimension, sort_order, is_required)
SELECT
  'visita_tecnica_secretaria_sme',
  'evidencia_criterio_' || n,
  'Evidência observada (critério ' || n || ')',
  'textarea',
  CASE
    WHEN n <= 3 THEN 'DIMENSÃO 1 — ACESSO E ORGANIZAÇÃO DOS DADOS'
    WHEN n <= 6 THEN 'DIMENSÃO 2 — ANÁLISE E INTERPRETAÇÃO DOS RESULTADOS'
    WHEN n <= 8 THEN 'DIMENSÃO 3 — ESTRATIFICAÇÃO E QUANTIFICAÇÃO DOS DADOS'
    ELSE 'DIMENSÃO 4 — PLANEJAMENTO E MONITORAMENTO'
  END,
  n * 10 + 5, false
FROM generate_series(1,10) n;

-- 6) Encaminhamentos (4 textareas)
INSERT INTO public.instrument_fields (form_type, field_key, label, field_type, dimension, sort_order, is_required) VALUES
  ('visita_tecnica_secretaria_sme','pontos_fortes',              'Pontos fortes identificados na visita',          'textarea','ENCAMINHAMENTOS',1000,false),
  ('visita_tecnica_secretaria_sme','aspectos_fortalecer',        'Aspectos a fortalecer / Fragilidades observadas','textarea','ENCAMINHAMENTOS',1010,false),
  ('visita_tecnica_secretaria_sme','estrategias_encaminhamentos','Estratégias e encaminhamentos sugeridos',        'textarea','ENCAMINHAMENTOS',1020,false),
  ('visita_tecnica_secretaria_sme','combinacoes_acompanhamento', 'Combinações para acompanhamento futuro',         'textarea','ENCAMINHAMENTOS',1030,false);
