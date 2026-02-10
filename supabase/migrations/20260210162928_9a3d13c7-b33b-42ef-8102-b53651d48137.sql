
-- FASE 1b: Funções helper + RLS policies para todas as tabelas

-- ============================================================
-- Funções helper (SECURITY DEFINER)
-- ============================================================

CREATE OR REPLACE FUNCTION public.user_has_programa(_user_id uuid, _programa text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_programas WHERE user_id = _user_id AND programa::text = _programa)
$$;

CREATE OR REPLACE FUNCTION public.user_has_entidade(_user_id uuid, _escola_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_entidades WHERE user_id = _user_id AND escola_id = _escola_id)
$$;

CREATE OR REPLACE FUNCTION public.is_manager(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin', 'gestor', 'n3_coordenador_programa'))
$$;

CREATE OR REPLACE FUNCTION public.is_operational(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('n4_1_cped', 'n4_2_gpi', 'n5_formador', 'aap_inicial', 'aap_portugues', 'aap_matematica'))
$$;

CREATE OR REPLACE FUNCTION public.is_local_user(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('n6_coord_pedagogico', 'n7_professor'))
$$;

CREATE OR REPLACE FUNCTION public.is_observer(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'n8_equipe_tecnica')
$$;

CREATE OR REPLACE FUNCTION public.user_has_escola_via_programa(_user_id uuid, _escola_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_programas up
    JOIN public.escolas e ON e.id = _escola_id AND e.programa IS NOT NULL AND up.programa::text = ANY(e.programa::text[])
    WHERE up.user_id = _user_id
  )
$$;

CREATE OR REPLACE FUNCTION public.user_has_full_data_access(_user_id uuid, _escola_id uuid, _programa text[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    EXISTS (SELECT 1 FROM public.user_entidades WHERE user_id = _user_id AND escola_id = _escola_id)
    AND EXISTS (
      SELECT 1 FROM public.user_programas up
      WHERE up.user_id = _user_id AND _programa IS NOT NULL AND up.programa::text = ANY(_programa)
    )
$$;

-- ============================================================
-- RLS: user_programas
-- ============================================================

CREATE POLICY "Admins can manage user_programas" ON public.user_programas FOR ALL
USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Managers can manage user_programas" ON public.user_programas FOR ALL
USING (public.is_manager(auth.uid())) WITH CHECK (public.is_manager(auth.uid()));

CREATE POLICY "Users can view own programas up" ON public.user_programas FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Require auth user_programas" ON public.user_programas FOR ALL
USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- RLS: user_entidades
-- ============================================================

CREATE POLICY "Admins can manage user_entidades" ON public.user_entidades FOR ALL
USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Managers can manage user_entidades" ON public.user_entidades FOR ALL
USING (public.is_manager(auth.uid())) WITH CHECK (public.is_manager(auth.uid()));

CREATE POLICY "Users can view own entidades" ON public.user_entidades FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Require auth user_entidades" ON public.user_entidades FOR ALL
USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- RLS: escolas (DROP old + CREATE new)
-- ============================================================

DROP POLICY IF EXISTS "AAPs can view their assigned escolas" ON public.escolas;
DROP POLICY IF EXISTS "Admins can manage escolas" ON public.escolas;
DROP POLICY IF EXISTS "Gestores can view escolas by programa" ON public.escolas;

CREATE POLICY "N1 Admins can manage escolas" ON public.escolas FOR ALL
USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "N2N3 Managers view escolas" ON public.escolas FOR SELECT
USING ((public.is_gestor(auth.uid()) OR public.has_role(auth.uid(), 'n3_coordenador_programa')) AND public.user_has_escola_via_programa(auth.uid(), id));

CREATE POLICY "N4N5 Operational view escolas" ON public.escolas FOR SELECT
USING (public.is_operational(auth.uid()) AND public.user_has_entidade(auth.uid(), id));

CREATE POLICY "N6N7 Local view escolas" ON public.escolas FOR SELECT
USING (public.is_local_user(auth.uid()) AND public.user_has_entidade(auth.uid(), id));

CREATE POLICY "N8 Observer view escolas" ON public.escolas FOR SELECT
USING (public.is_observer(auth.uid()) AND public.user_has_escola_via_programa(auth.uid(), id));

-- ============================================================
-- RLS: professores (DROP old + CREATE new)
-- ============================================================

DROP POLICY IF EXISTS "AAPs can delete professores in assigned schools" ON public.professores;
DROP POLICY IF EXISTS "AAPs can insert professores in assigned schools" ON public.professores;
DROP POLICY IF EXISTS "AAPs can update professores in assigned schools" ON public.professores;
DROP POLICY IF EXISTS "AAPs can view professores from assigned schools" ON public.professores;
DROP POLICY IF EXISTS "Admins can manage professores" ON public.professores;
DROP POLICY IF EXISTS "Admins can view all professores" ON public.professores;
DROP POLICY IF EXISTS "Gestores can delete professores by programa" ON public.professores;
DROP POLICY IF EXISTS "Gestores can insert professores by programa" ON public.professores;
DROP POLICY IF EXISTS "Gestores can update professores by programa" ON public.professores;
DROP POLICY IF EXISTS "Gestores can view professores by programa" ON public.professores;

CREATE POLICY "N1 Admins manage professores" ON public.professores FOR ALL
USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "N2N3 Managers view professores" ON public.professores FOR SELECT
USING ((public.is_gestor(auth.uid()) OR public.has_role(auth.uid(), 'n3_coordenador_programa'))
  AND professores.programa IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.user_programas up WHERE up.user_id = auth.uid() AND up.programa::text = ANY(professores.programa::text[])));

CREATE POLICY "N2N3 Managers insert professores" ON public.professores FOR INSERT
WITH CHECK ((public.is_gestor(auth.uid()) OR public.has_role(auth.uid(), 'n3_coordenador_programa'))
  AND professores.programa IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.user_programas up WHERE up.user_id = auth.uid() AND up.programa::text = ANY(professores.programa::text[])));

CREATE POLICY "N2N3 Managers update professores" ON public.professores FOR UPDATE
USING ((public.is_gestor(auth.uid()) OR public.has_role(auth.uid(), 'n3_coordenador_programa'))
  AND professores.programa IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.user_programas up WHERE up.user_id = auth.uid() AND up.programa::text = ANY(professores.programa::text[])));

CREATE POLICY "N2N3 Managers delete professores" ON public.professores FOR DELETE
USING ((public.is_gestor(auth.uid()) OR public.has_role(auth.uid(), 'n3_coordenador_programa'))
  AND professores.programa IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.user_programas up WHERE up.user_id = auth.uid() AND up.programa::text = ANY(professores.programa::text[])));

CREATE POLICY "N4N5 Operational view professores" ON public.professores FOR SELECT
USING (public.is_operational(auth.uid()) AND public.user_has_entidade(auth.uid(), professores.escola_id));

CREATE POLICY "N4N5 Operational insert professores" ON public.professores FOR INSERT
WITH CHECK (public.is_operational(auth.uid()) AND public.user_has_entidade(auth.uid(), professores.escola_id));

CREATE POLICY "N4N5 Operational update professores" ON public.professores FOR UPDATE
USING (public.is_operational(auth.uid()) AND public.user_has_entidade(auth.uid(), professores.escola_id));

CREATE POLICY "N4N5 Operational delete professores" ON public.professores FOR DELETE
USING (public.is_operational(auth.uid()) AND public.user_has_entidade(auth.uid(), professores.escola_id));

CREATE POLICY "N6N7 Local view professores" ON public.professores FOR SELECT
USING (public.is_local_user(auth.uid()) AND public.user_has_entidade(auth.uid(), professores.escola_id));

CREATE POLICY "N8 Observer view professores" ON public.professores FOR SELECT
USING (public.is_observer(auth.uid()) AND professores.programa IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.user_programas up WHERE up.user_id = auth.uid() AND up.programa::text = ANY(professores.programa::text[])));

-- ============================================================
-- RLS: programacoes (DROP old + CREATE new)
-- ============================================================

DROP POLICY IF EXISTS "AAPs can delete their own programacoes" ON public.programacoes;
DROP POLICY IF EXISTS "AAPs can insert their own programacoes" ON public.programacoes;
DROP POLICY IF EXISTS "AAPs can update their own programacoes" ON public.programacoes;
DROP POLICY IF EXISTS "AAPs can view their own programacoes" ON public.programacoes;
DROP POLICY IF EXISTS "Admins can manage programacoes" ON public.programacoes;
DROP POLICY IF EXISTS "Gestores can delete programacoes by programa" ON public.programacoes;
DROP POLICY IF EXISTS "Gestores can insert programacoes by programa" ON public.programacoes;
DROP POLICY IF EXISTS "Gestores can update programacoes by programa" ON public.programacoes;
DROP POLICY IF EXISTS "Gestores can view programacoes by programa" ON public.programacoes;

CREATE POLICY "N1 Admins manage programacoes" ON public.programacoes FOR ALL
USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "N2N3 Managers view programacoes" ON public.programacoes FOR SELECT
USING ((public.is_gestor(auth.uid()) OR public.has_role(auth.uid(), 'n3_coordenador_programa'))
  AND programacoes.programa IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.user_programas up WHERE up.user_id = auth.uid() AND up.programa::text = ANY(programacoes.programa)));

CREATE POLICY "N2N3 Managers insert programacoes" ON public.programacoes FOR INSERT
WITH CHECK ((public.is_gestor(auth.uid()) OR public.has_role(auth.uid(), 'n3_coordenador_programa'))
  AND programacoes.programa IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.user_programas up WHERE up.user_id = auth.uid() AND up.programa::text = ANY(programacoes.programa)));

CREATE POLICY "N2N3 Managers update programacoes" ON public.programacoes FOR UPDATE
USING ((public.is_gestor(auth.uid()) OR public.has_role(auth.uid(), 'n3_coordenador_programa'))
  AND programacoes.programa IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.user_programas up WHERE up.user_id = auth.uid() AND up.programa::text = ANY(programacoes.programa)));

CREATE POLICY "N2N3 Managers delete programacoes" ON public.programacoes FOR DELETE
USING ((public.is_gestor(auth.uid()) OR public.has_role(auth.uid(), 'n3_coordenador_programa'))
  AND programacoes.programa IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.user_programas up WHERE up.user_id = auth.uid() AND up.programa::text = ANY(programacoes.programa)));

CREATE POLICY "N4N5 Operational view programacoes" ON public.programacoes FOR SELECT
USING (public.is_operational(auth.uid()) AND (programacoes.aap_id = auth.uid() OR public.user_has_full_data_access(auth.uid(), programacoes.escola_id, programacoes.programa)));

CREATE POLICY "N4N5 Operational insert programacoes" ON public.programacoes FOR INSERT
WITH CHECK (public.is_operational(auth.uid()) AND programacoes.aap_id = auth.uid());

CREATE POLICY "N4N5 Operational update programacoes" ON public.programacoes FOR UPDATE
USING (public.is_operational(auth.uid()) AND programacoes.aap_id = auth.uid());

CREATE POLICY "N4N5 Operational delete programacoes" ON public.programacoes FOR DELETE
USING (public.is_operational(auth.uid()) AND programacoes.aap_id = auth.uid());

CREATE POLICY "N6N7 Local view programacoes" ON public.programacoes FOR SELECT
USING (public.is_local_user(auth.uid()) AND public.user_has_entidade(auth.uid(), programacoes.escola_id));

CREATE POLICY "N8 Observer view programacoes" ON public.programacoes FOR SELECT
USING (public.is_observer(auth.uid()) AND programacoes.programa IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.user_programas up WHERE up.user_id = auth.uid() AND up.programa::text = ANY(programacoes.programa)));

-- ============================================================
-- RLS: registros_acao (DROP old + CREATE new)
-- ============================================================

DROP POLICY IF EXISTS "AAPs can delete their own registros" ON public.registros_acao;
DROP POLICY IF EXISTS "AAPs can insert their own registros" ON public.registros_acao;
DROP POLICY IF EXISTS "AAPs can update their own registros" ON public.registros_acao;
DROP POLICY IF EXISTS "AAPs can view their own registros" ON public.registros_acao;
DROP POLICY IF EXISTS "Admins can manage registros" ON public.registros_acao;
DROP POLICY IF EXISTS "Gestores can delete registros by programa" ON public.registros_acao;
DROP POLICY IF EXISTS "Gestores can insert registros by programa" ON public.registros_acao;
DROP POLICY IF EXISTS "Gestores can update registros by programa" ON public.registros_acao;
DROP POLICY IF EXISTS "Gestores can view registros by programa" ON public.registros_acao;

CREATE POLICY "N1 Admins manage registros" ON public.registros_acao FOR ALL
USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "N2N3 Managers view registros" ON public.registros_acao FOR SELECT
USING ((public.is_gestor(auth.uid()) OR public.has_role(auth.uid(), 'n3_coordenador_programa'))
  AND registros_acao.programa IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.user_programas up WHERE up.user_id = auth.uid() AND up.programa::text = ANY(registros_acao.programa)));

CREATE POLICY "N2N3 Managers insert registros" ON public.registros_acao FOR INSERT
WITH CHECK ((public.is_gestor(auth.uid()) OR public.has_role(auth.uid(), 'n3_coordenador_programa'))
  AND registros_acao.programa IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.user_programas up WHERE up.user_id = auth.uid() AND up.programa::text = ANY(registros_acao.programa)));

CREATE POLICY "N2N3 Managers update registros" ON public.registros_acao FOR UPDATE
USING ((public.is_gestor(auth.uid()) OR public.has_role(auth.uid(), 'n3_coordenador_programa'))
  AND registros_acao.programa IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.user_programas up WHERE up.user_id = auth.uid() AND up.programa::text = ANY(registros_acao.programa)));

CREATE POLICY "N2N3 Managers delete registros" ON public.registros_acao FOR DELETE
USING ((public.is_gestor(auth.uid()) OR public.has_role(auth.uid(), 'n3_coordenador_programa'))
  AND registros_acao.programa IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.user_programas up WHERE up.user_id = auth.uid() AND up.programa::text = ANY(registros_acao.programa)));

CREATE POLICY "N4N5 Operational view registros" ON public.registros_acao FOR SELECT
USING (public.is_operational(auth.uid()) AND (registros_acao.aap_id = auth.uid() OR public.user_has_full_data_access(auth.uid(), registros_acao.escola_id, registros_acao.programa)));

CREATE POLICY "N4N5 Operational insert registros" ON public.registros_acao FOR INSERT
WITH CHECK (public.is_operational(auth.uid()) AND registros_acao.aap_id = auth.uid());

CREATE POLICY "N4N5 Operational update registros" ON public.registros_acao FOR UPDATE
USING (public.is_operational(auth.uid()) AND registros_acao.aap_id = auth.uid());

CREATE POLICY "N4N5 Operational delete registros" ON public.registros_acao FOR DELETE
USING (public.is_operational(auth.uid()) AND registros_acao.aap_id = auth.uid());

CREATE POLICY "N6N7 Local view registros" ON public.registros_acao FOR SELECT
USING (public.is_local_user(auth.uid()) AND public.user_has_entidade(auth.uid(), registros_acao.escola_id));

CREATE POLICY "N8 Observer view registros" ON public.registros_acao FOR SELECT
USING (public.is_observer(auth.uid()) AND registros_acao.programa IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.user_programas up WHERE up.user_id = auth.uid() AND up.programa::text = ANY(registros_acao.programa)));

-- ============================================================
-- RLS: presencas (DROP old + CREATE new)
-- ============================================================

DROP POLICY IF EXISTS "AAPs can delete presencas for their registros" ON public.presencas;
DROP POLICY IF EXISTS "AAPs can insert presencas for their registros" ON public.presencas;
DROP POLICY IF EXISTS "AAPs can update presencas for their registros" ON public.presencas;
DROP POLICY IF EXISTS "AAPs can view presencas of their registros" ON public.presencas;
DROP POLICY IF EXISTS "Admins can manage presencas" ON public.presencas;
DROP POLICY IF EXISTS "Gestores can delete presencas by programa" ON public.presencas;
DROP POLICY IF EXISTS "Gestores can insert presencas by programa" ON public.presencas;
DROP POLICY IF EXISTS "Gestores can update presencas by programa" ON public.presencas;
DROP POLICY IF EXISTS "Gestores can view presencas by programa" ON public.presencas;

CREATE POLICY "N1 Admins manage presencas" ON public.presencas FOR ALL
USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "N2N3 Managers view presencas" ON public.presencas FOR SELECT
USING ((public.is_gestor(auth.uid()) OR public.has_role(auth.uid(), 'n3_coordenador_programa'))
  AND EXISTS (SELECT 1 FROM public.registros_acao r JOIN public.user_programas up ON up.user_id = auth.uid()
    WHERE r.id = presencas.registro_acao_id AND r.programa IS NOT NULL AND up.programa::text = ANY(r.programa)));

CREATE POLICY "N2N3 Managers insert presencas" ON public.presencas FOR INSERT
WITH CHECK ((public.is_gestor(auth.uid()) OR public.has_role(auth.uid(), 'n3_coordenador_programa'))
  AND EXISTS (SELECT 1 FROM public.registros_acao r JOIN public.user_programas up ON up.user_id = auth.uid()
    WHERE r.id = presencas.registro_acao_id AND r.programa IS NOT NULL AND up.programa::text = ANY(r.programa)));

CREATE POLICY "N2N3 Managers update presencas" ON public.presencas FOR UPDATE
USING ((public.is_gestor(auth.uid()) OR public.has_role(auth.uid(), 'n3_coordenador_programa'))
  AND EXISTS (SELECT 1 FROM public.registros_acao r JOIN public.user_programas up ON up.user_id = auth.uid()
    WHERE r.id = presencas.registro_acao_id AND r.programa IS NOT NULL AND up.programa::text = ANY(r.programa)));

CREATE POLICY "N2N3 Managers delete presencas" ON public.presencas FOR DELETE
USING ((public.is_gestor(auth.uid()) OR public.has_role(auth.uid(), 'n3_coordenador_programa'))
  AND EXISTS (SELECT 1 FROM public.registros_acao r JOIN public.user_programas up ON up.user_id = auth.uid()
    WHERE r.id = presencas.registro_acao_id AND r.programa IS NOT NULL AND up.programa::text = ANY(r.programa)));

CREATE POLICY "N4N5 Operational view presencas" ON public.presencas FOR SELECT
USING (public.is_operational(auth.uid()) AND EXISTS (SELECT 1 FROM public.registros_acao r WHERE r.id = presencas.registro_acao_id AND r.aap_id = auth.uid()));

CREATE POLICY "N4N5 Operational insert presencas" ON public.presencas FOR INSERT
WITH CHECK (public.is_operational(auth.uid()) AND EXISTS (SELECT 1 FROM public.registros_acao r WHERE r.id = presencas.registro_acao_id AND r.aap_id = auth.uid()));

CREATE POLICY "N4N5 Operational update presencas" ON public.presencas FOR UPDATE
USING (public.is_operational(auth.uid()) AND EXISTS (SELECT 1 FROM public.registros_acao r WHERE r.id = presencas.registro_acao_id AND r.aap_id = auth.uid()));

CREATE POLICY "N4N5 Operational delete presencas" ON public.presencas FOR DELETE
USING (public.is_operational(auth.uid()) AND EXISTS (SELECT 1 FROM public.registros_acao r WHERE r.id = presencas.registro_acao_id AND r.aap_id = auth.uid()));

CREATE POLICY "N6N7 Local view presencas" ON public.presencas FOR SELECT
USING (public.is_local_user(auth.uid()) AND EXISTS (SELECT 1 FROM public.registros_acao r WHERE r.id = presencas.registro_acao_id AND public.user_has_entidade(auth.uid(), r.escola_id)));

CREATE POLICY "N8 Observer view presencas" ON public.presencas FOR SELECT
USING (public.is_observer(auth.uid()) AND EXISTS (SELECT 1 FROM public.registros_acao r JOIN public.user_programas up ON up.user_id = auth.uid()
  WHERE r.id = presencas.registro_acao_id AND r.programa IS NOT NULL AND up.programa::text = ANY(r.programa)));

-- ============================================================
-- RLS: avaliacoes_aula (DROP old + CREATE new)
-- ============================================================

DROP POLICY IF EXISTS "AAPs can delete their own avaliacoes" ON public.avaliacoes_aula;
DROP POLICY IF EXISTS "AAPs can insert their own avaliacoes" ON public.avaliacoes_aula;
DROP POLICY IF EXISTS "AAPs can update their own avaliacoes" ON public.avaliacoes_aula;
DROP POLICY IF EXISTS "AAPs can view their own avaliacoes" ON public.avaliacoes_aula;
DROP POLICY IF EXISTS "Admins can manage avaliacoes" ON public.avaliacoes_aula;
DROP POLICY IF EXISTS "Gestores can delete avaliacoes by programa" ON public.avaliacoes_aula;
DROP POLICY IF EXISTS "Gestores can insert avaliacoes by programa" ON public.avaliacoes_aula;
DROP POLICY IF EXISTS "Gestores can update avaliacoes by programa" ON public.avaliacoes_aula;
DROP POLICY IF EXISTS "Gestores can view avaliacoes by programa" ON public.avaliacoes_aula;

CREATE POLICY "N1 Admins manage avaliacoes" ON public.avaliacoes_aula FOR ALL
USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "N2N3 Managers view avaliacoes" ON public.avaliacoes_aula FOR SELECT
USING ((public.is_gestor(auth.uid()) OR public.has_role(auth.uid(), 'n3_coordenador_programa'))
  AND EXISTS (SELECT 1 FROM public.registros_acao r JOIN public.user_programas up ON up.user_id = auth.uid()
    WHERE r.id = avaliacoes_aula.registro_acao_id AND r.programa IS NOT NULL AND up.programa::text = ANY(r.programa)));

CREATE POLICY "N4N5 Operational view avaliacoes" ON public.avaliacoes_aula FOR SELECT
USING (public.is_operational(auth.uid()) AND avaliacoes_aula.aap_id = auth.uid());

CREATE POLICY "N4N5 Operational insert avaliacoes" ON public.avaliacoes_aula FOR INSERT
WITH CHECK (public.is_operational(auth.uid()) AND avaliacoes_aula.aap_id = auth.uid());

CREATE POLICY "N4N5 Operational update avaliacoes" ON public.avaliacoes_aula FOR UPDATE
USING (public.is_operational(auth.uid()) AND avaliacoes_aula.aap_id = auth.uid());

CREATE POLICY "N4N5 Operational delete avaliacoes" ON public.avaliacoes_aula FOR DELETE
USING (public.is_operational(auth.uid()) AND avaliacoes_aula.aap_id = auth.uid());

CREATE POLICY "N8 Observer view avaliacoes" ON public.avaliacoes_aula FOR SELECT
USING (public.is_observer(auth.uid()) AND EXISTS (SELECT 1 FROM public.registros_acao r JOIN public.user_programas up ON up.user_id = auth.uid()
  WHERE r.id = avaliacoes_aula.registro_acao_id AND r.programa IS NOT NULL AND up.programa::text = ANY(r.programa)));

-- ============================================================
-- RLS: profiles (add manager view)
-- ============================================================

CREATE POLICY "Managers can view all profiles" ON public.profiles FOR SELECT
USING (public.is_manager(auth.uid()));

-- ============================================================
-- RLS: user_roles (add manager view — drop duplicate if exists)
-- ============================================================

DROP POLICY IF EXISTS "Managers can view all roles" ON public.user_roles;
CREATE POLICY "Managers can view all roles" ON public.user_roles FOR SELECT
USING (public.is_manager(auth.uid()));
