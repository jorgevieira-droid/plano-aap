-- RPC: dias ativos por usuário (DAU agregado por usuário, histórico completo)
CREATE OR REPLACE FUNCTION public.get_dias_ativos_por_usuario()
RETURNS TABLE(user_id uuid, dias_ativos bigint, last_access timestamptz)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    l.user_id,
    COUNT(DISTINCT date_trunc('day', l.accessed_at))::bigint AS dias_ativos,
    MAX(l.accessed_at) AS last_access
  FROM public.user_access_log l
  GROUP BY l.user_id
$$;

-- RPC: rateio detalhado usuário × programa × mês (dias ativos)
CREATE OR REPLACE FUNCTION public.get_rateio_usuario_programa_mes(_inicio date, _fim date)
RETURNS TABLE(
  user_id uuid,
  nome text,
  email text,
  programa programa_type,
  mes date,
  dias_ativos bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    l.user_id,
    p.nome,
    p.email,
    up.programa,
    date_trunc('month', l.accessed_at)::date AS mes,
    COUNT(DISTINCT date_trunc('day', l.accessed_at))::bigint AS dias_ativos
  FROM public.user_access_log l
  JOIN public.profiles p ON p.id = l.user_id
  JOIN public.user_programas up ON up.user_id = l.user_id
  WHERE
    (_inicio IS NULL OR l.accessed_at >= _inicio)
    AND (_fim IS NULL OR l.accessed_at < (_fim + INTERVAL '1 day'))
    AND (
      public.has_role(auth.uid(), 'admin')
      OR public.has_role(auth.uid(), 'gestor')
      OR public.has_role(auth.uid(), 'n3_coordenador_programa')
    )
  GROUP BY l.user_id, p.nome, p.email, up.programa, date_trunc('month', l.accessed_at)
  ORDER BY mes, p.nome, up.programa
$$;