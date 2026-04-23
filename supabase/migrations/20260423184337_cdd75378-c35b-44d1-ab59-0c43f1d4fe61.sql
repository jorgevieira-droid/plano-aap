ALTER TABLE public.consultoria_pedagogica_respostas
  ADD COLUMN IF NOT EXISTS aulas_obs_tutor_lp integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS aulas_obs_tutor_mat integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS obs_aula_parceria_coord_extra integer DEFAULT 0;