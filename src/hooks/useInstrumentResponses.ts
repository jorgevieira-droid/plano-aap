import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface InstrumentResponseData {
  id: string;
  registro_acao_id: string;
  professor_id: string | null;
  escola_id: string;
  aap_id: string;
  form_type: string;
  responses: Record<string, any>;
  questoes_selecionadas: any[] | null;
  created_at: string;
}

export interface SaveInstrumentResponseInput {
  registro_acao_id: string;
  professor_id?: string | null;
  escola_id: string;
  aap_id: string;
  form_type: string;
  responses: Record<string, any>;
  questoes_selecionadas?: any[] | null;
}

export function useInstrumentResponses(registroAcaoId: string | undefined) {
  const { data, isLoading } = useQuery({
    queryKey: ['instrument_responses', registroAcaoId],
    queryFn: async () => {
      if (!registroAcaoId) return [];
      const { data, error } = await (supabase as any)
        .from('instrument_responses')
        .select('*')
        .eq('registro_acao_id', registroAcaoId);
      if (error) throw error;
      return (data || []) as InstrumentResponseData[];
    },
    enabled: !!registroAcaoId,
  });

  return { responses: data || [], isLoading };
}

export function useSaveInstrumentResponse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SaveInstrumentResponseInput) => {
      const { data, error } = await (supabase as any)
        .from('instrument_responses')
        .insert(input)
        .select('id')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instrument_responses'] });
    },
  });
}

export function useSaveMultipleInstrumentResponses() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inputs: SaveInstrumentResponseInput[]) => {
      const { data, error } = await (supabase as any)
        .from('instrument_responses')
        .insert(inputs);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instrument_responses'] });
    },
  });
}
