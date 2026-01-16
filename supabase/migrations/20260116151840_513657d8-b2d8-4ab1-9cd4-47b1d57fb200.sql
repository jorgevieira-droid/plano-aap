-- First, drop the problematic policies that might be allowing access
DROP POLICY IF EXISTS "Deny anonymous select on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Deny anonymous insert on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Deny anonymous update on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Deny anonymous delete on profiles" ON public.profiles;

-- Create proper policies that specifically deny access to the 'anon' role
-- These use PERMISSIVE policies with role targeting

-- For anon role - deny all operations
CREATE POLICY "Deny anon access to profiles"
ON public.profiles
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Force RLS even for table owner (prevents bypassing)
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;