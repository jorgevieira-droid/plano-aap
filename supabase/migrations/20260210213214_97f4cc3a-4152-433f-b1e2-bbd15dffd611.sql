
-- 1. Add questoes_selecionadas column to avaliacoes_aula
ALTER TABLE public.avaliacoes_aula
ADD COLUMN questoes_selecionadas jsonb;

-- 2. Create form_config_settings table
CREATE TABLE public.form_config_settings (
  form_key text PRIMARY KEY,
  min_optional_questions integer NOT NULL DEFAULT 3,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid
);

-- Enable RLS
ALTER TABLE public.form_config_settings ENABLE ROW LEVEL SECURITY;

-- RLS: authenticated users can read
CREATE POLICY "Authenticated users can view form_config_settings"
ON public.form_config_settings
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- RLS: admins can manage
CREATE POLICY "Admins can manage form_config_settings"
ON public.form_config_settings
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- 3. Seed default config
INSERT INTO public.form_config_settings (form_key, min_optional_questions)
VALUES ('observacao_aula', 3);

-- 4. Update the trigger to also validate questoes_selecionadas
CREATE OR REPLACE FUNCTION public.validate_avaliacao_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_role public.app_role;
  field_cfg RECORD;
  min_opt integer;
  opt_count integer;
  selected_keys text[];
BEGIN
  SELECT role INTO user_role FROM public.user_roles WHERE user_id = NEW.aap_id LIMIT 1;

  IF user_role IS NULL THEN
    RETURN NEW;
  END IF;

  -- Build array of selected field_keys from JSONB
  IF NEW.questoes_selecionadas IS NOT NULL THEN
    SELECT array_agg(elem->>'field_key')
    INTO selected_keys
    FROM jsonb_array_elements(NEW.questoes_selecionadas) elem;

    -- Validate all required fields are in the selection
    FOR field_cfg IN
      SELECT field_key FROM public.form_field_config
      WHERE form_key = 'observacao_aula' AND role = user_role
        AND enabled = true AND required = true
    LOOP
      IF NOT (field_cfg.field_key = ANY(selected_keys)) THEN
        RAISE EXCEPTION 'Questão obrigatória "%" não foi selecionada', field_cfg.field_key;
      END IF;
    END LOOP;

    -- Validate minimum optional questions
    SELECT min_optional_questions INTO min_opt
    FROM public.form_config_settings WHERE form_key = 'observacao_aula';

    SELECT count(*) INTO opt_count
    FROM jsonb_array_elements(NEW.questoes_selecionadas) elem
    WHERE (elem->>'obrigatoria')::boolean = false;

    IF opt_count < COALESCE(min_opt, 3) THEN
      RAISE EXCEPTION 'Mínimo de % questões opcionais exigido, mas apenas % foram selecionadas',
        COALESCE(min_opt, 3), opt_count;
    END IF;

    -- Reset fields NOT in selection to defaults
    IF NOT ('clareza_objetivos' = ANY(selected_keys)) THEN NEW.clareza_objetivos := 3; END IF;
    IF NOT ('dominio_conteudo' = ANY(selected_keys)) THEN NEW.dominio_conteudo := 3; END IF;
    IF NOT ('estrategias_didaticas' = ANY(selected_keys)) THEN NEW.estrategias_didaticas := 3; END IF;
    IF NOT ('engajamento_turma' = ANY(selected_keys)) THEN NEW.engajamento_turma := 3; END IF;
    IF NOT ('gestao_tempo' = ANY(selected_keys)) THEN NEW.gestao_tempo := 3; END IF;
    IF NOT ('observacoes_professor' = ANY(selected_keys)) THEN NEW.observacoes := NULL; END IF;
  ELSE
    -- Legacy behavior: reset disabled fields to defaults
    FOR field_cfg IN
      SELECT field_key FROM public.form_field_config
      WHERE form_key = 'observacao_aula' AND role = user_role AND enabled = false
    LOOP
      IF field_cfg.field_key = 'clareza_objetivos' THEN NEW.clareza_objetivos := 3; END IF;
      IF field_cfg.field_key = 'dominio_conteudo' THEN NEW.dominio_conteudo := 3; END IF;
      IF field_cfg.field_key = 'estrategias_didaticas' THEN NEW.estrategias_didaticas := 3; END IF;
      IF field_cfg.field_key = 'engajamento_turma' THEN NEW.engajamento_turma := 3; END IF;
      IF field_cfg.field_key = 'gestao_tempo' THEN NEW.gestao_tempo := 3; END IF;
      IF field_cfg.field_key = 'observacoes_professor' THEN NEW.observacoes := NULL; END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$function$;
