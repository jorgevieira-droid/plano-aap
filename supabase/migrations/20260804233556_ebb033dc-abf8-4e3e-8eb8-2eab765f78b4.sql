
-- 1) Safe views (column-restricted) for the BI read-only role
CREATE OR REPLACE VIEW public.metabase_profiles AS
SELECT id, nome, segmento, componente, ativo, created_at, updated_at
FROM public.profiles;

CREATE OR REPLACE VIEW public.metabase_escolas AS
SELECT id, nome, codesc, cod_inep, ativa, programa, uso_interno, created_at
FROM public.escolas;

CREATE OR REPLACE VIEW public.metabase_registros_acao AS
SELECT id, programacao_id, tipo, data, escola_id, aap_id, segmento, componente,
       ano_serie, turma, programa, status, reagendada_para, is_reagendada, tags,
       formacao_origem_id, projeto, componente_formacao_redes, modalidade,
       entidade_filho_id, created_at, updated_at
FROM public.registros_acao;

-- 2) Remove all direct base-table access from the BI role
REVOKE ALL ON public.profiles FROM metabase_ro;
REVOKE ALL ON public.escolas FROM metabase_ro;
REVOKE ALL ON public.registros_acao FROM metabase_ro;

DROP POLICY IF EXISTS "Metabase can read safe profile columns" ON public.profiles;
DROP POLICY IF EXISTS "Metabase can read escolas" ON public.escolas;
DROP POLICY IF EXISTS "Metabase can read registros_acao" ON public.registros_acao;

-- 3) Grant read access only to the safe views
GRANT SELECT ON public.metabase_profiles TO metabase_ro;
GRANT SELECT ON public.metabase_escolas TO metabase_ro;
GRANT SELECT ON public.metabase_registros_acao TO metabase_ro;

-- Keep views out of the public Data API roles
REVOKE ALL ON public.metabase_profiles FROM anon, authenticated;
REVOKE ALL ON public.metabase_escolas FROM anon, authenticated;
REVOKE ALL ON public.metabase_registros_acao FROM anon, authenticated;
