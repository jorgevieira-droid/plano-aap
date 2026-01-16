-- Drop existing SELECT policies on profiles that may be misconfigured
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Gestores can view AAP profiles from their programs" ON public.profiles;

-- Recreate policies as PERMISSIVE (default) with proper access control
-- Users can only view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Gestores can view AAP profiles from their assigned programs
CREATE POLICY "Gestores can view AAP profiles from programs"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  public.is_gestor(auth.uid()) AND EXISTS (
    SELECT 1 FROM gestor_programas gp
    JOIN aap_programas ap ON gp.programa = ap.programa
    WHERE gp.gestor_user_id = auth.uid() AND ap.aap_user_id = profiles.id
  )
);