
-- 1. user_roles: operacionais podem ver roles de usuários do mesmo programa
CREATE POLICY "N4N5 Operational view roles same programs"
  ON public.user_roles FOR SELECT
  USING (is_operational(auth.uid()) AND shares_programa(auth.uid(), user_id));

-- 2. user_programas: operacionais podem ver programas de usuários do mesmo programa
CREATE POLICY "Operational view programas same programs"
  ON public.user_programas FOR SELECT
  USING (is_operational(auth.uid()) AND shares_programa(auth.uid(), user_id));

-- 3. aap_programas: operacionais podem ver programas de usuários do mesmo programa
CREATE POLICY "Operational view aap_programas same programs"
  ON public.aap_programas FOR SELECT
  USING (is_operational(auth.uid()) AND shares_programa(auth.uid(), aap_user_id));
