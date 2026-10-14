-- Liberar escrita de valores manuais para N3 (n3_coordenador_programa)
DROP POLICY IF EXISTS "Admin/gestor write manual values" ON public.consultoria_valores_manuais;

CREATE POLICY "Managers write manual values"
  ON public.consultoria_valores_manuais
  FOR ALL
  TO authenticated
  USING (is_manager(auth.uid()))
  WITH CHECK (is_manager(auth.uid()));
