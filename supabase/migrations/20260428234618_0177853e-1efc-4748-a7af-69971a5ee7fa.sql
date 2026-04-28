-- Make Metabase views run with the querying role, avoiding owner-bypass behavior
CREATE OR REPLACE VIEW public.profiles_metabase
WITH (security_invoker = true) AS
SELECT
  id,
  nome,
  segmento,
  componente,
  created_at,
  updated_at
FROM public.profiles;

CREATE OR REPLACE VIEW public.professores_metabase
WITH (security_invoker = true) AS
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

-- Keep broad direct access revoked, then allow only the safe columns required by the reporting views
REVOKE SELECT ON TABLE public.profiles FROM metabase_ro;
REVOKE SELECT ON TABLE public.professores FROM metabase_ro;

GRANT SELECT (id, nome, segmento, componente, created_at, updated_at)
ON public.profiles TO metabase_ro;

GRANT SELECT (id, nome, escola_id, segmento, componente, ano_serie, cargo, ativo, programa, turma_formacao, created_at, updated_at, data_desativacao)
ON public.professores TO metabase_ro;

GRANT SELECT ON TABLE public.profiles_metabase TO metabase_ro;
GRANT SELECT ON TABLE public.professores_metabase TO metabase_ro;

-- Allow the direct Metabase database role to pass RLS for safe reporting reads
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'Metabase can read safe profile columns via view'
  ) THEN
    CREATE POLICY "Metabase can read safe profile columns via view"
    ON public.profiles
    FOR SELECT
    TO metabase_ro
    USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'professores'
      AND policyname = 'Metabase can read safe professor columns via view'
  ) THEN
    CREATE POLICY "Metabase can read safe professor columns via view"
    ON public.professores
    FOR SELECT
    TO metabase_ro
    USING (true);
  END IF;
END $$;