
ALTER TABLE public.programacoes ADD COLUMN IF NOT EXISTS modalidade text;
ALTER TABLE public.registros_acao ADD COLUMN IF NOT EXISTS modalidade text;
