-- 1. Notion sync config: drop gestor SELECT access (PII)
DROP POLICY IF EXISTS "Gestores can view scoped notion_sync_config" ON public.notion_sync_config;

-- 2. Add owner column to redes report tables
ALTER TABLE public.relatorios_eteg_redes
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.relatorios_professor_redes
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- 3. Replace permissive ALL policies with scoped policies
DROP POLICY IF EXISTS "Redes program users manage relatorios_eteg_redes" ON public.relatorios_eteg_redes;
DROP POLICY IF EXISTS "Redes program users manage relatorios_professor_redes" ON public.relatorios_professor_redes;

-- relatorios_eteg_redes
CREATE POLICY "Redes users can view eteg reports"
  ON public.relatorios_eteg_redes FOR SELECT TO authenticated
  USING (user_has_programa(auth.uid(), 'redes_municipais'));

CREATE POLICY "Redes users can insert own eteg reports"
  ON public.relatorios_eteg_redes FOR INSERT TO authenticated
  WITH CHECK (
    user_has_programa(auth.uid(), 'redes_municipais')
    AND (created_by IS NULL OR created_by = auth.uid())
  );

CREATE POLICY "Owners can update own eteg reports"
  ON public.relatorios_eteg_redes FOR UPDATE TO authenticated
  USING (created_by = auth.uid() AND user_has_programa(auth.uid(), 'redes_municipais'))
  WITH CHECK (created_by = auth.uid() AND user_has_programa(auth.uid(), 'redes_municipais'));

CREATE POLICY "Owners can delete own eteg reports"
  ON public.relatorios_eteg_redes FOR DELETE TO authenticated
  USING (created_by = auth.uid() AND user_has_programa(auth.uid(), 'redes_municipais'));

-- relatorios_professor_redes
CREATE POLICY "Redes users can view professor reports"
  ON public.relatorios_professor_redes FOR SELECT TO authenticated
  USING (user_has_programa(auth.uid(), 'redes_municipais'));

CREATE POLICY "Redes users can insert own professor reports"
  ON public.relatorios_professor_redes FOR INSERT TO authenticated
  WITH CHECK (
    user_has_programa(auth.uid(), 'redes_municipais')
    AND (created_by IS NULL OR created_by = auth.uid())
  );

CREATE POLICY "Owners can update own professor reports"
  ON public.relatorios_professor_redes FOR UPDATE TO authenticated
  USING (created_by = auth.uid() AND user_has_programa(auth.uid(), 'redes_municipais'))
  WITH CHECK (created_by = auth.uid() AND user_has_programa(auth.uid(), 'redes_municipais'));

CREATE POLICY "Owners can delete own professor reports"
  ON public.relatorios_professor_redes FOR DELETE TO authenticated
  USING (created_by = auth.uid() AND user_has_programa(auth.uid(), 'redes_municipais'));
