-- N2/N3 manage entidades_filho via parent escola program
CREATE POLICY "N2N3 Managers view entidades_filho"
ON public.entidades_filho
FOR SELECT
TO authenticated
USING (
  (is_gestor(auth.uid()) OR has_role(auth.uid(), 'n3_coordenador_programa'::app_role))
  AND user_has_escola_via_programa(auth.uid(), escola_id)
);

CREATE POLICY "N2N3 Managers insert entidades_filho"
ON public.entidades_filho
FOR INSERT
TO authenticated
WITH CHECK (
  (is_gestor(auth.uid()) OR has_role(auth.uid(), 'n3_coordenador_programa'::app_role))
  AND user_has_escola_via_programa(auth.uid(), escola_id)
);

CREATE POLICY "N2N3 Managers update entidades_filho"
ON public.entidades_filho
FOR UPDATE
TO authenticated
USING (
  (is_gestor(auth.uid()) OR has_role(auth.uid(), 'n3_coordenador_programa'::app_role))
  AND user_has_escola_via_programa(auth.uid(), escola_id)
)
WITH CHECK (
  (is_gestor(auth.uid()) OR has_role(auth.uid(), 'n3_coordenador_programa'::app_role))
  AND user_has_escola_via_programa(auth.uid(), escola_id)
);

CREATE POLICY "N2N3 Managers delete entidades_filho"
ON public.entidades_filho
FOR DELETE
TO authenticated
USING (
  (is_gestor(auth.uid()) OR has_role(auth.uid(), 'n3_coordenador_programa'::app_role))
  AND user_has_escola_via_programa(auth.uid(), escola_id)
);