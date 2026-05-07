ALTER TABLE public.observacoes_aula_redes ADD COLUMN IF NOT EXISTS registro_acao_id uuid;
CREATE UNIQUE INDEX IF NOT EXISTS observacoes_aula_redes_registro_acao_uniq
  ON public.observacoes_aula_redes(registro_acao_id)
  WHERE registro_acao_id IS NOT NULL;