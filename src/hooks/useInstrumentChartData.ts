import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getViewableAcoes, ACAO_TYPE_INFO, AcaoTipo } from '@/config/acaoPermissions';
import { INSTRUMENT_FORM_TYPES } from '@/hooks/useInstrumentFields';

export interface DimensionAverage {
  dimension: string;
  fieldKey: string;
  label: string;
  average: number;
  count: number;
  scaleMax: number;
}

export interface InstrumentChartData {
  formType: string;
  formLabel: string;
  dimensions: DimensionAverage[];
  totalResponses: number;
}

// Set of form_types that have instrument fields
const INSTRUMENT_FORM_TYPE_VALUES = new Set<string>(INSTRUMENT_FORM_TYPES.map(t => t.value));

export function useInstrumentChartData(filters?: {
  programaFilter?: string;
  escolaFilter?: string;
  mesFilter?: number | 'todos';
  anoFilter?: number;
  aapFilter?: string;
  componenteFilter?: string;
  entidadeFilhoEscolaId?: string;
}) {
  const { profile } = useAuth();

  // Determine which instrument types the user can view
  const viewableAcoes = getViewableAcoes(profile?.role);
  const viewableInstrumentTypes = viewableAcoes.filter(tipo => INSTRUMENT_FORM_TYPE_VALUES.has(tipo)) as string[];

  const { data, isLoading } = useQuery({
    queryKey: ['instrument_chart_data', viewableInstrumentTypes, filters],
    queryFn: async () => {
      if (viewableInstrumentTypes.length === 0) return [];

      // 1) Fetch instrument_fields for all viewable types
      const { data: fields, error: fieldsError } = await (supabase as any)
        .from('instrument_fields')
        .select('form_type, field_key, label, dimension, field_type, scale_max')
        .in('form_type', viewableInstrumentTypes)
        .eq('field_type', 'rating')
        .order('sort_order', { ascending: true });

      if (fieldsError) throw fieldsError;

      // 2) Fetch instrument_responses for those types
      let query = (supabase as any)
        .from('instrument_responses')
        .select('form_type, responses, registro_acao_id, escola_id, aap_id, created_at')
        .in('form_type', viewableInstrumentTypes);

      const { data: responses, error: responsesError } = await query;
      if (responsesError) throw responsesError;

      // 2b) Fetch registros_acao for date/programa/componente/escola filtering
      let registrosMap: Record<string, { data: string; programa: string[] | null; componente: string | null; escola_id: string | null }> = {};
      const registroIds = [...new Set((responses || []).map((r: any) => r.registro_acao_id))];
      if (registroIds.length > 0) {
        for (let i = 0; i < registroIds.length; i += 500) {
          const chunk = registroIds.slice(i, i + 500) as string[];
          const { data: regs } = await supabase
            .from('registros_acao')
            .select('id, data, programa, componente, escola_id')
            .in('id', chunk);
          for (const reg of regs || []) {
            registrosMap[reg.id] = {
              data: reg.data,
              programa: reg.programa,
              componente: (reg as any).componente ?? null,
              escola_id: (reg as any).escola_id ?? null,
            };
          }
        }
      }

      // 3) Apply temporal/escola/programa/aap/componente/entidade filters
      let filteredResponses = responses || [];

      if (filters?.anoFilter) {
        filteredResponses = filteredResponses.filter((r: any) => {
          const reg = registrosMap[r.registro_acao_id];
          const dateStr = reg?.data || r.created_at;
          return new Date(dateStr).getFullYear() === filters.anoFilter;
        });
      }
      if (filters?.mesFilter && filters.mesFilter !== 'todos') {
        filteredResponses = filteredResponses.filter((r: any) => {
          const reg = registrosMap[r.registro_acao_id];
          const dateStr = reg?.data || r.created_at;
          return new Date(dateStr).getMonth() + 1 === filters.mesFilter;
        });
      }
      if (filters?.escolaFilter && filters.escolaFilter !== 'todos') {
        filteredResponses = filteredResponses.filter((r: any) => r.escola_id === filters.escolaFilter);
      }
      if (filters?.programaFilter && filters.programaFilter !== 'todos') {
        filteredResponses = filteredResponses.filter((r: any) => {
          const reg = registrosMap[r.registro_acao_id];
          return reg?.programa?.includes(filters.programaFilter!);
        });
      }
      if (filters?.aapFilter && filters.aapFilter !== 'todos') {
        filteredResponses = filteredResponses.filter((r: any) => r.aap_id === filters.aapFilter);
      }
      if (filters?.componenteFilter && filters.componenteFilter !== 'todos') {
        filteredResponses = filteredResponses.filter((r: any) => {
          const reg = registrosMap[r.registro_acao_id];
          return reg?.componente === filters.componenteFilter;
        });
      }
      if (filters?.entidadeFilhoEscolaId) {
        filteredResponses = filteredResponses.filter((r: any) => {
          const reg = registrosMap[r.registro_acao_id];
          return (reg?.escola_id || r.escola_id) === filters.entidadeFilhoEscolaId;
        });
      }

      // 4) Group fields by form_type
      const fieldsByType: Record<string, typeof fields> = {};
      for (const f of fields || []) {
        if (!fieldsByType[f.form_type]) fieldsByType[f.form_type] = [];
        fieldsByType[f.form_type].push(f);
      }

      // 5) Calculate averages per form_type per field
      const chartDataList: InstrumentChartData[] = [];

      for (const formType of viewableInstrumentTypes) {
        const typeFields = fieldsByType[formType] || [];
        if (typeFields.length === 0) continue;

        const typeResponses = filteredResponses.filter((r: any) => r.form_type === formType);
        if (typeResponses.length === 0) continue;

        const dimensions: DimensionAverage[] = typeFields.map((field: any) => {
          let sum = 0;
          let count = 0;
          for (const resp of typeResponses) {
            const val = resp.responses?.[field.field_key];
            if (typeof val === 'number') {
              sum += val;
              count++;
            }
          }
          return {
            dimension: field.dimension || '',
            fieldKey: field.field_key,
            label: field.label,
            average: count > 0 ? Number((sum / count).toFixed(2)) : 0,
            count,
            scaleMax: field.scale_max || 5,
          };
        }).filter((d: DimensionAverage) => d.count > 0);

        if (dimensions.length === 0) continue;

        const formInfo = INSTRUMENT_FORM_TYPES.find(t => t.value === formType);
        const acaoInfo = ACAO_TYPE_INFO[formType as AcaoTipo];

        chartDataList.push({
          formType,
          formLabel: acaoInfo?.label || formInfo?.label || formType,
          dimensions,
          totalResponses: typeResponses.length,
        });
      }

      return chartDataList;
    },
    enabled: viewableInstrumentTypes.length > 0,
  });

  return {
    chartData: data || [],
    isLoading,
    viewableInstrumentTypes,
  };
}
