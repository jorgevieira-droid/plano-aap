
CREATE POLICY "N3 Coord view access_log"
ON public.user_access_log
FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'n3_coordenador_programa') AND
  shares_programa(auth.uid(), user_id)
);

CREATE POLICY "N4N5 Operational view access_log"
ON public.user_access_log
FOR SELECT TO authenticated
USING (
  is_operational(auth.uid()) AND
  shares_programa(auth.uid(), user_id)
);
