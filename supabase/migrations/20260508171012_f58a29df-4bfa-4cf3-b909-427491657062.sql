ALTER TABLE public.professores
  ADD COLUMN IF NOT EXISTS entidade_filho_id uuid REFERENCES public.entidades_filho(id) ON DELETE SET NULL;

ALTER TABLE public.escolas
  ADD COLUMN IF NOT EXISTS uso_interno boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_escolas_uso_interno ON public.escolas(uso_interno) WHERE uso_interno = true;
CREATE INDEX IF NOT EXISTS idx_professores_entidade_filho ON public.professores(entidade_filho_id);