import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { Loader2, Download, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { exportSectionsToPdf } from '@/lib/pdfExport';
import { ACAO_TYPE_INFO } from '@/config/acaoPermissions';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { classifyRegionaisAction, BUCKET_LABEL, BUCKET_BADGE_VARIANT, getDiasAtraso, type RegionaisBucket } from '@/lib/regionaisActionStatus';

const sortAZ = (a: string, b: string) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' });

const fechamentoLabel = (v?: string | null) => {
  if (!v) return '—';
  const m: Record<string, string> = {
    sim: 'Sim',
    parcialmente: 'Parcialmente',
    nao: 'Não',
  };
  return m[v] || v;
};

interface RegistroRow {
  id: string;
  data: string;
  aap_id: string;
  escola_id: string;
  programa: string[] | null;
  status: string;
  reagendada_para: string | null;
  programacao_id: string | null;
  profiles?: { id: string; nome: string } | null;
  escolas?: { id: string; nome: string } | null;
  programacoes?: { id: string; titulo?: string; descricao?: string; tags?: string[] | null; horario_inicio?: string; horario_fim?: string; projeto?: string | null; local_escolas?: string[] | null; local_outro?: string | null } | null;
}

export default function RelatorioRegionaisPage() {
  const { profile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const isGestorOrN3 = profile?.role === 'gestor' || profile?.role === 'n3_coordenador_programa';
  const hasRegionais = (profile?.programas || []).includes('regionais' as any);
  const allowed = isAdmin || (isGestorOrN3 && hasRegionais);

  useEffect(() => {
    if (profile && !allowed) navigate('/unauthorized', { replace: true });
  }, [profile, allowed, navigate]);

  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [atorId, setAtorId] = useState('todos');
  const [escolaId, setEscolaId] = useState('todos');
  const [rubricaTipo, setRubricaTipo] = useState('todos');
  const [statusFiltro, setStatusFiltro] = useState<'todos' | RegionaisBucket>('todos');
  const [exporting, setExporting] = useState(false);

  // 1. Registros de Monitoramento - Regionais (todos os status)
  const { data: registros, isLoading: loadingReg } = useQuery({
    queryKey: ['rel-regionais-registros'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('registros_acao')
        .select(`
          id, data, aap_id, escola_id, programa, status, reagendada_para, programacao_id,
          profiles:aap_id ( id, nome ),
          escolas:escola_id ( id, nome ),
          programacoes:programacao_id ( id, titulo, descricao, tags, horario_inicio, horario_fim, projeto, local_escolas, local_outro )
        `)
        .eq('tipo', 'monitoramento_acoes_formativas')
        .contains('programa', ['regionais'])
        .order('data', { ascending: false });
      if (error) throw error;
      return (data || []) as RegistroRow[];
    },
    enabled: allowed,
  });

  const registroIds = useMemo(() => (registros || []).map(r => r.id), [registros]);

  // 2. Relatórios encaminhamentos
  const { data: relatorios } = useQuery({
    queryKey: ['rel-regionais-relatorios', registroIds.length],
    queryFn: async () => {
      if (registroIds.length === 0) return [];
      const { data, error } = await (supabase as any)
        .from('relatorios_monit_acoes_formativas')
        .select('registro_acao_id, fechamento, encaminhamentos, observacoes, avancos, dificuldades')
        .in('registro_acao_id', registroIds);
      if (error) throw error;
      return data || [];
    },
    enabled: allowed && registroIds.length > 0,
  });

  // 3. Presenças
  const { data: presencas } = useQuery({
    queryKey: ['rel-regionais-presencas', registroIds.length],
    queryFn: async () => {
      if (registroIds.length === 0) return [];
      const { data, error } = await (supabase as any)
        .from('presencas')
        .select('registro_acao_id, presente, professor_id, professores:professor_id ( id, nome, cargo )')
        .in('registro_acao_id', registroIds);
      if (error) throw error;
      return data || [];
    },
    enabled: allowed && registroIds.length > 0,
  });

  // 4. Rubricas (instrument_responses)
  const { data: rubricas } = useQuery({
    queryKey: ['rel-regionais-rubricas', registroIds.length],
    queryFn: async () => {
      if (registroIds.length === 0) return [];
      const { data, error } = await (supabase as any)
        .from('instrument_responses')
        .select('id, registro_acao_id, form_type, responses, created_at')
        .in('registro_acao_id', registroIds)
        .not('form_type', 'in', '(monitoramento_acoes_formativas,lista_presenca)');
      if (error) throw error;
      return data || [];
    },
    enabled: allowed && registroIds.length > 0,
  });

  // 5. Instrument fields para os tipos presentes nas respostas
  const formTypes = useMemo(() => Array.from(new Set((rubricas || []).map((r: any) => r.form_type))), [rubricas]);

  const { data: instrumentFields } = useQuery({
    queryKey: ['rel-regionais-fields', formTypes.join(',')],
    queryFn: async () => {
      if (formTypes.length === 0) return [];
      const { data, error } = await (supabase as any)
        .from('instrument_fields')
        .select('form_type, field_key, label, dimension, sort_order, scale_min, scale_max')
        .in('form_type', formTypes)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: allowed && formTypes.length > 0,
  });

  const fieldsByForm = useMemo(() => {
    const m = new Map<string, any[]>();
    (instrumentFields || []).forEach((f: any) => {
      const arr = m.get(f.form_type) || [];
      arr.push(f);
      m.set(f.form_type, arr);
    });
    return m;
  }, [instrumentFields]);

  // Agrupar por registro
  const dataByRegistro = useMemo(() => {
    const map = new Map<string, { relatorio?: any; presencas: any[]; rubricas: any[] }>();
    (registros || []).forEach(r => map.set(r.id, { presencas: [], rubricas: [] }));
    (relatorios || []).forEach((r: any) => {
      const e = map.get(r.registro_acao_id); if (e) e.relatorio = r;
    });
    (presencas || []).forEach((p: any) => {
      const e = map.get(p.registro_acao_id); if (e) e.presencas.push(p);
    });
    (rubricas || []).forEach((rb: any) => {
      const e = map.get(rb.registro_acao_id); if (e) e.rubricas.push(rb);
    });
    return map;
  }, [registros, relatorios, presencas, rubricas]);

  // Filtros: opções
  const atores = useMemo(() => {
    const m = new Map<string, string>();
    (registros || []).forEach(r => { if (r.profiles?.id) m.set(r.profiles.id, r.profiles.nome); });
    return Array.from(m, ([id, nome]) => ({ id, nome })).sort((a, b) => sortAZ(a.nome, b.nome));
  }, [registros]);

  const escolasOpts = useMemo(() => {
    const m = new Map<string, string>();
    (registros || []).forEach(r => { if (r.escolas?.id) m.set(r.escolas.id, r.escolas.nome); });
    return Array.from(m, ([id, nome]) => ({ id, nome })).sort((a, b) => sortAZ(a.nome, b.nome));
  }, [registros]);

  const rubricaTipos = useMemo(() => {
    const set = new Set<string>();
    (rubricas || []).forEach((r: any) => set.add(r.form_type));
    return Array.from(set).sort((a, b) => sortAZ(ACAO_TYPE_INFO[a as any]?.label || a, ACAO_TYPE_INFO[b as any]?.label || b));
  }, [rubricas]);

  // Filtragem
  const filtered = useMemo(() => {
    return (registros || []).filter(r => {
      if (atorId !== 'todos' && r.aap_id !== atorId) return false;
      if (escolaId !== 'todos' && r.escola_id !== escolaId) return false;
      if (dataInicio && r.data < dataInicio) return false;
      if (dataFim && r.data > dataFim) return false;
      if (rubricaTipo !== 'todos') {
        const list = dataByRegistro.get(r.id)?.rubricas || [];
        if (!list.some((x: any) => x.form_type === rubricaTipo)) return false;
      }
      return true;
    });
  }, [registros, atorId, escolaId, dataInicio, dataFim, rubricaTipo, dataByRegistro]);

  // Resumo topo
  const resumo = useMemo(() => {
    let presentesTot = 0;
    let acoesComRubrica = 0;
    const numsAll: number[] = [];
    filtered.forEach(r => {
      const e = dataByRegistro.get(r.id);
      const presList = e?.presencas || [];
      presentesTot += presList.filter((p: any) => p.presente).length;
      const rb = e?.rubricas || [];
      if (rb.length > 0) acoesComRubrica++;
      rb.forEach((x: any) => {
        const vals = Object.values(x.responses || {}).filter((v: any) => typeof v === 'number' && v > 0) as number[];
        numsAll.push(...vals);
      });
    });
    const media = numsAll.length ? numsAll.reduce((a, b) => a + b, 0) / numsAll.length : 0;
    return {
      total: filtered.length,
      comRubrica: acoesComRubrica,
      presentes: presentesTot,
      media,
    };
  }, [filtered, dataByRegistro]);

  const localTexto = (p?: RegistroRow['programacoes']) => {
    if (!p) return '';
    const parts: string[] = [];
    if (p.local_escolas?.length) parts.push(p.local_escolas.join(', '));
    if (p.local_outro) parts.push(p.local_outro);
    return parts.join(' / ');
  };

  const handleExportExcel = () => {
    try {
      const wb = XLSX.utils.book_new();
      const acoes = filtered.map(r => {
        const e = dataByRegistro.get(r.id);
        const rel = e?.relatorio || {};
        return {
          Data: r.data ? format(parseISO(r.data), 'dd/MM/yyyy') : '',
          'Hora início': r.programacoes?.horario_inicio || '',
          'Hora fim': r.programacoes?.horario_fim || '',
          Título: r.programacoes?.titulo || '',
          Descrição: r.programacoes?.descricao || '',
          Tags: (r.programacoes?.tags || []).join('; '),
          Projeto: r.programacoes?.projeto || '',
          Local: localTexto(r.programacoes || undefined),
          'Escola/Regional': r.escolas?.nome || '',
          'Ator do Programa': r.profiles?.nome || '',
          Fechamento: fechamentoLabel(rel.fechamento),
          Encaminhamentos: rel.encaminhamentos || '',
          Observações: rel.observacoes || '',
          Avanços: rel.avancos || '',
          Dificuldades: rel.dificuldades || '',
        };
      });
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(acoes), 'Ações');

      const presLines: any[] = [];
      filtered.forEach(r => {
        const e = dataByRegistro.get(r.id);
        (e?.presencas || []).forEach((p: any) => {
          presLines.push({
            Data: r.data ? format(parseISO(r.data), 'dd/MM/yyyy') : '',
            'Escola/Regional': r.escolas?.nome || '',
            Participante: p.professores?.nome || '',
            Cargo: p.professores?.cargo || '',
            Presente: p.presente ? 'Sim' : 'Não',
          });
        });
      });
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(presLines.length ? presLines : [{}]), 'Presenças');

      const rubLines: any[] = [];
      filtered.forEach(r => {
        const e = dataByRegistro.get(r.id);
        (e?.rubricas || []).forEach((rb: any) => {
          const fields = fieldsByForm.get(rb.form_type) || [];
          fields.forEach((f: any) => {
            const v = rb.responses?.[f.field_key];
            if (v === undefined || v === null) return;
            rubLines.push({
              Data: r.data ? format(parseISO(r.data), 'dd/MM/yyyy') : '',
              'Escola/Regional': r.escolas?.nome || '',
              Instrumento: ACAO_TYPE_INFO[rb.form_type as any]?.label || rb.form_type,
              Dimensão: f.dimension || '',
              Critério: f.label,
              Resposta: typeof v === 'object' ? JSON.stringify(v) : v,
            });
          });
        });
      });
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rubLines.length ? rubLines : [{}]), 'Rubricas');

      XLSX.writeFile(wb, `relatorio-regionais-${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Excel gerado');
    } catch (e) {
      console.error(e); toast.error('Erro ao gerar Excel');
    }
  };

  const handleExportPdf = async () => {
    setExporting(true);
    try {
      const sections = filtered.map(r => {
        const e = dataByRegistro.get(r.id);
        const rel = e?.relatorio || {};
        const presList = e?.presencas || [];
        const presentes = presList.filter((p: any) => p.presente).length;
        const node = (
          <div style={{ padding: 16, fontFamily: 'Helvetica, Arial, sans-serif', width: 1000, fontSize: 12, color: '#222' }}>
            <h2 style={{ color: '#1a3a5c', borderBottom: '2px solid #1a3a5c', paddingBottom: 6, marginBottom: 8 }}>
              {r.programacoes?.titulo || 'Monitoramento de Ações Formativas'}
            </h2>
            <table style={{ width: '100%', fontSize: 11, marginBottom: 10 }}>
              <tbody>
                <tr><td><b>Data:</b> {r.data ? format(parseISO(r.data), 'dd/MM/yyyy') : '—'}</td>
                    <td><b>Horário:</b> {r.programacoes?.horario_inicio || '—'} – {r.programacoes?.horario_fim || '—'}</td></tr>
                <tr><td><b>Escola/Regional:</b> {r.escolas?.nome || '—'}</td>
                    <td><b>Ator do Programa:</b> {r.profiles?.nome || '—'}</td></tr>
                {r.programacoes?.projeto ? <tr><td colSpan={2}><b>Projeto:</b> {r.programacoes?.projeto}</td></tr> : null}
                {localTexto(r.programacoes || undefined) ? <tr><td colSpan={2}><b>Local:</b> {localTexto(r.programacoes || undefined)}</td></tr> : null}
                {(r.programacoes?.tags || []).length ? <tr><td colSpan={2}><b>Tags:</b> {(r.programacoes?.tags || []).join(', ')}</td></tr> : null}
              </tbody>
            </table>

            <h3 style={{ color: '#1a3a5c', fontSize: 13, marginTop: 8 }}>Resumo de Encaminhamentos</h3>
            <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
              <tbody>
                <tr><td style={{ border: '1px solid #ddd', padding: 4, width: 160 }}><b>Fechamento</b></td><td style={{ border: '1px solid #ddd', padding: 4 }}>{fechamentoLabel(rel.fechamento)}</td></tr>
                <tr><td style={{ border: '1px solid #ddd', padding: 4 }}><b>Encaminhamentos</b></td><td style={{ border: '1px solid #ddd', padding: 4, whiteSpace: 'pre-wrap' }}>{rel.encaminhamentos || '—'}</td></tr>
                <tr><td style={{ border: '1px solid #ddd', padding: 4 }}><b>Observações</b></td><td style={{ border: '1px solid #ddd', padding: 4, whiteSpace: 'pre-wrap' }}>{rel.observacoes || '—'}</td></tr>
                <tr><td style={{ border: '1px solid #ddd', padding: 4 }}><b>Avanços</b></td><td style={{ border: '1px solid #ddd', padding: 4, whiteSpace: 'pre-wrap' }}>{rel.avancos || '—'}</td></tr>
                <tr><td style={{ border: '1px solid #ddd', padding: 4 }}><b>Dificuldades</b></td><td style={{ border: '1px solid #ddd', padding: 4, whiteSpace: 'pre-wrap' }}>{rel.dificuldades || '—'}</td></tr>
              </tbody>
            </table>

            <h3 style={{ color: '#1a3a5c', fontSize: 13, marginTop: 12 }}>
              Presenças ({presentes}/{presList.length})
            </h3>
            {presList.length > 0 ? (
              <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f3f4f6' }}>
                    <th style={{ border: '1px solid #ddd', padding: 4, textAlign: 'left' }}>Participante</th>
                    <th style={{ border: '1px solid #ddd', padding: 4, textAlign: 'left' }}>Cargo</th>
                    <th style={{ border: '1px solid #ddd', padding: 4 }}>Presente</th>
                  </tr>
                </thead>
                <tbody>
                  {[...presList].sort((a: any, b: any) => sortAZ(a.professores?.nome || '', b.professores?.nome || '')).map((p: any, i: number) => (
                    <tr key={i}>
                      <td style={{ border: '1px solid #ddd', padding: 4 }}>{p.professores?.nome || '—'}</td>
                      <td style={{ border: '1px solid #ddd', padding: 4 }}>{p.professores?.cargo || '—'}</td>
                      <td style={{ border: '1px solid #ddd', padding: 4, textAlign: 'center' }}>{p.presente ? 'Sim' : 'Não'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p style={{ fontSize: 11, color: '#777' }}>Sem registros de presença.</p>}

            {(e?.rubricas || []).length > 0 && (
              <>
                <h3 style={{ color: '#1a3a5c', fontSize: 13, marginTop: 12 }}>Rubricas Respondidas</h3>
                {(e?.rubricas || []).map((rb: any) => {
                  const fields = fieldsByForm.get(rb.form_type) || [];
                  return (
                    <div key={rb.id} style={{ marginBottom: 10 }}>
                      <p style={{ fontWeight: 600, margin: '6px 0' }}>{ACAO_TYPE_INFO[rb.form_type as any]?.label || rb.form_type}</p>
                      <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: '#f3f4f6' }}>
                            <th style={{ border: '1px solid #ddd', padding: 4, textAlign: 'left' }}>Dimensão</th>
                            <th style={{ border: '1px solid #ddd', padding: 4, textAlign: 'left' }}>Critério</th>
                            <th style={{ border: '1px solid #ddd', padding: 4 }}>Nota</th>
                          </tr>
                        </thead>
                        <tbody>
                          {fields.map((f: any) => {
                            const v = rb.responses?.[f.field_key];
                            if (v === undefined || v === null || v === '') return null;
                            return (
                              <tr key={f.field_key}>
                                <td style={{ border: '1px solid #ddd', padding: 4 }}>{f.dimension || '—'}</td>
                                <td style={{ border: '1px solid #ddd', padding: 4 }}>{f.label}</td>
                                <td style={{ border: '1px solid #ddd', padding: 4, textAlign: 'center' }}>
                                  {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        );
        return { node };
      });

      if (sections.length === 0) {
        toast.info('Nenhuma ação para exportar');
        return;
      }

      await exportSectionsToPdf(sections as any, `relatorio-regionais-${new Date().toISOString().split('T')[0]}.pdf`, { title: 'Relatório - Programa de Regionais' });
      toast.success('PDF gerado');
    } catch (e) {
      console.error(e); toast.error('Erro ao gerar PDF');
    } finally {
      setExporting(false);
    }
  };

  if (!allowed || loadingReg) {
    return <div className="flex items-center justify-center min-h-[300px]"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Relatório - Programa de Regionais</h1>
          <p className="text-sm text-muted-foreground">
            Encaminhamentos, presenças e rubricas por ação realizada
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportExcel}>
            <FileSpreadsheet className="w-4 h-4 mr-2" /> Baixar Excel
          </Button>
          <Button onClick={handleExportPdf} disabled={exporting}>
            {exporting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
            Baixar PDF
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-5 gap-4">
          <div><Label>Data início</Label><Input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} /></div>
          <div><Label>Data fim</Label><Input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} /></div>
          <div>
            <Label>Escola / Regional</Label>
            <Select value={escolaId} onValueChange={setEscolaId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas</SelectItem>
                {escolasOpts.map(e => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Ator do Programa</Label>
            <Select value={atorId} onValueChange={setAtorId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {atores.map(a => <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Rubrica preenchida</Label>
            <Select value={rubricaTipo} onValueChange={setRubricaTipo}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas</SelectItem>
                {rubricaTipos.map(t => <SelectItem key={t} value={t}>{ACAO_TYPE_INFO[t as any]?.label || t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="pt-4"><div className="text-xs text-muted-foreground">Ações realizadas</div><div className="text-2xl font-bold">{resumo.total}</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-xs text-muted-foreground">Com rubrica</div><div className="text-2xl font-bold">{resumo.comRubrica}</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-xs text-muted-foreground">Participantes presentes</div><div className="text-2xl font-bold">{resumo.presentes}</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-xs text-muted-foreground">Média geral rubricas</div><div className="text-2xl font-bold">{resumo.media ? resumo.media.toFixed(2) : '—'}</div></CardContent></Card>
      </div>

      <div className="space-y-4">
        {filtered.length === 0 && (
          <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhuma ação encontrada com os filtros atuais.</CardContent></Card>
        )}
        {filtered.map(r => {
          const e = dataByRegistro.get(r.id);
          const rel = e?.relatorio;
          const presList = e?.presencas || [];
          const presentes = presList.filter((p: any) => p.presente).length;
          const rb = e?.rubricas || [];
          return (
            <Card key={r.id} data-pdf-section>
              <CardHeader>
                <div className="flex items-start justify-between gap-3 flex-wrap min-w-0">
                  <div className="min-w-0">
                    <CardTitle className="text-base break-words">{r.programacoes?.titulo || 'Monitoramento de Ações Formativas'}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      {r.data ? format(parseISO(r.data), 'dd/MM/yyyy') : '—'}
                      {r.programacoes?.horario_inicio ? ` · ${r.programacoes.horario_inicio}–${r.programacoes.horario_fim || ''}` : ''}
                      {' · '}{r.escolas?.nome || '—'} · {r.profiles?.nome || '—'}
                    </p>
                    {(r.programacoes?.tags || []).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(r.programacoes?.tags || []).map(t => <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>)}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-right shrink-0">
                    <div>Presentes: <b>{presentes}/{presList.length}</b></div>
                    <div>Rubricas: <b>{rb.length}</b></div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm mb-2">Encaminhamentos</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div><span className="text-muted-foreground">Fechamento:</span> {fechamentoLabel(rel?.fechamento)}</div>
                    <div className="md:col-span-2"><span className="text-muted-foreground">Encaminhamentos:</span><div className="whitespace-pre-wrap">{rel?.encaminhamentos || '—'}</div></div>
                    <div><span className="text-muted-foreground">Observações:</span><div className="whitespace-pre-wrap">{rel?.observacoes || '—'}</div></div>
                    <div><span className="text-muted-foreground">Avanços:</span><div className="whitespace-pre-wrap">{rel?.avancos || '—'}</div></div>
                    <div className="md:col-span-2"><span className="text-muted-foreground">Dificuldades:</span><div className="whitespace-pre-wrap">{rel?.dificuldades || '—'}</div></div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-sm mb-2">Presenças</h4>
                  {presList.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sem registros de presença.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr><th className="text-left p-2">Participante</th><th className="text-left p-2">Cargo</th><th className="p-2">Presente</th></tr>
                        </thead>
                        <tbody>
                          {[...presList].sort((a: any, b: any) => sortAZ(a.professores?.nome || '', b.professores?.nome || '')).map((p: any, i: number) => (
                            <tr key={i} className="border-b">
                              <td className="p-2">{p.professores?.nome || '—'}</td>
                              <td className="p-2">{p.professores?.cargo || '—'}</td>
                              <td className="p-2 text-center">{p.presente ? 'Sim' : 'Não'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {rb.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Rubricas respondidas</h4>
                    <div className="space-y-3">
                      {rb.map((x: any) => {
                        const fields = fieldsByForm.get(x.form_type) || [];
                        return (
                          <div key={x.id} className="border rounded-md p-3">
                            <p className="font-medium text-sm mb-2">{ACAO_TYPE_INFO[x.form_type as any]?.label || x.form_type}</p>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead className="bg-muted/50">
                                  <tr><th className="text-left p-2">Dimensão</th><th className="text-left p-2">Critério</th><th className="p-2">Nota</th></tr>
                                </thead>
                                <tbody>
                                  {fields.map((f: any) => {
                                    const v = x.responses?.[f.field_key];
                                    if (v === undefined || v === null || v === '') return null;
                                    return (
                                      <tr key={f.field_key} className="border-b">
                                        <td className="p-2">{f.dimension || '—'}</td>
                                        <td className="p-2">{f.label}</td>
                                        <td className="p-2 text-center font-semibold">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
