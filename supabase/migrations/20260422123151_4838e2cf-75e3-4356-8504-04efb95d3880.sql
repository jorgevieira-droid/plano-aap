ALTER TABLE public.programacoes
  ADD COLUMN IF NOT EXISTS apoio_componente text,
  ADD COLUMN IF NOT EXISTS apoio_etapa text,
  ADD COLUMN IF NOT EXISTS apoio_turma_voar text,
  ADD COLUMN IF NOT EXISTS apoio_escola_voar boolean,
  ADD COLUMN IF NOT EXISTS apoio_professor_id uuid,
  ADD COLUMN IF NOT EXISTS apoio_participantes text[],
  ADD COLUMN IF NOT EXISTS apoio_participantes_outros text,
  ADD COLUMN IF NOT EXISTS apoio_obs_planejada boolean,
  ADD COLUMN IF NOT EXISTS apoio_focos text[],
  ADD COLUMN IF NOT EXISTS apoio_devolutiva text;