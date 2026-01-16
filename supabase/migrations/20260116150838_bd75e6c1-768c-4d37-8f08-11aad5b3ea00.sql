-- Add a base authentication requirement policy for professores table
-- This ensures that unauthenticated users cannot access teacher data

-- First, let's check if there are any permissive policies that might allow public access
-- and add a restrictive policy requiring authentication

-- Create a policy that requires authentication for all SELECT operations
-- This will work alongside existing policies (admin, gestor, AAP can still access based on their rules)
CREATE POLICY "Require authentication for professores"
ON public.professores
FOR SELECT
TO anon
USING (false);

-- Also add explicit denial for anonymous INSERT/UPDATE/DELETE
CREATE POLICY "Deny anonymous insert on professores"
ON public.professores
FOR INSERT
TO anon
WITH CHECK (false);

CREATE POLICY "Deny anonymous update on professores"
ON public.professores
FOR UPDATE
TO anon
USING (false);

CREATE POLICY "Deny anonymous delete on professores"
ON public.professores
FOR DELETE
TO anon
USING (false);