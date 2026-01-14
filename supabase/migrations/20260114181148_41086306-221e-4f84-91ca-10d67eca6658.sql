-- Drop policies that are incorrectly using 'public' role instead of 'authenticated'
DROP POLICY IF EXISTS "Gestores can view AAP profiles from their programs" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Recreate policies with proper 'authenticated' role restriction
CREATE POLICY "Gestores can view AAP profiles from their programs" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  is_gestor(auth.uid()) AND EXISTS (
    SELECT 1 FROM gestor_programas gp
    JOIN aap_programas ap ON gp.programa = ap.programa
    WHERE gp.gestor_user_id = auth.uid() AND ap.aap_user_id = profiles.id
  )
);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);