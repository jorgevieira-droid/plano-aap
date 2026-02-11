
-- 1. Move existing fields from obs_engajamento_solidez to obs_implantacao_programa
UPDATE public.instrument_fields
SET form_type = 'obs_implantacao_programa'
WHERE form_type = 'obs_engajamento_solidez';

-- 2. Insert correct fields for obs_engajamento_solidez (5 rating + 1 text)
INSERT INTO public.instrument_fields (form_type, field_key, label, field_type, scale_min, scale_max, scale_labels, dimension, sort_order, is_required, description) VALUES
('obs_engajamento_solidez', 'clareza_papel_pe', 'Clareza sobre o Papel da PE no Desenvolvimento Pedagógico e da Gestão', 'rating', 1, 4,
 '[{"value":1,"label":"Frágil","description":"Baixo engajamento; parceria reativa"},{"value":2,"label":"Em construção","description":"Engajamento pontual; dependência de mediação"},{"value":3,"label":"Ativa","description":"Participação consistente; corresponsabilidade"},{"value":4,"label":"Consolidada","description":"Parceria estratégica; alto nível de confiança"}]'::jsonb,
 NULL, 1, true, NULL),

('obs_engajamento_solidez', 'clareza_papel_consultor', 'Clareza sobre o Papel do Consultor/Gestor Pedagógico', 'rating', 1, 4,
 '[{"value":1,"label":"Frágil","description":"Baixo engajamento; parceria reativa"},{"value":2,"label":"Em construção","description":"Engajamento pontual; dependência de mediação"},{"value":3,"label":"Ativa","description":"Participação consistente; corresponsabilidade"},{"value":4,"label":"Consolidada","description":"Parceria estratégica; alto nível de confiança"}]'::jsonb,
 NULL, 2, true, NULL),

('obs_engajamento_solidez', 'participacao_gestao_escolar', 'Participação da Gestão Escolar', 'rating', 1, 4,
 '[{"value":1,"label":"Frágil","description":"Baixo engajamento; parceria reativa"},{"value":2,"label":"Em construção","description":"Engajamento pontual; dependência de mediação"},{"value":3,"label":"Ativa","description":"Participação consistente; corresponsabilidade"},{"value":4,"label":"Consolidada","description":"Parceria estratégica; alto nível de confiança"}]'::jsonb,
 NULL, 3, true, NULL),

('obs_engajamento_solidez', 'abertura_acompanhamento', 'Abertura para Acompanhamento e Devolutivas', 'rating', 1, 4,
 '[{"value":1,"label":"Frágil","description":"Baixo engajamento; parceria reativa"},{"value":2,"label":"Em construção","description":"Engajamento pontual; dependência de mediação"},{"value":3,"label":"Ativa","description":"Participação consistente; corresponsabilidade"},{"value":4,"label":"Consolidada","description":"Parceria estratégica; alto nível de confiança"}]'::jsonb,
 NULL, 4, true, NULL),

('obs_engajamento_solidez', 'estabilidade_parceria', 'Estabilidade da Parceria com a Escola', 'rating', 1, 4,
 '[{"value":1,"label":"Frágil","description":"Baixo engajamento; parceria reativa"},{"value":2,"label":"Em construção","description":"Engajamento pontual; dependência de mediação"},{"value":3,"label":"Ativa","description":"Participação consistente; corresponsabilidade"},{"value":4,"label":"Consolidada","description":"Parceria estratégica; alto nível de confiança"}]'::jsonb,
 NULL, 5, true, NULL),

('obs_engajamento_solidez', 'evidencias', 'Evidências', 'text', NULL, NULL, NULL, NULL, 6, false, NULL);
