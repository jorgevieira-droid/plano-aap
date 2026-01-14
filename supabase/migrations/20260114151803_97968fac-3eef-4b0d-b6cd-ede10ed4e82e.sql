-- Adicionar políticas PERMISSIVE para garantir que apenas usuários autenticados possam acessar dados sensíveis

-- 1. Política para tabela profiles - requer autenticação
CREATE POLICY "Require authentication to access profiles"
ON public.profiles
FOR SELECT
TO public
USING (auth.uid() IS NOT NULL);

-- 2. Política para tabela user_roles - requer autenticação
CREATE POLICY "Require authentication to access user_roles"
ON public.user_roles
FOR SELECT
TO public
USING (auth.uid() IS NOT NULL);