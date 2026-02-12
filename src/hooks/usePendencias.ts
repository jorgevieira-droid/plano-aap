import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
  dias_atraso: number;
}

interface UsePendenciasFilters {
  programa?: string;
  escolaId?: string;
  tipo?: string;
}

export function usePendencias(filters?: UsePendenciasFilters) {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['pendencias', user?.id, filters],
    queryFn: async (): Promise<Pendencia[]> => {
      // Fetch registros with status agendada or reagendada
      // RLS will automatically filter based on user's role/program scope
      const { data: registros, error } = await supabase
        .from('registros_acao')
        .select('id, data, tipo, escola_id, aap_id, status, reagendada_para, programa')
        .in('status', ['agendada', 'reagendada']);

      if (error) throw error;
      if (!registros || registros.length === 0) return [];

      const today = new Date();
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      // Filter delayed actions (> 2 days past due)
      let delayed = registros
        .map(r => {
          const relevantDate = r.status === 'reagendada' && r.reagendada_para
            ? new Date(r.reagendada_para)
            : new Date(r.data);
          const diasAtraso = Math.floor((today.getTime() - relevantDate.getTime()) / (1000 * 60 * 60 * 24));
          return { ...r, dias_atraso: diasAtraso };
        })
        .filter(r => {
          const relevantDate = r.status === 'reagendada' && r.reagendada_para
            ? new Date(r.reagendada_para)
            : new Date(r.data);
          return relevantDate <= twoDaysAgo;
        });

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
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  return {
    pendencias: query.data || [],
    count: query.data?.length || 0,
    isLoading: query.isLoading,
    error: query.error,
  };
}
