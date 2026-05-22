import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ClipboardCheck, Loader2, Filter, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LabelList, LineChart, Line } from 'recharts';

import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/ui/StatCard';
import { classifyRegionaisAction, type RegionaisBucket } from '@/lib/regionaisActionStatus';

const sortAZ = (a: string, b: string) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' });

interface RegistroRow {
  id: string;
  data: string;
  status: string;
  reagendada_para: string | null;
  escola_id: string | null;
  programa: string[] | null;
}
interface RelatorioRow {
  registro_acao_id: string;
  frente_trabalho: string | null;
  fechamento: string | null;
  observacoes: string | null;
  avancos: string | null;
  dificuldades: string | null;
  encaminhamentos: string | null;
}
interface PresencaRow { registro_acao_id: string; presente: boolean }
interface RespostaRow { registro_acao_id: string; form_type: string }
interface EscolaRow { id: string; nome: string }

const RUBRICA_EXCLUDED = new Set(['monitoramento_acoes_formativas', 'lista_presenca']);

const mesLabel = (m: number) => ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][m - 1];

export default function MonitoramentoRegionaisBlock() {
  const currentYear = new Date().getFullYear();
  const [dataInicio, setDataInicio] = useState(`${currentYear}-01-01`);
  const [dataFim, setDataFim] = useState(`${currentYear}-12-31`);
  const [frente, setFrente] = useState<string>('todas');
  const [entidade, setEntidade] = useState<string>('todas');

  const { data, isLoading } = useQuery({
    queryKey: ['dash-monit-regionais', dataInicio, dataFim],
    queryFn: async () => {
      const { data: regs, error: e1 } = await supabase
        .from('registros_acao')
        .select('id, data, status, reagendada_para, escola_id, programa')
        .eq('tipo', 'monitoramento_acoes_formativas')
        .contains('programa', ['regionais'])
        .gte('data', dataInicio)
        .lte('data', dataFim);
      if (e1) throw e1;
      const registros = (regs || []) as RegistroRow[];
      const ids = registros.map(r => r.id);

      const escolaIds = [...new Set(registros.map(r => r.escola_id).filter(Boolean) as string[])];

      const [relRes, presRes, respRes, escRes] = await Promise.all([
        ids.length
          ? supabase.from('relatorios_monit_acoes_formativas')
              .select('registro_acao_id, frente_trabalho, fechamento, observacoes, avancos, dificuldades, encaminhamentos')
              .in('registro_acao_id', ids)
          : Promise.resolve({ data: [], error: null } as any),
        ids.length
          ? supabase.from('presencas').select('registro_acao_id, presente').in('registro_acao_id', ids)
          : Promise.resolve({ data: [], error: null } as any),
        ids.length
          ? supabase.from('instrument_responses').select('registro_acao_id, form_type').in('registro_acao_id', ids)
          : Promise.resolve({ data: [], error: null } as any),
        escolaIds.length
          ? supabase.from('escolas').select('id, nome').in('id', escolaIds)
          : Promise.resolve({ data: [], error: null } as any),
      ]);

      return {
        registros,
        relatorios: (relRes.data || []) as RelatorioRow[],
        presencas: (presRes.data || []) as PresencaRow[],
        respostas: (respRes.data || []) as RespostaRow[],
        escolas: (escRes.data || []) as EscolaRow[],
      };
    },
  });

  const filtered = useMemo(() => {
    if (!data) return null;
    const relByReg = new Map(data.relatorios.map(r => [r.registro_acao_id, r]));
    const escolaById = new Map(data.escolas.map(e => [e.id, e.nome]));

    const registros = data.registros.filter(r => {
      const rel = relByReg.get(r.id);
      if (frente !== 'todas' && (rel?.frente_trabalho || 'Sem frente') !== frente) return false;
      if (entidade !== 'todas' && r.escola_id !== entidade) return false;
      return true;
    });

    const ids = new Set(registros.map(r => r.id));
    const relatorios = data.relatorios.filter(r => ids.has(r.registro_acao_id));
    const presencas = data.presencas.filter(p => ids.has(p.registro_acao_id));
    const respostas = data.respostas.filter(p => ids.has(p.registro_acao_id));

    return { registros, relatorios, presencas, respostas, escolaById, relByReg };
  }, [data, frente, entidade]);

  const frenteOptions = useMemo(() => {
    if (!data) return [] as string[];
    return [...new Set(data.relatorios.map(r => r.frente_trabalho || 'Sem frente'))].sort(sortAZ);
  }, [data]);

  const entidadeOptions = useMemo(() => {
    if (!data) return [] as { id: string; nome: string }[];
    const idsInScope = new Set(data.registros.map(r => r.escola_id).filter(Boolean) as string[]);
    return data.escolas.filter(e => idsInScope.has(e.id)).sort((a, b) => sortAZ(a.nome, b.nome));
  }, [data]);

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border border-border p-6 flex items-center justify-center min-h-[160px]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!filtered) return null;

  const total = filtered.registros.length;
  const buckets: Record<RegionaisBucket, number> = { realizada: 0, prevista: 0, atrasada: 0, pendente: 0, cancelada: 0 };
  filtered.registros.forEach(r => { buckets[classifyRegionaisAction(r)]++; });
  const realizadas = buckets.realizada;
  const baseTaxa = total - buckets.cancelada;
  const taxa = baseTaxa > 0 ? Math.round((realizadas / baseTaxa) * 100) : 0;
  const comFechamento = filtered.relatorios.filter(r => (r.fechamento || '').trim()).length;
  const respValidas = filtered.respostas.filter(r => !RUBRICA_EXCLUDED.has(r.form_type));
  const regsComRubrica = new Set(respValidas.map(r => r.registro_acao_id)).size;
  const totalRubricas = respValidas.length;
  const totalPresencas = filtered.presencas.filter(p => p.presente).length;

  const comAvancos = filtered.relatorios.filter(r => (r.avancos || '').trim()).length;
  const comDificuldades = filtered.relatorios.filter(r => (r.dificuldades || '').trim()).length;
  const comEncaminhamentos = filtered.relatorios.filter(r => (r.encaminhamentos || '').trim()).length;

  // Por frente
  const porFrenteMap = new Map<string, number>();
  filtered.registros.filter(r => r.status === 'realizada').forEach(r => {
    const rel = filtered.relByReg.get(r.id);
    const k = rel?.frente_trabalho || 'Sem frente';
    porFrenteMap.set(k, (porFrenteMap.get(k) || 0) + 1);
  });
  const porFrente = [...porFrenteMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, value]) => ({ name, value }));

  // Por entidade
  const porEntidadeMap = new Map<string, number>();
  filtered.registros.filter(r => r.status === 'realizada').forEach(r => {
    const k = (r.escola_id && filtered.escolaById.get(r.escola_id)) || 'Sem entidade';
    porEntidadeMap.set(k, (porEntidadeMap.get(k) || 0) + 1);
  });
  const porEntidade = [...porEntidadeMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, value]) => ({ name, value }));

  // Evolução mensal
  const mesMap = new Map<string, { mes: string; previstas: number; realizadas: number; pendentes: number; sortKey: string }>();
  filtered.registros.forEach(r => {
    const d = new Date(r.data);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = `${mesLabel(d.getMonth() + 1)}/${String(d.getFullYear()).slice(2)}`;
    const cur = mesMap.get(key) || { mes: label, previstas: 0, realizadas: 0, pendentes: 0, sortKey: key };
    cur.previstas += 1;
    if (r.status === 'realizada') cur.realizadas += 1;
    if (classifyRegionaisAction(r) === 'pendente') cur.pendentes += 1;
    mesMap.set(key, cur);
  });
  const evolucao = [...mesMap.values()].sort((a, b) => a.sortKey.localeCompare(b.sortKey));

  const limparFiltros = () => {
    setDataInicio(`${currentYear}-01-01`);
    setDataFim(`${currentYear}-12-31`);
    setFrente('todas');
    setEntidade('todas');
  };

  return (
    <div className="bg-card rounded-xl border border-border p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h3 className="card-title flex items-center gap-2">
          <ClipboardCheck size={20} className="text-primary" />
          Monitoramento de Ações Formativas (Regionais)
        </h3>
      </div>

      {/* Filtros locais */}
      <div className="flex flex-wrap items-end gap-3 bg-muted/30 rounded-lg p-4">
        <div className="flex items-center gap-2 mr-2 mb-1">
          <Filter size={16} className="text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Filtros</span>
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Data início</Label>
          <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="w-[160px]" />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Data fim</Label>
          <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="w-[160px]" />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Frente de trabalho</Label>
          <Select value={frente} onValueChange={setFrente}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              {frenteOptions.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Entidade</Label>
          <Select value={entidade} onValueChange={setEntidade}>
            <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              {entidadeOptions.map(e => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button variant="ghost" size="sm" onClick={limparFiltros} className="ml-auto">
          <X size={14} className="mr-1" /> Limpar
        </Button>
      </div>

      {total === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Sem ações de monitoramento no período/escopo selecionado.
        </p>
      ) : (
        <>
          {/* Indicadores - lifecycle */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
            <StatCard title="Programadas" value={total} />
            <StatCard title="Realizadas" value={realizadas} variant="primary" />
            <StatCard title="Taxa de realização" value={`${taxa}%`} />
            <StatCard title="Previstas em aberto" value={buckets.prevista} />
            <StatCard title="Atrasadas" value={buckets.atrasada} />
            <StatCard title="Pendentes" value={buckets.pendente} />
            <StatCard title="Canceladas" value={buckets.cancelada} />
            <StatCard title="Com fechamento" value={comFechamento} />
            <StatCard title="Com rubrica" value={regsComRubrica} />
            <StatCard title="Rubricas respondidas" value={totalRubricas} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <StatCard title="Presenças registradas" value={totalPresencas} />
          </div>

          {/* Resumo qualitativo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-lg border border-border bg-muted/20 p-4">
              <p className="text-xs text-muted-foreground">Relatórios com Avanços</p>
              <p className="text-2xl font-bold">{comAvancos}</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/20 p-4">
              <p className="text-xs text-muted-foreground">Relatórios com Dificuldades</p>
              <p className="text-2xl font-bold">{comDificuldades}</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/20 p-4">
              <p className="text-xs text-muted-foreground">Relatórios com Encaminhamentos</p>
              <p className="text-2xl font-bold">{comEncaminhamentos}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Realizadas por Frente de trabalho</h4>
              {porFrente.length === 0 ? (
                <p className="text-xs text-muted-foreground">Sem dados.</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={porFrente} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <YAxis type="category" dataKey="name" width={140} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    <Bar dataKey="value" name="Realizadas" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Realizadas por Entidade</h4>
              {porEntidade.length === 0 ? (
                <p className="text-xs text-muted-foreground">Sem dados.</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={porEntidade} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <YAxis type="category" dataKey="name" width={160} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    <Bar dataKey="value" name="Realizadas" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {evolucao.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Evolução mensal</h4>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={evolucao}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="mes" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Legend />
                  <Line type="monotone" dataKey="previstas" name="Programadas" stroke="hsl(var(--muted-foreground))" strokeWidth={2} />
                  <Line type="monotone" dataKey="realizadas" name="Realizadas" stroke="hsl(var(--primary))" strokeWidth={2} />
                  <Line type="monotone" dataKey="pendentes" name="Pendentes" stroke="hsl(var(--destructive))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}
