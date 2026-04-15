-- 1. Create consultoria_pedagogica_respostas table
CREATE TABLE public.consultoria_pedagogica_respostas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registro_acao_id uuid NOT NULL REFERENCES public.registros_acao(id) ON DELETE CASCADE,
  aap_id uuid NOT NULL,
  escola_id uuid NOT NULL REFERENCES public.escolas(id),
  etapa_ensino text[],
  escola_voar boolean DEFAULT false,
  participantes text[],
  participantes_outros text,
  agenda_planejada boolean,
  agenda_alterada boolean,
  agenda_alterada_razoes text,
  -- Ações formativas junto aos professores
  aulas_obs_lp integer DEFAULT 0,
  aulas_obs_mat integer DEFAULT 0,
  aulas_obs_oe_lp integer DEFAULT 0,
  aulas_obs_oe_mat integer DEFAULT 0,
  aulas_tutoria_obs integer DEFAULT 0,
  aulas_obs_turma_padrao integer DEFAULT 0,
  aulas_obs_turma_adaptada integer DEFAULT 0,
  professores_observados integer DEFAULT 0,
  devolutivas_professor integer DEFAULT 0,
  atpcs_ministrados integer DEFAULT 0,
  -- Ações formativas junto à coordenação
  aulas_obs_parceria_coord integer DEFAULT 0,
  devolutivas_model_coord integer DEFAULT 0,
  acomp_devolutivas_coord integer DEFAULT 0,
  atpcs_acomp_coord integer DEFAULT 0,
  devolutivas_coord_atpc integer DEFAULT 0,
  -- Questões finais
  analise_dados boolean,
  pauta_formativa boolean,
  boas_praticas text,
  pontos_preocupacao text,
  encaminhamentos text,
  outros_pontos text,
  created_at timestamptz DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.consultoria_pedagogica_respostas ENABLE ROW LEVEL SECURITY;

-- 3. RLS policies (following instrument_responses pattern)
CREATE POLICY "N1 Admins manage consultoria_respostas"
ON public.consultoria_pedagogica_respostas FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "N2N3 Managers view consultoria_respostas"
ON public.consultoria_pedagogica_respostas FOR SELECT
USING (
  (is_gestor(auth.uid()) OR has_role(auth.uid(), 'n3_coordenador_programa'::app_role))
  AND EXISTS (
    SELECT 1 FROM registros_acao r
    JOIN user_programas up ON up.user_id = auth.uid()
    WHERE r.id = consultoria_pedagogica_respostas.registro_acao_id
      AND r.programa IS NOT NULL
      AND (up.programa)::text = ANY(r.programa)
  )
);

CREATE POLICY "N4N5 Operational insert consultoria_respostas"
ON public.consultoria_pedagogica_respostas FOR INSERT
WITH CHECK (is_operational(auth.uid()) AND aap_id = auth.uid());

CREATE POLICY "N4N5 Operational update consultoria_respostas"
ON public.consultoria_pedagogica_respostas FOR UPDATE
USING (is_operational(auth.uid()) AND aap_id = auth.uid());

CREATE POLICY "N4N5 Operational delete consultoria_respostas"
ON public.consultoria_pedagogica_respostas FOR DELETE
USING (is_operational(auth.uid()) AND aap_id = auth.uid());

CREATE POLICY "N4N5 Operational view consultoria_respostas"
ON public.consultoria_pedagogica_respostas FOR SELECT
USING (is_operational(auth.uid()) AND aap_id = auth.uid());

-- 4. Update CHECK constraints on programacoes
ALTER TABLE public.programacoes DROP CONSTRAINT IF EXISTS programacoes_tipo_check;
ALTER TABLE public.programacoes ADD CONSTRAINT programacoes_tipo_check CHECK (tipo = ANY(ARRAY[
  'formacao','visita','acompanhamento_aula','acompanhamento_formacoes','agenda_gestao',
  'autoavaliacao','devolutiva_pedagogica','obs_engajamento_solidez','obs_implantacao_programa',
  'observacao_aula','obs_uso_dados','participa_formacoes','qualidade_acomp_aula',
  'qualidade_implementacao','qualidade_atpcs','sustentabilidade_programa',
  'avaliacao_formacao_participante','lista_presenca','observacao_aula_redes',
  'encontro_eteg_redes','encontro_professor_redes','lideranca_gestores_pei',
  'monitoramento_gestao','acomp_professor_tutor','pec_qualidade_aula','visita_voar',
  'monitoramento_acoes_formativas','registro_consultoria_pedagogica'
]));

-- 5. Update CHECK constraints on registros_acao
ALTER TABLE public.registros_acao DROP CONSTRAINT IF EXISTS registros_acao_tipo_check;
ALTER TABLE public.registros_acao ADD CONSTRAINT registros_acao_tipo_check CHECK (tipo = ANY(ARRAY[
  'acompanhamento_formacoes','agenda_gestao','autoavaliacao','devolutiva_pedagogica',
  'formacao','obs_engajamento_solidez','obs_implantacao_programa','observacao_aula',
  'obs_uso_dados','participa_formacoes','qualidade_acomp_aula','qualidade_implementacao',
  'qualidade_atpcs','sustentabilidade_programa','avaliacao_formacao_participante',
  'lista_presenca','visita','acompanhamento_aula','observacao_aula_redes',
  'encontro_eteg_redes','encontro_professor_redes','lideranca_gestores_pei',
  'monitoramento_gestao','acomp_professor_tutor','pec_qualidade_aula','visita_voar',
  'monitoramento_acoes_formativas','registro_consultoria_pedagogica'
]));

-- 6. Insert form_config_settings entry
INSERT INTO public.form_config_settings (form_key, programas)
VALUES ('registro_consultoria_pedagogica', ARRAY['escolas','regionais','redes_municipais']::programa_type[])
ON CONFLICT (form_key) DO NOTHING;