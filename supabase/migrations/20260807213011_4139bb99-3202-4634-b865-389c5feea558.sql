ALTER TABLE public.programacoes DROP CONSTRAINT IF EXISTS programacoes_tipo_check;
ALTER TABLE public.registros_acao DROP CONSTRAINT IF EXISTS registros_acao_tipo_check;

ALTER TABLE public.programacoes ADD COLUMN IF NOT EXISTS apoio_ano_serie text;
ALTER TABLE public.programacoes ADD COLUMN IF NOT EXISTS apoio_turma text;
ALTER TABLE public.programacoes ADD COLUMN IF NOT EXISTS coord_nome text;
ALTER TABLE public.programacoes ADD COLUMN IF NOT EXISTS etapa_simples text;
ALTER TABLE public.programacoes ADD COLUMN IF NOT EXISTS reuniao_agendada boolean;

ALTER TABLE public.programacoes ADD CONSTRAINT programacoes_tipo_check CHECK (tipo IN (
  'acompanhamento_formacoes','agenda_gestao','autoavaliacao','devolutiva_pedagogica','formacao',
  'obs_engajamento_solidez','obs_implantacao_programa','observacao_aula','observacao_aula_redes',
  'observacao_aula_gpa','encontro_eteg_redes','encontro_professor_redes','obs_uso_dados',
  'participa_formacoes','qualidade_acomp_aula','qualidade_implementacao','qualidade_atpcs',
  'sustentabilidade_programa','avaliacao_formacao_participante','lista_presenca','lideranca_gestores_pei',
  'monitoramento_gestao','acomp_professor_tutor','pec_qualidade_aula','visita_voar',
  'monitoramento_acoes_formativas','registro_consultoria_pedagogica','registro_apoio_presencial',
  'registro_encaminhamentos_internos','encontro_microciclos_recomposicao','visita_tecnica_alfabetizacao_redes',
  'visita_tecnica_tarl','visita_tecnica_alfabetizacao','reuniao_acomp_alfabetizacao',
  'visita_tecnica_secretaria_sme','acompanhamento_aula','visita'
));

ALTER TABLE public.registros_acao ADD CONSTRAINT registros_acao_tipo_check CHECK (tipo IN (
  'acompanhamento_formacoes','agenda_gestao','autoavaliacao','devolutiva_pedagogica','formacao',
  'obs_engajamento_solidez','obs_implantacao_programa','observacao_aula','observacao_aula_redes',
  'observacao_aula_gpa','encontro_eteg_redes','encontro_professor_redes','obs_uso_dados',
  'participa_formacoes','qualidade_acomp_aula','qualidade_implementacao','qualidade_atpcs',
  'sustentabilidade_programa','avaliacao_formacao_participante','lista_presenca','lideranca_gestores_pei',
  'monitoramento_gestao','acomp_professor_tutor','pec_qualidade_aula','visita_voar',
  'monitoramento_acoes_formativas','registro_consultoria_pedagogica','registro_apoio_presencial',
  'registro_encaminhamentos_internos','encontro_microciclos_recomposicao','visita_tecnica_alfabetizacao_redes',
  'visita_tecnica_tarl','visita_tecnica_alfabetizacao','reuniao_acomp_alfabetizacao',
  'visita_tecnica_secretaria_sme','acompanhamento_aula','visita'
));

INSERT INTO public.form_config_settings (form_key, programas, min_optional_questions)
VALUES ('registro_encaminhamentos_internos', ARRAY['escolas','regionais','redes_municipais']::programa_type[], 0)
ON CONFLICT (form_key) DO UPDATE SET programas = EXCLUDED.programas;