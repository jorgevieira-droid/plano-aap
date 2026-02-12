
-- Helper function: check if two users share at least one entidade
CREATE OR REPLACE FUNCTION public.shares_entidade(_viewer_id uuid, _target_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_entidades a
    JOIN public.user_entidades b ON a.escola_id = b.escola_id
    WHERE a.user_id = _viewer_id AND b.user_id = _target_id
  )
$$;

-- Helper function: check if two users share at least one programa
CREATE OR REPLACE FUNCTION public.shares_programa(_viewer_id uuid, _target_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_programas a
    JOIN public.user_programas b ON a.programa = b.programa
    WHERE a.user_id = _viewer_id AND b.user_id = _target_id
  )
$$;

-- profiles: Operational users can view profiles sharing entidades
CREATE POLICY "N4N5 Operational view profiles same entities"
ON public.profiles
FOR SELECT
USING (is_operational(auth.uid()) AND shares_entidade(auth.uid(), id));

-- profiles: Local users can view profiles sharing entidades
CREATE POLICY "N6N7 Local view profiles same entities"
ON public.profiles
FOR SELECT
USING (is_local_user(auth.uid()) AND shares_entidade(auth.uid(), id));

-- profiles: Observer users can view profiles sharing programas
CREATE POLICY "N8 Observer view profiles same programs"
ON public.profiles
FOR SELECT
USING (is_observer(auth.uid()) AND shares_programa(auth.uid(), id));

-- profiles: N3 Coordenador view profiles sharing programas
CREATE POLICY "N3 Coord view profiles same programs"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'n3_coordenador_programa') AND shares_programa(auth.uid(), id));

-- user_roles: Operational users can view roles sharing entidades
CREATE POLICY "N4N5 Operational view roles same entities"
ON public.user_roles
FOR SELECT
USING (is_operational(auth.uid()) AND shares_entidade(auth.uid(), user_id));

-- user_roles: Local users can view roles sharing entidades
CREATE POLICY "N6N7 Local view roles same entities"
ON public.user_roles
FOR SELECT
USING (is_local_user(auth.uid()) AND shares_entidade(auth.uid(), user_id));

-- user_roles: Observer users can view roles sharing programas
CREATE POLICY "N8 Observer view roles same programs"
ON public.user_roles
FOR SELECT
USING (is_observer(auth.uid()) AND shares_programa(auth.uid(), user_id));

-- user_roles: N3 Coordenador view roles sharing programas
CREATE POLICY "N3 Coord view roles same programs"
ON public.user_roles
FOR SELECT
USING (has_role(auth.uid(), 'n3_coordenador_programa') AND shares_programa(auth.uid(), user_id));
