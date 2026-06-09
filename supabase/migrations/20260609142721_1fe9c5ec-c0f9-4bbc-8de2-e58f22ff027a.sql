CREATE OR REPLACE FUNCTION public.get_acessos_por_usuario()
RETURNS TABLE(user_id uuid, total bigint, last_access timestamptz)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id, COUNT(*)::bigint AS total, MAX(accessed_at) AS last_access
  FROM public.user_access_log
  GROUP BY user_id
$$;

GRANT EXECUTE ON FUNCTION public.get_acessos_por_usuario() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_acessos_por_usuario() TO service_role;