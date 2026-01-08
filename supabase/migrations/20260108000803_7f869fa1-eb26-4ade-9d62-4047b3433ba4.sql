-- Drop the restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Users can view their own escola assignments" ON public.aap_escolas;
DROP POLICY IF EXISTS "Admins can view all escola assignments" ON public.aap_escolas;
DROP POLICY IF EXISTS "Gestores can view all escola assignments" ON public.aap_escolas;
DROP POLICY IF EXISTS "Admins can manage escola assignments" ON public.aap_escolas;
DROP POLICY IF EXISTS "Gestores can manage escola assignments" ON public.aap_escolas;

-- Create permissive SELECT policies (user can see if ANY of these match)
CREATE POLICY "Users can view their own escola assignments"
ON public.aap_escolas
FOR SELECT
USING (auth.uid() = aap_user_id);

CREATE POLICY "Admins can view all escola assignments"
ON public.aap_escolas
FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Gestores can view all escola assignments"
ON public.aap_escolas
FOR SELECT
USING (is_gestor(auth.uid()));

-- Create permissive management policies for admin and gestor
CREATE POLICY "Admins can insert escola assignments"
ON public.aap_escolas
FOR INSERT
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update escola assignments"
ON public.aap_escolas
FOR UPDATE
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete escola assignments"
ON public.aap_escolas
FOR DELETE
USING (is_admin(auth.uid()));

CREATE POLICY "Gestores can insert escola assignments"
ON public.aap_escolas
FOR INSERT
WITH CHECK (is_gestor(auth.uid()));

CREATE POLICY "Gestores can update escola assignments"
ON public.aap_escolas
FOR UPDATE
USING (is_gestor(auth.uid()));

CREATE POLICY "Gestores can delete escola assignments"
ON public.aap_escolas
FOR DELETE
USING (is_gestor(auth.uid()));