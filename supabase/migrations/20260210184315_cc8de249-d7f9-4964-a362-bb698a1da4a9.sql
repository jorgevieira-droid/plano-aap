
-- Table for dynamic form field configuration
CREATE TABLE public.form_field_config (
  form_key text NOT NULL,
  field_key text NOT NULL,
  role public.app_role NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  required boolean NOT NULL DEFAULT false,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  PRIMARY KEY (form_key, field_key, role)
);

-- Enable RLS
ALTER TABLE public.form_field_config ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read config
CREATE POLICY "Authenticated users can view form_field_config"
ON public.form_field_config
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Only admins can manage
CREATE POLICY "Admins can manage form_field_config"
ON public.form_field_config
FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Trigger to validate avaliacoes_aula fields based on config
CREATE OR REPLACE FUNCTION public.validate_avaliacao_fields()
RETURNS TRIGGER AS $$
DECLARE
  user_role public.app_role;
  field_cfg RECORD;
BEGIN
  SELECT role INTO user_role FROM public.user_roles WHERE user_id = NEW.aap_id LIMIT 1;

  IF user_role IS NULL THEN
    RETURN NEW;
  END IF;

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

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_validate_avaliacao_fields
BEFORE INSERT OR UPDATE ON public.avaliacoes_aula
FOR EACH ROW
EXECUTE FUNCTION public.validate_avaliacao_fields();

-- Seed: all fields enabled for all roles with observacao_aula access
INSERT INTO public.form_field_config (form_key, field_key, role, enabled, required)
SELECT 'observacao_aula', f.field_key, r.role, true, false
FROM (VALUES
  ('clareza_objetivos'), ('dominio_conteudo'), ('estrategias_didaticas'),
  ('engajamento_turma'), ('gestao_tempo'), ('observacoes_professor'),
  ('observacoes_gerais'), ('avancos'), ('dificuldades'), ('turma')
) AS f(field_key)
CROSS JOIN (VALUES
  ('admin'::public.app_role), ('gestor'::public.app_role), ('n3_coordenador_programa'::public.app_role),
  ('n4_1_cped'::public.app_role), ('n4_2_gpi'::public.app_role), ('n5_formador'::public.app_role),
  ('n6_coord_pedagogico'::public.app_role), ('n7_professor'::public.app_role), ('n8_equipe_tecnica'::public.app_role)
) AS r(role);
