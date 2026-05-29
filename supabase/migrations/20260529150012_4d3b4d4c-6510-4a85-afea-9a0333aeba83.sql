
CREATE POLICY "N2N3 Managers insert relatorios_monitoramento_gestao"
ON public.relatorios_monitoramento_gestao
FOR INSERT
WITH CHECK (
  (is_gestor(auth.uid()) OR has_role(auth.uid(), 'n3_coordenador_programa'::app_role))
  AND EXISTS (
    SELECT 1
    FROM public.registros_acao r
    JOIN public.user_programas up ON up.user_id = auth.uid()
    WHERE r.id = relatorios_monitoramento_gestao.registro_acao_id
      AND r.programa IS NOT NULL
      AND (up.programa)::text = ANY (r.programa)
  )
);

CREATE POLICY "N2N3 Managers update relatorios_monitoramento_gestao"
ON public.relatorios_monitoramento_gestao
FOR UPDATE
USING (
  (is_gestor(auth.uid()) OR has_role(auth.uid(), 'n3_coordenador_programa'::app_role))
  AND EXISTS (
    SELECT 1
    FROM public.registros_acao r
    JOIN public.user_programas up ON up.user_id = auth.uid()
    WHERE r.id = relatorios_monitoramento_gestao.registro_acao_id
      AND r.programa IS NOT NULL
      AND (up.programa)::text = ANY (r.programa)
  )
)
WITH CHECK (
  (is_gestor(auth.uid()) OR has_role(auth.uid(), 'n3_coordenador_programa'::app_role))
  AND EXISTS (
    SELECT 1
    FROM public.registros_acao r
    JOIN public.user_programas up ON up.user_id = auth.uid()
    WHERE r.id = relatorios_monitoramento_gestao.registro_acao_id
      AND r.programa IS NOT NULL
      AND (up.programa)::text = ANY (r.programa)
  )
);

CREATE POLICY "N2N3 Managers delete relatorios_monitoramento_gestao"
ON public.relatorios_monitoramento_gestao
FOR DELETE
USING (
  (is_gestor(auth.uid()) OR has_role(auth.uid(), 'n3_coordenador_programa'::app_role))
  AND EXISTS (
    SELECT 1
    FROM public.registros_acao r
    JOIN public.user_programas up ON up.user_id = auth.uid()
    WHERE r.id = relatorios_monitoramento_gestao.registro_acao_id
      AND r.programa IS NOT NULL
      AND (up.programa)::text = ANY (r.programa)
  )
);
