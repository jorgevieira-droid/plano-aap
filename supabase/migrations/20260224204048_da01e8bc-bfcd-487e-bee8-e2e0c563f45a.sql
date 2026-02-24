ALTER TABLE public.programacoes
  ADD COLUMN projeto_notion text DEFAULT NULL,
  ADD COLUMN local text DEFAULT NULL;