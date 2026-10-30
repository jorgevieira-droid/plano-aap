import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/** Re-fetch queries whose first key starts with any prefix when forms/actions change (N1–N3 only). */
export function useRealtimeInvalidate(prefixes: string[]) {
  const qc = useQueryClient();
  const { isAdmin, hasRole } = useAuth();
  const enabled = isAdmin || hasRole('gestor') || hasRole('n3_coordenador_programa');
  const key = prefixes.join('|');

  useEffect(() => {
    if (!enabled) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const trigger = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        qc.invalidateQueries({
          predicate: (q) => {
            const k = String(q.queryKey?.[0] ?? '');
            return prefixes.some((p) => k.startsWith(p));
          },
        });
      }, 3000);
    };
    const channel = supabase
      .channel(`rt-${key}-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'instrument_responses' }, trigger)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'registros_acao' }, trigger)
      .subscribe();
    return () => {
      clearTimeout(timer);
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, key, qc]);
}
