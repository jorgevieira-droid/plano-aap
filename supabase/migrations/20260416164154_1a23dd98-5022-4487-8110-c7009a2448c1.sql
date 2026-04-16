ALTER TABLE public.programacoes DROP CONSTRAINT IF EXISTS programacoes_tipo_check;
ALTER TABLE public.programacoes ADD CONSTRAINT programacoes_tipo_check
  CHECK (tipo = ANY (ARRAY[
    'formacao','visita','acompanhamento_aula','acompanhamento_formacoes',
    'agenda_gestao','autoavaliacao','devolutiva_pedagogica','obs_engajamento_solidez',
    'obs_implantacao_programa','observacao_aula','obs_uso_dados','participa_formacoes',
    'qualidade_acomp_aula','qualidade_implementacao','qualidade_atpcs',
    'sustentabilidade_programa','avaliacao_formacao_participante','lista_presenca',
    'observacao_aula_redes','encontro_eteg_redes','encontro_professor_redes',
    'lideranca_gestores_pei','monitoramento_gestao','acomp_professor_tutor',
    'pec_qualidade_aula','visita_voar','monitoramento_acoes_formativas',
    'registro_consultoria_pedagogica','registro_apoio_presencial'
  ]));

ALTER TABLE public.registros_acao DROP CONSTRAINT IF EXISTS registros_acao_tipo_check;
ALTER TABLE public.registros_acao ADD CONSTRAINT registros_acao_tipo_check
  CHECK (tipo = ANY (ARRAY[
    'formacao','visita','acompanhamento_aula','acompanhamento_formacoes',
    'agenda_gestao','autoavaliacao','devolutiva_pedagogica','obs_engajamento_solidez',
    'obs_implantacao_programa','observacao_aula','obs_uso_dados','participa_formacoes',
    'qualidade_acomp_aula','qualidade_implementacao','qualidade_atpcs',
    'sustentabilidade_programa','avaliacao_formacao_participante','lista_presenca',
    'observacao_aula_redes','encontro_eteg_redes','encontro_professor_redes',
    'lideranca_gestores_pei','monitoramento_gestao','acomp_professor_tutor',
    'pec_qualidade_aula','visita_voar','monitoramento_acoes_formativas',
    'registro_consultoria_pedagogica','registro_apoio_presencial'
  ]));