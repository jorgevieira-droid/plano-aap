
DROP POLICY IF EXISTS "Admins can manage notion_sync_config" ON public.notion_sync_config;
DROP POLICY IF EXISTS "Gestores can view scoped notion_sync_config" ON public.notion_sync_config;

CREATE POLICY "Admins can manage notion_sync_config"
ON public.notion_sync_config
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Gestores can view scoped notion_sync_config"
ON public.notion_sync_config
FOR SELECT
TO authenticated
USING (is_gestor(auth.uid()) AND (EXISTS (
  SELECT 1
  FROM user_programas up_self
  JOIN user_programas up_target ON up_self.programa = up_target.programa
  WHERE up_self.user_id = auth.uid()
    AND up_target.user_id = notion_sync_config.system_user_id
)));

DROP POLICY IF EXISTS "Admins can manage notion_sync_log" ON public.notion_sync_log;
DROP POLICY IF EXISTS "Gestores can view notion_sync_log" ON public.notion_sync_log;

CREATE POLICY "Admins can manage notion_sync_log"
ON public.notion_sync_log
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Gestores can view notion_sync_log"
ON public.notion_sync_log
FOR SELECT
TO authenticated
USING (is_gestor(auth.uid()));
