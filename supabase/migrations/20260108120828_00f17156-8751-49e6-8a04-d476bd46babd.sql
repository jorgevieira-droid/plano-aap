-- Criar função para verificar se o gestor tem acesso ao programa
CREATE OR REPLACE FUNCTION public.gestor_has_programa(_user_id uuid, _programa text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.gestor_programas
    WHERE gestor_user_id = _user_id
      AND programa::text = _programa
  )
$$;

-- Criar função para verificar se gestor pode ver escola baseado no programa
CREATE OR REPLACE FUNCTION public.gestor_can_view_escola(_user_id uuid, _escola_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.gestor_programas gp
    JOIN public.escolas e ON e.programa IS NOT NULL AND gp.programa::text = ANY(e.programa::text[])
    WHERE gp.gestor_user_id = _user_id
      AND e.id = _escola_id
  )
$$;

-- Criar função para verificar se gestor pode ver professor baseado no programa
CREATE OR REPLACE FUNCTION public.gestor_can_view_professor(_user_id uuid, _professor_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.gestor_programas gp
    JOIN public.professores p ON p.programa IS NOT NULL AND gp.programa::text = ANY(p.programa::text[])
    WHERE gp.gestor_user_id = _user_id
      AND p.id = _professor_id
  )
$$;

-- Criar função para verificar se gestor pode ver registro baseado no programa
CREATE OR REPLACE FUNCTION public.gestor_can_view_registro(_user_id uuid, _registro_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.gestor_programas gp
    JOIN public.registros_acao r ON r.programa IS NOT NULL AND gp.programa::text = ANY(r.programa::text[])
    WHERE gp.gestor_user_id = _user_id
      AND r.id = _registro_id
  )
$$;

-- Criar função para verificar se gestor pode ver programação baseado no programa
CREATE OR REPLACE FUNCTION public.gestor_can_view_programacao(_user_id uuid, _programacao_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.gestor_programas gp
    JOIN public.programacoes p ON p.programa IS NOT NULL AND gp.programa::text = ANY(p.programa::text[])
    WHERE gp.gestor_user_id = _user_id
      AND p.id = _programacao_id
  )
$$;

-- Atualizar RLS policies para escolas - gestores só veem escolas do seu programa
DROP POLICY IF EXISTS "Gestores can view escolas" ON public.escolas;
CREATE POLICY "Gestores can view escolas by programa" 
ON public.escolas 
FOR SELECT 
USING (
  is_gestor(auth.uid()) AND (
    -- Se gestor não tem programa atribuído, não vê nada
    NOT EXISTS (SELECT 1 FROM public.gestor_programas WHERE gestor_user_id = auth.uid())
    OR
    -- Gestor vê escolas cujo programa inclui algum dos seus programas
    EXISTS (
      SELECT 1 FROM public.gestor_programas gp
      WHERE gp.gestor_user_id = auth.uid()
        AND escolas.programa IS NOT NULL
        AND gp.programa::text = ANY(escolas.programa::text[])
    )
  )
);

-- Atualizar RLS policies para professores - gestores só gerenciam professores do seu programa
DROP POLICY IF EXISTS "Gestores can manage professores" ON public.professores;
CREATE POLICY "Gestores can view professores by programa" 
ON public.professores 
FOR SELECT 
USING (
  is_gestor(auth.uid()) AND (
    NOT EXISTS (SELECT 1 FROM public.gestor_programas WHERE gestor_user_id = auth.uid())
    OR
    EXISTS (
      SELECT 1 FROM public.gestor_programas gp
      WHERE gp.gestor_user_id = auth.uid()
        AND professores.programa IS NOT NULL
        AND gp.programa::text = ANY(professores.programa::text[])
    )
  )
);

CREATE POLICY "Gestores can insert professores by programa" 
ON public.professores 
FOR INSERT 
WITH CHECK (
  is_gestor(auth.uid()) AND (
    EXISTS (
      SELECT 1 FROM public.gestor_programas gp
      WHERE gp.gestor_user_id = auth.uid()
        AND professores.programa IS NOT NULL
        AND gp.programa::text = ANY(professores.programa::text[])
    )
  )
);

CREATE POLICY "Gestores can update professores by programa" 
ON public.professores 
FOR UPDATE 
USING (
  is_gestor(auth.uid()) AND (
    EXISTS (
      SELECT 1 FROM public.gestor_programas gp
      WHERE gp.gestor_user_id = auth.uid()
        AND professores.programa IS NOT NULL
        AND gp.programa::text = ANY(professores.programa::text[])
    )
  )
);

CREATE POLICY "Gestores can delete professores by programa" 
ON public.professores 
FOR DELETE 
USING (
  is_gestor(auth.uid()) AND (
    EXISTS (
      SELECT 1 FROM public.gestor_programas gp
      WHERE gp.gestor_user_id = auth.uid()
        AND professores.programa IS NOT NULL
        AND gp.programa::text = ANY(professores.programa::text[])
    )
  )
);

-- Atualizar RLS policies para registros_acao - gestores só gerenciam registros do seu programa
DROP POLICY IF EXISTS "Gestores can manage registros" ON public.registros_acao;
CREATE POLICY "Gestores can view registros by programa" 
ON public.registros_acao 
FOR SELECT 
USING (
  is_gestor(auth.uid()) AND (
    NOT EXISTS (SELECT 1 FROM public.gestor_programas WHERE gestor_user_id = auth.uid())
    OR
    EXISTS (
      SELECT 1 FROM public.gestor_programas gp
      WHERE gp.gestor_user_id = auth.uid()
        AND registros_acao.programa IS NOT NULL
        AND gp.programa::text = ANY(registros_acao.programa::text[])
    )
  )
);

CREATE POLICY "Gestores can insert registros by programa" 
ON public.registros_acao 
FOR INSERT 
WITH CHECK (
  is_gestor(auth.uid()) AND (
    EXISTS (
      SELECT 1 FROM public.gestor_programas gp
      WHERE gp.gestor_user_id = auth.uid()
        AND registros_acao.programa IS NOT NULL
        AND gp.programa::text = ANY(registros_acao.programa::text[])
    )
  )
);

CREATE POLICY "Gestores can update registros by programa" 
ON public.registros_acao 
FOR UPDATE 
USING (
  is_gestor(auth.uid()) AND (
    EXISTS (
      SELECT 1 FROM public.gestor_programas gp
      WHERE gp.gestor_user_id = auth.uid()
        AND registros_acao.programa IS NOT NULL
        AND gp.programa::text = ANY(registros_acao.programa::text[])
    )
  )
);

CREATE POLICY "Gestores can delete registros by programa" 
ON public.registros_acao 
FOR DELETE 
USING (
  is_gestor(auth.uid()) AND (
    EXISTS (
      SELECT 1 FROM public.gestor_programas gp
      WHERE gp.gestor_user_id = auth.uid()
        AND registros_acao.programa IS NOT NULL
        AND gp.programa::text = ANY(registros_acao.programa::text[])
    )
  )
);

-- Atualizar RLS policies para programacoes - gestores só gerenciam programações do seu programa
DROP POLICY IF EXISTS "Gestores can view all programacoes" ON public.programacoes;
DROP POLICY IF EXISTS "Gestores can insert programacoes" ON public.programacoes;
DROP POLICY IF EXISTS "Gestores can update programacoes" ON public.programacoes;
DROP POLICY IF EXISTS "Gestores can delete programacoes" ON public.programacoes;

CREATE POLICY "Gestores can view programacoes by programa" 
ON public.programacoes 
FOR SELECT 
USING (
  is_gestor(auth.uid()) AND (
    NOT EXISTS (SELECT 1 FROM public.gestor_programas WHERE gestor_user_id = auth.uid())
    OR
    EXISTS (
      SELECT 1 FROM public.gestor_programas gp
      WHERE gp.gestor_user_id = auth.uid()
        AND programacoes.programa IS NOT NULL
        AND gp.programa::text = ANY(programacoes.programa::text[])
    )
  )
);

CREATE POLICY "Gestores can insert programacoes by programa" 
ON public.programacoes 
FOR INSERT 
WITH CHECK (
  is_gestor(auth.uid()) AND (
    EXISTS (
      SELECT 1 FROM public.gestor_programas gp
      WHERE gp.gestor_user_id = auth.uid()
        AND programacoes.programa IS NOT NULL
        AND gp.programa::text = ANY(programacoes.programa::text[])
    )
  )
);

CREATE POLICY "Gestores can update programacoes by programa" 
ON public.programacoes 
FOR UPDATE 
USING (
  is_gestor(auth.uid()) AND (
    EXISTS (
      SELECT 1 FROM public.gestor_programas gp
      WHERE gp.gestor_user_id = auth.uid()
        AND programacoes.programa IS NOT NULL
        AND gp.programa::text = ANY(programacoes.programa::text[])
    )
  )
);

CREATE POLICY "Gestores can delete programacoes by programa" 
ON public.programacoes 
FOR DELETE 
USING (
  is_gestor(auth.uid()) AND (
    EXISTS (
      SELECT 1 FROM public.gestor_programas gp
      WHERE gp.gestor_user_id = auth.uid()
        AND programacoes.programa IS NOT NULL
        AND gp.programa::text = ANY(programacoes.programa::text[])
    )
  )
);

-- Atualizar RLS policies para avaliacoes_aula - gestores só gerenciam avaliações do seu programa
DROP POLICY IF EXISTS "Gestores can manage avaliacoes" ON public.avaliacoes_aula;
CREATE POLICY "Gestores can view avaliacoes by programa" 
ON public.avaliacoes_aula 
FOR SELECT 
USING (
  is_gestor(auth.uid()) AND (
    EXISTS (
      SELECT 1 FROM public.gestor_programas gp
      JOIN public.registros_acao r ON r.id = avaliacoes_aula.registro_acao_id
      WHERE gp.gestor_user_id = auth.uid()
        AND r.programa IS NOT NULL
        AND gp.programa::text = ANY(r.programa::text[])
    )
  )
);

CREATE POLICY "Gestores can insert avaliacoes by programa" 
ON public.avaliacoes_aula 
FOR INSERT 
WITH CHECK (
  is_gestor(auth.uid()) AND (
    EXISTS (
      SELECT 1 FROM public.gestor_programas gp
      JOIN public.registros_acao r ON r.id = avaliacoes_aula.registro_acao_id
      WHERE gp.gestor_user_id = auth.uid()
        AND r.programa IS NOT NULL
        AND gp.programa::text = ANY(r.programa::text[])
    )
  )
);

CREATE POLICY "Gestores can update avaliacoes by programa" 
ON public.avaliacoes_aula 
FOR UPDATE 
USING (
  is_gestor(auth.uid()) AND (
    EXISTS (
      SELECT 1 FROM public.gestor_programas gp
      JOIN public.registros_acao r ON r.id = avaliacoes_aula.registro_acao_id
      WHERE gp.gestor_user_id = auth.uid()
        AND r.programa IS NOT NULL
        AND gp.programa::text = ANY(r.programa::text[])
    )
  )
);

CREATE POLICY "Gestores can delete avaliacoes by programa" 
ON public.avaliacoes_aula 
FOR DELETE 
USING (
  is_gestor(auth.uid()) AND (
    EXISTS (
      SELECT 1 FROM public.gestor_programas gp
      JOIN public.registros_acao r ON r.id = avaliacoes_aula.registro_acao_id
      WHERE gp.gestor_user_id = auth.uid()
        AND r.programa IS NOT NULL
        AND gp.programa::text = ANY(r.programa::text[])
    )
  )
);

-- Atualizar RLS policies para presencas - gestores só gerenciam presenças do seu programa
DROP POLICY IF EXISTS "Gestores can manage presencas" ON public.presencas;
CREATE POLICY "Gestores can view presencas by programa" 
ON public.presencas 
FOR SELECT 
USING (
  is_gestor(auth.uid()) AND (
    EXISTS (
      SELECT 1 FROM public.gestor_programas gp
      JOIN public.registros_acao r ON r.id = presencas.registro_acao_id
      WHERE gp.gestor_user_id = auth.uid()
        AND r.programa IS NOT NULL
        AND gp.programa::text = ANY(r.programa::text[])
    )
  )
);

CREATE POLICY "Gestores can insert presencas by programa" 
ON public.presencas 
FOR INSERT 
WITH CHECK (
  is_gestor(auth.uid()) AND (
    EXISTS (
      SELECT 1 FROM public.gestor_programas gp
      JOIN public.registros_acao r ON r.id = presencas.registro_acao_id
      WHERE gp.gestor_user_id = auth.uid()
        AND r.programa IS NOT NULL
        AND gp.programa::text = ANY(r.programa::text[])
    )
  )
);

CREATE POLICY "Gestores can update presencas by programa" 
ON public.presencas 
FOR UPDATE 
USING (
  is_gestor(auth.uid()) AND (
    EXISTS (
      SELECT 1 FROM public.gestor_programas gp
      JOIN public.registros_acao r ON r.id = presencas.registro_acao_id
      WHERE gp.gestor_user_id = auth.uid()
        AND r.programa IS NOT NULL
        AND gp.programa::text = ANY(r.programa::text[])
    )
  )
);

CREATE POLICY "Gestores can delete presencas by programa" 
ON public.presencas 
FOR DELETE 
USING (
  is_gestor(auth.uid()) AND (
    EXISTS (
      SELECT 1 FROM public.gestor_programas gp
      JOIN public.registros_acao r ON r.id = presencas.registro_acao_id
      WHERE gp.gestor_user_id = auth.uid()
        AND r.programa IS NOT NULL
        AND gp.programa::text = ANY(r.programa::text[])
    )
  )
);