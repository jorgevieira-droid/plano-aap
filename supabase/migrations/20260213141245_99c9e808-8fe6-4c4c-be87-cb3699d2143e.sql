
-- Allow N2/N3 to manage escolas linked to their programs
CREATE POLICY "N2N3 Managers insert escolas"
ON public.escolas
FOR INSERT
WITH CHECK (
  (is_gestor(auth.uid()) OR has_role(auth.uid(), 'n3_coordenador_programa'::app_role))
  AND programa IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.user_programas up
    WHERE up.user_id = auth.uid()
      AND up.programa::text = ANY(SELECT unnest(programa)::text FROM public.escolas e WHERE e.id = escolas.id)
  )
);

CREATE POLICY "N2N3 Managers update escolas"
ON public.escolas
FOR UPDATE
USING (
  (is_gestor(auth.uid()) OR has_role(auth.uid(), 'n3_coordenador_programa'::app_role))
  AND programa IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.user_programas up
    WHERE up.user_id = auth.uid()
      AND up.programa::text = ANY(
        SELECT p::text FROM unnest(escolas.programa) AS p
      )
  )
);

CREATE POLICY "N2N3 Managers delete escolas"
ON public.escolas
FOR DELETE
USING (
  (is_gestor(auth.uid()) OR has_role(auth.uid(), 'n3_coordenador_programa'::app_role))
  AND programa IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.user_programas up
    WHERE up.user_id = auth.uid()
      AND up.programa::text = ANY(
        SELECT p::text FROM unnest(escolas.programa) AS p
      )
  )
);
