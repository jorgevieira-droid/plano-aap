
-- 1. Create a directory view that only exposes non-sensitive fields (id, nome)
-- Uses security_invoker=false so it runs as owner (bypasses RLS on base table)
-- Access control is enforced via WHERE clause instead
CREATE OR REPLACE VIEW public.profiles_directory AS
  SELECT p.id, p.nome
  FROM public.profiles p
  WHERE
    p.id = auth.uid()
    OR is_admin(auth.uid())
    OR is_manager(auth.uid())
    OR (has_role(auth.uid(), 'n3_coordenador_programa') AND shares_programa(auth.uid(), p.id))
    OR (is_operational(auth.uid()) AND shares_entidade(auth.uid(), p.id))
    OR (is_local_user(auth.uid()) AND shares_entidade(auth.uid(), p.id))
    OR (is_observer(auth.uid()) AND shares_programa(auth.uid(), p.id));

-- Grant SELECT on view to authenticated users
GRANT SELECT ON public.profiles_directory TO authenticated;

-- 2. Drop N3-N8 SELECT policies from base profiles table
-- These exposed email/phone to lower-tier users
DROP POLICY IF EXISTS "N3 Coord view profiles same programs" ON public.profiles;
DROP POLICY IF EXISTS "N4N5 Operational view profiles same entities" ON public.profiles;
DROP POLICY IF EXISTS "N6N7 Local view profiles same entities" ON public.profiles;
DROP POLICY IF EXISTS "N8 Observer view profiles same programs" ON public.profiles;
