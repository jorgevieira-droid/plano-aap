
-- Reestruturar instrumento Registro de Apoio Presencial conforme novo documento

-- 1) Remover campos não utilizados pelo novo documento
DELETE FROM public.instrument_fields
WHERE form_type = 'registro_apoio_presencial'
  AND field_key IN ('estr_conteudo_organizado', 'estr_questionamentos', 'estr_ajustes_pedagogicos',
                    'gestao_adaptacao', 'gestao_questionamentos');

-- 2) PLANEJAMENTO
UPDATE public.instrument_fields SET
  label = '1 - O conteúdo é alinhado ao currículo e possui foco nos pré-requisitos para que os estudantes avancem',
  description = 'A aula aborda o que é essencial para o ano/ciclo, previsto no currículo, respeitando a progressão necessária para a recomposição.',
  sort_order = 1
WHERE form_type = 'registro_apoio_presencial' AND field_key = 'plan_curriculo';

UPDATE public.instrument_fields SET
  label = '*2 - O objetivo de aprendizagem estava claro e foi significado junto aos estudantes',
  description = 'A apresentação do objetivo da aprendizagem oferece clareza aos estudantes sobre o que será aprendido e porquê.',
  sort_order = 2
WHERE form_type = 'registro_apoio_presencial' AND field_key = 'plan_objetivo';

UPDATE public.instrument_fields SET
  label = '*3 - O domínio conceitual permite a realização de explicações contextualizadas, exemplificações e adaptações',
  description = 'A segurança conceitual se manifesta em diferentes ações do professor: ao explicar conceitos, ao estabelecer relações entre ideias, ao responder perguntas inesperadas e ao aprofundar discussões.',
  sort_order = 3
WHERE form_type = 'registro_apoio_presencial' AND field_key = 'plan_dominio';

UPDATE public.instrument_fields SET
  label = '*4 - A utilização intencional dos recursos pedagógicos (plataformas, materiais impressos e digitais, propostas didáticas preparadas pelo professor) favorece a aprendizagem',
  description = 'Os recursos utilizados apoiam aprendizagem de forma intencional e não apenas para cumprir metas ou seguir roteiros de forma mecânica.',
  sort_order = 4
WHERE form_type = 'registro_apoio_presencial' AND field_key = 'plan_recursos';

INSERT INTO public.instrument_fields (form_type, field_key, label, description, field_type, scale_min, scale_max, scale_labels, dimension, sort_order, is_required)
VALUES (
  'registro_apoio_presencial',
  'plan_organizacao',
  '5 - A organização da aula em tempos adequados permite que ela seja realizada com começo, meio e fim',
  'A estrutura lógica da aula. Em recomposição, o tempo é ouro e a explicação não pode gerar mais confusão.',
  'rating', 0, 3,
  '[{"value":3,"label":"Muito efetivo"},{"value":2,"label":"Efetivo"},{"value":1,"label":"Pouco efetivo"},{"value":0,"label":"Nada efetivo"}]'::jsonb,
  'Planejamento e Domínio do Conteúdo e Recursos Pedagógicos',
  5, false
);

UPDATE public.instrument_fields SET
  label = 'Registre as evidências referentes a este foco de observação',
  description = NULL,
  sort_order = 6
WHERE form_type = 'registro_apoio_presencial' AND field_key = 'plan_evidencias';

-- 3) ESTRATÉGIAS DE APRENDIZAGEM
UPDATE public.instrument_fields SET
  label = '1 - As estratégias de aprendizagem são ativas e adequadas ao objetivo da aula',
  description = 'A metodologia deve ser o veículo que transporta o aluno do "não saber" ao "saber", especialmente em contextos de defasagem.',
  sort_order = 7
WHERE form_type = 'registro_apoio_presencial' AND field_key = 'estr_aprendizagem_ativa';

UPDATE public.instrument_fields SET
  label = '2 - A abordagem e as estratégias utilizadas alcançam os estudantes com lacunas de aprendizagem',
  description = 'A diversificação de abordagens na turma é fundamental para quem possui lacunas de aprendizagem possa aprender.',
  sort_order = 8
WHERE form_type = 'registro_apoio_presencial' AND field_key = 'estr_abordagem_lacunas';

INSERT INTO public.instrument_fields (form_type, field_key, label, description, field_type, scale_min, scale_max, scale_labels, dimension, sort_order, is_required)
VALUES
(
  'registro_apoio_presencial',
  'estr_compreensao_checada',
  '*3 - A compreensão dos estudantes foi checada para apoiar a retomada ou o avanço dos conteúdos',
  'A aprendizagem se constrói em etapas e acompanhar esse percurso é fundamental para que todos possam progredir.',
  'rating', 0, 3,
  '[{"value":3,"label":"Muito efetivo"},{"value":2,"label":"Efetivo"},{"value":1,"label":"Pouco efetivo"},{"value":0,"label":"Nada efetivo"}]'::jsonb,
  'Estratégias de Aprendizagem',
  9, false
),
(
  'registro_apoio_presencial',
  'estr_circulacao_mediacao',
  '4 - Circulação em sala e mediação problematizadora',
  'A circulação permite o monitoramento das aprendizagens e a realização de uma mediação problematizadora que contribua para o avanço efetivo dos estudantes e não apenas o cumprimento do planejamento.',
  'rating', 0, 3,
  '[{"value":3,"label":"Muito efetivo"},{"value":2,"label":"Efetivo"},{"value":1,"label":"Pouco efetivo"},{"value":0,"label":"Nada efetivo"}]'::jsonb,
  'Estratégias de Aprendizagem',
  10, false
);

UPDATE public.instrument_fields SET
  label = 'Registre as evidências referentes a este foco de observação',
  description = NULL,
  sort_order = 11
WHERE form_type = 'registro_apoio_presencial' AND field_key = 'estr_evidencias';

-- 4) GESTÃO DE SALA DE AULA
UPDATE public.instrument_fields SET
  label = '1 - O engajamento dos estudantes para iniciar a aula garante apoio à realização das atividades previstas',
  description = 'Engajar os estudantes para iniciar a aula em curto espaço de tempo apoia o desenvolvimento das atividades planejadas.',
  sort_order = 12
WHERE form_type = 'registro_apoio_presencial' AND field_key = 'gestao_engajamento';

UPDATE public.instrument_fields SET
  label = '2 - O gerenciamento do tempo garante desenvolvimento da sequência didática, resolução de dúvidas e sistematização de aprendizagens',
  description = 'O equilíbrio entre cumprir a sequência didática e garantir que os momentos de prática e dúvida não sejam atropelados é fundamental para a aprendizagem.',
  sort_order = 13
WHERE form_type = 'registro_apoio_presencial' AND field_key = 'gestao_tempo';

UPDATE public.instrument_fields SET
  label = '*3 - A maior parte dos alunos participa da aula',
  description = 'Engajamento coletivo e a capacidade do professor de converter o plano de aula em uma experiência compartilhada por todos.',
  sort_order = 14
WHERE form_type = 'registro_apoio_presencial' AND field_key = 'gestao_participacao';

UPDATE public.instrument_fields SET
  label = '*4 - O clima na sala de aula é de colaboração, respeito mútuo e favorável à aprendizagem',
  description = 'O respeito e a segurança para errar, especialmente quando está recuperando defasagens, apoia o desenvolvimento da aprendizagem.',
  sort_order = 15
WHERE form_type = 'registro_apoio_presencial' AND field_key = 'gestao_clima';

UPDATE public.instrument_fields SET
  label = '5 - As intervenções docentes quando os estudantes estão dispersos ou em casos de conflito e indisciplina são respeitosas',
  description = NULL,
  sort_order = 16
WHERE form_type = 'registro_apoio_presencial' AND field_key = 'gestao_respeito_conflito';

UPDATE public.instrument_fields SET
  label = 'Registre as evidências referentes a este foco de observação',
  description = NULL,
  sort_order = 17
WHERE form_type = 'registro_apoio_presencial' AND field_key = 'gestao_evidencias';

-- 5) PERGUNTAS OBRIGATÓRIAS (atualiza sort_order para ficarem ao final)
UPDATE public.instrument_fields SET sort_order = 18
WHERE form_type = 'registro_apoio_presencial' AND field_key = 'obrig_aspectos_pratica';

UPDATE public.instrument_fields SET sort_order = 19
WHERE form_type = 'registro_apoio_presencial' AND field_key = 'obrig_perguntas_reflexao';

UPDATE public.instrument_fields SET sort_order = 20
WHERE form_type = 'registro_apoio_presencial' AND field_key = 'obrig_sugestoes';

UPDATE public.instrument_fields SET sort_order = 21
WHERE form_type = 'registro_apoio_presencial' AND field_key = 'obrig_combinados';
