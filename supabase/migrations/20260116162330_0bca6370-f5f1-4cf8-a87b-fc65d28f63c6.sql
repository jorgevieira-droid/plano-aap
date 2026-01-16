-- =================================================================
-- FIX PROFILES TABLE RLS POLICIES
-- Convert SELECT policies to PERMISSIVE for proper OR logic
-- =================================================================

-- Drop all existing SELECT policies on profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Gestores can view AAP profiles from programs" ON public.profiles;
DROP POLICY IF EXISTS "Deny anon access to profiles" ON public.profiles;

-- Create PERMISSIVE policies for SELECT (OR logic - any matching grants access)
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Gestores can view AAP profiles from programs"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  public.is_gestor(auth.uid()) AND EXISTS (
    SELECT 1 FROM public.gestor_programas gp
    JOIN public.aap_programas ap ON gp.programa = ap.programa
    WHERE gp.gestor_user_id = auth.uid() AND ap.aap_user_id = profiles.id
  )
);

-- Block anonymous access entirely (FOR ALL to anon with false)
CREATE POLICY "Block anonymous access to profiles"
ON public.profiles
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- =================================================================
-- FIX PROFESSORES TABLE RLS POLICIES
-- Convert SELECT policies to PERMISSIVE for proper OR logic
-- =================================================================

-- Drop existing SELECT policies on professores
DROP POLICY IF EXISTS "AAPs can view professores from assigned schools" ON public.professores;
DROP POLICY IF EXISTS "Gestores can view professores by programa" ON public.professores;
DROP POLICY IF EXISTS "Require authentication for professores" ON public.professores;
DROP POLICY IF EXISTS "Deny anonymous delete on professores" ON public.professores;
DROP POLICY IF EXISTS "Deny anonymous insert on professores" ON public.professores;
DROP POLICY IF EXISTS "Deny anonymous update on professores" ON public.professores;

-- Create PERMISSIVE policies for SELECT (OR logic - any matching grants access)
CREATE POLICY "Admins can view all professores"
ON public.professores
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "AAPs can view professores from assigned schools"
ON public.professores
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.aap_escolas ae
    WHERE ae.aap_user_id = auth.uid() AND ae.escola_id = professores.escola_id
  )
);

CREATE POLICY "Gestores can view professores by programa"
ON public.professores
FOR SELECT
TO authenticated
USING (
  public.is_gestor(auth.uid()) AND EXISTS (
    SELECT 1 FROM public.gestor_programas gp
    WHERE gp.gestor_user_id = auth.uid() 
      AND professores.programa IS NOT NULL 
      AND gp.programa::text = ANY(professores.programa::text[])
  )
);

-- Block anonymous access entirely (FOR ALL to anon with false)
CREATE POLICY "Block anonymous access to professores"
ON public.professores
FOR ALL
TO anon
USING (false)
WITH CHECK (false);