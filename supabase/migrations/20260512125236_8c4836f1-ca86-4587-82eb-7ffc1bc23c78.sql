ALTER TABLE public.relatorios_monit_acoes_formativas
  ADD COLUMN IF NOT EXISTS observacoes text,
  ADD COLUMN IF NOT EXISTS avancos text,
  ADD COLUMN IF NOT EXISTS dificuldades text;

ALTER TABLE public.relatorios_monit_acoes_formativas
  ALTER COLUMN frente_trabalho DROP NOT NULL,
  ALTER COLUMN local_encontro DROP NOT NULL;