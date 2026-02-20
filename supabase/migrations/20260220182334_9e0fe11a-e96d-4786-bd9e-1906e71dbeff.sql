-- Fix professores_cargo_check constraint to include all supported cargo values
ALTER TABLE public.professores DROP CONSTRAINT IF EXISTS professores_cargo_check;

ALTER TABLE public.professores ADD CONSTRAINT professores_cargo_check
  CHECK (cargo = ANY (ARRAY[
    'professor'::text,
    'coordenador'::text,
    'vice_diretor'::text,
    'diretor'::text,
    'equipe_tecnica_sme'::text
  ]));