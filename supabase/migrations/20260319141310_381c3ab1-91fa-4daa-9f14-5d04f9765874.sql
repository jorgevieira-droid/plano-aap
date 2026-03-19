CREATE POLICY "GPI can manage CPed entidades"
ON public.user_entidades
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'n4_2_gpi') AND
  has_role(user_id, 'n4_1_cped') AND
  shares_programa(auth.uid(), user_id)
)
WITH CHECK (
  has_role(auth.uid(), 'n4_2_gpi') AND
  has_role(user_id, 'n4_1_cped') AND
  shares_programa(auth.uid(), user_id)
);