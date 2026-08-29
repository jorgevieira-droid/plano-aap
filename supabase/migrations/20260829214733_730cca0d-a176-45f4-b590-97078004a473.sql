DO $$
DECLARE
  p RECORD;
  re TEXT := '(^|[^.[:alnum:]_])(is_admin|is_gestor|is_manager|is_operational|is_observer|is_local_user|is_admin_or_gestor|has_role|user_has_programa|gestor_has_programa)\(((?:[^()]|\([^()]*\))*)\)';
  new_qual TEXT;
  new_check TEXT;
  stmt TEXT;
BEGIN
  FOR p IN
    SELECT schemaname, tablename, policyname, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (coalesce(qual, '') ~ re OR coalesce(with_check, '') ~ re)
  LOOP
    new_qual := CASE WHEN p.qual IS NULL THEN NULL
                     ELSE regexp_replace(p.qual, re, '\1( SELECT public.\2(\3))', 'g') END;
    new_check := CASE WHEN p.with_check IS NULL THEN NULL
                      ELSE regexp_replace(p.with_check, re, '\1( SELECT public.\2(\3))', 'g') END;

    stmt := format('ALTER POLICY %I ON public.%I', p.policyname, p.tablename);
    IF new_qual IS NOT NULL THEN
      stmt := stmt || format(' USING (%s)', new_qual);
    END IF;
    IF new_check IS NOT NULL THEN
      stmt := stmt || format(' WITH CHECK (%s)', new_check);
    END IF;

    EXECUTE stmt;
  END LOOP;
END;
$$;