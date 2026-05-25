import { useEffect, useMemo, useState } from 'react';
import { History, Download, Loader2, Filter, Plus, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth, ProgramaType } from '@/contexts/AuthContext';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { programaLabels } from '@/config/roleConfig';
import { getAcaoLabel } from '@/config/acaoPermissions';

interface AlteracaoRow {
  id: string;
  registro_id: string | null;
  usuario_id: string | null;
  operacao: 'INSERT' | 'UPDATE' | 'DELETE' | null;
  alteracao: any;
  contexto: any;
  created_at: string;
}

const operacaoLabel: Record<string, { label: string; cls: string; icon: typeof Plus }> = {
  INSERT: { label: 'Criação', cls: 'bg-success/10 text-success border-success/20', icon: Plus },
  UPDATE: { label: 'Edição', cls: 'bg-warning/10 text-warning border-warning/20', icon: Pencil },
  DELETE: { label: 'Exclusão', cls: 'bg-destructive/10 text-destructive border-destructive/20', icon: Trash2 },
};

// Fields whose changes we never display (internal noise)
const HIDDEN_FIELDS = new Set(['id', 'created_at', 'updated_at']);

const FIELD_LABELS: Record<string, string> = {
  tipo: 'Tipo de ação',
  data: 'Data',
  escola_id: 'Escola/Entidade',
  aap_id: 'Responsável',
  segmento: 'Segmento',
  componente: 'Componente',
  ano_serie: 'Ano/Série',
  turma: 'Turma',
  observacoes: 'Observações',
  avancos: 'Avanços',
  dificuldades: 'Dificuldades',
  programa: 'Programa',
  status: 'Status',
  reagendada_para: 'Reagendada para',
  is_reagendada: 'Reagendada?',
  tags: 'Tags',
  projeto: 'Projeto',
  programacao_id: 'Programação',
  formacao_origem_id: 'Formação de origem',
};

function formatValue(v: any): string {
  if (v === null || v === undefined || v === '') return '—';
  if (Array.isArray(v)) return v.length ? v.join(', ') : '—';
  if (typeof v === 'boolean') return v ? 'Sim' : 'Não';
  return String(v);
}

export default function HistoricoAlteracoesPage() {
  const { isAdmin } = useAuth();
  const [rows, setRows] = useState<AlteracaoRow[]>([]);
  const [users, setUsers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [opFilter, setOpFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [programaFilter, setProgramaFilter] = useState<string>('all');
  const [tipoFilter, setTipoFilter] = useState<string>('all');

  const [detail, setDetail] = useState<AlteracaoRow | null>(null);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('registros_alteracoes')
          .select('id, registro_id, usuario_id, operacao, alteracao, contexto, created_at')
          .eq('tabela', 'registros_acao')
          .order('created_at', { ascending: false })
          .limit(2000);
        if (error) throw error;
        const list = (data || []) as AlteracaoRow[];
        setRows(list);

        const ids = Array.from(new Set(list.map(r => r.usuario_id).filter(Boolean))) as string[];
        if (ids.length) {
          const { data: profs } = await supabase
            .from('profiles')
            .select('id, nome')
            .in('id', ids);
          const map: Record<string, string> = {};
          (profs || []).forEach(p => { map[p.id] = p.nome; });
          setUsers(map);
        }
      } catch (e: any) {
        console.error(e);
        toast.error(e?.message || 'Erro ao carregar histórico');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const uniqueUsers = useMemo(() => {
    const ids = Array.from(new Set(rows.map(r => r.usuario_id).filter(Boolean))) as string[];
    return ids
      .map(id => ({ id, nome: users[id] || 'Usuário removido' }))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }));
  }, [rows, users]);

  const uniqueTipos = useMemo(() => {
    const set = new Set<string>();
    rows.forEach(r => { const t = r.contexto?.tipo; if (t) set.add(t); });
    return Array.from(set)
      .map(t => ({ tipo: t, label: getAcaoLabel(t) }))
      .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR', { sensitivity: 'base' }));
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (opFilter !== 'all' && r.operacao !== opFilter) return false;
      if (userFilter !== 'all' && r.usuario_id !== userFilter) return false;
      if (tipoFilter !== 'all' && r.contexto?.tipo !== tipoFilter) return false;
      if (programaFilter !== 'all') {
        const progs: string[] = Array.isArray(r.contexto?.programa) ? r.contexto.programa : [];
        if (!progs.includes(programaFilter)) return false;
      }
      if (dateFrom && r.created_at < dateFrom) return false;
      if (dateTo && r.created_at > dateTo + 'T23:59:59') return false;
      return true;
    });
  }, [rows, opFilter, userFilter, tipoFilter, programaFilter, dateFrom, dateTo]);

  const changedFieldsSummary = (r: AlteracaoRow): string => {
    if (r.operacao === 'UPDATE') {
      const cf = r.alteracao?.changed_fields || {};
      const keys = Object.keys(cf).filter(k => !HIDDEN_FIELDS.has(k));
      if (!keys.length) return '—';
      return keys.map(k => FIELD_LABELS[k] || k).join(', ');
    }
    if (r.operacao === 'INSERT') return 'Registro criado';
    if (r.operacao === 'DELETE') return 'Registro excluído';
    return '—';
  };

  const exportCSV = () => {
    const headers = ['Data/hora', 'Usuário', 'Operação', 'Tipo de ação', 'Escola/Entidade', 'Programa', 'Campos alterados'];
    const lines = filtered.map(r => [
      new Date(r.created_at).toLocaleString('pt-BR'),
      r.usuario_id ? (users[r.usuario_id] || r.usuario_id) : 'Sistema',
      operacaoLabel[r.operacao || '']?.label || r.operacao || '—',
      r.contexto?.tipo ? getAcaoLabel(r.contexto.tipo) : '—',
      r.contexto?.escola_nome || '—',
      Array.isArray(r.contexto?.programa) ? r.contexto.programa.map((p: string) => programaLabels[p as ProgramaType] || p).join('; ') : '—',
      changedFieldsSummary(r),
    ]);
    const csv = [headers, ...lines].map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historico-alteracoes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Histórico exportado!');
  };

  const columns = [
    {
      key: 'created_at',
      header: 'Data/hora',
      render: (r: AlteracaoRow) => (
        <span className="text-sm whitespace-nowrap text-muted-foreground">
          {new Date(r.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
        </span>
      ),
    },
    {
      key: 'usuario',
      header: 'Usuário',
      render: (r: AlteracaoRow) => (
        <span className="text-sm text-foreground">
          {r.usuario_id ? (users[r.usuario_id] || '—') : <span className="italic text-muted-foreground">Sistema</span>}
        </span>
      ),
    },
    {
      key: 'operacao',
      header: 'Operação',
      render: (r: AlteracaoRow) => {
        const info = operacaoLabel[r.operacao || ''];
        if (!info) return <span className="text-muted-foreground">—</span>;
        const Icon = info.icon;
        return (
          <Badge variant="outline" className={`${info.cls} gap-1`}>
            <Icon size={12} />
            {info.label}
          </Badge>
        );
      },
    },
    {
      key: 'tipo',
      header: 'Tipo de ação',
      render: (r: AlteracaoRow) => (
        <span className="text-sm text-foreground break-words min-w-0">
          {r.contexto?.tipo ? getAcaoLabel(r.contexto.tipo) : '—'}
        </span>
      ),
    },
    {
      key: 'escola',
      header: 'Escola/Entidade',
      render: (r: AlteracaoRow) => (
        <span className="text-sm text-muted-foreground break-words min-w-0">
          {r.contexto?.escola_nome || '—'}
        </span>
      ),
    },
    {
      key: 'programa',
      header: 'Programa',
      render: (r: AlteracaoRow) => {
        const progs: string[] = Array.isArray(r.contexto?.programa) ? r.contexto.programa : [];
        if (!progs.length) return <span className="text-muted-foreground text-xs">—</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {progs.map(p => (
              <span key={p} className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                {programaLabels[p as ProgramaType] || p}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      key: 'campos',
      header: 'Mudanças',
      render: (r: AlteracaoRow) => (
        <button
          onClick={() => setDetail(r)}
          className="text-sm text-primary underline-offset-2 hover:underline text-left"
        >
          {changedFieldsSummary(r)}
        </button>
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
            <History className="w-8 h-8 text-primary" />
            Histórico de Alterações
          </h1>
          <p className="page-subtitle">
            {filtered.length} eventos · criações, edições e exclusões em ações da Programação
          </p>
        </div>
        <Button onClick={exportCSV} className="gap-2">
          <Download size={18} />
          Exportar CSV
        </Button>
      </div>

      <div className="card p-4 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Filter size={16} /> Filtros
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div>
            <Label className="text-xs">De</Label>
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Até</Label>
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Operação</Label>
            <Select value={opFilter} onValueChange={setOpFilter}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="INSERT">Criação</SelectItem>
                <SelectItem value="UPDATE">Edição</SelectItem>
                <SelectItem value="DELETE">Exclusão</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Usuário</Label>
            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {uniqueUsers.map(u => (
                  <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Programa</Label>
            <Select value={programaFilter} onValueChange={setProgramaFilter}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="escolas">Programa de Escolas</SelectItem>
                <SelectItem value="regionais">Regionais de Ensino</SelectItem>
                <SelectItem value="redes_municipais">Redes Municipais</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="lg:col-span-2">
            <Label className="text-xs">Tipo de ação</Label>
            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {uniqueTipos.map(t => (
                  <SelectItem key={t.tipo} value={t.tipo}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        keyExtractor={(r) => r.id}
        emptyMessage="Nenhuma alteração encontrada"
      />

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto w-[95vw] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da alteração</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Data/hora</p>
                  <p className="font-medium">{new Date(detail.created_at).toLocaleString('pt-BR')}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Usuário</p>
                  <p className="font-medium">{detail.usuario_id ? (users[detail.usuario_id] || 'Usuário removido') : 'Sistema'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Operação</p>
                  <p className="font-medium">{operacaoLabel[detail.operacao || '']?.label || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tipo de ação</p>
                  <p className="font-medium break-words">{detail.contexto?.tipo ? getAcaoLabel(detail.contexto.tipo) : '—'}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs text-muted-foreground">Escola/Entidade</p>
                  <p className="font-medium break-words">{detail.contexto?.escola_nome || '—'}</p>
                </div>
              </div>

              {detail.operacao === 'UPDATE' && (
                <div>
                  <p className="text-xs font-semibold text-foreground mb-2">Campos alterados</p>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left px-3 py-2">Campo</th>
                          <th className="text-left px-3 py-2">Antes</th>
                          <th className="text-left px-3 py-2">Depois</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(detail.alteracao?.changed_fields || {})
                          .filter(([k]) => !HIDDEN_FIELDS.has(k))
                          .map(([k, v]: any) => (
                            <tr key={k} className="border-t">
                              <td className="px-3 py-2 font-medium align-top">{FIELD_LABELS[k] || k}</td>
                              <td className="px-3 py-2 text-muted-foreground align-top break-words">{formatValue(v?.antes)}</td>
                              <td className="px-3 py-2 text-foreground align-top break-words">{formatValue(v?.depois)}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {detail.operacao === 'INSERT' && (
                <div>
                  <p className="text-xs font-semibold text-foreground mb-2">Valores criados</p>
                  <pre className="text-xs bg-muted/50 p-3 rounded-lg overflow-x-auto max-h-72">
                    {JSON.stringify(detail.alteracao?.after, null, 2)}
                  </pre>
                </div>
              )}

              {detail.operacao === 'DELETE' && (
                <div>
                  <p className="text-xs font-semibold text-foreground mb-2">Valores excluídos</p>
                  <pre className="text-xs bg-muted/50 p-3 rounded-lg overflow-x-auto max-h-72">
                    {JSON.stringify(detail.alteracao?.before, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
