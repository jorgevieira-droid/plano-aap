
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS segmento text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS componente text DEFAULT NULL;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_segmento_check 
    CHECK (segmento IS NULL OR segmento = ANY (ARRAY[
      'anos_iniciais', 'anos_finais', 'ensino_medio', 'nao_se_aplica'
    ]));

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_componente_check 
    CHECK (componente IS NULL OR componente = ANY (ARRAY[
      'polivalente', 'lingua_portuguesa', 'matematica', 'nao_se_aplica'
    ]));
