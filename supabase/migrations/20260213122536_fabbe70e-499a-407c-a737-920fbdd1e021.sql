
-- Step 1: Recreate profiles_directory view with SECURITY INVOKER
DROP VIEW IF EXISTS public.profiles_directory;

CREATE VIEW public.profiles_directory
WITH (security_invoker = on)
AS
SELECT p.id, p.nome
FROM public.profiles p;

-- Step 2: Add SELECT policies on profiles for lower-tier users (only id and nome will be exposed via the view)
-- N3 Coordinators can view profiles sharing same programs
CREATE POLICY "N3 Coord view profiles same programs"
ON public.profiles
FOR SELECT
USING (
  has_role(auth.uid(), 'n3_coordenador_programa'::app_role)
  AND shares_programa(auth.uid(), id)
);

-- N4/N5 Operational can view profiles sharing same entities
CREATE POLICY "N4N5 Operational view profiles same entities"
ON public.profiles
FOR SELECT
USING (
  is_operational(auth.uid())
  AND shares_entidade(auth.uid(), id)
);

-- N6/N7 Local can view profiles sharing same entities
CREATE POLICY "N6N7 Local view profiles same entities"
ON public.profiles
FOR SELECT
USING (
  is_local_user(auth.uid())
  AND shares_entidade(auth.uid(), id)
);

-- N8 Observer can view profiles sharing same programs
CREATE POLICY "N8 Observer view profiles same programs"
ON public.profiles
FOR SELECT
USING (
  is_observer(auth.uid())
  AND shares_programa(auth.uid(), id)
);
