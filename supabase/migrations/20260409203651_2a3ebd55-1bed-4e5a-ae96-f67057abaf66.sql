ALTER TABLE public.programacoes
  ADD COLUMN IF NOT EXISTS frente_trabalho text,
  ADD COLUMN IF NOT EXISTS publico_encontro text[],
  ADD COLUMN IF NOT EXISTS local_encontro text,
  ADD COLUMN IF NOT EXISTS local_escolas text[],
  ADD COLUMN IF NOT EXISTS local_outro text,
  ADD COLUMN IF NOT EXISTS fechamento text,
  ADD COLUMN IF NOT EXISTS encaminhamentos text;