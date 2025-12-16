-- Create helper function to check if user is gestor
CREATE OR REPLACE FUNCTION public.is_gestor(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'gestor'
  )
$$;

-- Create helper function to check if user is admin or gestor
CREATE OR REPLACE FUNCTION public.is_admin_or_gestor(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'gestor')
  )
$$;

-- Update profiles policies to allow gestor to view all profiles
CREATE POLICY "Gestores can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (is_gestor(auth.uid()));

-- Allow gestores to manage aap_escolas
CREATE POLICY "Gestores can manage escola assignments" 
ON public.aap_escolas 
FOR ALL 
USING (is_gestor(auth.uid()));

CREATE POLICY "Gestores can view all escola assignments" 
ON public.aap_escolas 
FOR SELECT 
USING (is_gestor(auth.uid()));

-- Allow gestores to view escolas (but not modify)
CREATE POLICY "Gestores can view escolas" 
ON public.escolas 
FOR SELECT 
USING (is_gestor(auth.uid()));