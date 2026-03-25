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
  source: 'programacao' | 'registro';
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
      const today = new Date();
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const threeDaysAgoStr = threeDaysAgo.toISOString().split('T')[0];

      // 1. Primary source: programacoes with status 'prevista' and date > 3 days ago
      const { data: programacoes, error: progError } = await supabase
        .from('programacoes')
        .select('id, data, tipo, escola_id, aap_id, status, programa')
        .eq('status', 'prevista')
        .lte('data', threeDaysAgoStr);

      if (progError) throw progError;

      // 2. Fallback: registros_acao without programacao_id (orphan/legacy)
      const { data: registrosOrfaos, error: regError } = await supabase
        .from('registros_acao')
        .select('id, data, tipo, escola_id, aap_id, status, reagendada_para, programa, programacao_id')
        .in('status', ['prevista', 'agendada', 'reagendada'])
        .is('programacao_id', null)
        .lte('data', threeDaysAgoStr);

      if (regError) throw regError;

      // Build pendencias from programacoes
      const fromProgramacoes: Pendencia[] = (programacoes || []).map(p => {
        const dataDate = new Date(p.data);
        const diasAtraso = Math.floor((today.getTime() - dataDate.getTime()) / (1000 * 60 * 60 * 24));
        return {
          id: p.id,
          data: p.data,
          tipo: p.tipo,
          escola_id: p.escola_id,
          aap_id: p.aap_id,
          status: p.status,
          reagendada_para: null,
          programa: p.programa,
          dias_atraso: diasAtraso,
          source: 'programacao' as const,
        };
      });

      // Build pendencias from orphan registros
      const fromRegistros: Pendencia[] = (registrosOrfaos || []).map(r => {
        const relevantDate = r.status === 'reagendada' && r.reagendada_para
          ? new Date(r.reagendada_para)
          : new Date(r.data);
        const diasAtraso = Math.floor((today.getTime() - relevantDate.getTime()) / (1000 * 60 * 60 * 24));
        return {
          id: r.id,
          data: r.data,
          tipo: r.tipo,
          escola_id: r.escola_id,
          aap_id: r.aap_id,
          status: r.status,
          reagendada_para: r.reagendada_para,
          programa: r.programa,
          dias_atraso: diasAtraso,
          source: 'registro' as const,
        };
      }).filter(r => r.dias_atraso >= 3);

      let combined = [...fromProgramacoes, ...fromRegistros];

      // Apply client-side filters
      if (filters?.programa) {
        combined = combined.filter(r => r.programa?.includes(filters.programa!));
      }
      if (filters?.escolaId) {
        combined = combined.filter(r => r.escola_id === filters.escolaId);
      }
      if (filters?.tipo) {
        combined = combined.filter(r => r.tipo === filters.tipo);
      }

      // Fetch escola names and aap names
      const escolaIds = [...new Set(combined.map(r => r.escola_id))];
      const aapIds = [...new Set(combined.map(r => r.aap_id))];

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

      return combined
        .map(r => ({
          ...r,
          escola_nome: escolaMap.get(r.escola_id) || 'Escola não encontrada',
          aap_nome: profileMap.get(r.aap_id) || 'Não identificado',
        }))
        .sort((a, b) => b.dias_atraso - a.dias_atraso);
    },
    enabled: !!user,
    refetchInterval: 5 * 60 * 1000,
  });

  return {
    pendencias: query.data || [],
    count: query.data?.length || 0,
    isLoading: query.isLoading,
    error: query.error,
  };
}
