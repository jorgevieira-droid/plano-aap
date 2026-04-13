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

interface AccessRow {
  id: string;
  nome: string;
  email: string;
  role: AppRole | null;
  programas: ProgramaType[];
  accessCount: number;
  lastAccess: string | null;
}

export default function RelatorioAcessosPage() {
  const { isAdmin } = useAuth();
  const [data, setData] = useState<AccessRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProgramas, setSelectedProgramas] = useState<ProgramaType[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [profilesRes, rolesRes, programasRes, accessRes] = await Promise.all([
        supabase.from('profiles').select('id, nome, email').order('nome'),
        supabase.from('user_roles').select('user_id, role'),
        supabase.from('user_programas').select('user_id, programa'),
        supabase.from('user_access_log').select('user_id, accessed_at').order('accessed_at', { ascending: false }),
      ]);

      if (profilesRes.error) throw profilesRes.error;

      const accessMap = new Map<string, { count: number; lastAccess: string; entries: string[] }>();
      (accessRes.data || []).forEach(row => {
        const existing = accessMap.get(row.user_id);
        if (existing) {
          existing.count++;
          existing.entries.push(row.accessed_at);
        } else {
          accessMap.set(row.user_id, { count: 1, lastAccess: row.accessed_at, entries: [row.accessed_at] });
        }
      });

      const rows: AccessRow[] = (profilesRes.data || []).map(profile => {
        const userRole = rolesRes.data?.find(r => r.user_id === profile.id);
        const userProgramas = programasRes.data
          ?.filter(p => p.user_id === profile.id)
          .map(p => p.programa as ProgramaType) || [];
        const accessData = accessMap.get(profile.id);

        return {
          id: profile.id,
          nome: profile.nome,
          email: profile.email,
          role: (userRole?.role as AppRole) || null,
          programas: userProgramas,
          accessCount: accessData?.count || 0,
          lastAccess: accessData?.lastAccess || null,
        };
      });

      setData(rows);
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
      result = result.filter(row =>
        row.programas.some(p => selectedProgramas.includes(p))
      );
    }

    // Date filter is approximate — we filter by lastAccess for simplicity
    if (dateFrom) {
      result = result.filter(row => row.lastAccess && row.lastAccess >= dateFrom);
    }
    if (dateTo) {
      const toEnd = dateTo + 'T23:59:59';
      result = result.filter(row => row.lastAccess && row.lastAccess <= toEnd);
    }

    return result;
  }, [data, selectedProgramas, dateFrom, dateTo]);

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
    setSelectedProgramas(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    );
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
      render: (row: AccessRow) => (
        row.role ? (
          <Badge variant="outline" className={getRoleTierColor(row.role)}>
            {roleLabelsMap[row.role] || row.role}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        )
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
      render: (row: AccessRow) => (
        <span className="font-medium text-foreground">{row.accessCount}</span>
      ),
    },
    {
      key: 'lastAccess',
      header: 'Último Acesso',
      render: (row: AccessRow) => (
        <span className="text-muted-foreground text-xs">
          {row.lastAccess
            ? new Date(row.lastAccess).toLocaleDateString('pt-BR', {
                day: '2-digit', month: '2-digit', year: '2-digit',
                hour: '2-digit', minute: '2-digit',
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
              {(['escolas', 'regionais', 'redes_municipais'] as ProgramaType[]).map(p => (
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
            <Input
              id="dateFrom"
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="dateTo" className="text-xs">Até</Label>
            <Input
              id="dateTo"
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
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
