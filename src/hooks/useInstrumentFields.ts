import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface InstrumentField {
  id: string;
  form_type: string;
  field_key: string;
  label: string;
  description: string | null;
  field_type: string;
  scale_min: number | null;
  scale_max: number | null;
  scale_labels: ScaleLabel[] | null;
  dimension: string | null;
  sort_order: number;
  is_required: boolean;
  metadata: Record<string, any> | null;
}

export interface ScaleLabel {
  value: number;
  label: string;
  description?: string;
}

export function useInstrumentFields(formType: string | undefined) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['instrument_fields', formType],
    queryFn: async () => {
      if (!formType) return [];
      const { data, error } = await (supabase as any)
        .from('instrument_fields')
        .select('*')
        .eq('form_type', formType)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data || []) as InstrumentField[];
    },
    enabled: !!formType,
  });

  // Group fields by dimension
  const groupedByDimension = (data || []).reduce<Record<string, InstrumentField[]>>((acc, field) => {
    const dim = field.dimension || '__no_dimension__';
    if (!acc[dim]) acc[dim] = [];
    acc[dim].push(field);
    return acc;
  }, {});

  return {
    fields: data || [],
    groupedByDimension,
    isLoading,
    error,
  };
}

/** List of form types that have instrument fields (for admin config) */
export const INSTRUMENT_FORM_TYPES = [
  { value: 'observacao_aula', label: 'Observação de Aula' },
  { value: 'observacao_aula_redes', label: 'Observação de Aula – REDES' },
  { value: 'encontro_eteg_redes', label: 'Encontro Formativo ET/EG – REDES' },
  { value: 'encontro_professor_redes', label: 'Encontro Formativo Professor – REDES' },
  { value: 'devolutiva_pedagogica', label: 'Devolutiva Pedagógica' },
  { value: 'qualidade_atpcs', label: 'Qualidade das ATPCs' },
  { value: 'obs_uso_dados', label: 'Observação – Uso Pedagógico de Dados' },
  { value: 'autoavaliacao', label: 'Autoavaliação' },
  { value: 'qualidade_implementacao', label: 'Qualidade da Implementação' },
  { value: 'engajamento_solidez', label: 'Engajamento e Solidez da Parceria' },
  { value: 'participa_formacoes', label: 'Participa de Formações' },
  { value: 'obs_engajamento_solidez', label: 'Observação – Engajamento e Solidez' },
  { value: 'sustentabilidade_programa', label: 'Sustentabilidade e Aprendizado do Programa' },
  { value: 'qualidade_acomp_aula', label: 'Qualidade do Acompanhamento de Aula (Coordenador)' },
  { value: 'avaliacao_formacao_participante', label: 'Formulário de Avaliação (Participante)' },
  { value: 'agenda_gestao', label: 'Agenda de Gestão' },
  { value: 'acompanhamento_formacoes', label: 'Acompanhamento Formações' },
  { value: 'formacao', label: 'Formação' },
  { value: 'obs_implantacao_programa', label: 'Observação - Implantação do Programa (Por Entidade)' },
  { value: 'lista_presenca', label: 'Lista de Presença (Formação)' },
  { value: 'lideranca_gestores_pei', label: 'Liderança Pedagógica – Gestores PEI' },
  { value: 'acomp_professor_tutor', label: 'Acompanhamento Professor Tutor' },
  { value: 'pec_qualidade_aula', label: 'PEC Qualidade de Aula' },
  { value: 'visita_voar', label: 'Instrumento de Visita – Projeto VOAR' },
  { value: 'monitoramento_acoes_formativas', label: 'Monitoramento de Ações Formativas – Regionais' },
  { value: 'monitoramento_gestao', label: 'Monitoramento e Gestão' },
  { value: 'registro_consultoria_pedagogica', label: 'Registro da Consultoria Pedagógica' },
] as const;
