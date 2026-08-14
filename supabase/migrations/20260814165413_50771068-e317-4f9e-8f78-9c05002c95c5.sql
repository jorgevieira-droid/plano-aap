CREATE UNIQUE INDEX IF NOT EXISTS instrument_responses_unique_registro_form_no_prof
  ON public.instrument_responses (registro_acao_id, form_type)
  WHERE professor_id IS NULL;