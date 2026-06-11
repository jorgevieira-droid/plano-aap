
DROP POLICY IF EXISTS "N4N5 Operational insert rvta" ON public.relatorios_visita_tecnica_alfabetizacao;

CREATE POLICY "N4N5 Operational insert rvta"
  ON public.relatorios_visita_tecnica_alfabetizacao FOR INSERT
  TO authenticated
  WITH CHECK (
    is_operational(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.registros_acao r
      WHERE r.id = relatorios_visita_tecnica_alfabetizacao.registro_acao_id
        AND (r.aap_id = auth.uid() OR user_has_full_data_access(auth.uid(), r.escola_id, r.programa))
    )
  );
