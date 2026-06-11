
CREATE TABLE public.narrative_report_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  programa text NOT NULL,
  form_type text NOT NULL,
  total_registros integer NOT NULL DEFAULT 0,
  prompt_tokens integer NOT NULL DEFAULT 0,
  completion_tokens integer NOT NULL DEFAULT 0,
  total_tokens integer NOT NULL DEFAULT 0,
  cost_usd numeric(12,6) NOT NULL DEFAULT 0,
  model text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.narrative_report_usage TO authenticated;
GRANT ALL ON public.narrative_report_usage TO service_role;

ALTER TABLE public.narrative_report_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "N1/N2/N3 can view narrative usage"
ON public.narrative_report_usage
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'gestor')
  OR public.has_role(auth.uid(), 'n3_coordenador_programa')
);

CREATE INDEX idx_nru_created_at ON public.narrative_report_usage (created_at);
CREATE INDEX idx_nru_programa ON public.narrative_report_usage (programa);

CREATE OR REPLACE FUNCTION public.get_custo_narrativos_por_mes_programa()
RETURNS TABLE(mes date, programa text, total_usd numeric, total_geracoes bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT date_trunc('month', created_at)::date AS mes,
         programa,
         SUM(cost_usd)::numeric AS total_usd,
         COUNT(*)::bigint AS total_geracoes
  FROM public.narrative_report_usage
  WHERE
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'gestor')
    OR public.has_role(auth.uid(), 'n3_coordenador_programa')
  GROUP BY 1, 2
  ORDER BY 1, 2;
$$;
