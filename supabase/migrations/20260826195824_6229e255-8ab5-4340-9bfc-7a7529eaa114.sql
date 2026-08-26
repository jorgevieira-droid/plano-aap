DROP VIEW IF EXISTS public.profiles_directory;

CREATE VIEW public.profiles_directory
WITH (security_invoker=on) AS
  SELECT p.id, p.nome, p.ativo
  FROM public.profiles p;

GRANT SELECT ON public.profiles_directory TO authenticated;