CREATE OR REPLACE FUNCTION public.get_acessos_por_mes_programa()
RETURNS TABLE (mes date, programa programa_type, total bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    date_trunc('month', l.accessed_at)::date AS mes,
    up.programa,
    COUNT(*)::bigint AS total
  FROM public.user_access_log l
  JOIN public.user_programas up ON up.user_id = l.user_id
  GROUP BY 1, 2
  ORDER BY 1, 2;
$$;

REVOKE ALL ON FUNCTION public.get_acessos_por_mes_programa() FROM public;
GRANT EXECUTE ON FUNCTION public.get_acessos_por_mes_programa() TO authenticated;