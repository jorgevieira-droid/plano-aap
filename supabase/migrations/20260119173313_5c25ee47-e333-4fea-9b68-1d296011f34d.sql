-- ============================================================
-- FIX: Convert profiles RLS policies from RESTRICTIVE to PERMISSIVE
-- Problem: All RESTRICTIVE policies use AND logic, so no user can access data
-- Solution: Use PERMISSIVE (OR logic) for valid access, keep RESTRICTIVE for blocking anon
-- ============================================================

-- Drop existing profiles SELECT policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Block anonymous access to profiles" ON public.profiles;

-- Recreate as PERMISSIVE policies (OR logic - any matching condition grants access)
CREATE POLICY "Users can view own profile"
ON public.profiles
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Keep the anonymous blocking as RESTRICTIVE (defense in depth)
-- This is applied in addition to the REVOKE we did earlier
CREATE POLICY "Block anonymous access to profiles"
ON public.profiles
AS RESTRICTIVE
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Ensure UPDATE policies are also PERMISSIVE for proper access
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;

CREATE POLICY "Users can update their own profile"
ON public.profiles
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update profiles"
ON public.profiles
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Ensure INSERT and DELETE for admins are PERMISSIVE
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

CREATE POLICY "Admins can insert profiles"
ON public.profiles
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete profiles"
ON public.profiles
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Also ensure regular users can insert their own profile (for new user signup)
CREATE POLICY "Users can insert their own profile"
ON public.profiles
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);