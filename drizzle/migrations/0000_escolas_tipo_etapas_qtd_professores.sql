ALTER TABLE public.escolas
  ADD COLUMN IF NOT EXISTS tipo text,
  ADD COLUMN IF NOT EXISTS etapas text[],
  ADD COLUMN IF NOT EXISTS qtd_professores_categoria jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.escolas ADD CONSTRAINT escolas_tipo_check CHECK (tipo IS NULL OR tipo IN ('PEI','Parcial'));

CREATE TABLE public.consultoria_valores_manuais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  programa text NOT NULL DEFAULT 'escolas',
  mes date NOT NULL,
  metrica text NOT NULL,
  valor integer NOT NULL DEFAULT 0,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (programa, mes, metrica)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.consultoria_valores_manuais TO authenticated;
GRANT ALL ON public.consultoria_valores_manuais TO service_role;
ALTER TABLE public.consultoria_valores_manuais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Managers read manual values" ON public.consultoria_valores_manuais FOR SELECT TO authenticated USING (public.is_manager(auth.uid()));
CREATE POLICY "Admin/gestor write manual values" ON public.consultoria_valores_manuais FOR ALL TO authenticated USING (public.is_admin_or_gestor(auth.uid())) WITH CHECK (public.is_admin_or_gestor(auth.uid()));