CREATE OR REPLACE FUNCTION public.user_can_view_redes_municipio(_user_id uuid, _municipio text)
 RETURNS boolean
 LANGUAGE sql
 STABLE PARALLEL SAFE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT public.user_has_programa(_user_id, 'redes_municipais')
    AND (
      public.is_admin_or_gestor(_user_id)
      OR public.is_manager(_user_id)
      OR (
        _municipio IS NOT NULL
        AND btrim(_municipio) <> ''
        AND (
          EXISTS (
            SELECT 1
            FROM public.user_entidades ue
            JOIN public.escolas e ON e.id = ue.escola_id
            WHERE ue.user_id = _user_id
              AND e.ativa
              AND 'redes_municipais' = ANY (e.programa)
              AND lower(btrim(e.nome)) = lower(btrim(_municipio))
          )
          OR EXISTS (
            SELECT 1
            FROM public.escolas e
            WHERE e.ativa
              AND 'redes_municipais' = ANY (e.programa)
              AND lower(btrim(e.nome)) = lower(btrim(_municipio))
              AND public.user_has_escola_via_programa(_user_id, e.id)
          )
        )
      )
    )
$function$;