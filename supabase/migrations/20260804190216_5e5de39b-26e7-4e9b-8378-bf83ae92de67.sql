-- Restrict BI reporting role (metabase_ro) to non-sensitive columns only

-- PROFILES: remove PII (email, telefone) from BI reach
REVOKE ALL ON public.profiles FROM metabase_ro;
GRANT SELECT (id, nome, segmento, componente, ativo, created_at, updated_at) ON public.profiles TO metabase_ro;

DROP POLICY IF EXISTS "Metabase can read safe profile columns via view" ON public.profiles;
CREATE POLICY "Metabase can read safe profile columns"
ON public.profiles FOR SELECT TO metabase_ro USING (true);

-- ESCOLAS: remove address from BI reach
REVOKE ALL ON public.escolas FROM metabase_ro;
GRANT SELECT (id, nome, codesc, cod_inep, ativa, programa, uso_interno, created_at) ON public.escolas TO metabase_ro;

-- REGISTROS_ACAO: remove free-text narrative fields from BI reach
REVOKE ALL ON public.registros_acao FROM metabase_ro;
GRANT SELECT (
  id, programacao_id, tipo, data, escola_id, aap_id, segmento, componente, ano_serie,
  turma, programa, created_at, updated_at, status, reagendada_para, is_reagendada, tags,
  formacao_origem_id, projeto, componente_formacao_redes, modalidade, entidade_filho_id
) ON public.registros_acao TO metabase_ro;