DROP POLICY IF EXISTS "N4N5 Operational delete instrument_responses" ON public.instrument_responses;
CREATE POLICY "N4N5 Operational delete instrument_responses"
ON public.instrument_responses
FOR DELETE
TO authenticated
USING (
  is_operational(auth.uid())
  AND aap_id = auth.uid()
  AND (
    user_has_entidade(auth.uid(), escola_id)
    OR user_has_escola_via_programa(auth.uid(), escola_id)
  )
);

DROP POLICY IF EXISTS "N4N5 Operational view instrument_responses" ON public.instrument_responses;
CREATE POLICY "N4N5 Operational view instrument_responses"
ON public.instrument_responses
FOR SELECT
TO authenticated
USING (
  is_operational(auth.uid())
  AND aap_id = auth.uid()
  AND (
    user_has_entidade(auth.uid(), escola_id)
    OR user_has_escola_via_programa(auth.uid(), escola_id)
  )
);

DROP POLICY IF EXISTS "N4N5 Operational update instrument_responses" ON public.instrument_responses;
CREATE POLICY "N4N5 Operational update instrument_responses"
ON public.instrument_responses
FOR UPDATE
TO authenticated
USING (
  is_operational(auth.uid())
  AND aap_id = auth.uid()
  AND (
    user_has_entidade(auth.uid(), escola_id)
    OR user_has_escola_via_programa(auth.uid(), escola_id)
  )
)
WITH CHECK (
  is_operational(auth.uid())
  AND aap_id = auth.uid()
  AND (
    user_has_entidade(auth.uid(), escola_id)
    OR user_has_escola_via_programa(auth.uid(), escola_id)
  )
);