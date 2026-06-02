import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock, Loader2 } from 'lucide-react';

import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type ProgramaType = Database['public']['Enums']['programa_type'];

const ATOR_ROLES = ['n4_1_cped', 'n4_2_gpi', 'n5_formador'] as const;
const ROLE_LABEL: Record<string, string> = {
  n4_1_cped: 'N4.1 — Consultor Pedagógico',
  n4_2_gpi: 'N4.2 — GPI',
  n5_formador: 'N5 — Formador',
};

interface Props {
  programaFilter: ProgramaType | 'todos';
  escolaFilter: string;
  atorFilter: string;
  anoFilter: number;
  mesFilter: number | 'todos';
}

const sortAZ = (a: string, b: string) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' });

const minutesBetween = (inicio: string | null, fim: string | null): number => {
  if (!inicio || !fim) return 0;
  const [hi, mi] = inicio.split(':').map(Number);
  const [hf, mf] = fim.split(':').map(Number);
  if ([hi, mi, hf, mf].some(n => Number.isNaN(n))) return 0;
  const delta = (hf * 60 + mf) - (hi * 60 + mi);
  return delta > 0 ? delta : 0;
};

const formatHoras = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h${m > 0 ? ` ${m.toString().padStart(2, '0')}min` : ''}`;
};

export default function HorasPorAtorCard({
  programaFilter,
  escolaFilter,
  atorFilter,
  anoFilter,
  mesFilter,
}: Props) {
  const { dataInicio, dataFim } = useMemo(() => {
    if (mesFilter === 'todos') {
      return { dataInicio: `${anoFilter}-01-01`, dataFim: `${anoFilter}-12-31` };
    }
    const lastDay = new Date(anoFilter, mesFilter, 0).getDate();
    const mm = String(mesFilter).padStart(2, '0');
    return {
      dataInicio: `${anoFilter}-${mm}-01`,
      dataFim: `${anoFilter}-${mm}-${String(lastDay).padStart(2, '0')}`,
    };
  }, [anoFilter, mesFilter]);

  const { data, isLoading } = useQuery({
    queryKey: ['horas-por-ator', dataInicio, dataFim, programaFilter, escolaFilter, atorFilter],
    queryFn: async () => {
      // 1. Atores válidos (N4.1, N4.2, N5)
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('role', ATOR_ROLES as unknown as string[]);

      const roleByUser = new Map<string, string>();
      (roles || []).forEach(r => roleByUser.set(r.user_id, r.role));
      const atorIds = [...roleByUser.keys()];
      if (atorIds.length === 0) return { rows: [], semHorarioGlobal: 0 };

      // 2. Programações no período, dos atores
      let query = supabase
        .from('programacoes')
        .select('id, aap_id, horario_inicio, horario_fim, data, escola_id, programa, status')
        .in('aap_id', atorIds)
        .gte('data', dataInicio)
        .lte('data', dataFim);

      if (escolaFilter !== 'todos') query = query.eq('escola_id', escolaFilter);
      if (atorFilter !== 'todos') query = query.eq('aap_id', atorFilter);

      const { data: programacoes, error } = await query;
      if (error) throw error;

      // 3. Filtrar por programa em memória (array column)
      const progs = (programacoes || []).filter(p => {
        if (programaFilter === 'todos') return true;
        return Array.isArray(p.programa) && p.programa.includes(programaFilter);
      });

      // 4. Nomes
      const { data: profilesData } = await supabase
        .from('profiles_directory')
        .select('id, nome')
        .in('id', atorIds);
      const nomeById = new Map((profilesData || []).map(p => [p.id, p.nome as string]));

      // 5. Agrupar por ator
      const acc = new Map<string, { user_id: string; nome: string; role: string; qtd: number; minutos: number; semHorario: number }>();
      let semHorarioGlobal = 0;
      progs.forEach(p => {
        if (!p.aap_id) return;
        const mins = minutesBetween(p.horario_inicio as string | null, p.horario_fim as string | null);
        const cur = acc.get(p.aap_id) || {
          user_id: p.aap_id,
          nome: nomeById.get(p.aap_id) || 'Ator',
          role: roleByUser.get(p.aap_id) || '',
          qtd: 0,
          minutos: 0,
          semHorario: 0,
        };
        cur.qtd += 1;
        if (mins > 0) cur.minutos += mins;
        else { cur.semHorario += 1; semHorarioGlobal += 1; }
        acc.set(p.aap_id, cur);
      });

      const rows = [...acc.values()]
        .filter(r => r.qtd > 0)
        .sort((a, b) => sortAZ(a.nome, b.nome));

      return { rows, semHorarioGlobal };
    },
  });

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border border-border p-6 flex items-center justify-center min-h-[160px]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const rows = data?.rows || [];
  const totalMin = rows.reduce((acc, r) => acc + r.minutos, 0);
  const totalAcoes = rows.reduce((acc, r) => acc + r.qtd, 0);

  return (
    <div className="bg-card rounded-xl border border-border p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="card-title flex items-center gap-2">
          <Clock size={20} className="text-primary" />
          Horas por Ator do Programa
        </h3>
        <div className="text-xs text-muted-foreground">
          {rows.length} ator(es) · {totalAcoes} ação(ões) · {formatHoras(totalMin)} no total
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Soma das horas entre <strong>início</strong> e <strong>fim</strong> das ações em que N4.1, N4.2 e N5 são responsáveis,
        dentro dos filtros aplicados no topo. Ações sem horário não somam.
      </p>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Nenhuma ação encontrada para os filtros atuais.
        </p>
      ) : (
        <div className="overflow-x-auto max-h-[70vh]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-card border-b border-border">
              <tr className="text-left text-muted-foreground">
                <th className="py-2 pr-3 font-medium">Ator</th>
                <th className="py-2 pr-3 font-medium">Nível</th>
                <th className="py-2 pr-3 font-medium text-right">Ações</th>
                <th className="py-2 pr-3 font-medium text-right">Sem horário</th>
                <th className="py-2 font-medium text-right">Horas totais</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.user_id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="py-2 pr-3 break-words min-w-0">{r.nome}</td>
                  <td className="py-2 pr-3 text-xs text-muted-foreground">{ROLE_LABEL[r.role] || r.role}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{r.qtd}</td>
                  <td className="py-2 pr-3 text-right tabular-nums text-muted-foreground">
                    {r.semHorario > 0 ? r.semHorario : '—'}
                  </td>
                  <td className="py-2 text-right tabular-nums font-semibold">{formatHoras(r.minutos)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(data?.semHorarioGlobal || 0) > 0 && (
        <p className="text-xs text-muted-foreground">
          ⚠ {data?.semHorarioGlobal} ação(ões) sem horário de início/fim não foram somadas.
        </p>
      )}
    </div>
  );
}
