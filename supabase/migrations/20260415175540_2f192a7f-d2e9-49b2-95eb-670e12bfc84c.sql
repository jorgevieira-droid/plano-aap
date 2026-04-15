
-- Seed instrument_fields for registro_consultoria_pedagogica
INSERT INTO public.instrument_fields (form_type, field_key, label, field_type, dimension, sort_order, is_required, scale_min, scale_max, scale_labels, metadata) VALUES
-- Participantes
('registro_consultoria_pedagogica', 'participantes', 'Participantes', 'multi_select', 'Participantes', 1, true, NULL, NULL, NULL, NULL),
('registro_consultoria_pedagogica', 'participantes_outros', 'Outros participantes', 'text', 'Participantes', 2, false, NULL, NULL, NULL, NULL),
-- Agenda
('registro_consultoria_pedagogica', 'agenda_planejada', 'A agenda planejada foi cumprida?', 'boolean', 'Agenda', 3, false, NULL, NULL, NULL, NULL),
('registro_consultoria_pedagogica', 'agenda_alterada', 'A agenda precisou ser alterada?', 'boolean', 'Agenda', 4, false, NULL, NULL, NULL, NULL),
('registro_consultoria_pedagogica', 'agenda_alterada_razoes', 'Razões da alteração da agenda', 'text', 'Agenda', 5, false, NULL, NULL, NULL, NULL),
-- Ações Formativas – Professores
('registro_consultoria_pedagogica', 'aulas_obs_lp', 'Aulas observadas – Língua Portuguesa', 'number', 'Ações Formativas – Professores', 6, false, NULL, NULL, NULL, NULL),
('registro_consultoria_pedagogica', 'aulas_obs_mat', 'Aulas observadas – Matemática', 'number', 'Ações Formativas – Professores', 7, false, NULL, NULL, NULL, NULL),
('registro_consultoria_pedagogica', 'aulas_obs_oe_lp', 'Aulas observadas OE – LP', 'number', 'Ações Formativas – Professores', 8, false, NULL, NULL, NULL, NULL),
('registro_consultoria_pedagogica', 'aulas_obs_oe_mat', 'Aulas observadas OE – Matemática', 'number', 'Ações Formativas – Professores', 9, false, NULL, NULL, NULL, NULL),
('registro_consultoria_pedagogica', 'aulas_tutoria_obs', 'Aulas de tutoria observadas', 'number', 'Ações Formativas – Professores', 10, false, NULL, NULL, NULL, NULL),
('registro_consultoria_pedagogica', 'aulas_obs_turma_padrao', 'Aulas observadas – Turma padrão (VOAR)', 'number', 'Ações Formativas – Professores', 11, false, NULL, NULL, NULL, '{"voar_only": true}'),
('registro_consultoria_pedagogica', 'aulas_obs_turma_adaptada', 'Aulas observadas – Turma adaptada (VOAR)', 'number', 'Ações Formativas – Professores', 12, false, NULL, NULL, NULL, '{"voar_only": true}'),
('registro_consultoria_pedagogica', 'professores_observados', 'Professores observados', 'number', 'Ações Formativas – Professores', 13, false, NULL, NULL, NULL, NULL),
('registro_consultoria_pedagogica', 'devolutivas_professor', 'Devolutivas ao professor', 'number', 'Ações Formativas – Professores', 14, false, NULL, NULL, NULL, NULL),
('registro_consultoria_pedagogica', 'atpcs_ministrados', 'ATPCs ministrados', 'number', 'Ações Formativas – Professores', 15, false, NULL, NULL, NULL, NULL),
-- Ações Formativas – Coordenação
('registro_consultoria_pedagogica', 'aulas_obs_parceria_coord', 'Aulas observadas em parceria com coordenador', 'number', 'Ações Formativas – Coordenação', 16, false, NULL, NULL, NULL, NULL),
('registro_consultoria_pedagogica', 'devolutivas_model_coord', 'Devolutivas modeladas com coordenador', 'number', 'Ações Formativas – Coordenação', 17, false, NULL, NULL, NULL, NULL),
('registro_consultoria_pedagogica', 'acomp_devolutivas_coord', 'Acompanhamento de devolutivas do coordenador', 'number', 'Ações Formativas – Coordenação', 18, false, NULL, NULL, NULL, NULL),
('registro_consultoria_pedagogica', 'atpcs_acomp_coord', 'ATPCs acompanhados com coordenador', 'number', 'Ações Formativas – Coordenação', 19, false, NULL, NULL, NULL, NULL),
('registro_consultoria_pedagogica', 'devolutivas_coord_atpc', 'Devolutivas do coordenador sobre ATPC', 'number', 'Ações Formativas – Coordenação', 20, false, NULL, NULL, NULL, NULL),
-- Questões Finais
('registro_consultoria_pedagogica', 'analise_dados', 'Houve análise de dados?', 'boolean', 'Questões Finais', 21, false, NULL, NULL, NULL, NULL),
('registro_consultoria_pedagogica', 'pauta_formativa', 'Houve pauta formativa?', 'boolean', 'Questões Finais', 22, false, NULL, NULL, NULL, NULL),
('registro_consultoria_pedagogica', 'boas_praticas', 'Boas práticas observadas', 'text', 'Questões Finais', 23, false, NULL, NULL, NULL, NULL),
('registro_consultoria_pedagogica', 'pontos_preocupacao', 'Pontos de preocupação', 'text', 'Questões Finais', 24, false, NULL, NULL, NULL, NULL),
('registro_consultoria_pedagogica', 'encaminhamentos', 'Encaminhamentos', 'text', 'Questões Finais', 25, false, NULL, NULL, NULL, NULL),
('registro_consultoria_pedagogica', 'outros_pontos', 'Outros pontos relevantes', 'text', 'Questões Finais', 26, false, NULL, NULL, NULL, NULL)
ON CONFLICT DO NOTHING;

-- Insert default form_config_settings enabling all programs
INSERT INTO public.form_config_settings (form_key, programas, min_optional_questions)
VALUES ('registro_consultoria_pedagogica', ARRAY['escolas','regionais','redes_municipais']::programa_type[], 0)
ON CONFLICT DO NOTHING;
