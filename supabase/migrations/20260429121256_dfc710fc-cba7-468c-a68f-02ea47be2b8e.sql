UPDATE public.instrument_fields
SET metadata = jsonb_build_object(
  'options', jsonb_build_array(
    jsonb_build_object('value', 'autonoma',    'label', 'Acessam de forma autônoma'),
    jsonb_build_object('value', 'com_apoio',   'label', 'Acessam com apoio'),
    jsonb_build_object('value', 'nao_acessam', 'label', 'Não acessam')
  )
)
WHERE form_type = 'encontro_microciclos_recomposicao'
  AND field_key = 'plataforma_acesso';

UPDATE public.instrument_fields
SET metadata = jsonb_build_object(
  'options', jsonb_build_array(
    jsonb_build_object('value', 'sistematicamente', 'label', 'Sistematicamente'),
    jsonb_build_object('value', 'parcialmente',     'label', 'Parcialmente'),
    jsonb_build_object('value', 'nao',              'label', 'Não utilizam')
  )
)
WHERE form_type = 'encontro_microciclos_recomposicao'
  AND field_key = 'plataforma_quizzes';