
-- Tabela dedicada para o instrumento "Visita Técnica — Alfabetização"
CREATE TABLE IF NOT EXISTS public.relatorios_visita_tecnica_alfabetizacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registro_acao_id uuid NOT NULL REFERENCES public.registros_acao(id) ON DELETE CASCADE,
  created_by uuid,
  status text NOT NULL DEFAULT 'rascunho',
  -- Cadastro (persistido na criação)
  municipio text,
  nome_escola text,
  tecnico_visitante text,
  data date,
  horario_inicio time,
  horario_fim time,
  -- Gerenciamento
  ano text,
  turma text,
  qtd_estudantes integer,
  nivel_iab smallint,
  segmento text,
  material_didatico text[] DEFAULT '{}'::text[],
  alunos_masculino integer,
  alunos_feminino integer,
  -- 8 critérios com nota 1-4 + evidência
  nota_q1 smallint, evidencia_q1 text,
  nota_q2 smallint, evidencia_q2 text,
  nota_q3 smallint, evidencia_q3 text,
  nota_q4 smallint, evidencia_q4 text,
  q4_nao_se_aplica boolean NOT NULL DEFAULT false,
  nota_q5 smallint, evidencia_q5 text,
  nota_q6 smallint, evidencia_q6 text,
  nota_q7 smallint, evidencia_q7 text,
  nota_q8 smallint, evidencia_q8 text,
  observacoes_gerais text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(registro_acao_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.relatorios_visita_tecnica_alfabetizacao TO authenticated;
GRANT ALL ON public.relatorios_visita_tecnica_alfabetizacao TO service_role;

ALTER TABLE public.relatorios_visita_tecnica_alfabetizacao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "N1 Admins manage rvta"
  ON public.relatorios_visita_tecnica_alfabetizacao FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "N2N3 Managers manage rvta"
  ON public.relatorios_visita_tecnica_alfabetizacao FOR ALL
  USING (
    (is_gestor(auth.uid()) OR has_role(auth.uid(), 'n3_coordenador_programa'::app_role))
    AND EXISTS (
      SELECT 1 FROM registros_acao r
      JOIN user_programas up ON up.user_id = auth.uid()
      WHERE r.id = relatorios_visita_tecnica_alfabetizacao.registro_acao_id
        AND r.programa IS NOT NULL AND up.programa::text = ANY (r.programa)
    )
  )
  WITH CHECK (
    (is_gestor(auth.uid()) OR has_role(auth.uid(), 'n3_coordenador_programa'::app_role))
    AND EXISTS (
      SELECT 1 FROM registros_acao r
      JOIN user_programas up ON up.user_id = auth.uid()
      WHERE r.id = relatorios_visita_tecnica_alfabetizacao.registro_acao_id
        AND r.programa IS NOT NULL AND up.programa::text = ANY (r.programa)
    )
  );

CREATE POLICY "N4N5 Operational insert rvta"
  ON public.relatorios_visita_tecnica_alfabetizacao FOR INSERT
  WITH CHECK (true);

CREATE POLICY "N4N5 Operational view rvta"
  ON public.relatorios_visita_tecnica_alfabetizacao FOR SELECT
  USING (
    is_operational(auth.uid()) AND EXISTS (
      SELECT 1 FROM registros_acao r
      WHERE r.id = relatorios_visita_tecnica_alfabetizacao.registro_acao_id
        AND (r.aap_id = auth.uid() OR user_has_full_data_access(auth.uid(), r.escola_id, r.programa))
    )
  );

CREATE POLICY "N4N5 Operational update rvta"
  ON public.relatorios_visita_tecnica_alfabetizacao FOR UPDATE
  USING (
    is_operational(auth.uid()) AND EXISTS (
      SELECT 1 FROM registros_acao r
      WHERE r.id = relatorios_visita_tecnica_alfabetizacao.registro_acao_id
        AND (r.aap_id = auth.uid() OR user_has_full_data_access(auth.uid(), r.escola_id, r.programa))
    )
  );

CREATE POLICY "N4N5 Operational delete rvta"
  ON public.relatorios_visita_tecnica_alfabetizacao FOR DELETE
  USING (
    is_operational(auth.uid()) AND EXISTS (
      SELECT 1 FROM registros_acao r
      WHERE r.id = relatorios_visita_tecnica_alfabetizacao.registro_acao_id
        AND (r.aap_id = auth.uid() OR user_has_full_data_access(auth.uid(), r.escola_id, r.programa))
    )
  );

CREATE TRIGGER update_rvta_updated_at
  BEFORE UPDATE ON public.relatorios_visita_tecnica_alfabetizacao
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar o formulário para os 3 programas
INSERT INTO public.form_config_settings (form_key, programas)
VALUES ('visita_tecnica_alfabetizacao', ARRAY['escolas','redes_municipais','regionais']::programa_type[])
ON CONFLICT (form_key) DO UPDATE SET programas = EXCLUDED.programas;

-- Seeds em instrument_fields (8 critérios, escala 1-4) agrupados em 4 dimensões
INSERT INTO public.instrument_fields (form_type, field_key, label, description, field_type, scale_min, scale_max, scale_labels, dimension, sort_order, is_required)
VALUES
('visita_tecnica_alfabetizacao','nota_q1','O professor demonstra clareza sobre os objetivos de aprendizagem da etapa?',
 'Foco: o professor precisa saber o que os estudantes devem alcançar na etapa de alfabetização e como cada atividade contribui para esse fim.',
 'rating', 1, 4,
 '[{"value":1,"label":"Insuficiente"},{"value":2,"label":"Em Desenvolvimento"},{"value":3,"label":"Consolidado"},{"value":4,"label":"Avançado"}]'::jsonb,
 'D1 — Objetivos e Regularidade', 10, true),

('visita_tecnica_alfabetizacao','nota_q2','O quórum de estudantes na turma foi igual ou superior a 85% no dia da visita?',
 'Foco: a frequência escolar é condição para a aprendizagem. Quórum consistente indica que a escola garante o direito de presença dos estudantes.',
 'rating', 1, 4,
 '[{"value":1,"label":"Insuficiente"},{"value":2,"label":"Em Desenvolvimento"},{"value":3,"label":"Consolidado"},{"value":4,"label":"Avançado"}]'::jsonb,
 'D1 — Objetivos e Regularidade', 20, true),

('visita_tecnica_alfabetizacao','nota_q3','O professor auxiliar atua com função pedagógica estruturada?',
 'Foco: o auxiliar deve ter papel pedagógico claro, complementar ao titular, com foco no apoio aos estudantes.',
 'rating', 1, 4,
 '[{"value":1,"label":"Insuficiente"},{"value":2,"label":"Em Desenvolvimento"},{"value":3,"label":"Consolidado"},{"value":4,"label":"Avançado"}]'::jsonb,
 'D2 — Apoio e Material', 30, true),

('visita_tecnica_alfabetizacao','nota_q4','O professor utiliza efetivamente o material didático do programa (Currículo em Ação e IAB) durante a aula?',
 'Foco: o material didático do programa é o principal suporte estruturado para a alfabetização. Quando marcado "Não se aplica à rede", a pergunta é desconsiderada no cálculo da média.',
 'rating', 1, 4,
 '[{"value":1,"label":"Insuficiente"},{"value":2,"label":"Em Desenvolvimento"},{"value":3,"label":"Consolidado"},{"value":4,"label":"Avançado"}]'::jsonb,
 'D2 — Apoio e Material', 40, true),

('visita_tecnica_alfabetizacao','nota_q5','Há evidências de agrupamento produtivo ou organização por níveis de proficiência?',
 'Foco: agrupar estudantes por níveis de proficiência permite intervenções pedagógicas mais focadas.',
 'rating', 1, 4,
 '[{"value":1,"label":"Insuficiente"},{"value":2,"label":"Em Desenvolvimento"},{"value":3,"label":"Consolidado"},{"value":4,"label":"Avançado"}]'::jsonb,
 'D3 — Agrupamentos e Plataformas', 50, true),

('visita_tecnica_alfabetizacao','nota_q6','A escola está utilizando regularmente as plataformas Elefante Letrado, Matific e PARC?',
 'Foco: as plataformas digitais complementam o trabalho pedagógico e devem ser integradas à rotina.',
 'rating', 1, 4,
 '[{"value":1,"label":"Insuficiente"},{"value":2,"label":"Em Desenvolvimento"},{"value":3,"label":"Consolidado"},{"value":4,"label":"Avançado"}]'::jsonb,
 'D3 — Agrupamentos e Plataformas', 60, true),

('visita_tecnica_alfabetizacao','nota_q7','O professor participou de formação continuada alinhada aos resultados das sondagens?',
 'Foco: a formação continuada é mais eficaz quando conectada à realidade da turma e aos resultados das sondagens.',
 'rating', 1, 4,
 '[{"value":1,"label":"Insuficiente"},{"value":2,"label":"Em Desenvolvimento"},{"value":3,"label":"Consolidado"},{"value":4,"label":"Avançado"}]'::jsonb,
 'D4 — Formação e Sondagens', 70, true),

('visita_tecnica_alfabetizacao','nota_q8','Há evidências de que os resultados das sondagens orientam intervenções pedagógicas?',
 'Foco: os dados de sondagem devem informar diretamente o planejamento e as intervenções pedagógicas em sala.',
 'rating', 1, 4,
 '[{"value":1,"label":"Insuficiente"},{"value":2,"label":"Em Desenvolvimento"},{"value":3,"label":"Consolidado"},{"value":4,"label":"Avançado"}]'::jsonb,
 'D4 — Formação e Sondagens', 80, true)
ON CONFLICT DO NOTHING;
