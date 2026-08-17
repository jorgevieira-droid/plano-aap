import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { Loader2, Download, FileText, Users, School } from 'lucide-react';
import { toast } from 'sonner';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAcoesByPrograma } from '@/hooks/useAcoesByPrograma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { MultiSelectFilter } from '@/components/forms/MultiSelectFilter';
import { exportSectionsToPdf } from '@/lib/pdfExport';

const sortPt = (a: string, b: string) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' });

export default function PainelEncaminhamentosInternosPage() {
  const { profile, isAdmin, hasRole, effectiveProgramas } = useAuth();
  const { isAcaoEnabledForPrograma, isLoading: loadingAcoes } = useAcoesByPrograma() as any;
  const navigate = useNavigate();

  const isGestorOrN3 = hasRole('gestor') || hasRole('n3_coordenador_programa');
  const programasHabilitados = useMemo(
    () => (effectiveProgramas || []).filter((p: string) =>
      isAcaoEnabledForPrograma('registro_encaminhamentos_internos' as any, p as any)),
    [effectiveProgramas, isAcaoEnabledForPrograma],
  );
  const allowed = isAdmin || (isGestorOrN3 && programasHabilitados.length > 0);

  useEffect(() => {
    if (profile && !loadingAcoes && !allowed) navigate('/unauthorized', { replace: true });
  }, [profile, allowed, loadingAcoes, navigate]);

  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [consultorIds, setConsultorIds] = useState<string[]>([]);
  const [escolaIds, setEscolaIds] = useState<string[]>([]);
  const [exporting, setExporting] = useState(false);

  const { data: rows, isLoading } = useQuery({
    queryKey: ['painel-encaminhamentos-internos'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('instrument_responses')
        .select(`
          id, registro_acao_id,
          registros_acao:registro_acao_id (
            id, data, aap_id, escola_id, programa, status,
            profiles:aap_id ( id, nome ),
            escolas:escola_id ( id, nome )
          )
        `)
        .eq('form_type', 'registro_encaminhamentos_internos');
      if (error) throw error;
      return (data || []).filter((r: any) => r.registros_acao?.status === 'realizada');
    },
    enabled: allowed,
  });

  const consultores = useMemo(() => {
    const m = new Map<string, string>();
    (rows || []).forEach((r: any) => {
      const p = r.registros_acao?.profiles;
      if (p?.id) m.set(p.id, p.nome);
    });
    return Array.from(m, ([value, label]) => ({ value, label })).sort((a, b) => sortPt(a.label, b.label));
  }, [rows]);

  const escolas = useMemo(() => {
    const m = new Map<string, string>();
    (rows || []).forEach((r: any) => {
      const e = r.registros_acao?.escolas;
      if (e?.id) m.set(e.id, e.nome);
    });
    return Array.from(m, ([value, label]) => ({ value, label })).sort((a, b) => sortPt(a.label, b.label));
  }, [rows]);

  const filtered = useMemo(() => (rows || []).filter((r: any) => {
    const reg = r.registros_acao;
    if (!reg) return false;
    if (consultorIds.length > 0 && !consultorIds.includes(reg.aap_id)) return false;
    if (escolaIds.length > 0 && !escolaIds.includes(reg.escola_id)) return false;
    if (dataInicio && reg.data < dataInicio) return false;
    if (dataFim && reg.data > dataFim) return false;
    return true;
  }), [rows, consultorIds, escolaIds, dataInicio, dataFim]);

  const porEscola = useMemo(() => {
    const m = new Map<string, number>();
    filtered.forEach((r: any) => {
      const nome = r.registros_acao?.escolas?.nome || 'Sem entidade';
      m.set(nome, (m.get(nome) || 0) + 1);
    });
    return Array.from(m, ([nome, qtd]) => ({ nome, qtd })).sort((a, b) => b.qtd - a.qtd || sortPt(a.nome, b.nome));
  }, [filtered]);

  const porConsultor = useMemo(() => {
    const m = new Map<string, number>();
    filtered.forEach((r: any) => {
      const nome = r.registros_acao?.profiles?.nome || 'Sem consultor(a)';
      m.set(nome, (m.get(nome) || 0) + 1);
    });
    return Array.from(m, ([nome, qtd]) => ({ nome, qtd })).sort((a, b) => b.qtd - a.qtd || sortPt(a.nome, b.nome));
  }, [filtered]);

  const totalConsultores = consultorIds.length > 0 ? consultorIds.length : porConsultor.length;
  const totalEscolas = escolaIds.length > 0 ? escolaIds.length : porEscola.length;

  const periodoLabel = `${dataInicio ? format(parseISO(dataInicio), 'dd/MM/yyyy') : '—'} a ${dataFim ? format(parseISO(dataFim), 'dd/MM/yyyy') : '—'}`;

  const handleExport = async () => {
    setExporting(true);
    try {
      const node = (
        <div style={{ padding: 24, fontFamily: 'Helvetica, Arial, sans-serif', width: 1000 }}>
          <h2 style={{ color: '#1a3a5c', borderBottom: '2px solid #1a3a5c', paddingBottom: 6 }}>
            Painel — Registro de Encaminhamentos Internos
          </h2>
          <p style={{ fontSize: 12, color: '#555' }}>Período: {periodoLabel}</p>
          <p style={{ fontSize: 13 }}>
            Total de registros: <strong>{filtered.length}</strong> · Consultores(as): <strong>{totalConsultores}</strong> · Escolas: <strong>{totalEscolas}</strong>
          </p>
          <h3 style={{ color: '#1a3a5c', marginTop: 16 }}>Registros por escola</h3>
          <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
            <tbody>
              {porEscola.map(l => (
                <tr key={l.nome}>
                  <td style={{ padding: 5, border: '1px solid #ddd' }}>{l.nome}</td>
                  <td style={{ padding: 5, border: '1px solid #ddd', textAlign: 'right' }}>{l.qtd}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <h3 style={{ color: '#1a3a5c', marginTop: 16 }}>Registros por consultor(a)</h3>
          <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
            <tbody>
              {porConsultor.map(l => (
                <tr key={l.nome}>
                  <td style={{ padding: 5, border: '1px solid #ddd' }}>{l.nome}</td>
                  <td style={{ padding: 5, border: '1px solid #ddd', textAlign: 'right' }}>{l.qtd}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      await exportSectionsToPdf(
        [{ node }],
        `painel-encaminhamentos-internos-${new Date().toISOString().split('T')[0]}.pdf`,
        { title: 'Painel - Registro de Encaminhamentos Internos', subtitle: `Período: ${periodoLabel}` },
      );
      toast.success('PDF gerado');
    } catch (e) {
      console.error(e);
      toast.error('Erro ao gerar PDF');
    } finally {
      setExporting(false);
    }
  };

  if (!allowed) return null;

  const kpiCards = [
    {
      label: 'Total de Registros no Período',
      value: filtered.length,
      icon: FileText,
      iconColor: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Consultores(as) selecionados',
      value: totalConsultores,
      icon: Users,
      iconColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      label: 'Escolas Selecionadas',
      value: totalEscolas,
      icon: School,
      iconColor: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
  ];

  return (
    <div className="min-w-0 space-y-8 overflow-x-hidden p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Painel - Registro de Encaminhamentos Internos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acompanhe os registros por consultor(a) e escola no período selecionado.
          </p>
        </div>
        <Button onClick={handleExport} disabled={exporting} className="shrink-0">
          {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
          Exportar PDF
        </Button>
      </div>

      {/* Filter bar */}
      <Card className="border shadow-sm">
        <CardContent className="grid grid-cols-1 gap-4 p-5 md:grid-cols-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Consultor(a)</Label>
            <MultiSelectFilter
              options={consultores}
              selected={consultorIds}
              onChange={setConsultorIds}
              allLabel="Todos(as)"
              itemNoun="Consultor(a)"
              width={240}
              triggerClassName="w-full"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Escola</Label>
            <MultiSelectFilter
              options={escolas}
              selected={escolaIds}
              onChange={setEscolaIds}
              allLabel="Todas"
              itemNoun="Escola"
              width={240}
              triggerClassName="w-full"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Data Início</Label>
            <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Data Fim</Label>
            <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {kpiCards.map((c) => (
              <Card key={c.label} className="border shadow-sm">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className={cn('rounded-lg p-3', c.bgColor)}>
                    <c.icon className={cn('h-6 w-6', c.iconColor)} />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-tight text-muted-foreground">{c.label}</p>
                    <p className="text-3xl font-bold text-foreground">{String(c.value).padStart(2, '0')}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tables */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <Card className="border shadow-sm">
              <CardHeader className="border-b bg-muted/30 px-6 py-4">
                <CardTitle className="text-base font-semibold text-foreground">Registros por Escola</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[70vh] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-muted">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Escola</th>
                        <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">Qtd de Registros</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {porEscola.length === 0 ? (
                        <tr>
                          <td colSpan={2} className="px-6 py-8 text-center text-muted-foreground">
                            Nenhum registro no período.
                          </td>
                        </tr>
                      ) : (
                        porEscola.map((l) => (
                          <tr key={l.nome} className="transition-colors hover:bg-muted/40">
                            <td className="min-w-0 max-w-xs break-words px-6 py-3 font-medium text-foreground">{l.nome}</td>
                            <td className="px-6 py-3 text-right font-semibold text-foreground">{l.qtd}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader className="border-b bg-muted/30 px-6 py-4">
                <CardTitle className="text-base font-semibold text-foreground">Registros por Consultor(a)</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[70vh] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-muted">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Consultor(a)</th>
                        <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">Qtd de Registros</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {porConsultor.length === 0 ? (
                        <tr>
                          <td colSpan={2} className="px-6 py-8 text-center text-muted-foreground">
                            Nenhum registro no período.
                          </td>
                        </tr>
                      ) : (
                        porConsultor.map((l) => (
                          <tr key={l.nome} className="transition-colors hover:bg-muted/40">
                            <td className="min-w-0 max-w-xs break-words px-6 py-3 font-medium text-foreground">{l.nome}</td>
                            <td className="px-6 py-3 text-right font-semibold text-foreground">{l.qtd}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

import { cn } from '@/lib/utils';
