-- Create professores table
CREATE TABLE public.professores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  escola_id UUID NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
  segmento TEXT NOT NULL CHECK (segmento IN ('anos_iniciais', 'anos_finais', 'ensino_medio')),
  componente TEXT NOT NULL CHECK (componente IN ('polivalente', 'lingua_portuguesa', 'matematica')),
  ano_serie TEXT NOT NULL,
  cargo TEXT NOT NULL CHECK (cargo IN ('professor', 'coordenador')),
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.professores ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage professores" 
ON public.professores 
FOR ALL 
USING (is_admin(auth.uid()));

-- Gestores can manage professores
CREATE POLICY "Gestores can manage professores" 
ON public.professores 
FOR ALL 
USING (is_gestor(auth.uid()));

-- AAPs can view professores from their schools
CREATE POLICY "AAPs can view professores from assigned schools" 
ON public.professores 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.aap_escolas 
    WHERE aap_escolas.aap_user_id = auth.uid() 
    AND aap_escolas.escola_id = professores.escola_id
  )
);

-- Everyone authenticated can view professores (for selection in forms)
CREATE POLICY "Authenticated users can view professores" 
ON public.professores 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Trigger for updated_at
CREATE TRIGGER update_professores_updated_at
BEFORE UPDATE ON public.professores
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_professores_escola_id ON public.professores(escola_id);
CREATE INDEX idx_professores_segmento ON public.professores(segmento);
CREATE INDEX idx_professores_componente ON public.professores(componente);