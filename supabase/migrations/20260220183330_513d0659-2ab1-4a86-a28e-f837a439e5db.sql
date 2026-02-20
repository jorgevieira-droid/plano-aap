
-- Adicionar 'nao_se_aplica' às constraints de segmento e componente
ALTER TABLE public.professores DROP CONSTRAINT IF EXISTS professores_segmento_check;
ALTER TABLE public.professores ADD CONSTRAINT professores_segmento_check
  CHECK (segmento = ANY (ARRAY[
    'anos_iniciais', 'anos_finais', 'ensino_medio', 'nao_se_aplica'
  ]));

ALTER TABLE public.professores DROP CONSTRAINT IF EXISTS professores_componente_check;
ALTER TABLE public.professores ADD CONSTRAINT professores_componente_check
  CHECK (componente = ANY (ARRAY[
    'polivalente', 'lingua_portuguesa', 'matematica', 'nao_se_aplica'
  ]));
