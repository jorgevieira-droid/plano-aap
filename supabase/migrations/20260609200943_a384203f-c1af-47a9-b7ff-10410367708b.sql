
-- 1) entidade_filho_id em registros_acao + backfill
ALTER TABLE public.registros_acao
  ADD COLUMN IF NOT EXISTS entidade_filho_id uuid
  REFERENCES public.entidades_filho(id) ON DELETE SET NULL;

-- Desabilita a trigger de auditoria durante backfill (auth.uid() é null em migrações)
ALTER TABLE public.registros_acao DISABLE TRIGGER USER;

UPDATE public.registros_acao r
   SET entidade_filho_id = p.entidade_filho_id
  FROM public.programacoes p
 WHERE r.programacao_id = p.id
   AND r.entidade_filho_id IS NULL
   AND p.entidade_filho_id IS NOT NULL;

ALTER TABLE public.registros_acao ENABLE TRIGGER USER;

-- 2) Tabela relatorios_reuniao_acomp_alfabetizacao
CREATE TABLE public.relatorios_reuniao_acomp_alfabetizacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registro_acao_id uuid NOT NULL UNIQUE
    REFERENCES public.registros_acao(id) ON DELETE CASCADE,
  created_by uuid,
  status text NOT NULL DEFAULT 'rascunho',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  municipio text,
  data date,
  nome_escola text,
  entidade_filho_id uuid REFERENCES public.entidades_filho(id) ON DELETE SET NULL,
  ponto_focal_municipal text,
  avaliador_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  hora_inicio time,
  hora_fim time,
  segmento text,
  nota_criterio_1 smallint, evidencia_criterio_1 text,
  nota_criterio_2 smallint, evidencia_criterio_2 text,
  nota_criterio_3 smallint, evidencia_criterio_3 text,
  nota_criterio_4 smallint, evidencia_criterio_4 text,
  nota_criterio_5 smallint, evidencia_criterio_5 text,
  nota_criterio_6 smallint, evidencia_criterio_6 text,
  nota_criterio_7 smallint, evidencia_criterio_7 text,
  nota_criterio_8 smallint, evidencia_criterio_8 text,
  nota_criterio_9 smallint, evidencia_criterio_9 text,
  nota_criterio_10 smallint, evidencia_criterio_10 text,
  nota_criterio_11 smallint, evidencia_criterio_11 text,
  nota_criterio_12 smallint, evidencia_criterio_12 text,
  nota_criterio_13 smallint, evidencia_criterio_13 text,
  pontos_fortes text,
  aspectos_fortalecer text,
  estrategias_sugeridas text
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.relatorios_reuniao_acomp_alfabetizacao TO authenticated;
GRANT ALL ON public.relatorios_reuniao_acomp_alfabetizacao TO service_role;

ALTER TABLE public.relatorios_reuniao_acomp_alfabetizacao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "N1 Admins manage rel_reuniao_acomp_alfa"
  ON public.relatorios_reuniao_acomp_alfabetizacao TO authenticated
  USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "N2N3 Managers manage rel_reuniao_acomp_alfa"
  ON public.relatorios_reuniao_acomp_alfabetizacao TO authenticated
  USING (
    (is_gestor(auth.uid()) OR has_role(auth.uid(), 'n3_coordenador_programa'::app_role))
    AND EXISTS (SELECT 1 FROM public.registros_acao r JOIN public.user_programas up ON up.user_id = auth.uid()
      WHERE r.id = relatorios_reuniao_acomp_alfabetizacao.registro_acao_id AND r.programa IS NOT NULL AND up.programa::text = ANY (r.programa))
  )
  WITH CHECK (
    (is_gestor(auth.uid()) OR has_role(auth.uid(), 'n3_coordenador_programa'::app_role))
    AND EXISTS (SELECT 1 FROM public.registros_acao r JOIN public.user_programas up ON up.user_id = auth.uid()
      WHERE r.id = relatorios_reuniao_acomp_alfabetizacao.registro_acao_id AND r.programa IS NOT NULL AND up.programa::text = ANY (r.programa))
  );

CREATE POLICY "N4N5 Operational manage rel_reuniao_acomp_alfa"
  ON public.relatorios_reuniao_acomp_alfabetizacao TO authenticated
  USING (
    is_operational(auth.uid())
    AND EXISTS (SELECT 1 FROM public.registros_acao r
      WHERE r.id = relatorios_reuniao_acomp_alfabetizacao.registro_acao_id
        AND user_has_full_data_access(auth.uid(), r.escola_id, r.programa))
  )
  WITH CHECK (
    is_operational(auth.uid())
    AND EXISTS (SELECT 1 FROM public.registros_acao r
      WHERE r.id = relatorios_reuniao_acomp_alfabetizacao.registro_acao_id
        AND user_has_full_data_access(auth.uid(), r.escola_id, r.programa))
  );

CREATE TRIGGER update_rel_reuniao_acomp_alfa_updated_at
  BEFORE UPDATE ON public.relatorios_reuniao_acomp_alfabetizacao
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) form_config_settings
INSERT INTO public.form_config_settings (form_key, programas, min_optional_questions)
VALUES ('reuniao_acomp_alfabetizacao', ARRAY['escolas','regionais','redes_municipais']::programa_type[], 0)
ON CONFLICT (form_key) DO UPDATE SET programas = EXCLUDED.programas;

-- 4) instrument_fields — 13 critérios
DELETE FROM public.instrument_fields WHERE form_type = 'reuniao_acomp_alfabetizacao';

WITH criterios(num, dim, label, descricao, l0, l1, l2) AS (
  VALUES
  (1, 'DIMENSÃO 1 — MATERIAIS E AVALIAÇÃO',
   'O material didático foi entregue a todas as escolas e está sendo utilizado regularmente em sala?',
   'A presença e uso regular do material é condição básica para a implementação do programa.',
   'O material não foi entregue a uma ou mais escolas, ou há relato de que não está sendo utilizado em sala de aula.',
   'O material foi entregue, mas há escolas em que o uso é irregular, esporádico ou restrito a algumas turmas.',
   'O material foi entregue a todas as escolas e há evidências de uso regular e sistemático em sala de aula.'),
  (2, 'DIMENSÃO 1 — MATERIAIS E AVALIAÇÃO',
   'A avaliação de entrada foi aplicada no prazo previsto?',
   'A avaliação de entrada é a base para o diagnóstico e a formação de agrupamentos por nível de proficiência.',
   'A avaliação de entrada não foi aplicada ou foi aplicada com atraso significativo, comprometendo o diagnóstico.',
   'A avaliação foi aplicada em parte das escolas ou turmas, dentro do prazo, mas não de forma universal.',
   'A avaliação de entrada foi aplicada em todas as escolas e turmas dentro do prazo previsto.'),
  (3, 'DIMENSÃO 1 — MATERIAIS E AVALIAÇÃO',
   'A sondagem está ocorrendo conforme o cronograma pactuado?',
   'A sondagem periódica permite rastrear a evolução dos estudantes e orientar intervenções pedagógicas.',
   'A sondagem não está sendo realizada ou está completamente fora do cronograma acordado.',
   'A sondagem ocorre em algumas escolas ou com frequência menor que a pactuada.',
   'A sondagem está sendo realizada em todas as escolas, conforme cronograma acordado.'),
  (4, 'DIMENSÃO 1 — MATERIAIS E AVALIAÇÃO',
   'A equipe técnica realiza devolutiva estruturada dos resultados às escolas?',
   'A devolutiva qualificada transforma dados de sondagem em insumos concretos para a prática pedagógica.',
   'Não há devolutiva dos resultados às escolas. Os dados ficam retidos na secretaria sem retorno.',
   'Há devolutiva, mas de forma informal, irregular ou sem estrutura que oriente as ações pedagógicas.',
   'A equipe técnica realiza devolutivas estruturadas, com análise dos dados e orientações pedagógicas claras para cada escola.'),
  (5, 'DIMENSÃO 2 — PLATAFORMAS E TECNOLOGIA',
   'As escolas receberam orientação regular para uso das plataformas Elefante Letrado, Matific e PARC?',
   'A orientação continuada é condição para que as plataformas sejam utilizadas com intencionalidade pedagógica.',
   'Não houve orientação às escolas sobre o uso das plataformas ou a orientação ocorreu apenas uma vez na implantação.',
   'Há orientação, mas irregular ou direcionada apenas a algumas escolas. O suporte não é sistemático.',
   'As escolas recebem orientação regular e estruturada para o uso pedagógico das plataformas.'),
  (6, 'DIMENSÃO 2 — PLATAFORMAS E TECNOLOGIA',
   'As escolas estão utilizando regularmente as plataformas Elefante Letrado, Matific e PARC?',
   'O uso regular das plataformas amplia as oportunidades de prática e acompanhamento individual dos estudantes.',
   'Nenhuma ou muito poucas escolas utilizam as plataformas. O acesso é nulo ou esporádico.',
   'Parte das escolas utiliza as plataformas, mas sem regularidade ou sem integração à rotina pedagógica.',
   'A maioria das escolas utiliza as plataformas regularmente, com frequência integrada à rotina de ensino.'),
  (7, 'DIMENSÃO 2 — PLATAFORMAS E TECNOLOGIA',
   'Houve adesão à plataforma de monitoramento municipal?',
   'A adesão à plataforma permite o acompanhamento centralizado dos indicadores do programa.',
   'Não houve adesão ou o acesso à plataforma não foi configurado.',
   'Houve adesão parcial — algumas escolas ou usuários ainda não estão cadastrados ou ativos.',
   'Houve adesão completa à plataforma, com todas as escolas e usuários ativos.'),
  (8, 'DIMENSÃO 3 — FORMAÇÃO E SUPORTE PEDAGÓGICO',
   'Há planejamento de formação continuada alinhado aos resultados das sondagens?',
   'A formação baseada em dados garante que o desenvolvimento profissional responda às necessidades reais dos professores.',
   'Não há planejamento de formação ou a formação existente não tem relação com os dados das sondagens.',
   'Há planejamento de formação, mas com conexão fraca ou informal com os resultados das sondagens.',
   'O planejamento de formação está explicitamente alinhado aos resultados das sondagens, com temas definidos a partir dos dados.'),
  (9, 'DIMENSÃO 3 — FORMAÇÃO E SUPORTE PEDAGÓGICO',
   'O calendário de formações está sendo executado conforme planejado?',
   'A execução fiel do calendário de formações garante continuidade e impacto sobre a prática docente.',
   'As formações não estão sendo realizadas ou há atrasos que comprometem o cronograma.',
   'Parte das formações está sendo realizada, mas com frequência ou participação abaixo do previsto.',
   'As formações estão sendo realizadas conforme planejado, com participação adequada dos professores.'),
  (10, 'DIMENSÃO 4 — VISITA TÉCNICA ÀS ESCOLAS',
   'O quórum de estudantes nas turmas de alfabetização foi igual ou superior a 85%?',
   'A frequência dos estudantes é um indicador de qualidade do vínculo escolar e condição para a aprendizagem.',
   'O quórum estava abaixo de 70% na maioria das turmas visitadas.',
   'O quórum variou entre 70% e 84% — aceitável, mas abaixo da meta.',
   'O quórum foi igual ou superior a 85% nas turmas observadas.'),
  (11, 'DIMENSÃO 4 — VISITA TÉCNICA ÀS ESCOLAS',
   'Há evidências de agrupamento produtivo ou organização por níveis de proficiência?',
   'O agrupamento intencional por nível permite ao professor intervir de forma diferenciada e aumentar a eficácia das interações.',
   'Não há agrupamento. Todos os estudantes recebem a mesma atividade, independente do nível.',
   'Há tentativa de agrupamento, mas sem clareza sobre critérios ou sem tarefas diferenciadas por grupo.',
   'O professor organiza os estudantes por nível de proficiência, com atividades distintas e intervenções calibradas a cada grupo.'),
  (12, 'DIMENSÃO 4 — VISITA TÉCNICA ÀS ESCOLAS',
   'O professor auxiliar atua com função pedagógica estruturada?',
   'O professor auxiliar deve ter papel pedagógico definido, não apenas operacional, para ampliar o impacto sobre a aprendizagem.',
   'Não há professor auxiliar designado, ou o(a) auxiliar presente não desempenha função pedagógica.',
   'O professor auxiliar está presente, mas atua principalmente em suporte operacional (disciplina, organização de materiais).',
   'O professor auxiliar tem papel pedagógico estruturado: atua com grupos, oferece suporte a estudantes com maior defasagem ou conduz atividades planejadas.'),
  (13, 'DIMENSÃO 4 — VISITA TÉCNICA ÀS ESCOLAS',
   'O município acompanha indicadores de frequência das turmas de alfabetização?',
   'O monitoramento sistemático da frequência permite identificar turmas em risco e agir preventivamente.',
   'O município não monitora frequência ou os dados de frequência não são acessados regularmente.',
   'Há acompanhamento informal ou esporádico dos indicadores de frequência.',
   'O município monitora sistematicamente a frequência das turmas, com dados atualizados e uso para tomada de decisão.')
)
INSERT INTO public.instrument_fields (form_type, field_key, label, description, field_type, scale_min, scale_max, scale_labels, dimension, sort_order, is_required)
SELECT
  'reuniao_acomp_alfabetizacao',
  'nota_criterio_' || num,
  num || '. ' || label,
  'Foco: ' || descricao,
  'rating',
  0, 2,
  jsonb_build_array(
    jsonb_build_object('value', 0, 'label', '0 — Não implementado',       'description', l0),
    jsonb_build_object('value', 1, 'label', '1 — Parcialmente implementado', 'description', l1),
    jsonb_build_object('value', 2, 'label', '2 — Implementado',           'description', l2)
  ),
  dim, num * 10, true
FROM criterios;

INSERT INTO public.instrument_fields (form_type, field_key, label, field_type, dimension, sort_order, is_required)
SELECT
  'reuniao_acomp_alfabetizacao',
  'evidencia_criterio_' || n,
  'Evidência observada (critério ' || n || ')',
  'textarea',
  CASE WHEN n <= 4 THEN 'DIMENSÃO 1 — MATERIAIS E AVALIAÇÃO'
       WHEN n <= 7 THEN 'DIMENSÃO 2 — PLATAFORMAS E TECNOLOGIA'
       WHEN n <= 9 THEN 'DIMENSÃO 3 — FORMAÇÃO E SUPORTE PEDAGÓGICO'
       ELSE 'DIMENSÃO 4 — VISITA TÉCNICA ÀS ESCOLAS' END,
  n * 10 + 5, false
FROM generate_series(1,13) n;

INSERT INTO public.instrument_fields (form_type, field_key, label, field_type, dimension, sort_order, is_required) VALUES
  ('reuniao_acomp_alfabetizacao','pontos_fortes','Pontos fortes identificados','textarea','ENCAMINHAMENTOS',1000,false),
  ('reuniao_acomp_alfabetizacao','aspectos_fortalecer','Aspectos a fortalecer','textarea','ENCAMINHAMENTOS',1010,false),
  ('reuniao_acomp_alfabetizacao','estrategias_sugeridas','Estratégias sugeridas','textarea','ENCAMINHAMENTOS',1020,false);
