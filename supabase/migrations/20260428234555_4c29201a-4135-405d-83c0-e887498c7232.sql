-- Ensure the Metabase read-only role can use the public schema and reporting objects
GRANT USAGE ON SCHEMA public TO metabase_ro;

-- Base reporting tables needed by Metabase questions
GRANT SELECT ON TABLE public.escolas TO metabase_ro;
GRANT SELECT ON TABLE public.registros_acao TO metabase_ro;

-- Keep sensitive base people tables unavailable directly to Metabase
REVOKE SELECT ON TABLE public.profiles FROM metabase_ro;
REVOKE SELECT ON TABLE public.professores FROM metabase_ro;

-- Recreate safe reporting views as owner-executed views so Metabase only needs access to the view
CREATE OR REPLACE VIEW public.profiles_metabase
WITH (security_invoker = false) AS
SELECT
  id,
  nome,
  segmento,
  componente,
  created_at,
  updated_at
FROM public.profiles;

CREATE OR REPLACE VIEW public.professores_metabase
WITH (security_invoker = false) AS
SELECT
  id,
  nome,
  escola_id,
  segmento,
  componente,
  ano_serie,
  cargo,
  ativo,
  programa,
  turma_formacao,
  created_at,
  updated_at,
  data_desativacao
FROM public.professores;

GRANT SELECT ON TABLE public.profiles_metabase TO metabase_ro;
GRANT SELECT ON TABLE public.professores_metabase TO metabase_ro;

-- Allow the direct Metabase database role to read rows despite application RLS rules based on auth.uid()
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'escolas'
      AND policyname = 'Metabase can read escolas'
  ) THEN
    CREATE POLICY "Metabase can read escolas"
    ON public.escolas
    FOR SELECT
    TO metabase_ro
    USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'registros_acao'
      AND policyname = 'Metabase can read registros_acao'
  ) THEN
    CREATE POLICY "Metabase can read registros_acao"
    ON public.registros_acao
    FOR SELECT
    TO metabase_ro
    USING (true);
  END IF;
END $$;