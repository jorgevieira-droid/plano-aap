
-- Add tags column to programacoes
ALTER TABLE public.programacoes ADD COLUMN tags text[] DEFAULT NULL;

-- Add tags column to registros_acao
ALTER TABLE public.registros_acao ADD COLUMN tags text[] DEFAULT NULL;
