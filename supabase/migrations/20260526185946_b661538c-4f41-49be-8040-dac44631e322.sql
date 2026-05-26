ALTER TABLE public.programacoes ADD COLUMN IF NOT EXISTS componente_formacao_redes text;
ALTER TABLE public.registros_acao ADD COLUMN IF NOT EXISTS componente_formacao_redes text;
ALTER TABLE public.relatorios_professor_redes DROP COLUMN IF EXISTS componente_formacao_redes;