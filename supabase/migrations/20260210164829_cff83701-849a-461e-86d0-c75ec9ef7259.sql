
-- Fix security: Add authentication-required policies to tables missing them

-- profiles: block anonymous access
CREATE POLICY "Block anonymous access to profiles"
ON public.profiles FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- notion_sync_config: require authentication
CREATE POLICY "Require authentication notion_sync_config"
ON public.notion_sync_config FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- notion_sync_log: require authentication
CREATE POLICY "Require authentication notion_sync_log"
ON public.notion_sync_log FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- registros_alteracoes: require authentication
CREATE POLICY "Require authentication registros_alteracoes"
ON public.registros_alteracoes FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);
