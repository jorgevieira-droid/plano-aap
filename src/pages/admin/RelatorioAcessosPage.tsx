import { useState, useEffect, useMemo } from 'react';
import { BarChart3, Download, Loader2, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth, AppRole, ProgramaType } from '@/contexts/AuthContext';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { roleLabelsMap, getRoleTierColor, programaLabels } from '@/config/roleConfig';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface AccessRow {
  id: string;
  nome: string;
  email: string;
  role: AppRole | null;
  programas: ProgramaType[];
  accessCount: number;
  diasAtivos: number;
  lastAccess: string | null;
}

interface RawAccess {
  user_id: string;
  accessed_at: string;
}

const PROGRAMA_COLORS: Record<ProgramaType, string> = {
  escolas: 'hsl(var(--primary))',
  regionais: 'hsl(var(--accent))',
  redes_municipais: 'hsl(var(--muted-foreground))',
};

interface NarrativeCostAggregate {
  mes: string;
  programa: ProgramaType;
  total_usd: number;
  total_geracoes: number;
}

export default function RelatorioAcessosPage() {
  const { isAdmin, profile } = useAuth();
  const [data, setData] = useState<AccessRow[]>([]);
  const [rawAccessLog, setRawAccessLog] = useState<RawAccess[]>([]);
  const [userProgramasMap, setUserProgramasMap] = useState<Map<string, ProgramaType[]>>(new Map());
  const [monthlyAggregates, setMonthlyAggregates] = useState<{ mes: string; programa: ProgramaType; total: number }[]>([]);
  const [narrativeCostAggregates, setNarrativeCostAggregates] = useState<NarrativeCostAggregate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProgramas, setSelectedProgramas] = useState<ProgramaType[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const userProgramas = profile?.programas || [];
  const userRole = profile?.role;
  const canSeeNarrativeCost =
    isAdmin || userRole === 'gestor' || userRole === 'n3_coordenador_programa';
  const allowedProgramas: ProgramaType[] = isAdmin
    ? (['escolas', 'regionais', 'redes_municipais'] as ProgramaType[])
    : (userProgramas as ProgramaType[]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [profilesRes, rolesRes, programasRes, accessRes, diasAtivosRes, monthlyRes, narrativeCostRes] = await Promise.all([
        supabase.from('profiles').select('id, nome, email').order('nome'),
        supabase.from('user_roles').select('user_id, role'),
        supabase.from('user_programas').select('user_id, programa'),
        supabase.rpc('get_acessos_por_usuario' as any),
        supabase.rpc('get_dias_ativos_por_usuario' as any),
        supabase.rpc('get_acessos_por_mes_programa'),
        canSeeNarrativeCost
          ? supabase.rpc('get_custo_narrativos_por_mes_programa' as any)
          : Promise.resolve({ data: [], error: null } as any),
      ]);

      if ((narrativeCostRes as any).error) {
        console.error('Error fetching narrative cost aggregates:', (narrativeCostRes as any).error);
      } else {
        setNarrativeCostAggregates((((narrativeCostRes as any).data || []) as any[]).map(r => ({
          mes: r.mes as string,
          programa: r.programa as ProgramaType,
          total_usd: Number(r.total_usd) || 0,
          total_geracoes: Number(r.total_geracoes) || 0,
        })));
      }

      if (monthlyRes.error) {
        console.error('Error fetching monthly aggregates:', monthlyRes.error);
      } else {
        setMonthlyAggregates(((monthlyRes.data || []) as any[]).map(r => ({
          mes: r.mes as string,
          programa: r.programa as ProgramaType,
          total: Number(r.total) || 0,
        })));
      }

      if (profilesRes.error) throw profilesRes.error;

      const upMap = new Map<string, ProgramaType[]>();
      (programasRes.data || []).forEach(p => {
        const arr = upMap.get(p.user_id) || [];
        arr.push(p.programa as ProgramaType);
        upMap.set(p.user_id, arr);
      });
      setUserProgramasMap(upMap);

      const accessMap = new Map<string, { count: number; lastAccess: string }>();
      if ((accessRes as any).error) {
        console.error('Error fetching access aggregates:', (accessRes as any).error);
      } else {
        (((accessRes as any).data || []) as any[]).forEach(row => {
          accessMap.set(row.user_id, {
            count: Number(row.total) || 0,
            lastAccess: row.last_access as string,
          });
        });
      }

      const diasAtivosMap = new Map<string, number>();
      if ((diasAtivosRes as any).error) {
        console.error('Error fetching dias ativos:', (diasAtivosRes as any).error);
      } else {
        (((diasAtivosRes as any).data || []) as any[]).forEach(row => {
          diasAtivosMap.set(row.user_id, Number(row.dias_ativos) || 0);
        });
      }
      setRawAccessLog([]);

      const rows: AccessRow[] = (profilesRes.data || []).map(profile => {
        const userRole = rolesRes.data?.find(r => r.user_id === profile.id);
        const rowProgramas = upMap.get(profile.id) || [];
        const accessData = accessMap.get(profile.id);

        return {
          id: profile.id,
          nome: profile.nome,
          email: profile.email,
          role: (userRole?.role as AppRole) || null,
          programas: rowProgramas,
          accessCount: accessData?.count || 0,
          diasAtivos: diasAtivosMap.get(profile.id) || 0,
          lastAccess: accessData?.lastAccess || null,
        };
      });

      if (!isAdmin) {
        const myProgramas = userProgramas as string[];
        setData(rows.filter(row => row.programas.some(p => myProgramas.includes(p))));
      } else {
        setData(rows);
      }
    } catch (error) {
      console.error('Error fetching access data:', error);
      toast.error('Erro ao carregar dados de acesso');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    let result = data;
    if (selectedProgramas.length > 0) {
      result = result.filter(row => row.programas.some(p => selectedProgramas.includes(p)));
    }
    if (dateFrom) {
      result = result.filter(row => row.lastAccess && row.lastAccess >= dateFrom);
    }
    if (dateTo) {
      const toEnd = dateTo + 'T23:59:59';
      result = result.filter(row => row.lastAccess && row.lastAccess <= toEnd);
    }
    return result;
  }, [data, selectedProgramas, dateFrom, dateTo]);

  // Chart: total accesses per month x programa (ignores date filters — full history)
  const chartData = useMemo(() => {
    const activeProgramas = (selectedProgramas.length > 0 ? selectedProgramas : allowedProgramas);
    const MESES_PT = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
    ];

    const buckets = new Map<string, Record<string, number>>();

    for (const agg of monthlyAggregates) {
      if (!activeProgramas.includes(agg.programa)) continue;
      // agg.mes is 'YYYY-MM-DD' (first of month)
      const [y, m] = agg.mes.split('-');
      const key = `${y}-${m}`;
      let bucket = buckets.get(key);
      if (!bucket) {
        bucket = {};
        buckets.set(key, bucket);
      }
      bucket[agg.programa] = (bucket[agg.programa] || 0) + agg.total;
    }

    const sortedKeys = Array.from(buckets.keys()).sort();
    return sortedKeys.map(key => {
      const [y, m] = key.split('-');
      const label = `${MESES_PT[Number(m) - 1]}/${y.slice(-2)}`;
      const row: Record<string, string | number> = { mes: label };
      for (const prog of allowedProgramas) {
        row[prog] = buckets.get(key)?.[prog] || 0;
      }
      return row;
    });
  }, [monthlyAggregates, selectedProgramas, allowedProgramas]);


  // Chart: narrative report cost per month × programa (USD, full history)
  const narrativeCostChartData = useMemo(() => {
    const activeProgramas = (selectedProgramas.length > 0 ? selectedProgramas : allowedProgramas);
    const MESES_PT = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
    ];
    const buckets = new Map<string, Record<string, { usd: number; count: number }>>();
    for (const agg of narrativeCostAggregates) {
      if (!activeProgramas.includes(agg.programa)) continue;
      const [y, m] = agg.mes.split('-');
      const key = `${y}-${m}`;
      let bucket = buckets.get(key);
      if (!bucket) { bucket = {}; buckets.set(key, bucket); }
      const cur = bucket[agg.programa] || { usd: 0, count: 0 };
      cur.usd += agg.total_usd;
      cur.count += agg.total_geracoes;
      bucket[agg.programa] = cur;
    }
    const sortedKeys = Array.from(buckets.keys()).sort();
    return sortedKeys.map(key => {
      const [y, m] = key.split('-');
      const label = `${MESES_PT[Number(m) - 1]}/${y.slice(-2)}`;
      const row: Record<string, string | number> = { mes: label };
      for (const prog of allowedProgramas) {
        const b = buckets.get(key)?.[prog];
        row[prog] = b ? Number(b.usd.toFixed(4)) : 0;
        row[`${prog}__count`] = b?.count || 0;
      }
      return row;
    });
  }, [narrativeCostAggregates, selectedProgramas, allowedProgramas]);

  const totalNarrativeCost = useMemo(
    () => narrativeCostAggregates
      .filter(a => (selectedProgramas.length === 0 || selectedProgramas.includes(a.programa)))
      .reduce((s, a) => s + a.total_usd, 0),
    [narrativeCostAggregates, selectedProgramas],
  );

  const chartSeries = (selectedProgramas.length > 0 ? selectedProgramas : allowedProgramas);

  const totalAcessos = useMemo(() => {
    return filteredData.reduce((sum, row) => sum + (row.accessCount || 0), 0);
  }, [filteredData]);

  const totalDiasAtivos = useMemo(() => {
    return filteredData.reduce((sum, row) => sum + (row.diasAtivos || 0), 0);
  }, [filteredData]);

  // Total usuário-dias por programa (DAU) — usa monthlyAggregates (já é DAU por programa)
  const usuarioDiasPorPrograma = useMemo(() => {
    const map = new Map<ProgramaType, number>();
    for (const agg of monthlyAggregates) {
      map.set(agg.programa, (map.get(agg.programa) || 0) + agg.total);
    }
    return map;
  }, [monthlyAggregates]);

  const totalUsuarioDiasGlobal = useMemo(() => {
    const programas = (selectedProgramas.length > 0 ? selectedProgramas : allowedProgramas);
    return programas.reduce((s, p) => s + (usuarioDiasPorPrograma.get(p) || 0), 0);
  }, [usuarioDiasPorPrograma, selectedProgramas, allowedProgramas]);

  const exportCSV = () => {
    const headers = ['Nome', 'Email', 'Papel', 'Programas', 'Qtd Acessos', 'Dias Ativos', 'Último Acesso'];
    const rows = filteredData.map(row => [
      row.nome,
      row.email,
      row.role ? (roleLabelsMap[row.role] || row.role) : 'Sem papel',
      row.programas.map(p => programaLabels[p] || p).join('; '),
      row.accessCount.toString(),
      row.diasAtivos.toString(),
      row.lastAccess ? new Date(row.lastAccess).toLocaleDateString('pt-BR') : '—',
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-acessos-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Relatório exportado!');
  };

  const exportRateioCSV = async () => {
    try {
      const { data: rateio, error } = await supabase.rpc('get_rateio_usuario_programa_mes' as any, {
        _inicio: dateFrom || null,
        _fim: dateTo || null,
      });
      if (error) throw error;
      const headers = ['Usuário', 'E-mail', 'Programa', 'Mês', 'Dias ativos'];
      const rows = ((rateio || []) as any[])
        .filter(r => selectedProgramas.length === 0 || selectedProgramas.includes(r.programa))
        .map(r => {
          const [y, m] = String(r.mes).split('-');
          return [
            r.nome || '',
            r.email || '',
            programaLabels[r.programa as ProgramaType] || r.programa,
            `${m}/${y}`,
            String(r.dias_ativos),
          ];
        });
      const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rateio-acessos-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Base de rateio exportada!');
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Erro ao exportar base de rateio');
    }
  };

  const togglePrograma = (p: ProgramaType) => {
    setSelectedProgramas(prev => (prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]));
  };

  const columns = [
    {
      key: 'nome',
      header: 'Usuário',
      render: (row: AccessRow) => (
        <div>
          <p className="font-medium text-foreground">{row.nome}</p>
          <p className="text-sm text-muted-foreground">{row.email}</p>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Papel',
      render: (row: AccessRow) =>
        row.role ? (
          <Badge variant="outline" className={getRoleTierColor(row.role)}>
            {roleLabelsMap[row.role] || row.role}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        ),
    },
    {
      key: 'programas',
      header: 'Programas',
      render: (row: AccessRow) => (
        <div className="flex flex-wrap gap-1">
          {row.programas.map(p => (
            <span key={p} className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
              {programaLabels[p] || p}
            </span>
          ))}
          {row.programas.length === 0 && <span className="text-muted-foreground text-xs">—</span>}
        </div>
      ),
    },
    {
      key: 'accessCount',
      header: 'Qtd Acessos',
      render: (row: AccessRow) => <span className="font-medium text-foreground">{row.accessCount}</span>,
    },
    {
      key: 'diasAtivos',
      header: 'Dias Ativos',
      render: (row: AccessRow) => <span className="font-medium text-foreground">{row.diasAtivos}</span>,
    },
    {
      key: 'lastAccess',
      header: 'Último Acesso',
      render: (row: AccessRow) => (
        <span className="text-muted-foreground text-xs">
          {row.lastAccess
            ? new Date(row.lastAccess).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })
            : '—'}
        </span>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="page-header flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-primary" />
            Relatório de Acessos
          </h1>
          <p className="page-subtitle">
            {filteredData.length} usuários · {totalAcessos} logins · {totalDiasAtivos} dias ativos
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={exportRateioCSV} variant="outline" className="gap-2">
            <Download size={18} />
            Exportar CSV (rateio)
          </Button>
          <Button onClick={exportCSV} className="gap-2">
            <Download size={18} />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Resumo para rateio */}
      <div className="card p-4">
        <h2 className="text-sm font-medium text-foreground">Resumo para rateio (usuário-dias)</h2>
        <p className="text-xs text-muted-foreground mb-3">
          <strong>Usuário-dias</strong> = soma de usuários únicos ativos por dia (DAU). É a métrica recomendada para divisão proporcional de custos de Cloud entre os programas. Um usuário vinculado a mais de um programa é contado em cada um deles. Histórico completo — não é afetado pelos filtros de data acima.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg border border-border p-3 bg-primary/5">
            <p className="text-xs text-muted-foreground">Total no recorte</p>
            <p className="text-2xl font-semibold text-foreground">{totalUsuarioDiasGlobal.toLocaleString('pt-BR')}</p>
            <p className="text-[10px] text-muted-foreground mt-1">usuário-dias</p>
          </div>
          {allowedProgramas.map(p => (
            <div key={p} className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">{programaLabels[p] || p}</p>
              <p className="text-2xl font-semibold text-foreground">
                {(usuarioDiasPorPrograma.get(p) || 0).toLocaleString('pt-BR')}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">usuário-dias</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Filter size={16} />
          Filtros
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className="text-xs">Programas</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {allowedProgramas.map(p => (
                <button
                  key={p}
                  onClick={() => togglePrograma(p)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    selectedProgramas.includes(p)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-muted-foreground border-border hover:border-primary/50'
                  }`}
                >
                  {programaLabels[p] || p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="dateFrom" className="text-xs">De</Label>
            <Input id="dateFrom" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="dateTo" className="text-xs">Até</Label>
            <Input id="dateTo" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="mt-1" />
          </div>
        </div>
      </div>

      {/* Chart: acessos por mês × programa */}
      <div className="card p-4">
        <h2 className="text-sm font-medium text-foreground">Usuários ativos por mês e programa</h2>
        <p className="text-xs text-muted-foreground mb-3">Cada usuário é contado no máximo uma vez por dia em cada um de seus programas (métrica de "usuários-dia ativos"). Histórico completo — não é afetado pelos filtros de data acima. Um usuário com mais de um programa é contado em cada programa.</p>

        {chartData.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
            Sem acessos no período selecionado
          </div>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="mes" fontSize={12} stroke="hsl(var(--muted-foreground))" />
                <YAxis fontSize={12} allowDecimals={false} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {chartSeries.map(prog => (
                  <Bar
                    key={prog}
                    dataKey={prog}
                    name={programaLabels[prog] || prog}
                    fill={PROGRAMA_COLORS[prog]}
                    radius={[4, 4, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Chart: custo de Relatórios Narrativos (USD) por mês × programa */}
      {canSeeNarrativeCost && (
        <div className="card p-4">
          <h2 className="text-sm font-medium text-foreground">
            Custo de Relatórios Narrativos (USD)
          </h2>
          <p className="text-xs text-muted-foreground mb-3">
            Custo estimado com base nos tokens reais retornados pela IA (Gemini 2.5 Flash:
            $0,30/M input + $2,50/M output). Histórico completo desde o início do registro —
            não é afetado pelos filtros de data acima. Total no recorte: ${totalNarrativeCost.toFixed(4)}.
          </p>
          {narrativeCostChartData.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
              Ainda não há gerações registradas
            </div>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={narrativeCostChartData} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="mes" fontSize={12} stroke="hsl(var(--muted-foreground))" />
                  <YAxis
                    fontSize={12}
                    stroke="hsl(var(--muted-foreground))"
                    tickFormatter={(v: number) => `$${Number(v).toFixed(3)}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 6,
                      fontSize: 12,
                    }}
                    formatter={(value: any, name: any, item: any) => {
                      const prog = chartSeries.find(p => (programaLabels[p] || p) === name);
                      const count = prog ? item.payload[`${prog}__count`] || 0 : 0;
                      return [`$${Number(value).toFixed(4)} · ${count} ${count === 1 ? 'geração' : 'gerações'}`, name];
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  {chartSeries.map(prog => (
                    <Bar
                      key={prog}
                      dataKey={prog}
                      name={programaLabels[prog] || prog}
                      fill={PROGRAMA_COLORS[prog]}
                      radius={[4, 4, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}


      <DataTable
        data={filteredData}
        columns={columns}
        keyExtractor={(row) => row.id}
        emptyMessage="Nenhum dado de acesso encontrado"
      />
    </div>
  );
}
