ALTER TABLE public.relatorios_visita_tecnica_microciclos
  ADD COLUMN IF NOT EXISTS q1_organizacao_rotina_outro TEXT,
  ADD COLUMN IF NOT EXISTS q8_material_didatico TEXT,
  ADD COLUMN IF NOT EXISTS q14_aulas_ultimos_30_dias INTEGER;