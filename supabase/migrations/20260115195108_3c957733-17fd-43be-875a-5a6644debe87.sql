-- Add policy requiring authentication for SELECT on profiles table
CREATE POLICY "Require authentication for profiles select" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL);