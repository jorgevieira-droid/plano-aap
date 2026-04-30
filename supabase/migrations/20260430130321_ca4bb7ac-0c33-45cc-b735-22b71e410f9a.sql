
-- Allow N4.1/N4.2/N5 (operational) users to manage presencas, instrument_responses,
-- registros_acao updates, programacoes status updates, and microciclo reports
-- for actions where they share entidade + programa with the action owner.
-- Existing "owner-only" policies remain in place.

-- =========================
-- presencas
-- =========================
CREATE POLICY "N4N5 Operational shared insert presencas"
ON public.presencas
FOR INSERT
TO authenticated
WITH CHECK (
  is_operational(auth.uid()) AND EXISTS (
    SELECT 1 FROM public.registros_acao r
    WHERE r.id = presencas.registro_acao_id
      AND user_has_full_data_access(auth.uid(), r.escola_id, r.programa)
  )
);

CREATE POLICY "N4N5 Operational shared update presencas"
ON public.presencas
FOR UPDATE
TO authenticated
USING (
  is_operational(auth.uid()) AND EXISTS (
    SELECT 1 FROM public.registros_acao r
    WHERE r.id = presencas.registro_acao_id
      AND user_has_full_data_access(auth.uid(), r.escola_id, r.programa)
  )
);

CREATE POLICY "N4N5 Operational shared delete presencas"
ON public.presencas
FOR DELETE
TO authenticated
USING (
  is_operational(auth.uid()) AND EXISTS (
    SELECT 1 FROM public.registros_acao r
    WHERE r.id = presencas.registro_acao_id
      AND user_has_full_data_access(auth.uid(), r.escola_id, r.programa)
  )
);

-- =========================
-- instrument_responses
-- =========================
CREATE POLICY "N4N5 Operational shared insert instrument_responses"
ON public.instrument_responses
FOR INSERT
TO authenticated
WITH CHECK (
  is_operational(auth.uid()) AND EXISTS (
    SELECT 1 FROM public.registros_acao r
    WHERE r.id = instrument_responses.registro_acao_id
      AND user_has_full_data_access(auth.uid(), r.escola_id, r.programa)
  )
);

CREATE POLICY "N4N5 Operational shared update instrument_responses"
ON public.instrument_responses
FOR UPDATE
TO authenticated
USING (
  is_operational(auth.uid()) AND EXISTS (
    SELECT 1 FROM public.registros_acao r
    WHERE r.id = instrument_responses.registro_acao_id
      AND user_has_full_data_access(auth.uid(), r.escola_id, r.programa)
  )
);

CREATE POLICY "N4N5 Operational shared delete instrument_responses"
ON public.instrument_responses
FOR DELETE
TO authenticated
USING (
  is_operational(auth.uid()) AND EXISTS (
    SELECT 1 FROM public.registros_acao r
    WHERE r.id = instrument_responses.registro_acao_id
      AND user_has_full_data_access(auth.uid(), r.escola_id, r.programa)
  )
);

-- =========================
-- relatorios_microciclos_recomposicao (only when linked to an accessible registro)
-- =========================
CREATE POLICY "N4N5 Operational shared insert microciclos"
ON public.relatorios_microciclos_recomposicao
FOR INSERT
TO authenticated
WITH CHECK (
  is_operational(auth.uid()) AND registro_acao_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.registros_acao r
    WHERE r.id = relatorios_microciclos_recomposicao.registro_acao_id
      AND user_has_full_data_access(auth.uid(), r.escola_id, r.programa)
  )
);

CREATE POLICY "N4N5 Operational shared update microciclos"
ON public.relatorios_microciclos_recomposicao
FOR UPDATE
TO authenticated
USING (
  is_operational(auth.uid()) AND registro_acao_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.registros_acao r
    WHERE r.id = relatorios_microciclos_recomposicao.registro_acao_id
      AND user_has_full_data_access(auth.uid(), r.escola_id, r.programa)
  )
);

CREATE POLICY "N4N5 Operational shared delete microciclos"
ON public.relatorios_microciclos_recomposicao
FOR DELETE
TO authenticated
USING (
  is_operational(auth.uid()) AND registro_acao_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.registros_acao r
    WHERE r.id = relatorios_microciclos_recomposicao.registro_acao_id
      AND user_has_full_data_access(auth.uid(), r.escola_id, r.programa)
  )
);

CREATE POLICY "N4N5 Operational shared select microciclos"
ON public.relatorios_microciclos_recomposicao
FOR SELECT
TO authenticated
USING (
  is_operational(auth.uid()) AND registro_acao_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.registros_acao r
    WHERE r.id = relatorios_microciclos_recomposicao.registro_acao_id
      AND user_has_full_data_access(auth.uid(), r.escola_id, r.programa)
  )
);

-- =========================
-- registros_acao  (UPDATE for shared actions; INSERT also useful when creating registro for someone else's programacao)
-- =========================
CREATE POLICY "N4N5 Operational shared insert registros"
ON public.registros_acao
FOR INSERT
TO authenticated
WITH CHECK (
  is_operational(auth.uid())
  AND user_has_full_data_access(auth.uid(), escola_id, programa)
);

CREATE POLICY "N4N5 Operational shared update registros"
ON public.registros_acao
FOR UPDATE
TO authenticated
USING (
  is_operational(auth.uid())
  AND user_has_full_data_access(auth.uid(), escola_id, programa)
);

-- =========================
-- programacoes  (UPDATE for shared actions, e.g., marking status='realizada')
-- =========================
CREATE POLICY "N4N5 Operational shared update programacoes"
ON public.programacoes
FOR UPDATE
TO authenticated
USING (
  is_operational(auth.uid())
  AND user_has_full_data_access(auth.uid(), escola_id, programa)
);
