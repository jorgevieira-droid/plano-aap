CREATE OR REPLACE FUNCTION public.log_daily_access()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user uuid := auth.uid();
BEGIN
  IF v_user IS NULL THEN
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.user_access_log
    WHERE user_id = v_user
      AND (accessed_at AT TIME ZONE 'America/Sao_Paulo')::date
          = (now() AT TIME ZONE 'America/Sao_Paulo')::date
  ) THEN
    RETURN;
  END IF;

  INSERT INTO public.user_access_log (user_id) VALUES (v_user);
END;
$$;

REVOKE ALL ON FUNCTION public.log_daily_access() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_daily_access() TO authenticated;

CREATE INDEX IF NOT EXISTS idx_user_access_log_user_date
  ON public.user_access_log (user_id, accessed_at DESC);