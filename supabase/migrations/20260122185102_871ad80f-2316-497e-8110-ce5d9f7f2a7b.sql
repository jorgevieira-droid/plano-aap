-- Drop the current AAPs policy that allows viewing all escolas
DROP POLICY IF EXISTS "AAPs can view escolas" ON public.escolas;

-- Create a new policy that filters escolas by AAP's assigned schools
CREATE POLICY "AAPs can view their assigned escolas" 
ON public.escolas 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1
    FROM aap_escolas ae
    JOIN user_roles ur ON (ur.user_id = auth.uid())
    WHERE ae.aap_user_id = auth.uid() 
      AND ae.escola_id = escolas.id
      AND ur.role = ANY (ARRAY['aap_inicial'::app_role, 'aap_portugues'::app_role, 'aap_matematica'::app_role])
  )
);