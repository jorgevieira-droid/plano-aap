-- Recriar views com security_invoker=off (rodam como owner, bypassam RLS)
-- Continuam expondo APENAS colunas não-sensíveis
DROP VIEW IF EXISTS public.profiles_metabase CASCADE;
DROP VIEW IF EXISTS public.professores_metabase CASCADE;

CREATE VIEW public.profiles_metabase
WITH (security_invoker=off) AS
  SELECT id, nome, segmento, componente, created_at, updated_at
  FROM public.profiles;

CREATE VIEW public.professores_metabase
WITH (security_invoker=off) AS
  SELECT id, nome, escola_id, segmento, componente, ano_serie, cargo, 
         ativo, programa, turma_formacao, created_at, updated_at, data_desativacao
  FROM public.professores;

-- Garantir SELECT para o metabase_ro nas views
GRANT SELECT ON public.profiles_metabase TO metabase_ro;
GRANT SELECT ON public.professores_metabase TO metabase_ro;