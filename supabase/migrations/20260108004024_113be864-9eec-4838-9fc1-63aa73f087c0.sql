-- Create table for edit logs
CREATE TABLE public.registros_alteracoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tabela TEXT NOT NULL,
  registro_id UUID NOT NULL,
  usuario_id UUID NOT NULL,
  alteracao JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.registros_alteracoes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can view all alteracoes" 
ON public.registros_alteracoes 
FOR SELECT 
USING (is_admin(auth.uid()));

CREATE POLICY "Gestores can view all alteracoes" 
ON public.registros_alteracoes 
FOR SELECT 
USING (is_gestor(auth.uid()));

CREATE POLICY "Users can view their own alteracoes" 
ON public.registros_alteracoes 
FOR SELECT 
USING (auth.uid() = usuario_id);

CREATE POLICY "Authenticated users can insert alteracoes" 
ON public.registros_alteracoes 
FOR INSERT 
WITH CHECK (auth.uid() = usuario_id);

-- AAPs can now update their own registros
CREATE POLICY "AAPs can delete their own registros" 
ON public.registros_acao 
FOR DELETE 
USING (aap_id = auth.uid());

-- AAPs can update their avaliacoes
CREATE POLICY "AAPs can update their own avaliacoes" 
ON public.avaliacoes_aula 
FOR UPDATE 
USING (aap_id = auth.uid());

-- AAPs can update presencas for their registros
CREATE POLICY "AAPs can update presencas for their registros" 
ON public.presencas 
FOR UPDATE 
USING (EXISTS ( SELECT 1
   FROM registros_acao r
  WHERE ((r.id = presencas.registro_acao_id) AND (r.aap_id = auth.uid()))));

-- AAPs can delete presencas for their registros  
CREATE POLICY "AAPs can delete presencas for their registros" 
ON public.presencas 
FOR DELETE 
USING (EXISTS ( SELECT 1
   FROM registros_acao r
  WHERE ((r.id = presencas.registro_acao_id) AND (r.aap_id = auth.uid()))));

-- AAPs can delete avaliacoes
CREATE POLICY "AAPs can delete their own avaliacoes" 
ON public.avaliacoes_aula 
FOR DELETE 
USING (aap_id = auth.uid());