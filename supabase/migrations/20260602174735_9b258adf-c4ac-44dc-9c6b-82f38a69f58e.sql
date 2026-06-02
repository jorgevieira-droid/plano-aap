
-- 1) Table for Observação de Aula (GPA)
CREATE TABLE public.observacoes_aula_gpa (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  registro_acao_id uuid UNIQUE,
  status text NOT NULL DEFAULT 'rascunho',

  -- Cabeçalho (cadastro)
  municipio text,
  data date,
  nome_escola text,
  observador text,
  horario_inicio time,
  horario_fim time,

  -- Identificação (gerenciamento)
  nome_professor text,
  ano text,
  turma text,
  qtd_estudantes integer,
  segmento text,
  material_didatico text[],
  alunos_masculino integer,
  alunos_feminino integer,

  -- 9 critérios escala 1-4
  nota_criterio_1 integer CHECK (nota_criterio_1 BETWEEN 1 AND 4),
  evidencia_criterio_1 text,
  nota_criterio_2 integer CHECK (nota_criterio_2 BETWEEN 1 AND 4),
  evidencia_criterio_2 text,
  nota_criterio_3 integer CHECK (nota_criterio_3 BETWEEN 1 AND 4),
  evidencia_criterio_3 text,
  nota_criterio_4 integer CHECK (nota_criterio_4 BETWEEN 1 AND 4),
  evidencia_criterio_4 text,
  nota_criterio_5 integer CHECK (nota_criterio_5 BETWEEN 1 AND 4),
  evidencia_criterio_5 text,
  nota_criterio_6 integer CHECK (nota_criterio_6 BETWEEN 1 AND 4),
  evidencia_criterio_6 text,
  nota_criterio_7 integer CHECK (nota_criterio_7 BETWEEN 1 AND 4),
  evidencia_criterio_7 text,
  nota_criterio_8 integer CHECK (nota_criterio_8 BETWEEN 1 AND 4),
  evidencia_criterio_8 text,
  nota_criterio_9 integer CHECK (nota_criterio_9 BETWEEN 1 AND 4),
  evidencia_criterio_9 text,

  -- Encaminhamentos
  pontos_fortes text,
  aspectos_fortalecer text,
  estrategias_sugeridas text,
  combinacao_acompanhamento text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_observacoes_aula_gpa_registro_acao ON public.observacoes_aula_gpa(registro_acao_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.observacoes_aula_gpa TO authenticated;
GRANT ALL ON public.observacoes_aula_gpa TO service_role;

ALTER TABLE public.observacoes_aula_gpa ENABLE ROW LEVEL SECURITY;

-- N1 Admins manage all
CREATE POLICY "N1 Admins manage observacoes_aula_gpa"
ON public.observacoes_aula_gpa
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- N2/N3 Managers manage within their programs
CREATE POLICY "N2N3 Managers manage observacoes_aula_gpa"
ON public.observacoes_aula_gpa
FOR ALL
TO authenticated
USING (
  (is_gestor(auth.uid()) OR has_role(auth.uid(), 'n3_coordenador_programa'::app_role))
  AND EXISTS (
    SELECT 1 FROM public.registros_acao r
    JOIN public.user_programas up ON up.user_id = auth.uid()
    WHERE r.id = observacoes_aula_gpa.registro_acao_id
      AND r.programa IS NOT NULL
      AND (up.programa)::text = ANY (r.programa)
  )
)
WITH CHECK (
  (is_gestor(auth.uid()) OR has_role(auth.uid(), 'n3_coordenador_programa'::app_role))
  AND EXISTS (
    SELECT 1 FROM public.registros_acao r
    JOIN public.user_programas up ON up.user_id = auth.uid()
    WHERE r.id = observacoes_aula_gpa.registro_acao_id
      AND r.programa IS NOT NULL
      AND (up.programa)::text = ANY (r.programa)
  )
);

-- N4.1/N4.2/N5 manage via shared escola+programa access
CREATE POLICY "N4N5 Operational manage observacoes_aula_gpa via acao"
ON public.observacoes_aula_gpa
FOR ALL
TO authenticated
USING (
  is_operational(auth.uid())
  AND registro_acao_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.registros_acao r
    WHERE r.id = observacoes_aula_gpa.registro_acao_id
      AND user_has_full_data_access(auth.uid(), r.escola_id, r.programa)
  )
)
WITH CHECK (
  is_operational(auth.uid())
  AND registro_acao_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.registros_acao r
    WHERE r.id = observacoes_aula_gpa.registro_acao_id
      AND user_has_full_data_access(auth.uid(), r.escola_id, r.programa)
  )
);

-- Trigger updated_at
CREATE TRIGGER update_observacoes_aula_gpa_updated_at
BEFORE UPDATE ON public.observacoes_aula_gpa
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Seed form_config_settings for availability per program (default: all 3)
INSERT INTO public.form_config_settings (form_key, min_optional_questions, programas)
VALUES ('observacao_aula_gpa', 3, ARRAY['escolas','regionais','redes_municipais']::programa_type[])
ON CONFLICT (form_key) DO NOTHING;
