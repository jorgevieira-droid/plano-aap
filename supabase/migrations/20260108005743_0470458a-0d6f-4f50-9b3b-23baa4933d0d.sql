-- Remove políticas conflitantes de programacoes
DROP POLICY IF EXISTS "Admins can manage programacoes" ON public.programacoes;
DROP POLICY IF EXISTS "Gestores can manage programacoes" ON public.programacoes;
DROP POLICY IF EXISTS "Admins can insert programacoes" ON public.programacoes;
DROP POLICY IF EXISTS "Gestores can insert programacoes" ON public.programacoes;
DROP POLICY IF EXISTS "AAPs can view their own programacoes" ON public.programacoes;
DROP POLICY IF EXISTS "AAPs can update their own programacoes" ON public.programacoes;

-- Recriar políticas PERMISSIVE (default) para programacoes
-- SELECT
CREATE POLICY "Admins can view all programacoes" 
ON public.programacoes 
FOR SELECT 
USING (is_admin(auth.uid()));

CREATE POLICY "Gestores can view all programacoes" 
ON public.programacoes 
FOR SELECT 
USING (is_gestor(auth.uid()));

CREATE POLICY "AAPs can view their own programacoes" 
ON public.programacoes 
FOR SELECT 
USING (aap_id = auth.uid());

-- INSERT
CREATE POLICY "Admins can insert programacoes" 
ON public.programacoes 
FOR INSERT 
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Gestores can insert programacoes" 
ON public.programacoes 
FOR INSERT 
WITH CHECK (is_gestor(auth.uid()));

-- UPDATE
CREATE POLICY "Admins can update programacoes" 
ON public.programacoes 
FOR UPDATE 
USING (is_admin(auth.uid()));

CREATE POLICY "Gestores can update programacoes" 
ON public.programacoes 
FOR UPDATE 
USING (is_gestor(auth.uid()));

CREATE POLICY "AAPs can update their own programacoes" 
ON public.programacoes 
FOR UPDATE 
USING (aap_id = auth.uid());

-- DELETE
CREATE POLICY "Admins can delete programacoes" 
ON public.programacoes 
FOR DELETE 
USING (is_admin(auth.uid()));

CREATE POLICY "Gestores can delete programacoes" 
ON public.programacoes 
FOR DELETE 
USING (is_gestor(auth.uid()));