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

export default function RelatorioAcessosPage() {
  const { isAdmin, profile } = useAuth();
  const [data, setData] = useState<AccessRow[]>([]);
  const [rawAccessLog, setRawAccessLog] = useState<RawAccess[]>([]);
  const [userProgramasMap, setUserProgramasMap] = useState<Map<string, ProgramaType[]>>(new Map());
  const [monthlyAggregates, setMonthlyAggregates] = useState<{ mes: string; programa: ProgramaType; total: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProgramas, setSelectedProgramas] = useState<ProgramaType[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const userProgramas = profile?.programas || [];
  const allowedProgramas: ProgramaType[] = isAdmin
    ? (['escolas', 'regionais', 'redes_municipais'] as ProgramaType[])
    : (userProgramas as ProgramaType[]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [profilesRes, rolesRes, programasRes, accessRes, monthlyRes] = await Promise.all([
        supabase.from('profiles').select('id, nome, email').order('nome'),
        supabase.from('user_roles').select('user_id, role'),
        supabase.from('user_programas').select('user_id, programa'),
        supabase.from('user_access_log').select('user_id, accessed_at').order('accessed_at', { ascending: false }).range(0, 49999),
        supabase.rpc('get_acessos_por_mes_programa'),
      ]);

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
      (accessRes.data || []).forEach(row => {
        const existing = accessMap.get(row.user_id);
        if (existing) {
          existing.count++;
        } else {
          accessMap.set(row.user_id, { count: 1, lastAccess: row.accessed_at });
        }
      });
      setRawAccessLog((accessRes.data || []) as RawAccess[]);

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


  const chartSeries = (selectedProgramas.length > 0 ? selectedProgramas : allowedProgramas);

  const totalAcessos = useMemo(() => {
    const activeProgramas = (selectedProgramas.length > 0 ? selectedProgramas : allowedProgramas);
    return monthlyAggregates.reduce((sum, agg) => {
      if (!activeProgramas.includes(agg.programa)) return sum;
      return sum + agg.total;
    }, 0);
  }, [monthlyAggregates, selectedProgramas, allowedProgramas]);

  const exportCSV = () => {
    const headers = ['Nome', 'Email', 'Papel', 'Programas', 'Qtd Acessos', 'Último Acesso'];
    const rows = filteredData.map(row => [
      row.nome,
      row.email,
      row.role ? (roleLabelsMap[row.role] || row.role) : 'Sem papel',
      row.programas.map(p => programaLabels[p] || p).join('; '),
      row.accessCount.toString(),
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
            {filteredData.length} usuários · {filteredData.reduce((s, r) => s + r.accessCount, 0)} acessos totais
          </p>
        </div>
        <Button onClick={exportCSV} className="gap-2">
          <Download size={18} />
          Exportar CSV
        </Button>
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
        <h2 className="text-sm font-medium text-foreground">Acessos por mês e programa</h2>
        <p className="text-xs text-muted-foreground mb-3">Histórico completo — não é afetado pelos filtros de data acima.</p>
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

      <DataTable
        data={filteredData}
        columns={columns}
        keyExtractor={(row) => row.id}
        emptyMessage="Nenhum dado de acesso encontrado"
      />
    </div>
  );
}
