CREATE TABLE public.user_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  accessed_at timestamptz NOT NULL DEFAULT now(),
  ip_address text
);

ALTER TABLE public.user_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage access_log" ON public.user_access_log
  FOR ALL TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Managers view access_log" ON public.user_access_log
  FOR SELECT TO authenticated
  USING (is_manager(auth.uid()));

CREATE POLICY "Users insert own access" ON public.user_access_log
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_user_access_log_user_id ON public.user_access_log (user_id);
CREATE INDEX idx_user_access_log_accessed_at ON public.user_access_log (accessed_at DESC);