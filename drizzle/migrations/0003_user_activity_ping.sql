CREATE TABLE public.user_activity_ping (
  user_id uuid NOT NULL,
  bloco timestamptz NOT NULL,
  PRIMARY KEY (user_id, bloco)
);
GRANT SELECT ON public.user_activity_ping TO authenticated;
GRANT ALL ON public.user_activity_ping TO service_role;
ALTER TABLE public.user_activity_ping ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Managers view activity" ON public.user_activity_ping FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_manager(auth.uid()));

CREATE OR REPLACE FUNCTION public.log_activity_ping()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;
  INSERT INTO public.user_activity_ping (user_id, bloco)
  VALUES (auth.uid(), to_timestamp(floor(extract(epoch from now()) / 300) * 300))
  ON CONFLICT DO NOTHING;
END; $$;
REVOKE ALL ON FUNCTION public.log_activity_ping() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_activity_ping() TO authenticated;

CREATE OR REPLACE FUNCTION public.get_tempo_ativo_por_dia(_inicio date, _fim date)
RETURNS TABLE(user_id uuid, dia date, minutos bigint, primeiro timestamptz, ultimo timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT p.user_id, (p.bloco AT TIME ZONE 'America/Sao_Paulo')::date,
         (COUNT(*) * 5)::bigint, MIN(p.bloco), MAX(p.bloco) + interval '5 minutes'
  FROM public.user_activity_ping p
  WHERE (p.bloco AT TIME ZONE 'America/Sao_Paulo')::date BETWEEN _inicio AND _fim
    AND (public.is_manager(auth.uid()) OR public.is_operational(auth.uid()) OR p.user_id = auth.uid())
  GROUP BY 1, 2;
$$;
REVOKE ALL ON FUNCTION public.get_tempo_ativo_por_dia(date, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_tempo_ativo_por_dia(date, date) TO authenticated;