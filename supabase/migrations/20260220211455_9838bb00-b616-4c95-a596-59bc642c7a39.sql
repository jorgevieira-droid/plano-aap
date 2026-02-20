
-- 1. Atualizar constraint de segmento em profiles para permitir novo valor
ALTER TABLE public.profiles 
  DROP CONSTRAINT IF EXISTS profiles_segmento_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_segmento_check 
    CHECK (segmento IS NULL OR segmento = ANY (ARRAY[
      'anos_iniciais', 'anos_finais', 'ensino_medio', 
      'anos_finais_ensino_medio', 'nao_se_aplica'
    ]));

-- 2. Adicionar coluna tipo_ator_presenca em programacoes
ALTER TABLE public.programacoes
  ADD COLUMN IF NOT EXISTS tipo_ator_presenca text DEFAULT 'todos';
