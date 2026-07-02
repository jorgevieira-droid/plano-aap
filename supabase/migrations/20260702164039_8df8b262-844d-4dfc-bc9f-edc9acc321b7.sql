ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ativo boolean NOT NULL DEFAULT true;
CREATE INDEX IF NOT EXISTS idx_profiles_inativos ON public.profiles(id) WHERE ativo = false;