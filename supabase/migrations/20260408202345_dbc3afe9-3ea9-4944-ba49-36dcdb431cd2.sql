ALTER TABLE public.programacoes
ADD COLUMN entidade_filho_id uuid REFERENCES public.entidades_filho(id) ON DELETE SET NULL;