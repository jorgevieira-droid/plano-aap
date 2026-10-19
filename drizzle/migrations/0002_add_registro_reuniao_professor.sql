DO $$
DECLARE tipos text := $t$'acompanhamento_formacoes','agenda_gestao','autoavaliacao','devolutiva_pedagogica','formacao','obs_engajamento_solidez','obs_implantacao_programa','observacao_aula','observacao_aula_redes','observacao_aula_gpa','encontro_eteg_redes','encontro_professor_redes','obs_uso_dados','participa_formacoes','qualidade_acomp_aula','qualidade_implementacao','qualidade_atpcs','sustentabilidade_programa','avaliacao_formacao_participante','lista_presenca','lideranca_gestores_pei','monitoramento_gestao','acomp_professor_tutor','pec_qualidade_aula','visita_voar','monitoramento_acoes_formativas','registro_consultoria_pedagogica','registro_apoio_presencial','registro_encaminhamentos_internos','registro_formacao_coletiva','registro_planejamento_conjunto','registro_apoio_coordenador','registro_aula_compartilhada','registro_reuniao_professor','alteracao_agenda_visita','encontro_microciclos_recomposicao','visita_tecnica_alfabetizacao_redes','visita_tecnica_tarl','visita_tecnica_alfabetizacao','reuniao_acomp_alfabetizacao','visita_tecnica_secretaria_sme','acompanhamento_aula','visita'$t$;
BEGIN
  EXECUTE 'ALTER TABLE public.programacoes DROP CONSTRAINT programacoes_tipo_check';
  EXECUTE 'ALTER TABLE public.programacoes ADD CONSTRAINT programacoes_tipo_check CHECK (tipo = ANY (ARRAY[' || tipos || ']))';
  EXECUTE 'ALTER TABLE public.registros_acao DROP CONSTRAINT registros_acao_tipo_check';
  EXECUTE 'ALTER TABLE public.registros_acao ADD CONSTRAINT registros_acao_tipo_check CHECK (tipo = ANY (ARRAY[' || tipos || ']))';
END $$;
INSERT INTO public.form_config_settings (form_key, min_optional_questions, programas)
VALUES ('registro_reuniao_professor', 0, ARRAY['escolas']::programa_type[])
ON CONFLICT (form_key) DO NOTHING;