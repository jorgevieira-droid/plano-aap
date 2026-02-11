
ALTER TABLE public.registros_acao DROP CONSTRAINT registros_acao_tipo_check;

ALTER TABLE public.registros_acao ADD CONSTRAINT registros_acao_tipo_check CHECK (
  tipo = ANY (ARRAY[
    'acompanhamento_formacoes'::text,
    'agenda_gestao'::text,
    'autoavaliacao'::text,
    'devolutiva_pedagogica'::text,
    'formacao'::text,
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
    'lista_presenca'::text,
    'visita'::text,
    'acompanhamento_aula'::text
  ])
);
