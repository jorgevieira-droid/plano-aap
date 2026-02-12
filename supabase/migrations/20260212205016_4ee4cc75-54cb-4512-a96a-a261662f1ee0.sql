
-- Remove overly permissive broad policy from user_programas
-- Existing specific policies (Admins, Managers, Users own) provide proper coverage
DROP POLICY IF EXISTS "Require auth user_programas" ON public.user_programas;

-- Remove same pattern from user_entidades
DROP POLICY IF EXISTS "Require auth user_entidades" ON public.user_entidades;
