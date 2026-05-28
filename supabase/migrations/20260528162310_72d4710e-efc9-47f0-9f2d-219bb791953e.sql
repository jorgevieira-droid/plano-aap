-- Visita Técnica — Alfabetização (REDES) bespoke report table
CREATE TABLE public.relatorios_visita_tecnica_alfabetizacao_redes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  registro_acao_id uuid NOT NULL UNIQUE,
  created_by uuid,
  status text NOT NULL DEFAULT 'rascunho',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),

  -- Cadastro/contexto
  rede_municipal text,
  data date,
  nome_escola text,
  tecnico_visitante text,
  horario time,

  -- Gerenciamento - turma
  turma_ano text,
  nivel_iab text,
  qtd_estudantes integer,
  segmento text,
  material_didatico text[],
  alunos_masculino integer,
  alunos_feminino integer,

  -- 12 critérios (nota 1-4 + evidência)
  nota_criterio_1 integer,  evidencia_criterio_1 text,
  nota_criterio_2 integer,  evidencia_criterio_2 text,
  nota_criterio_3 integer,  evidencia_criterio_3 text,
  nota_criterio_4 integer,  evidencia_criterio_4 text,
  nota_criterio_5 integer,  evidencia_criterio_5 text,
  nota_criterio_6 integer,  evidencia_criterio_6 text,
  nota_criterio_7 integer,  evidencia_criterio_7 text,
  nota_criterio_8 integer,  evidencia_criterio_8 text,
  nota_criterio_9 integer,  evidencia_criterio_9 text,
  nota_criterio_10 integer, evidencia_criterio_10 text,
  nota_criterio_11 integer, evidencia_criterio_11 text,
  nota_criterio_12 integer, evidencia_criterio_12 text,

  -- Encaminhamentos
  pontos_fortes text,
  aspectos_fortalecer text,
  estrategias_sugeridas text,
  combinacao_acompanhamento text
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.relatorios_visita_tecnica_alfabetizacao_redes TO authenticated;
GRANT ALL ON public.relatorios_visita_tecnica_alfabetizacao_redes TO service_role;

ALTER TABLE public.relatorios_visita_tecnica_alfabetizacao_redes ENABLE ROW LEVEL SECURITY;

-- N1 admins manage everything
CREATE POLICY "N1 Admins manage rel_vt_alfabetizacao_redes"
ON public.relatorios_visita_tecnica_alfabetizacao_redes
AS PERMISSIVE FOR ALL TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- N2/N3 managers manage within their programs (mirrors observacoes_aula_redes pattern)
CREATE POLICY "N2N3 Managers manage rel_vt_alfabetizacao_redes"
ON public.relatorios_visita_tecnica_alfabetizacao_redes
AS PERMISSIVE FOR ALL TO authenticated
USING (
  (is_gestor(auth.uid()) OR has_role(auth.uid(), 'n3_coordenador_programa'::app_role))
  AND EXISTS (
    SELECT 1 FROM registros_acao r
    JOIN user_programas up ON up.user_id = auth.uid()
    WHERE r.id = relatorios_visita_tecnica_alfabetizacao_redes.registro_acao_id
      AND r.programa IS NOT NULL
      AND (up.programa)::text = ANY (r.programa)
  )
)
WITH CHECK (
  (is_gestor(auth.uid()) OR has_role(auth.uid(), 'n3_coordenador_programa'::app_role))
  AND EXISTS (
    SELECT 1 FROM registros_acao r
    JOIN user_programas up ON up.user_id = auth.uid()
    WHERE r.id = relatorios_visita_tecnica_alfabetizacao_redes.registro_acao_id
      AND r.programa IS NOT NULL
      AND (up.programa)::text = ANY (r.programa)
  )
);

-- N4/N5 operational manage via registro+entidade access
CREATE POLICY "N4N5 Operational manage rel_vt_alfabetizacao_redes"
ON public.relatorios_visita_tecnica_alfabetizacao_redes
AS PERMISSIVE FOR ALL TO authenticated
USING (
  is_operational(auth.uid()) AND EXISTS (
    SELECT 1 FROM registros_acao r
    WHERE r.id = relatorios_visita_tecnica_alfabetizacao_redes.registro_acao_id
      AND user_has_full_data_access(auth.uid(), r.escola_id, r.programa)
  )
)
WITH CHECK (
  is_operational(auth.uid()) AND EXISTS (
    SELECT 1 FROM registros_acao r
    WHERE r.id = relatorios_visita_tecnica_alfabetizacao_redes.registro_acao_id
      AND user_has_full_data_access(auth.uid(), r.escola_id, r.programa)
  )
);

CREATE TRIGGER update_rel_vt_alfa_redes_updated_at
BEFORE UPDATE ON public.relatorios_visita_tecnica_alfabetizacao_redes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
