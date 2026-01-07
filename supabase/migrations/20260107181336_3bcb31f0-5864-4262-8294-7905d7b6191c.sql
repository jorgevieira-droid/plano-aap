-- Create enum for programs
CREATE TYPE public.programa_type AS ENUM ('escolas', 'regionais', 'redes_municipais');

-- Add programa column to escolas table
ALTER TABLE public.escolas 
ADD COLUMN programa programa_type[] DEFAULT ARRAY['escolas']::programa_type[];

-- Add programa column to professores table
ALTER TABLE public.professores 
ADD COLUMN programa programa_type[] DEFAULT ARRAY['escolas']::programa_type[];

-- Create table for AAP program assignments
CREATE TABLE public.aap_programas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  aap_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  programa programa_type NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(aap_user_id, programa)
);

-- Enable RLS on aap_programas
ALTER TABLE public.aap_programas ENABLE ROW LEVEL SECURITY;

-- RLS policies for aap_programas
CREATE POLICY "Admins can manage aap_programas" 
ON public.aap_programas 
FOR ALL 
USING (is_admin(auth.uid()));

CREATE POLICY "Gestores can manage aap_programas" 
ON public.aap_programas 
FOR ALL 
USING (is_gestor(auth.uid()));

CREATE POLICY "Users can view their own programas" 
ON public.aap_programas 
FOR SELECT 
USING (auth.uid() = aap_user_id);

-- Create index for performance
CREATE INDEX idx_aap_programas_user ON public.aap_programas(aap_user_id);
CREATE INDEX idx_escolas_programa ON public.escolas USING GIN(programa);
CREATE INDEX idx_professores_programa ON public.professores USING GIN(programa);