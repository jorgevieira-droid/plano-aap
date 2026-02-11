-- Drop the old restrictive check constraint
ALTER TABLE public.programacoes DROP CONSTRAINT programacoes_tipo_check;

-- Add updated check constraint with all valid action types
ALTER TABLE public.programacoes ADD CONSTRAINT programacoes_tipo_check CHECK (
  tipo = ANY (ARRAY[
    'formacao'::text,
    'visita'::text,
    'acompanhamento_aula'::text,
    'acompanhamento_formacoes'::text,
    'agenda_gestao'::text,
    'autoavaliacao'::text,
    'devolutiva_pedagogica'::text,
    'obs_engajamento_solidez'::text,
    'obs_implantacao_programa'::text,
    'observacao_aula'::text,
    'obs_uso_dados'::text,
    'participa_formacoes'::text,
    'qualidade_acomp_aula'::text,
    'qualidade_implementacao'::text,
    'qualidade_atpcs'::text,
    'sustentabilidade_programa'::text,
    'avaliacao_formacao_participante'::text,
    'lista_presenca'::text
  ])
);