import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getDataReferenciaPendencia, getDiasAtraso, isRegistroPendente } from '@/lib/pendencias';

export interface Pendencia {
  id: string;
  data: string;
  tipo: string;
  escola_id: string;
  escola_nome?: string;
  aap_id: string;
  aap_nome?: string;
  status: string;
  reagendada_para: string | null;
  programa: string[] | null;
  componente: string;
  data_referencia: string;
  dias_atraso: number;
}

interface UsePendenciasFilters {
  programa?: string;
  escolaId?: string;
  tipo?: string;
}

export function usePendencias(filters?: UsePendenciasFilters) {
  const { user, profile } = useAuth();

  const query = useQuery({
    queryKey: ['pendencias', user?.id, profile?.role, filters],
    placeholderData: keepPreviousData,
    refetchOnMount: 'always',
    queryFn: async (): Promise<Pendencia[]> => {
      // Fetch registros with status agendada or reagendada
      // RLS will automatically filter based on user's role/program scope
      let baseQuery = supabase
        .from('registros_acao')
        .select('id, data, tipo, escola_id, aap_id, status, reagendada_para, programa, componente')
        .in('status', ['agendada', 'reagendada']);

      // N4.1 (CPed) e N5 (Formador) só veem suas próprias pendências
      if (user && (profile?.role === 'n4_1_cped' || profile?.role === 'n5_formador')) {
        baseQuery = baseQuery.eq('aap_id', user.id);
      }

      const { data: registros, error } = await baseQuery;

      if (error) throw error;
      if (!registros || registros.length === 0) return [];

      const [{ data: settings, error: settingsError }, { data: internalSchools, error: schoolsError }] = await Promise.all([
        supabase.from('form_config_settings').select('form_key, programas'),
        supabase.from('escolas').select('id').eq('uso_interno', true),
      ]);
      if (settingsError) throw settingsError;
      if (schoolsError) throw schoolsError;

      const inactiveTypes = new Set((settings || []).filter(setting => setting.programas.length === 0).map(setting => setting.form_key));
      const internalSchoolIds = new Set((internalSchools || []).map(escola => escola.id));

      let delayed = registros
        .filter(r => isRegistroPendente(r) && !inactiveTypes.has(r.tipo) && !internalSchoolIds.has(r.escola_id))
        .map(r => ({
          ...r,
          data_referencia: getDataReferenciaPendencia(r),
          dias_atraso: getDiasAtraso(r),
        }));

      // Apply client-side filters
      if (filters?.programa) {
        delayed = delayed.filter(r => r.programa?.includes(filters.programa!));
      }
      if (filters?.escolaId) {
        delayed = delayed.filter(r => r.escola_id === filters.escolaId);
      }
      if (filters?.tipo) {
        delayed = delayed.filter(r => r.tipo === filters.tipo);
      }

      // Fetch escola names
      const escolaIds = [...new Set(delayed.map(r => r.escola_id))];
      const aapIds = [...new Set(delayed.map(r => r.aap_id))];

      const [escolasResult, profilesResult] = await Promise.all([
        escolaIds.length > 0
          ? supabase.from('escolas').select('id, nome').in('id', escolaIds)
          : { data: [] },
        aapIds.length > 0
          ? supabase.from('profiles_directory').select('id, nome').in('id', aapIds)
          : { data: [] },
      ]);

      const escolaMap = new Map((escolasResult.data || []).map(e => [e.id, e.nome]));
      const profileMap = new Map((profilesResult.data || []).map(p => [p.id, p.nome]));

      return delayed
        .map(r => ({
          ...r,
          escola_nome: escolaMap.get(r.escola_id) || 'Escola não encontrada',
          aap_nome: profileMap.get(r.aap_id) || 'Não identificado',
        }))
        .sort((a, b) => b.dias_atraso - a.dias_atraso);
    },
    enabled: !!user,
    // Sem auto-refresh: atualização sob demanda (navegação/mutação)
  });

  return {
    pendencias: query.data || [],
    count: query.data?.length || 0,
    isLoading: query.isLoading,
    error: query.error,
  };
}
