CREATE POLICY "N2N3 Managers insert instrument_responses"
ON public.instrument_responses
FOR INSERT TO public
WITH CHECK (
  (is_gestor(auth.uid()) OR has_role(auth.uid(), 'n3_coordenador_programa'))
  AND EXISTS (
    SELECT 1 FROM public.registros_acao r
    JOIN public.user_programas up ON up.user_id = auth.uid()
    WHERE r.id = instrument_responses.registro_acao_id
      AND r.programa IS NOT NULL
      AND up.programa::text = ANY (r.programa)
  )
);

CREATE POLICY "N2N3 Managers update instrument_responses"
ON public.instrument_responses
FOR UPDATE TO public
USING (
  (is_gestor(auth.uid()) OR has_role(auth.uid(), 'n3_coordenador_programa'))
  AND EXISTS (
    SELECT 1 FROM public.registros_acao r
    JOIN public.user_programas up ON up.user_id = auth.uid()
    WHERE r.id = instrument_responses.registro_acao_id
      AND r.programa IS NOT NULL
      AND up.programa::text = ANY (r.programa)
  )
);

CREATE POLICY "N2N3 Managers delete instrument_responses"
ON public.instrument_responses
FOR DELETE TO public
USING (
  (is_gestor(auth.uid()) OR has_role(auth.uid(), 'n3_coordenador_programa'))
  AND EXISTS (
    SELECT 1 FROM public.registros_acao r
    JOIN public.user_programas up ON up.user_id = auth.uid()
    WHERE r.id = instrument_responses.registro_acao_id
      AND r.programa IS NOT NULL
      AND up.programa::text = ANY (r.programa)
  )
);