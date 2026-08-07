DROP POLICY IF EXISTS "N4N5 Operational insert instrument_responses" ON public.instrument_responses;
CREATE POLICY "N4N5 Operational insert instrument_responses"
ON public.instrument_responses FOR INSERT TO authenticated
WITH CHECK (
  is_operational(auth.uid())
  AND aap_id = auth.uid()
  AND (
    user_has_entidade(auth.uid(), escola_id)
    OR user_has_escola_via_programa(auth.uid(), escola_id)
  )
);

DROP POLICY IF EXISTS "N4N5 Operational insert consultoria_respostas" ON public.consultoria_pedagogica_respostas;
CREATE POLICY "N4N5 Operational insert consultoria_respostas"
ON public.consultoria_pedagogica_respostas FOR INSERT TO authenticated
WITH CHECK (
  is_operational(auth.uid())
  AND aap_id = auth.uid()
  AND (
    user_has_entidade(auth.uid(), escola_id)
    OR user_has_escola_via_programa(auth.uid(), escola_id)
  )
);