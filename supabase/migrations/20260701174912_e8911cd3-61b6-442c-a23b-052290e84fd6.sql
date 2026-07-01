
DROP POLICY IF EXISTS "Authenticated users can view entidades_filho" ON public.entidades_filho;

CREATE POLICY "Users view entidades_filho in their programs"
ON public.entidades_filho
FOR SELECT
USING (
  is_admin(auth.uid())
  OR user_has_escola_via_programa(auth.uid(), escola_id)
  OR user_has_entidade(auth.uid(), escola_id)
);
