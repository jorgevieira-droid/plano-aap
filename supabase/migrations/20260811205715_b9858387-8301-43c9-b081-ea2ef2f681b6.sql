
-- avaliacoes_aula
DROP POLICY IF EXISTS "N4N5 Operational insert avaliacoes" ON public.avaliacoes_aula;
CREATE POLICY "N4N5 Operational insert avaliacoes"
ON public.avaliacoes_aula FOR INSERT TO authenticated
WITH CHECK (
  is_operational(auth.uid())
  AND aap_id = auth.uid()
  AND (
    public.user_has_entidade(auth.uid(), escola_id)
    OR public.user_has_escola_via_programa(auth.uid(), escola_id)
  )
);

DROP POLICY IF EXISTS "N4N5 Operational update avaliacoes" ON public.avaliacoes_aula;
CREATE POLICY "N4N5 Operational update avaliacoes"
ON public.avaliacoes_aula FOR UPDATE TO authenticated
USING (
  is_operational(auth.uid())
  AND aap_id = auth.uid()
  AND (
    public.user_has_entidade(auth.uid(), escola_id)
    OR public.user_has_escola_via_programa(auth.uid(), escola_id)
  )
)
WITH CHECK (
  is_operational(auth.uid())
  AND aap_id = auth.uid()
  AND (
    public.user_has_entidade(auth.uid(), escola_id)
    OR public.user_has_escola_via_programa(auth.uid(), escola_id)
  )
);

-- programacoes
DROP POLICY IF EXISTS "N4N5 Operational insert programacoes" ON public.programacoes;
CREATE POLICY "N4N5 Operational insert programacoes"
ON public.programacoes FOR INSERT TO authenticated
WITH CHECK (
  is_operational(auth.uid())
  AND aap_id = auth.uid()
  AND (
    escola_id IS NULL
    OR public.user_has_entidade(auth.uid(), escola_id)
    OR public.user_has_escola_via_programa(auth.uid(), escola_id)
  )
);

DROP POLICY IF EXISTS "N4N5 Operational update programacoes" ON public.programacoes;
CREATE POLICY "N4N5 Operational update programacoes"
ON public.programacoes FOR UPDATE TO authenticated
USING (
  is_operational(auth.uid())
  AND aap_id = auth.uid()
  AND (
    escola_id IS NULL
    OR public.user_has_entidade(auth.uid(), escola_id)
    OR public.user_has_escola_via_programa(auth.uid(), escola_id)
  )
)
WITH CHECK (
  is_operational(auth.uid())
  AND aap_id = auth.uid()
  AND (
    escola_id IS NULL
    OR public.user_has_entidade(auth.uid(), escola_id)
    OR public.user_has_escola_via_programa(auth.uid(), escola_id)
  )
);

-- registros_acao
DROP POLICY IF EXISTS "N4N5 Operational insert registros" ON public.registros_acao;
CREATE POLICY "N4N5 Operational insert registros"
ON public.registros_acao FOR INSERT TO authenticated
WITH CHECK (
  is_operational(auth.uid())
  AND aap_id = auth.uid()
  AND (
    escola_id IS NULL
    OR public.user_has_entidade(auth.uid(), escola_id)
    OR public.user_has_escola_via_programa(auth.uid(), escola_id)
  )
);

DROP POLICY IF EXISTS "N4N5 Operational update registros" ON public.registros_acao;
CREATE POLICY "N4N5 Operational update registros"
ON public.registros_acao FOR UPDATE TO authenticated
USING (
  is_operational(auth.uid())
  AND aap_id = auth.uid()
  AND (
    escola_id IS NULL
    OR public.user_has_entidade(auth.uid(), escola_id)
    OR public.user_has_escola_via_programa(auth.uid(), escola_id)
  )
)
WITH CHECK (
  is_operational(auth.uid())
  AND aap_id = auth.uid()
  AND (
    escola_id IS NULL
    OR public.user_has_entidade(auth.uid(), escola_id)
    OR public.user_has_escola_via_programa(auth.uid(), escola_id)
  )
);
