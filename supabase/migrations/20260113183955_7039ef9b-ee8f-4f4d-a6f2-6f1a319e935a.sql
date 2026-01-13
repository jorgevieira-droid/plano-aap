-- Fix RLS policies to be PERMISSIVE instead of RESTRICTIVE
-- This ensures that any matching policy grants access (OR logic) instead of all policies needing to match (AND logic)

-- Drop and recreate escolas policies as PERMISSIVE
DROP POLICY IF EXISTS "Admins can manage escolas" ON public.escolas;
DROP POLICY IF EXISTS "Everyone can view escolas" ON public.escolas;
DROP POLICY IF EXISTS "Gestores can view escolas by programa" ON public.escolas;

-- Escolas policies - PERMISSIVE
CREATE POLICY "Admins can manage escolas"
ON public.escolas
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Gestores can view escolas by programa"
ON public.escolas
FOR SELECT
TO authenticated
USING (
  is_gestor(auth.uid()) AND
  EXISTS (
    SELECT 1 FROM gestor_programas gp
    WHERE gp.gestor_user_id = auth.uid()
    AND escolas.programa IS NOT NULL
    AND (gp.programa)::text = ANY((escolas.programa)::text[])
  )
);

CREATE POLICY "AAPs can view escolas"
ON public.escolas
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('aap_inicial', 'aap_portugues', 'aap_matematica')
  )
);

-- Drop and recreate programacoes policies as PERMISSIVE
DROP POLICY IF EXISTS "Admins can view all programacoes" ON public.programacoes;
DROP POLICY IF EXISTS "Admins can insert programacoes" ON public.programacoes;
DROP POLICY IF EXISTS "Admins can update programacoes" ON public.programacoes;
DROP POLICY IF EXISTS "Admins can delete programacoes" ON public.programacoes;
DROP POLICY IF EXISTS "Gestores can view programacoes by programa" ON public.programacoes;
DROP POLICY IF EXISTS "Gestores can insert programacoes by programa" ON public.programacoes;
DROP POLICY IF EXISTS "Gestores can update programacoes by programa" ON public.programacoes;
DROP POLICY IF EXISTS "Gestores can delete programacoes by programa" ON public.programacoes;
DROP POLICY IF EXISTS "AAPs can view their own programacoes" ON public.programacoes;
DROP POLICY IF EXISTS "AAPs can update their own programacoes" ON public.programacoes;

-- Programacoes policies - PERMISSIVE
CREATE POLICY "Admins can manage programacoes"
ON public.programacoes
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Gestores can view programacoes by programa"
ON public.programacoes
FOR SELECT
TO authenticated
USING (
  is_gestor(auth.uid()) AND
  EXISTS (
    SELECT 1 FROM gestor_programas gp
    WHERE gp.gestor_user_id = auth.uid()
    AND programacoes.programa IS NOT NULL
    AND (gp.programa)::text = ANY(programacoes.programa)
  )
);

CREATE POLICY "Gestores can insert programacoes by programa"
ON public.programacoes
FOR INSERT
TO authenticated
WITH CHECK (
  is_gestor(auth.uid()) AND
  EXISTS (
    SELECT 1 FROM gestor_programas gp
    WHERE gp.gestor_user_id = auth.uid()
    AND programacoes.programa IS NOT NULL
    AND (gp.programa)::text = ANY(programacoes.programa)
  )
);

CREATE POLICY "Gestores can update programacoes by programa"
ON public.programacoes
FOR UPDATE
TO authenticated
USING (
  is_gestor(auth.uid()) AND
  EXISTS (
    SELECT 1 FROM gestor_programas gp
    WHERE gp.gestor_user_id = auth.uid()
    AND programacoes.programa IS NOT NULL
    AND (gp.programa)::text = ANY(programacoes.programa)
  )
);

CREATE POLICY "Gestores can delete programacoes by programa"
ON public.programacoes
FOR DELETE
TO authenticated
USING (
  is_gestor(auth.uid()) AND
  EXISTS (
    SELECT 1 FROM gestor_programas gp
    WHERE gp.gestor_user_id = auth.uid()
    AND programacoes.programa IS NOT NULL
    AND (gp.programa)::text = ANY(programacoes.programa)
  )
);

CREATE POLICY "AAPs can view their own programacoes"
ON public.programacoes
FOR SELECT
TO authenticated
USING (aap_id = auth.uid());

CREATE POLICY "AAPs can update their own programacoes"
ON public.programacoes
FOR UPDATE
TO authenticated
USING (aap_id = auth.uid());

-- Drop and recreate professores policies as PERMISSIVE
DROP POLICY IF EXISTS "Admins can manage professores" ON public.professores;
DROP POLICY IF EXISTS "Authenticated users can view professores" ON public.professores;
DROP POLICY IF EXISTS "Gestores can view professores by programa" ON public.professores;
DROP POLICY IF EXISTS "Gestores can insert professores by programa" ON public.professores;
DROP POLICY IF EXISTS "Gestores can update professores by programa" ON public.professores;
DROP POLICY IF EXISTS "Gestores can delete professores by programa" ON public.professores;
DROP POLICY IF EXISTS "AAPs can view professores from assigned schools" ON public.professores;

-- Professores policies - PERMISSIVE
CREATE POLICY "Admins can manage professores"
ON public.professores
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Gestores can view professores by programa"
ON public.professores
FOR SELECT
TO authenticated
USING (
  is_gestor(auth.uid()) AND
  EXISTS (
    SELECT 1 FROM gestor_programas gp
    WHERE gp.gestor_user_id = auth.uid()
    AND professores.programa IS NOT NULL
    AND (gp.programa)::text = ANY((professores.programa)::text[])
  )
);

CREATE POLICY "Gestores can insert professores by programa"
ON public.professores
FOR INSERT
TO authenticated
WITH CHECK (
  is_gestor(auth.uid()) AND
  EXISTS (
    SELECT 1 FROM gestor_programas gp
    WHERE gp.gestor_user_id = auth.uid()
    AND professores.programa IS NOT NULL
    AND (gp.programa)::text = ANY((professores.programa)::text[])
  )
);

CREATE POLICY "Gestores can update professores by programa"
ON public.professores
FOR UPDATE
TO authenticated
USING (
  is_gestor(auth.uid()) AND
  EXISTS (
    SELECT 1 FROM gestor_programas gp
    WHERE gp.gestor_user_id = auth.uid()
    AND professores.programa IS NOT NULL
    AND (gp.programa)::text = ANY((professores.programa)::text[])
  )
);

CREATE POLICY "Gestores can delete professores by programa"
ON public.professores
FOR DELETE
TO authenticated
USING (
  is_gestor(auth.uid()) AND
  EXISTS (
    SELECT 1 FROM gestor_programas gp
    WHERE gp.gestor_user_id = auth.uid()
    AND professores.programa IS NOT NULL
    AND (gp.programa)::text = ANY((professores.programa)::text[])
  )
);

CREATE POLICY "AAPs can view professores from assigned schools"
ON public.professores
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM aap_escolas ae
    WHERE ae.aap_user_id = auth.uid()
    AND ae.escola_id = professores.escola_id
  )
);

-- Drop and recreate registros_acao policies as PERMISSIVE
DROP POLICY IF EXISTS "Admins can manage registros" ON public.registros_acao;
DROP POLICY IF EXISTS "Gestores can view registros by programa" ON public.registros_acao;
DROP POLICY IF EXISTS "Gestores can insert registros by programa" ON public.registros_acao;
DROP POLICY IF EXISTS "Gestores can update registros by programa" ON public.registros_acao;
DROP POLICY IF EXISTS "Gestores can delete registros by programa" ON public.registros_acao;
DROP POLICY IF EXISTS "AAPs can view their own registros" ON public.registros_acao;
DROP POLICY IF EXISTS "AAPs can insert their own registros" ON public.registros_acao;
DROP POLICY IF EXISTS "AAPs can update their own registros" ON public.registros_acao;
DROP POLICY IF EXISTS "AAPs can delete their own registros" ON public.registros_acao;

-- Registros_acao policies - PERMISSIVE
CREATE POLICY "Admins can manage registros"
ON public.registros_acao
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Gestores can view registros by programa"
ON public.registros_acao
FOR SELECT
TO authenticated
USING (
  is_gestor(auth.uid()) AND
  EXISTS (
    SELECT 1 FROM gestor_programas gp
    WHERE gp.gestor_user_id = auth.uid()
    AND registros_acao.programa IS NOT NULL
    AND (gp.programa)::text = ANY(registros_acao.programa)
  )
);

CREATE POLICY "Gestores can insert registros by programa"
ON public.registros_acao
FOR INSERT
TO authenticated
WITH CHECK (
  is_gestor(auth.uid()) AND
  EXISTS (
    SELECT 1 FROM gestor_programas gp
    WHERE gp.gestor_user_id = auth.uid()
    AND registros_acao.programa IS NOT NULL
    AND (gp.programa)::text = ANY(registros_acao.programa)
  )
);

CREATE POLICY "Gestores can update registros by programa"
ON public.registros_acao
FOR UPDATE
TO authenticated
USING (
  is_gestor(auth.uid()) AND
  EXISTS (
    SELECT 1 FROM gestor_programas gp
    WHERE gp.gestor_user_id = auth.uid()
    AND registros_acao.programa IS NOT NULL
    AND (gp.programa)::text = ANY(registros_acao.programa)
  )
);

CREATE POLICY "Gestores can delete registros by programa"
ON public.registros_acao
FOR DELETE
TO authenticated
USING (
  is_gestor(auth.uid()) AND
  EXISTS (
    SELECT 1 FROM gestor_programas gp
    WHERE gp.gestor_user_id = auth.uid()
    AND registros_acao.programa IS NOT NULL
    AND (gp.programa)::text = ANY(registros_acao.programa)
  )
);

CREATE POLICY "AAPs can view their own registros"
ON public.registros_acao
FOR SELECT
TO authenticated
USING (aap_id = auth.uid());

CREATE POLICY "AAPs can insert their own registros"
ON public.registros_acao
FOR INSERT
TO authenticated
WITH CHECK (aap_id = auth.uid());

CREATE POLICY "AAPs can update their own registros"
ON public.registros_acao
FOR UPDATE
TO authenticated
USING (aap_id = auth.uid());

CREATE POLICY "AAPs can delete their own registros"
ON public.registros_acao
FOR DELETE
TO authenticated
USING (aap_id = auth.uid());

-- Drop and recreate presencas policies as PERMISSIVE
DROP POLICY IF EXISTS "Admins can manage presencas" ON public.presencas;
DROP POLICY IF EXISTS "Gestores can view presencas by programa" ON public.presencas;
DROP POLICY IF EXISTS "Gestores can insert presencas by programa" ON public.presencas;
DROP POLICY IF EXISTS "Gestores can update presencas by programa" ON public.presencas;
DROP POLICY IF EXISTS "Gestores can delete presencas by programa" ON public.presencas;
DROP POLICY IF EXISTS "AAPs can view presencas of their registros" ON public.presencas;
DROP POLICY IF EXISTS "AAPs can insert presencas for their registros" ON public.presencas;
DROP POLICY IF EXISTS "AAPs can update presencas for their registros" ON public.presencas;
DROP POLICY IF EXISTS "AAPs can delete presencas for their registros" ON public.presencas;

-- Presencas policies - PERMISSIVE
CREATE POLICY "Admins can manage presencas"
ON public.presencas
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Gestores can view presencas by programa"
ON public.presencas
FOR SELECT
TO authenticated
USING (
  is_gestor(auth.uid()) AND
  EXISTS (
    SELECT 1 FROM gestor_programas gp
    JOIN registros_acao r ON r.id = presencas.registro_acao_id
    WHERE gp.gestor_user_id = auth.uid()
    AND r.programa IS NOT NULL
    AND (gp.programa)::text = ANY(r.programa)
  )
);

CREATE POLICY "Gestores can insert presencas by programa"
ON public.presencas
FOR INSERT
TO authenticated
WITH CHECK (
  is_gestor(auth.uid()) AND
  EXISTS (
    SELECT 1 FROM gestor_programas gp
    JOIN registros_acao r ON r.id = presencas.registro_acao_id
    WHERE gp.gestor_user_id = auth.uid()
    AND r.programa IS NOT NULL
    AND (gp.programa)::text = ANY(r.programa)
  )
);

CREATE POLICY "Gestores can update presencas by programa"
ON public.presencas
FOR UPDATE
TO authenticated
USING (
  is_gestor(auth.uid()) AND
  EXISTS (
    SELECT 1 FROM gestor_programas gp
    JOIN registros_acao r ON r.id = presencas.registro_acao_id
    WHERE gp.gestor_user_id = auth.uid()
    AND r.programa IS NOT NULL
    AND (gp.programa)::text = ANY(r.programa)
  )
);

CREATE POLICY "Gestores can delete presencas by programa"
ON public.presencas
FOR DELETE
TO authenticated
USING (
  is_gestor(auth.uid()) AND
  EXISTS (
    SELECT 1 FROM gestor_programas gp
    JOIN registros_acao r ON r.id = presencas.registro_acao_id
    WHERE gp.gestor_user_id = auth.uid()
    AND r.programa IS NOT NULL
    AND (gp.programa)::text = ANY(r.programa)
  )
);

CREATE POLICY "AAPs can view presencas of their registros"
ON public.presencas
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM registros_acao r
    WHERE r.id = presencas.registro_acao_id
    AND r.aap_id = auth.uid()
  )
);

CREATE POLICY "AAPs can insert presencas for their registros"
ON public.presencas
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM registros_acao r
    WHERE r.id = presencas.registro_acao_id
    AND r.aap_id = auth.uid()
  )
);

CREATE POLICY "AAPs can update presencas for their registros"
ON public.presencas
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM registros_acao r
    WHERE r.id = presencas.registro_acao_id
    AND r.aap_id = auth.uid()
  )
);

CREATE POLICY "AAPs can delete presencas for their registros"
ON public.presencas
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM registros_acao r
    WHERE r.id = presencas.registro_acao_id
    AND r.aap_id = auth.uid()
  )
);

-- Drop and recreate avaliacoes_aula policies as PERMISSIVE
DROP POLICY IF EXISTS "Admins can manage avaliacoes" ON public.avaliacoes_aula;
DROP POLICY IF EXISTS "Gestores can view avaliacoes by programa" ON public.avaliacoes_aula;
DROP POLICY IF EXISTS "Gestores can insert avaliacoes by programa" ON public.avaliacoes_aula;
DROP POLICY IF EXISTS "Gestores can update avaliacoes by programa" ON public.avaliacoes_aula;
DROP POLICY IF EXISTS "Gestores can delete avaliacoes by programa" ON public.avaliacoes_aula;
DROP POLICY IF EXISTS "AAPs can view their own avaliacoes" ON public.avaliacoes_aula;
DROP POLICY IF EXISTS "AAPs can insert their own avaliacoes" ON public.avaliacoes_aula;
DROP POLICY IF EXISTS "AAPs can update their own avaliacoes" ON public.avaliacoes_aula;
DROP POLICY IF EXISTS "AAPs can delete their own avaliacoes" ON public.avaliacoes_aula;

-- Avaliacoes_aula policies - PERMISSIVE
CREATE POLICY "Admins can manage avaliacoes"
ON public.avaliacoes_aula
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Gestores can view avaliacoes by programa"
ON public.avaliacoes_aula
FOR SELECT
TO authenticated
USING (
  is_gestor(auth.uid()) AND
  EXISTS (
    SELECT 1 FROM gestor_programas gp
    JOIN registros_acao r ON r.id = avaliacoes_aula.registro_acao_id
    WHERE gp.gestor_user_id = auth.uid()
    AND r.programa IS NOT NULL
    AND (gp.programa)::text = ANY(r.programa)
  )
);

CREATE POLICY "Gestores can insert avaliacoes by programa"
ON public.avaliacoes_aula
FOR INSERT
TO authenticated
WITH CHECK (
  is_gestor(auth.uid()) AND
  EXISTS (
    SELECT 1 FROM gestor_programas gp
    JOIN registros_acao r ON r.id = avaliacoes_aula.registro_acao_id
    WHERE gp.gestor_user_id = auth.uid()
    AND r.programa IS NOT NULL
    AND (gp.programa)::text = ANY(r.programa)
  )
);

CREATE POLICY "Gestores can update avaliacoes by programa"
ON public.avaliacoes_aula
FOR UPDATE
TO authenticated
USING (
  is_gestor(auth.uid()) AND
  EXISTS (
    SELECT 1 FROM gestor_programas gp
    JOIN registros_acao r ON r.id = avaliacoes_aula.registro_acao_id
    WHERE gp.gestor_user_id = auth.uid()
    AND r.programa IS NOT NULL
    AND (gp.programa)::text = ANY(r.programa)
  )
);

CREATE POLICY "Gestores can delete avaliacoes by programa"
ON public.avaliacoes_aula
FOR DELETE
TO authenticated
USING (
  is_gestor(auth.uid()) AND
  EXISTS (
    SELECT 1 FROM gestor_programas gp
    JOIN registros_acao r ON r.id = avaliacoes_aula.registro_acao_id
    WHERE gp.gestor_user_id = auth.uid()
    AND r.programa IS NOT NULL
    AND (gp.programa)::text = ANY(r.programa)
  )
);

CREATE POLICY "AAPs can view their own avaliacoes"
ON public.avaliacoes_aula
FOR SELECT
TO authenticated
USING (aap_id = auth.uid());

CREATE POLICY "AAPs can insert their own avaliacoes"
ON public.avaliacoes_aula
FOR INSERT
TO authenticated
WITH CHECK (aap_id = auth.uid());

CREATE POLICY "AAPs can update their own avaliacoes"
ON public.avaliacoes_aula
FOR UPDATE
TO authenticated
USING (aap_id = auth.uid());

CREATE POLICY "AAPs can delete their own avaliacoes"
ON public.avaliacoes_aula
FOR DELETE
TO authenticated
USING (aap_id = auth.uid());