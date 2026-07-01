INSERT INTO public.user_programas (user_id, programa)
SELECT gp.gestor_user_id, gp.programa
FROM public.gestor_programas gp
ON CONFLICT (user_id, programa) DO NOTHING;

INSERT INTO public.user_programas (user_id, programa)
SELECT ap.aap_user_id, ap.programa
FROM public.aap_programas ap
ON CONFLICT (user_id, programa) DO NOTHING;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY CASE role
    WHEN 'admin' THEN 1
    WHEN 'gestor' THEN 2
    WHEN 'n3_coordenador_programa' THEN 3
    WHEN 'n4_1_cped' THEN 4
    WHEN 'n4_2_gpi' THEN 4
    WHEN 'n5_formador' THEN 5
    WHEN 'aap_inicial' THEN 5
    WHEN 'aap_portugues' THEN 5
    WHEN 'aap_matematica' THEN 5
    WHEN 'n6_coord_pedagogico' THEN 6
    WHEN 'n7_professor' THEN 7
    WHEN 'n8_equipe_tecnica' THEN 8
    ELSE 99
  END ASC, created_at DESC
  LIMIT 1
$$;

REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;