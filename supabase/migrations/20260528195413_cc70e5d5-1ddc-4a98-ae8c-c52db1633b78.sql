ALTER TABLE public.registros_acao DISABLE TRIGGER USER;
DELETE FROM public.registros_acao
WHERE status NOT IN ('realizada','cancelada')
  AND tipo IN (SELECT form_key FROM public.form_config_settings
               WHERE COALESCE(array_length(programas,1),0) = 0);
ALTER TABLE public.registros_acao ENABLE TRIGGER USER;

DELETE FROM public.programacoes
WHERE status NOT IN ('realizada','cancelada')
  AND tipo IN (SELECT form_key FROM public.form_config_settings
               WHERE COALESCE(array_length(programas,1),0) = 0);