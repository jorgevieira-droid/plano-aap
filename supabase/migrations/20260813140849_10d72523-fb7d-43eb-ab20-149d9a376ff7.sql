
CREATE OR REPLACE FUNCTION public.user_can_view_redes_municipio(_user_id uuid, _municipio text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.user_has_programa(_user_id, 'redes_municipais')
    AND (
      public.is_admin_or_gestor(_user_id)
      OR public.is_manager(_user_id)
      OR EXISTS (
        SELECT 1
        FROM public.user_entidades ue
        JOIN public.escolas e ON e.id = ue.escola_id
        WHERE ue.user_id = _user_id
          AND _municipio IS NOT NULL
          AND lower(btrim(e.nome)) = lower(btrim(_municipio))
      )
      OR EXISTS (
        SELECT 1
        FROM public.escolas e
        WHERE _municipio IS NOT NULL
          AND lower(btrim(e.nome)) = lower(btrim(_municipio))
          AND public.user_has_escola_via_programa(_user_id, e.id)
      )
    )
$$;

DROP POLICY IF EXISTS "Redes users can view eteg reports" ON public.relatorios_eteg_redes;
CREATE POLICY "Redes users can view eteg reports"
ON public.relatorios_eteg_redes
FOR SELECT
TO authenticated
USING (
  created_by = auth.uid()
  OR public.user_can_view_redes_municipio(auth.uid(), municipio)
);

DROP POLICY IF EXISTS "Redes users can view professor reports" ON public.relatorios_professor_redes;
CREATE POLICY "Redes users can view professor reports"
ON public.relatorios_professor_redes
FOR SELECT
TO authenticated
USING (
  created_by = auth.uid()
  OR public.user_can_view_redes_municipio(auth.uid(), municipio)
);
