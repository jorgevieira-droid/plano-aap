-- Create programacoes table
CREATE TABLE public.programacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL CHECK (tipo IN ('formacao', 'visita', 'acompanhamento_aula')),
  titulo TEXT NOT NULL,
  descricao TEXT,
  data DATE NOT NULL,
  horario_inicio TIME NOT NULL,
  horario_fim TIME NOT NULL,
  escola_id UUID NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
  aap_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  segmento TEXT NOT NULL,
  componente TEXT NOT NULL,
  ano_serie TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'prevista' CHECK (status IN ('prevista', 'realizada', 'cancelada')),
  motivo_cancelamento TEXT,
  programa TEXT[] DEFAULT ARRAY['escolas'],
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create registros_acao table
CREATE TABLE public.registros_acao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  programacao_id UUID REFERENCES public.programacoes(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('formacao', 'visita', 'acompanhamento_aula')),
  data DATE NOT NULL,
  escola_id UUID NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
  aap_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  segmento TEXT NOT NULL,
  componente TEXT NOT NULL,
  ano_serie TEXT NOT NULL,
  turma TEXT,
  observacoes TEXT,
  avancos TEXT,
  dificuldades TEXT,
  programa TEXT[] DEFAULT ARRAY['escolas'],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create presencas table
CREATE TABLE public.presencas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  registro_acao_id UUID NOT NULL REFERENCES public.registros_acao(id) ON DELETE CASCADE,
  professor_id UUID NOT NULL REFERENCES public.professores(id) ON DELETE CASCADE,
  presente BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create avaliacoes_aula table for acompanhamento_aula
CREATE TABLE public.avaliacoes_aula (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  registro_acao_id UUID NOT NULL REFERENCES public.registros_acao(id) ON DELETE CASCADE,
  professor_id UUID NOT NULL REFERENCES public.professores(id) ON DELETE CASCADE,
  escola_id UUID NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
  aap_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  clareza_objetivos INTEGER NOT NULL DEFAULT 3 CHECK (clareza_objetivos BETWEEN 1 AND 5),
  dominio_conteudo INTEGER NOT NULL DEFAULT 3 CHECK (dominio_conteudo BETWEEN 1 AND 5),
  estrategias_didaticas INTEGER NOT NULL DEFAULT 3 CHECK (estrategias_didaticas BETWEEN 1 AND 5),
  engajamento_turma INTEGER NOT NULL DEFAULT 3 CHECK (engajamento_turma BETWEEN 1 AND 5),
  gestao_tempo INTEGER NOT NULL DEFAULT 3 CHECK (gestao_tempo BETWEEN 1 AND 5),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.programacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registros_acao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presencas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avaliacoes_aula ENABLE ROW LEVEL SECURITY;

-- Programacoes policies
CREATE POLICY "Admins can manage programacoes" ON public.programacoes FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Gestores can manage programacoes" ON public.programacoes FOR ALL USING (is_gestor(auth.uid()));
CREATE POLICY "AAPs can view their own programacoes" ON public.programacoes FOR SELECT USING (aap_id = auth.uid());
CREATE POLICY "AAPs can update their own programacoes" ON public.programacoes FOR UPDATE USING (aap_id = auth.uid());

-- Registros policies
CREATE POLICY "Admins can manage registros" ON public.registros_acao FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Gestores can manage registros" ON public.registros_acao FOR ALL USING (is_gestor(auth.uid()));
CREATE POLICY "AAPs can view their own registros" ON public.registros_acao FOR SELECT USING (aap_id = auth.uid());
CREATE POLICY "AAPs can insert their own registros" ON public.registros_acao FOR INSERT WITH CHECK (aap_id = auth.uid());
CREATE POLICY "AAPs can update their own registros" ON public.registros_acao FOR UPDATE USING (aap_id = auth.uid());

-- Presencas policies
CREATE POLICY "Admins can manage presencas" ON public.presencas FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Gestores can manage presencas" ON public.presencas FOR ALL USING (is_gestor(auth.uid()));
CREATE POLICY "AAPs can view presencas of their registros" ON public.presencas FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.registros_acao r WHERE r.id = registro_acao_id AND r.aap_id = auth.uid()));
CREATE POLICY "AAPs can insert presencas for their registros" ON public.presencas FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.registros_acao r WHERE r.id = registro_acao_id AND r.aap_id = auth.uid()));

-- Avaliacoes policies
CREATE POLICY "Admins can manage avaliacoes" ON public.avaliacoes_aula FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Gestores can manage avaliacoes" ON public.avaliacoes_aula FOR ALL USING (is_gestor(auth.uid()));
CREATE POLICY "AAPs can view their own avaliacoes" ON public.avaliacoes_aula FOR SELECT USING (aap_id = auth.uid());
CREATE POLICY "AAPs can insert their own avaliacoes" ON public.avaliacoes_aula FOR INSERT WITH CHECK (aap_id = auth.uid());

-- Create triggers for updated_at
CREATE TRIGGER update_programacoes_updated_at BEFORE UPDATE ON public.programacoes 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_registros_updated_at BEFORE UPDATE ON public.registros_acao 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();