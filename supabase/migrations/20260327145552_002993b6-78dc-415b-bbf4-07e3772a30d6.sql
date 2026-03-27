
-- Seed form_config_settings for monitoramento_gestao
INSERT INTO public.form_config_settings (form_key, min_optional_questions, programas)
VALUES ('monitoramento_gestao', 0, ARRAY['escolas'::programa_type, 'regionais'::programa_type, 'redes_municipais'::programa_type])
ON CONFLICT (form_key) DO NOTHING;

-- Seed instrument_fields for monitoramento_gestao
INSERT INTO public.instrument_fields (form_type, field_key, label, description, field_type, dimension, sort_order, is_required, scale_min, scale_max, scale_labels, metadata) VALUES
('monitoramento_gestao', 'publico', 'Público do Encontro', 'Seleção múltipla do público presente', 'checkbox_group', 'Dados do Encontro', 1, true, NULL, NULL, NULL, '{"options": ["Líder Regional", "Dirigente", "CEC", "Supervisor", "PEC", "Gestão Escolar (Diretor, Vice, Coordenador, outros)", "Professor"]}'::jsonb),
('monitoramento_gestao', 'frente_trabalho', 'Frente de Trabalho', 'Seleção única da frente de trabalho', 'radio_group', 'Dados do Encontro', 2, true, NULL, NULL, NULL, '{"options": ["Semanal Gestão", "Governança", "Mentoria Dirigente", "PDCA", "Alinhamento CEC", "Imersão em Dados"]}'::jsonb),
('monitoramento_gestao', 'observacao', 'Observação', 'Observações gerais sobre o encontro', 'text', 'Dados do Encontro', 3, false, NULL, NULL, NULL, NULL),
('monitoramento_gestao', 'pdca_temas', 'Temas abordados (PDCA)', 'Quais os temas abordados?', 'text', 'Detalhes do PDCA', 4, false, NULL, NULL, NULL, '{"conditional": "frente_trabalho=PDCA"}'::jsonb),
('monitoramento_gestao', 'pdca_pontos_atencao', 'Pontos de atenção (PDCA)', 'Quais os pontos de atenção da agenda?', 'text', 'Detalhes do PDCA', 5, false, NULL, NULL, NULL, '{"conditional": "frente_trabalho=PDCA"}'::jsonb),
('monitoramento_gestao', 'pdca_encaminhamentos', 'Encaminhamentos (PDCA)', 'Quais os encaminhamentos da agenda?', 'text', 'Detalhes do PDCA', 6, false, NULL, NULL, NULL, '{"conditional": "frente_trabalho=PDCA"}'::jsonb),
('monitoramento_gestao', 'pdca_material', 'Material utilizado (PDCA)', 'Material utilizado (incluir link se houver)', 'text', 'Detalhes do PDCA', 7, false, NULL, NULL, NULL, '{"conditional": "frente_trabalho=PDCA"}'::jsonb),
('monitoramento_gestao', 'pdca_aprendizados', 'Aprendizados (PDCA)', 'Aprendizados em relação ao encontro e estrutura do PDCA', 'text', 'Detalhes do PDCA', 8, false, NULL, NULL, NULL, '{"conditional": "frente_trabalho=PDCA"}'::jsonb)
ON CONFLICT DO NOTHING;
