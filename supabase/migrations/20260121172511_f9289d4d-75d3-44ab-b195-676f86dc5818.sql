-- ============================================================
-- FIX: Strengthen RLS policies for profiles and professores tables
-- Ensure proper authentication checks and role validation
-- ============================================================

-- PROFILES TABLE: Ensure the SELECT policy for users is properly scoped
-- Drop and recreate with explicit role targeting

-- First, verify the existing policies work correctly by making them more explicit
-- The current policies target 'authenticated' role which is correct

-- Add an additional RESTRICTIVE policy to ensure auth.uid() is always checked
DROP POLICY IF EXISTS "Require authentication for profiles" ON public.profiles;

CREATE POLICY "Require authentication for profiles"
ON public.profiles
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- PROFESSORES TABLE: Add RESTRICTIVE policy to ensure auth is always required
DROP POLICY IF EXISTS "Require authentication for professores" ON public.professores;

CREATE POLICY "Require authentication for professores"
ON public.professores
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Make the AAPs SELECT policy more restrictive to only their assigned programs
DROP POLICY IF EXISTS "AAPs can view professores from assigned schools" ON public.professores;

CREATE POLICY "AAPs can view professores from assigned schools"
ON public.professores
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.aap_escolas ae
    JOIN public.user_roles ur ON ur.user_id = auth.uid()
    WHERE ae.aap_user_id = auth.uid()
      AND ae.escola_id = professores.escola_id
      AND ur.role IN ('aap_inicial', 'aap_portugues', 'aap_matematica')
  )
);