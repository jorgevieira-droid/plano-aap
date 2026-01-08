-- Fix: Add INSERT policy for admins and gestores on programacoes
CREATE POLICY "Admins can insert programacoes" 
ON public.programacoes 
FOR INSERT 
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Gestores can insert programacoes" 
ON public.programacoes 
FOR INSERT 
WITH CHECK (is_gestor(auth.uid()));