
-- Drop the overly broad policy that grants all authenticated users access
DROP POLICY IF EXISTS "Require authentication for profiles" ON public.profiles;

-- The "Block anonymous access to profiles" restrictive policy with USING(false) 
-- is also problematic as it blocks ALL access including legitimate users.
-- Remove it since the remaining permissive policies already require auth.uid() checks.
DROP POLICY IF EXISTS "Block anonymous access to profiles" ON public.profiles;
