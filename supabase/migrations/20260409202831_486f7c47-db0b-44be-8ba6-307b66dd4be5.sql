-- 1. Update CHECK constraint on programacoes.tipo
ALTER TABLE public.programacoes DROP CONSTRAINT programacoes_tipo_check;
ALTER TABLE public.programacoes ADD CONSTRAINT programacoes_tipo_check CHECK (tipo = ANY (ARRAY[
  'formacao','visita','acompanhamento_aula','acompanhamento_formacoes','agenda_gestao',
  'autoavaliacao','devolutiva_pedagogica','obs_engajamento_solidez','obs_implantacao_programa',
  'observacao_aula','obs_uso_dados','participa_formacoes','qualidade_acomp_aula',
  'qualidade_implementacao','qualidade_atpcs','sustentabilidade_programa',
  'avaliacao_formacao_participante','lista_presenca','observacao_aula_redes',
  'encontro_eteg_redes','encontro_professor_redes','lideranca_gestores_pei',
  'monitoramento_gestao','acomp_professor_tutor','pec_qualidade_aula','visita_voar',
  'monitoramento_acoes_formativas'
]));

-- 2. Update CHECK constraint on registros_acao.tipo
ALTER TABLE public.registros_acao DROP CONSTRAINT registros_acao_tipo_check;
ALTER TABLE public.registros_acao ADD CONSTRAINT registros_acao_tipo_check CHECK (tipo = ANY (ARRAY[
  'acompanhamento_formacoes','agenda_gestao','autoavaliacao','devolutiva_pedagogica',
  'formacao','obs_engajamento_solidez','obs_implantacao_programa','observacao_aula',
  'obs_uso_dados','participa_formacoes','qualidade_acomp_aula','qualidade_implementacao',
  'qualidade_atpcs','sustentabilidade_programa','avaliacao_formacao_participante',
  'lista_presenca','visita','acompanhamento_aula','observacao_aula_redes',
  'encontro_eteg_redes','encontro_professor_redes','lideranca_gestores_pei',
  'monitoramento_gestao','acomp_professor_tutor','pec_qualidade_aula','visita_voar',
  'monitoramento_acoes_formativas'
]));

-- 3. Create table for the new form data
CREATE TABLE public.relatorios_monit_acoes_formativas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registro_acao_id uuid NOT NULL REFERENCES public.registros_acao(id) ON DELETE CASCADE,
  publico text[] NOT NULL DEFAULT '{}',
  frente_trabalho text NOT NULL,
  local_encontro text NOT NULL,
  local_escolas text[] DEFAULT '{}',
  local_outro text,
  fechamento text,
  encaminhamentos text,
  status text NOT NULL DEFAULT 'enviado',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.relatorios_monit_acoes_formativas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "N1 Admins manage relatorios_monit_acoes_formativas"
  ON public.relatorios_monit_acoes_formativas FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "N2N3 Managers view relatorios_monit_acoes_formativas"
  ON public.relatorios_monit_acoes_formativas FOR SELECT
  TO authenticated
  USING ((is_gestor(auth.uid()) OR has_role(auth.uid(), 'n3_coordenador_programa')) AND EXISTS (
    SELECT 1 FROM registros_acao r JOIN user_programas up ON up.user_id = auth.uid()
    WHERE r.id = relatorios_monit_acoes_formativas.registro_acao_id
      AND r.programa IS NOT NULL AND up.programa::text = ANY(r.programa)
  ));

CREATE POLICY "N4N5 Operational manage relatorios_monit_acoes_formativas"
  ON public.relatorios_monit_acoes_formativas FOR ALL
  TO authenticated
  USING (is_operational(auth.uid()) AND EXISTS (
    SELECT 1 FROM registros_acao r WHERE r.id = relatorios_monit_acoes_formativas.registro_acao_id AND r.aap_id = auth.uid()
  ))
  WITH CHECK (is_operational(auth.uid()) AND EXISTS (
    SELECT 1 FROM registros_acao r WHERE r.id = relatorios_monit_acoes_formativas.registro_acao_id AND r.aap_id = auth.uid()
  ));

-- 4. Register in form_config_settings
INSERT INTO public.form_config_settings (form_key, programas, min_optional_questions)
VALUES ('monitoramento_acoes_formativas', ARRAY['escolas','regionais','redes_municipais']::programa_type[], 0)
ON CONFLICT (form_key) DO NOTHING;