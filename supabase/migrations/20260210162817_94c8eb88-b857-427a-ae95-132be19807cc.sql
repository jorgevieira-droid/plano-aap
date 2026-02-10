
-- FASE 1a: Adicionar novos valores ao enum + criar tabelas + migrar dados
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'n3_coordenador_programa';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'n4_1_cped';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'n4_2_gpi';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'n5_formador';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'n6_coord_pedagogico';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'n7_professor';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'n8_equipe_tecnica';

-- Criar tabela unificada user_programas
CREATE TABLE IF NOT EXISTS public.user_programas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  programa public.programa_type NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, programa)
);
ALTER TABLE public.user_programas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_programas FORCE ROW LEVEL SECURITY;

-- Criar tabela unificada user_entidades
CREATE TABLE IF NOT EXISTS public.user_entidades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  escola_id uuid NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, escola_id)
);
ALTER TABLE public.user_entidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_entidades FORCE ROW LEVEL SECURITY;

-- Migrar dados
INSERT INTO public.user_programas (user_id, programa)
SELECT gestor_user_id, programa FROM public.gestor_programas
ON CONFLICT (user_id, programa) DO NOTHING;

INSERT INTO public.user_programas (user_id, programa)
SELECT aap_user_id, programa FROM public.aap_programas
ON CONFLICT (user_id, programa) DO NOTHING;

INSERT INTO public.user_entidades (user_id, escola_id)
SELECT aap_user_id, escola_id FROM public.aap_escolas
ON CONFLICT (user_id, escola_id) DO NOTHING;
