
-- ============================================================
-- 1. profiles: remover policy ALL ampla
-- ============================================================
DROP POLICY IF EXISTS "Block anonymous access to profiles" ON public.profiles;

-- ============================================================
-- 2. user_roles: remover SELECT amplo
-- ============================================================
DROP POLICY IF EXISTS "Require authentication to access user_roles" ON public.user_roles;

-- ============================================================
-- 3. registros_alteracoes: remover ALL amplo (mantém INSERT scoped + SELECTs)
-- ============================================================
DROP POLICY IF EXISTS "Require authentication registros_alteracoes" ON public.registros_alteracoes;

-- ============================================================
-- 4. notion_sync_config: restringir gestores ao próprio programa
-- ============================================================
DROP POLICY IF EXISTS "Gestores can view notion_sync_config" ON public.notion_sync_config;
CREATE POLICY "Gestores can view scoped notion_sync_config"
ON public.notion_sync_config
FOR SELECT
USING (
  is_gestor(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.user_programas up_self
    JOIN public.user_programas up_target
      ON up_self.programa = up_target.programa
    WHERE up_self.user_id = auth.uid()
      AND up_target.user_id = notion_sync_config.system_user_id
  )
);

-- ============================================================
-- 5. professores: remover policy SELECT ampla do metabase_ro
--    (acesso já é feito via view public.professores_metabase)
-- ============================================================
DROP POLICY IF EXISTS "Metabase can read safe professor columns via view" ON public.professores;

-- ============================================================
-- 6. observacoes_aula_redes: substituir policy ALL ampla
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can manage observacoes_aula_redes" ON public.observacoes_aula_redes;

CREATE POLICY "N1 Admins manage observacoes_aula_redes"
ON public.observacoes_aula_redes
FOR ALL TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "N2N3 Managers manage observacoes_aula_redes redes"
ON public.observacoes_aula_redes
FOR ALL TO authenticated
USING (
  (is_gestor(auth.uid()) OR has_role(auth.uid(), 'n3_coordenador_programa'::app_role))
  AND EXISTS (
    SELECT 1 FROM public.user_programas up
    WHERE up.user_id = auth.uid()
      AND up.programa = 'redes_municipais'::programa_type
  )
)
WITH CHECK (
  (is_gestor(auth.uid()) OR has_role(auth.uid(), 'n3_coordenador_programa'::app_role))
  AND EXISTS (
    SELECT 1 FROM public.user_programas up
    WHERE up.user_id = auth.uid()
      AND up.programa = 'redes_municipais'::programa_type
  )
);

CREATE POLICY "N4N5 Operational manage observacoes_aula_redes via acao"
ON public.observacoes_aula_redes
FOR ALL TO authenticated
USING (
  is_operational(auth.uid())
  AND registro_acao_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.registros_acao r
    WHERE r.id = observacoes_aula_redes.registro_acao_id
      AND user_has_full_data_access(auth.uid(), r.escola_id, r.programa)
  )
)
WITH CHECK (
  is_operational(auth.uid())
  AND registro_acao_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.registros_acao r
    WHERE r.id = observacoes_aula_redes.registro_acao_id
      AND user_has_full_data_access(auth.uid(), r.escola_id, r.programa)
  )
);

-- ============================================================
-- 7. relatorios_eteg_redes: substituir policy ALL ampla
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can manage relatorios_eteg_redes" ON public.relatorios_eteg_redes;

CREATE POLICY "N1 Admins manage relatorios_eteg_redes"
ON public.relatorios_eteg_redes
FOR ALL TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Redes program users manage relatorios_eteg_redes"
ON public.relatorios_eteg_redes
FOR ALL TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.user_programas up
    WHERE up.user_id = auth.uid()
      AND up.programa = 'redes_municipais'::programa_type
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.user_programas up
    WHERE up.user_id = auth.uid()
      AND up.programa = 'redes_municipais'::programa_type
  )
);

-- ============================================================
-- 8. relatorios_professor_redes: substituir policy ALL ampla
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can manage relatorios_professor_redes" ON public.relatorios_professor_redes;

CREATE POLICY "N1 Admins manage relatorios_professor_redes"
ON public.relatorios_professor_redes
FOR ALL TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Redes program users manage relatorios_professor_redes"
ON public.relatorios_professor_redes
FOR ALL TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.user_programas up
    WHERE up.user_id = auth.uid()
      AND up.programa = 'redes_municipais'::programa_type
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.user_programas up
    WHERE up.user_id = auth.uid()
      AND up.programa = 'redes_municipais'::programa_type
  )
);

-- ============================================================
-- 9. relatorios_monitoramento_gestao: substituir policy ALL ampla
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can manage relatorios_monitoramento_gestao" ON public.relatorios_monitoramento_gestao;

CREATE POLICY "N1 Admins manage relatorios_monitoramento_gestao"
ON public.relatorios_monitoramento_gestao
FOR ALL TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "N2N3 Managers view relatorios_monitoramento_gestao"
ON public.relatorios_monitoramento_gestao
FOR SELECT TO authenticated
USING (
  (is_gestor(auth.uid()) OR has_role(auth.uid(), 'n3_coordenador_programa'::app_role))
  AND EXISTS (
    SELECT 1 FROM public.registros_acao r
    JOIN public.user_programas up ON up.user_id = auth.uid()
    WHERE r.id = relatorios_monitoramento_gestao.registro_acao_id
      AND r.programa IS NOT NULL
      AND (up.programa)::text = ANY (r.programa)
  )
);

CREATE POLICY "N4N5 Operational manage relatorios_monitoramento_gestao"
ON public.relatorios_monitoramento_gestao
FOR ALL TO authenticated
USING (
  is_operational(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.registros_acao r
    WHERE r.id = relatorios_monitoramento_gestao.registro_acao_id
      AND user_has_full_data_access(auth.uid(), r.escola_id, r.programa)
  )
)
WITH CHECK (
  is_operational(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.registros_acao r
    WHERE r.id = relatorios_monitoramento_gestao.registro_acao_id
      AND user_has_full_data_access(auth.uid(), r.escola_id, r.programa)
  )
);
