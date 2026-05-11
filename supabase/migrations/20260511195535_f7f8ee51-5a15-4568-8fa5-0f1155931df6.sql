CREATE TABLE public.relatorios_visita_tecnica_microciclos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  registro_acao_id uuid NOT NULL UNIQUE,
  created_by uuid,
  status text NOT NULL DEFAULT 'rascunho',
  -- Snapshot da identificação
  municipio text,
  nome_escola text,
  data date,
  formador text,
  -- Cabeçalho de gerenciamento
  pessoa_acompanhou text,
  professor_observado text,
  horario_inicio time,
  horario_fim time,
  -- Partes da visita
  partes_visita text[],
  -- PARTE 1
  q1_organizacao_rotina text,
  q2_inicio_aulas text,
  q3_tres_encontros text,
  q4_modelos_agrupamento text[],
  q4_modelos_agrupamento_outro text,
  q5_anos_escolares text[],
  q6_num_turmas integer,
  q7_num_estudantes integer,
  q8_material_suficiente text,
  q9_registros_avaliacao text,
  q10_tempo_formativo text,
  -- PARTE 2
  q11_estudantes_matriculados integer,
  q12_estudantes_presentes integer,
  q13_componente text,
  q14_agrupamento_turma text,
  q14_agrupamento_turma_outro text,
  q15_uso_material text,
  q16_cadernos_uso text[],
  nota_q17 integer, evidencia_q17 text,
  nota_q18 integer, evidencia_q18 text,
  nota_q19 integer, evidencia_q19 text,
  nota_q20 integer, evidencia_q20 text,
  nota_q21 integer, evidencia_q21 text,
  nota_q22 integer, evidencia_q22 text,
  -- PARTE 3 - Bloco A: condições gerais
  encA_pontos_fortes text,
  encA_aspectos_fortalecer text,
  encA_encaminhamentos text,
  -- PARTE 3 - Bloco B: aspectos metodológicos
  encB_pontos_fortes text,
  encB_aspectos_fortalecer text,
  encB_encaminhamentos text,
  -- PARTE 3 - Bloco C: análise plataforma Trajetória
  encC_pontos_fortes text,
  encC_aspectos_fortalecer text,
  encC_encaminhamentos text,
  -- Observações gerais
  observacoes_gerais text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_rvtm_registro_acao_id ON public.relatorios_visita_tecnica_microciclos(registro_acao_id);
CREATE INDEX idx_rvtm_created_by ON public.relatorios_visita_tecnica_microciclos(created_by);

ALTER TABLE public.relatorios_visita_tecnica_microciclos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "N1 Admins manage rvtm"
ON public.relatorios_visita_tecnica_microciclos
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "N2N3 Managers view rvtm"
ON public.relatorios_visita_tecnica_microciclos
FOR SELECT
USING (
  (is_gestor(auth.uid()) OR has_role(auth.uid(), 'n3_coordenador_programa'::app_role))
  AND EXISTS (
    SELECT 1 FROM registros_acao r
    JOIN user_programas up ON up.user_id = auth.uid()
    WHERE r.id = relatorios_visita_tecnica_microciclos.registro_acao_id
      AND r.programa IS NOT NULL
      AND up.programa::text = ANY(r.programa)
  )
);

CREATE POLICY "N2N3 Managers manage rvtm"
ON public.relatorios_visita_tecnica_microciclos
FOR ALL
USING (
  (is_gestor(auth.uid()) OR has_role(auth.uid(), 'n3_coordenador_programa'::app_role))
  AND EXISTS (
    SELECT 1 FROM registros_acao r
    JOIN user_programas up ON up.user_id = auth.uid()
    WHERE r.id = relatorios_visita_tecnica_microciclos.registro_acao_id
      AND r.programa IS NOT NULL
      AND up.programa::text = ANY(r.programa)
  )
)
WITH CHECK (
  (is_gestor(auth.uid()) OR has_role(auth.uid(), 'n3_coordenador_programa'::app_role))
  AND EXISTS (
    SELECT 1 FROM registros_acao r
    JOIN user_programas up ON up.user_id = auth.uid()
    WHERE r.id = relatorios_visita_tecnica_microciclos.registro_acao_id
      AND r.programa IS NOT NULL
      AND up.programa::text = ANY(r.programa)
  )
);

CREATE POLICY "N4N5 Operational view rvtm"
ON public.relatorios_visita_tecnica_microciclos
FOR SELECT
USING (
  is_operational(auth.uid())
  AND EXISTS (
    SELECT 1 FROM registros_acao r
    WHERE r.id = relatorios_visita_tecnica_microciclos.registro_acao_id
      AND (r.aap_id = auth.uid() OR user_has_full_data_access(auth.uid(), r.escola_id, r.programa))
  )
);

CREATE POLICY "N4N5 Operational insert rvtm"
ON public.relatorios_visita_tecnica_microciclos
FOR INSERT
WITH CHECK (
  is_operational(auth.uid())
  AND EXISTS (
    SELECT 1 FROM registros_acao r
    WHERE r.id = relatorios_visita_tecnica_microciclos.registro_acao_id
      AND (r.aap_id = auth.uid() OR user_has_full_data_access(auth.uid(), r.escola_id, r.programa))
  )
);

CREATE POLICY "N4N5 Operational update rvtm"
ON public.relatorios_visita_tecnica_microciclos
FOR UPDATE
USING (
  is_operational(auth.uid())
  AND EXISTS (
    SELECT 1 FROM registros_acao r
    WHERE r.id = relatorios_visita_tecnica_microciclos.registro_acao_id
      AND (r.aap_id = auth.uid() OR user_has_full_data_access(auth.uid(), r.escola_id, r.programa))
  )
);

CREATE POLICY "N4N5 Operational delete rvtm"
ON public.relatorios_visita_tecnica_microciclos
FOR DELETE
USING (
  is_operational(auth.uid())
  AND EXISTS (
    SELECT 1 FROM registros_acao r
    WHERE r.id = relatorios_visita_tecnica_microciclos.registro_acao_id
      AND (r.aap_id = auth.uid() OR user_has_full_data_access(auth.uid(), r.escola_id, r.programa))
  )
);

CREATE TRIGGER update_rvtm_updated_at
BEFORE UPDATE ON public.relatorios_visita_tecnica_microciclos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();