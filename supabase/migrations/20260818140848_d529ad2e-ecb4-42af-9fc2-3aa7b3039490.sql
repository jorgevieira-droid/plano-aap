ALTER TABLE public.relatorios_visita_tecnica_microciclos
  ADD COLUMN IF NOT EXISTS q_frequencia_semanal text,
  ADD COLUMN IF NOT EXISTS q_frequencia_semanal_outro text,
  ADD COLUMN IF NOT EXISTS q_horas_aula text,
  ADD COLUMN IF NOT EXISTS q_horas_aula_outro text,
  ADD COLUMN IF NOT EXISTS q_material_didatico_multi text[],
  ADD COLUMN IF NOT EXISTS q_material_didatico_outro text,
  ADD COLUMN IF NOT EXISTS q_cp_consulta_trajetoria text,
  ADD COLUMN IF NOT EXISTS q_professores_consultam_trajetoria text,
  ADD COLUMN IF NOT EXISTS q_caminhada_pedagogica text,
  ADD COLUMN IF NOT EXISTS q_professor_modelo text;