
CREATE TABLE IF NOT EXISTS public.relatorios_visita_tecnica_tarl (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registro_acao_id uuid NOT NULL REFERENCES public.registros_acao(id) ON DELETE CASCADE,
  created_by uuid,
  status text NOT NULL DEFAULT 'rascunho',
  municipio text, nome_escola text, tecnico_visitante text,
  data date, horario_inicio time, horario_fim time,
  ano_serie text, turma text, modalidade text,
  qtd_matriculados integer, qtd_presentes integer,
  agente_nome text, agente_participou_formacao text,
  nivel_lp text, nivel_mat text,
  plano_aula_assinado text, replanejamento_15_dias text,
  observacoes_iniciais text,
  nota_d1_1 smallint, evidencia_d1_1 text,
  nota_d1_2 smallint, evidencia_d1_2 text,
  nota_d1_3 smallint, evidencia_d1_3 text,
  nota_d2_1 smallint, evidencia_d2_1 text,
  nota_d2_2 smallint, evidencia_d2_2 text,
  nota_d2_3 smallint, evidencia_d2_3 text,
  nota_d2_4 smallint, evidencia_d2_4 text,
  nota_d3_1 smallint, evidencia_d3_1 text,
  nota_d3_2 smallint, evidencia_d3_2 text,
  nota_d3_3 smallint, evidencia_d3_3 text,
  nota_d4_2 smallint, evidencia_d4_2 text,
  nota_d4_3 smallint, evidencia_d4_3 text,
  nota_d5_1 smallint, evidencia_d5_1 text,
  nota_d5_2 smallint, evidencia_d5_2 text,
  avaliacao_geral text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (registro_acao_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.relatorios_visita_tecnica_tarl TO authenticated;
GRANT ALL ON public.relatorios_visita_tecnica_tarl TO service_role;

ALTER TABLE public.relatorios_visita_tecnica_tarl ENABLE ROW LEVEL SECURITY;

CREATE POLICY "N1 Admins manage rvtt" ON public.relatorios_visita_tecnica_tarl
  FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "N2N3 Managers view rvtt" ON public.relatorios_visita_tecnica_tarl
  FOR SELECT USING (
    (is_gestor(auth.uid()) OR has_role(auth.uid(),'n3_coordenador_programa'::app_role))
    AND EXISTS (
      SELECT 1 FROM registros_acao r JOIN user_programas up ON up.user_id = auth.uid()
      WHERE r.id = relatorios_visita_tecnica_tarl.registro_acao_id
        AND r.programa IS NOT NULL AND up.programa::text = ANY (r.programa)
    )
  );

CREATE POLICY "N2N3 Managers manage rvtt" ON public.relatorios_visita_tecnica_tarl
  FOR ALL USING (
    (is_gestor(auth.uid()) OR has_role(auth.uid(),'n3_coordenador_programa'::app_role))
    AND EXISTS (
      SELECT 1 FROM registros_acao r JOIN user_programas up ON up.user_id = auth.uid()
      WHERE r.id = relatorios_visita_tecnica_tarl.registro_acao_id
        AND r.programa IS NOT NULL AND up.programa::text = ANY (r.programa)
    )
  ) WITH CHECK (
    (is_gestor(auth.uid()) OR has_role(auth.uid(),'n3_coordenador_programa'::app_role))
    AND EXISTS (
      SELECT 1 FROM registros_acao r JOIN user_programas up ON up.user_id = auth.uid()
      WHERE r.id = relatorios_visita_tecnica_tarl.registro_acao_id
        AND r.programa IS NOT NULL AND up.programa::text = ANY (r.programa)
    )
  );

CREATE POLICY "N4N5 Operational view rvtt" ON public.relatorios_visita_tecnica_tarl
  FOR SELECT USING (
    is_operational(auth.uid()) AND EXISTS (
      SELECT 1 FROM registros_acao r
      WHERE r.id = relatorios_visita_tecnica_tarl.registro_acao_id
        AND (r.aap_id = auth.uid() OR user_has_full_data_access(auth.uid(), r.escola_id, r.programa))
    )
  );

CREATE POLICY "N4N5 Operational insert rvtt" ON public.relatorios_visita_tecnica_tarl
  FOR INSERT WITH CHECK (
    is_operational(auth.uid()) AND EXISTS (
      SELECT 1 FROM registros_acao r
      WHERE r.id = relatorios_visita_tecnica_tarl.registro_acao_id
        AND (r.aap_id = auth.uid() OR user_has_full_data_access(auth.uid(), r.escola_id, r.programa))
    )
  );

CREATE POLICY "N4N5 Operational update rvtt" ON public.relatorios_visita_tecnica_tarl
  FOR UPDATE USING (
    is_operational(auth.uid()) AND EXISTS (
      SELECT 1 FROM registros_acao r
      WHERE r.id = relatorios_visita_tecnica_tarl.registro_acao_id
        AND (r.aap_id = auth.uid() OR user_has_full_data_access(auth.uid(), r.escola_id, r.programa))
    )
  );

CREATE POLICY "N4N5 Operational delete rvtt" ON public.relatorios_visita_tecnica_tarl
  FOR DELETE USING (
    is_operational(auth.uid()) AND EXISTS (
      SELECT 1 FROM registros_acao r
      WHERE r.id = relatorios_visita_tecnica_tarl.registro_acao_id
        AND (r.aap_id = auth.uid() OR user_has_full_data_access(auth.uid(), r.escola_id, r.programa))
    )
  );

CREATE TRIGGER set_updated_at_rvtt
  BEFORE UPDATE ON public.relatorios_visita_tecnica_tarl
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.form_config_settings (form_key, min_optional_questions, programas)
VALUES ('visita_tecnica_tarl', 0, ARRAY['escolas','regionais','redes_municipais']::programa_type[])
ON CONFLICT (form_key) DO UPDATE SET
  programas = EXCLUDED.programas,
  min_optional_questions = EXCLUDED.min_optional_questions,
  updated_at = now();

INSERT INTO public.instrument_fields (form_type, field_key, label, field_type, scale_min, scale_max, dimension, sort_order, is_required)
VALUES
('visita_tecnica_tarl','nota_d1_1','D1.1 Agrupamento por Nível de Aprendizagem','rating',1,4,'DIMENSÃO 1 — ORGANIZAÇÃO E GESTÃO DE DADOS',1,false),
('visita_tecnica_tarl','nota_d1_2','D1.2 Visibilidade do Progresso dos Estudantes','rating',1,4,'DIMENSÃO 1 — ORGANIZAÇÃO E GESTÃO DE DADOS',2,false),
('visita_tecnica_tarl','nota_d1_3','D1.3 Organização e Acesso aos Materiais Metodológicos','rating',1,4,'DIMENSÃO 1 — ORGANIZAÇÃO E GESTÃO DE DADOS',3,false),
('visita_tecnica_tarl','nota_d2_1','D2.1 Estrutura da Aula em Três Momentos','rating',1,4,'DIMENSÃO 2 — IMPLEMENTAÇÃO CAMaL',4,false),
('visita_tecnica_tarl','nota_d2_2','D2.2 Atividades Multissensoriais','rating',1,4,'DIMENSÃO 2 — IMPLEMENTAÇÃO CAMaL',5,false),
('visita_tecnica_tarl','nota_d2_3','D2.3 Instrução Customizada por Nível de Grupo','rating',1,4,'DIMENSÃO 2 — IMPLEMENTAÇÃO CAMaL',6,false),
('visita_tecnica_tarl','nota_d2_4','D2.4 Uso Adequado dos Materiais do Caderno','rating',1,4,'DIMENSÃO 2 — IMPLEMENTAÇÃO CAMaL',7,false),
('visita_tecnica_tarl','nota_d3_1','D3.1 Ambiente Seguro para Errar','rating',1,4,'DIMENSÃO 3 — CLIMA E ENGAJAMENTO',8,false),
('visita_tecnica_tarl','nota_d3_2','D3.2 Participação Ativa dos Estudantes','rating',1,4,'DIMENSÃO 3 — CLIMA E ENGAJAMENTO',9,false),
('visita_tecnica_tarl','nota_d3_3','D3.3 Cooperação entre Pares e Protagonismo','rating',1,4,'DIMENSÃO 3 — CLIMA E ENGAJAMENTO',10,false),
('visita_tecnica_tarl','nota_d4_2','D4.2 Uso Pedagógico dos Dados das Avaliações','rating',1,4,'DIMENSÃO 4 — PLANEJAMENTO E USO DE DADOS',11,false),
('visita_tecnica_tarl','nota_d4_3','D4.3 Registros de Acompanhamento da Aprendizagem','rating',1,4,'DIMENSÃO 4 — PLANEJAMENTO E USO DE DADOS',12,false),
('visita_tecnica_tarl','nota_d5_1','D5.1 Apoio e Engajamento da Gestão Escolar','rating',1,4,'DIMENSÃO 5 — GESTÃO DA REDE',13,false),
('visita_tecnica_tarl','nota_d5_2','D5.2 Receptividade às Devolutivas Formativas','rating',1,4,'DIMENSÃO 5 — GESTÃO DA REDE',14,false)
ON CONFLICT DO NOTHING;
