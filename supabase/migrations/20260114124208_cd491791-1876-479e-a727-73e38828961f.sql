-- Adicionar política para AAPs poderem criar suas próprias programações
CREATE POLICY "AAPs can insert their own programacoes"
ON public.programacoes
FOR INSERT
TO authenticated
WITH CHECK (aap_id = auth.uid());

-- Adicionar política para AAPs poderem deletar suas próprias programações
CREATE POLICY "AAPs can delete their own programacoes"
ON public.programacoes
FOR DELETE
TO authenticated
USING (aap_id = auth.uid());