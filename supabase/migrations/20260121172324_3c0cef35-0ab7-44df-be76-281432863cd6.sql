-- Add INSERT, UPDATE, DELETE policies for AAPs on professores table
-- AAPs should be able to manage professores from their assigned schools

-- AAPs can insert professores in their assigned schools
CREATE POLICY "AAPs can insert professores in assigned schools"
ON public.professores
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.aap_escolas ae
    JOIN public.user_roles ur ON ur.user_id = auth.uid()
    WHERE ae.aap_user_id = auth.uid()
      AND ae.escola_id = professores.escola_id
      AND ur.role IN ('aap_inicial', 'aap_portugues', 'aap_matematica')
  )
);

-- AAPs can update professores in their assigned schools
CREATE POLICY "AAPs can update professores in assigned schools"
ON public.professores
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.aap_escolas ae
    JOIN public.user_roles ur ON ur.user_id = auth.uid()
    WHERE ae.aap_user_id = auth.uid()
      AND ae.escola_id = professores.escola_id
      AND ur.role IN ('aap_inicial', 'aap_portugues', 'aap_matematica')
  )
);

-- AAPs can delete professores in their assigned schools
CREATE POLICY "AAPs can delete professores in assigned schools"
ON public.professores
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.aap_escolas ae
    JOIN public.user_roles ur ON ur.user_id = auth.uid()
    WHERE ae.aap_user_id = auth.uid()
      AND ae.escola_id = professores.escola_id
      AND ur.role IN ('aap_inicial', 'aap_portugues', 'aap_matematica')
  )
);