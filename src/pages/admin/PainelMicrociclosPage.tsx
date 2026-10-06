import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, Search, Download, ClipboardCheck, Clock, Users, Info, FileText, ArrowLeft, BarChart3 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { calcularHorasFormacao } from '@/lib/utils';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { usePersistedState } from '@/hooks/usePersistedState';
import { ListPagination } from '@/components/ui/list-pagination';
import { usePagedList } from '@/hooks/usePagedList';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import logoPe from '@/assets/pe-logo-branco-horizontal.png';
import logoBussola from '@/assets/logo-bussola-branco.png';

type ChartMetric = 'score' | 'encontros' | 'horas' | 'avaliacao' | 'visitas';
const METRICAS: { value: ChartMetric; label: string; unidade: string }[] = [
  { value: 'score', label: 'Score', unidade: '0–100' },
  { value: 'encontros', label: 'Encontros', unidade: 'qtd' },
  { value: 'horas', label: 'Horas', unidade: 'h' },
  { value: 'avaliacao', label: 'Avaliação', unidade: 'escala 1–4' },
  { value: 'visitas', label: 'Visitas', unidade: 'qtd' },
];
const metricValue = (r: EntidadeRank, m: ChartMetric): number | null =>
  m === 'score' ? r.score : m === 'encontros' ? r.encontros : m === 'horas' ? r.horas
    : m === 'avaliacao' ? (r.avaliacaoMedia !== null ? Math.round(r.avaliacaoMedia * 100) / 100 : null) : r.visitas;

const loadImg = (src: string) => new Promise<HTMLImageElement>((res, rej) => {
  const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src;
});

interface VisitaRow {
  data: string;
  notas: number[];
  escola_id: string | null;
  entidade_filho_id: string | null;
  programa: string[] | null;
}

interface EncontroRow {
  data: string;
  escola_id: string | null;
  entidade_filho_id: string | null;
  programa: string[] | null;
  horas: number;
  pctPresenca: number | null;
}

interface EntidadeRank {
  key: string;
  nome: string;
  redeNome?: string;
  visitas: number;
  avaliacaoMedia: number | null;
  encontros: number;
  horas: number;
  presencaMedia: number | null;
  notaAvaliacao: number | null;
  notaPresenca: number | null;
  notaHoras: number | null;
  score: number;
}

const NOTA_CAMPOS = ['nota_q17', 'nota_q18', 'nota_q19', 'nota_q20', 'nota_q21', 'nota_q22'] as const;

const PROGRAMAS = [
  { value: 'escolas', label: 'Escolas' },
  { value: 'regionais', label: 'Regionais' },
  { value: 'redes_municipais', label: 'Redes Municipais' },
];

const tipoNoPeriodo = (data: string, inicio: string, fim: string) =>
  (!inicio || data >= inicio) && (!fim || data <= fim);

export default function PainelMicrociclosPage() {
  const [dataInicio, setDataInicio] = usePersistedState('painel-microciclos:dataInicio', '');
  const [dataFim, setDataFim] = usePersistedState('painel-microciclos:dataFim', '');
  const [selectedPrograma, setSelectedPrograma] = usePersistedState('painel-microciclos:selectedPrograma', 'all');
  const [selectedRede, setSelectedRede] = usePersistedState('painel-microciclos:selectedRede', 'todas');
  const [selectedEscola, setSelectedEscola] = usePersistedState('painel-microciclos:selectedEscola', 'todas');
  const [activeTab, setActiveTab] = usePersistedState('painel-microciclos:activeTab', 'rede');
  const [chartMetric, setChartMetric] = usePersistedState<ChartMetric>('painel-microciclos:chartMetric', 'score');
  const [pdfProgress, setPdfProgress] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const [visitas, setVisitas] = useState<VisitaRow[]>([]);
  const [encontros, setEncontros] = useState<EncontroRow[]>([]);
  const [redes, setRedes] = useState<{ id: string; nome: string }[]>([]);
  const [entidadesFilho, setEntidadesFilho] = useState<{ id: string; nome: string; escola_id: string }[]>([]);

  useEffect(() => {
    supabase.from('escolas').select('id, nome').eq('ativa', true).order('nome')
      .then(({ data }) => { if (data) setRedes(data); });
    supabase.from('entidades_filho').select('id, nome, escola_id').eq('ativa', true).order('nome')
      .then(({ data }) => { if (data) setEntidadesFilho(data); });
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);

    // Visitas Técnicas - Microciclos (status enviado) com vínculo via registros_acao
    let visQuery = supabase
      .from('relatorios_visita_tecnica_microciclos')
      .select('id, data, registro_acao_id, nota_q17, nota_q18, nota_q19, nota_q20, nota_q21, nota_q22')
      .eq('status', 'enviado')
      .order('data', { ascending: false });
    if (dataInicio) visQuery = visQuery.gte('data', dataInicio);
    if (dataFim) visQuery = visQuery.lte('data', dataFim);
    const { data: visData } = await visQuery;

    // Sem FK entre as tabelas: busca os registros_acao separadamente e junta no cliente
    const visRegIds = Array.from(new Set((visData || []).map((v: any) => v.registro_acao_id).filter(Boolean)));
    const regById = new Map<string, { escola_id: string | null; entidade_filho_id: string | null; programa: string[] | null }>();
    if (visRegIds.length > 0) {
      const { data: visRegData } = await supabase
        .from('registros_acao')
        .select('id, escola_id, entidade_filho_id, programa')
        .in('id', visRegIds);
      (visRegData || []).forEach((r: any) => regById.set(r.id, r));
    }

    const visitasRows: VisitaRow[] = (visData || []).map((v: any) => {
      const reg = regById.get(v.registro_acao_id);
      return {
        data: v.data,
        notas: NOTA_CAMPOS.map(c => v[c]).filter((n: any) => typeof n === 'number'),
        escola_id: reg?.escola_id ?? null,
        entidade_filho_id: reg?.entidade_filho_id ?? null,
        programa: reg?.programa ?? null,
      };
    });

    // Encontros Formativos - Microciclos realizados
    let encQuery = supabase
      .from('programacoes')
      .select('id, data, horario_inicio, horario_fim, escola_id, programa')
      .eq('tipo', 'encontro_microciclos_recomposicao')
      .eq('status', 'realizada')
      .order('data', { ascending: false });
    if (dataInicio) encQuery = encQuery.gte('data', dataInicio);
    if (dataFim) encQuery = encQuery.lte('data', dataFim);
    const { data: encData } = await encQuery;
    const progRows = encData || [];

    // Registros e presenças dos encontros
    let encontroRows: EncontroRow[] = [];
    if (progRows.length > 0) {
      const progIds = progRows.map((p: any) => p.id);
      const { data: regData } = await supabase
        .from('registros_acao')
        .select('id, programacao_id, escola_id, entidade_filho_id, programa')
        .in('programacao_id', progIds);
      const regRows = regData || [];
      const regIds = regRows.map((r: any) => r.id);

      const presencasPorRegistro = new Map<string, { presente: boolean }[]>();
      if (regIds.length > 0) {
        const { data: presData } = await supabase
          .from('presencas')
          .select('registro_acao_id, presente')
          .in('registro_acao_id', regIds);
        (presData || []).forEach((p: any) => {
          const arr = presencasPorRegistro.get(p.registro_acao_id) || [];
          arr.push({ presente: p.presente });
          presencasPorRegistro.set(p.registro_acao_id, arr);
        });
      }

      encontroRows = progRows.map((p: any) => {
        const regs = regRows.filter((r: any) => r.programacao_id === p.id);
        let total = 0; let presentes = 0;
        regs.forEach((r: any) => {
          const linhas = presencasPorRegistro.get(r.id) || [];
          total += linhas.length;
          presentes += linhas.filter((l: any) => l.presente).length;
        });
        return {
          data: p.data,
          escola_id: p.escola_id ?? null,
          entidade_filho_id: regs.find((r: any) => r.entidade_filho_id)?.entidade_filho_id ?? null,
          programa: p.programa ?? null,
          horas: calcularHorasFormacao(p.horario_inicio, p.horario_fim),
          pctPresenca: total > 0 ? (presentes / total) * 100 : null,
        };
      });
    }

    setVisitas(visitasRows);
    setEncontros(encontroRows);
    setIsLoading(false);
    setHasLoaded(true);
  }, [dataInicio, dataFim]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ===== Agregação por entidade =====
  const buildRanking = useCallback(
    (scope: 'rede' | 'escola'): EntidadeRank[] => {
      const visitasFiltradas = visitas.filter(v =>
        (selectedPrograma === 'all' || (v.programa || []).includes(selectedPrograma)) &&
        (scope === 'escola' ? v.entidade_filho_id : v.escola_id)
      );
      const encontrosFiltrados = encontros.filter(e =>
        (selectedPrograma === 'all' || (e.programa || []).includes(selectedPrograma)) &&
        (scope === 'escola' ? e.entidade_filho_id : e.escola_id)
      );

      const map = new Map<string, {
        nome: string; redeNome?: string; visitas: number[]; presencas: number[];
        encontros: number; horas: number;
      }>();

      if (scope === 'rede') {
        visitasFiltradas.forEach(v => {
          const e = map.get(v.escola_id!) || { nome: redes.find(r => r.id === v.escola_id)?.nome || '—', visitas: [] as number[], presencas: [] as number[], encontros: 0, horas: 0 };
          e.visitas.push(...v.notas);
          map.set(v.escola_id!, e);
        });
        encontrosFiltrados.forEach(e => {
          const cur = map.get(e.escola_id!) || { nome: redes.find(r => r.id === e.escola_id)?.nome || '—', visitas: [] as number[], presencas: [] as number[], encontros: 0, horas: 0 };
          cur.encontros += 1;
          cur.horas += e.horas;
          if (e.pctPresenca !== null) cur.presencas.push(e.pctPresenca);
          map.set(e.escola_id!, cur);
        });
      } else {
        visitasFiltradas.forEach(v => {
          const ef = entidadesFilho.find(x => x.id === v.entidade_filho_id);
          const e = map.get(v.entidade_filho_id!) || { nome: ef?.nome || '—', redeNome: redes.find(r => r.id === ef?.escola_id)?.nome || '—', visitas: [] as number[], presencas: [] as number[], encontros: 0, horas: 0 };
          e.visitas.push(...v.notas);
          map.set(v.entidade_filho_id!, e);
        });
        encontrosFiltrados.forEach(e => {
          const ef = entidadesFilho.find(x => x.id === e.entidade_filho_id);
          const cur = map.get(e.entidade_filho_id!) || { nome: ef?.nome || '—', redeNome: redes.find(r => r.id === ef?.escola_id)?.nome || '—', visitas: [] as number[], presencas: [] as number[], encontros: 0, horas: 0 };
          cur.encontros += 1;
          cur.horas += e.horas;
          if (e.pctPresenca !== null) cur.presencas.push(e.pctPresenca);
          map.set(e.entidade_filho_id!, cur);
        });
      }

      const media = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
      const maxHoras = Math.max(0, ...Array.from(map.values()).map(v => v.horas));

      const ranks: EntidadeRank[] = Array.from(map.entries()).map(([key, v]) => {
        const avaliacaoMedia = media(v.visitas);
        const notaAvaliacao = avaliacaoMedia !== null ? ((avaliacaoMedia - 1) / 3) * 100 : null;
        const presencaMedia = media(v.presencas);
        const notaPresenca = presencaMedia;
        const notaHoras = v.horas > 0 && maxHoras > 0 ? (v.horas / maxHoras) * 100 : null;
        const disponiveis = [notaAvaliacao, notaPresenca, notaHoras].filter((n): n is number => n !== null);
        const score = disponiveis.length > 0 ? Math.round(disponiveis.reduce((a, b) => a + b, 0) / disponiveis.length) : 0;
        return {
          key,
          nome: v.nome,
          redeNome: v.redeNome,
          visitas: (scope === 'rede' ? visitasFiltradas.filter(x => x.escola_id === key) : visitasFiltradas.filter(x => x.entidade_filho_id === key)).length,
          avaliacaoMedia,
          encontros: v.encontros,
          horas: Math.round(v.horas * 10) / 10,
          presencaMedia: presencaMedia !== null ? Math.round(presencaMedia) : null,
          notaAvaliacao: notaAvaliacao !== null ? Math.round(notaAvaliacao) : null,
          notaPresenca: notaPresenca !== null ? Math.round(notaPresenca) : null,
          notaHoras: notaHoras !== null ? Math.round(notaHoras) : null,
          score,
        };
      });

      return ranks
        .filter(r => r.nome !== '—')
        .sort((a, b) => b.score - a.score || a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }));
    },
    [visitas, encontros, redes, entidadesFilho, selectedPrograma]
  );

  const rankingRede = useMemo(() => buildRanking('rede'), [buildRanking]);
  const rankingEscola = useMemo(() => buildRanking('escola'), [buildRanking]);

  // Opções dos dropdowns derivadas dos rankings (só entidades com dados no período)
  const redesOptions = useMemo(
    () => [...rankingRede].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' })),
    [rankingRede]
  );
  const escolasOptions = useMemo(() => {
    const base = selectedRede === 'todas'
      ? rankingEscola
      : rankingEscola.filter(r => entidadesFilho.find(ef => ef.id === r.key)?.escola_id === selectedRede);
    return [...base].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }));
  }, [rankingEscola, selectedRede, entidadesFilho]);

  // Ao trocar a Rede, reseta a Escola se ela não pertencer à nova Rede
  useEffect(() => {
    if (selectedEscola === 'todas' || selectedRede === 'todas') return;
    const ef = entidadesFilho.find(x => x.id === selectedEscola);
    if (ef && ef.escola_id !== selectedRede) setSelectedEscola('todas');
  }, [selectedRede, selectedEscola, entidadesFilho, setSelectedEscola]);

  const rankingRedeFiltrado = useMemo(
    () => (selectedRede === 'todas' ? rankingRede : rankingRede.filter(r => r.key === selectedRede)),
    [rankingRede, selectedRede]
  );
  const rankingEscolaFiltrado = useMemo(() => {
    let base = rankingEscola;
    if (selectedRede !== 'todas') {
      base = base.filter(r => entidadesFilho.find(ef => ef.id === r.key)?.escola_id === selectedRede);
    }
    if (selectedEscola !== 'todas') {
      base = base.filter(r => r.key === selectedEscola);
    }
    return base;
  }, [rankingEscola, selectedRede, selectedEscola, entidadesFilho]);

  const rankingFiltrado = useMemo(
    () => (activeTab === 'rede' ? rankingRedeFiltrado : rankingEscolaFiltrado),
    [activeTab, rankingRedeFiltrado, rankingEscolaFiltrado]
  );

  const paged = usePagedList(rankingFiltrado, 50);

  const maxHorasRanking = useMemo(() => {
    const base = activeTab === 'rede' ? rankingRede : rankingEscola;
    return Math.max(0, ...base.map(r => r.horas));
  }, [activeTab, rankingRede, rankingEscola]);

  const resumo = useMemo(() => {
    const matchRede = (escolaId: string | null) => selectedRede === 'todas' || escolaId === selectedRede;
    const matchEscola = (efId: string | null) => selectedEscola === 'todas' || efId === selectedEscola;
    const vis = visitas.filter(v => matchRede(v.escola_id) && matchEscola(v.entidade_filho_id));
    const enc = encontros.filter(e => matchRede(e.escola_id) && matchEscola(e.entidade_filho_id));
    const todasNotas = vis.flatMap(v => v.notas);
    return {
      visitas: vis.length,
      avaliacaoGeral: todasNotas.length ? todasNotas.reduce((a, b) => a + b, 0) / todasNotas.length : null,
      encontros: enc.length,
      horas: enc.reduce((a, e) => a + e.horas, 0),
    };
  }, [visitas, encontros, selectedRede, selectedEscola]);

  const exportToExcel = useCallback(() => {
    try {
      const wb = XLSX.utils.book_new();
      const build = (ranks: EntidadeRank[], colName: string) => ranks.map((r, i) => ({
        'Posição': i + 1,
        [colName]: r.nome,
        ...(colName === 'Escola' ? { 'Rede': r.redeNome || '' } : {}),
        'Visitas': r.visitas,
        'Avaliação Média (1-4)': r.avaliacaoMedia !== null ? Math.round(r.avaliacaoMedia * 100) / 100 : '',
        'Encontros': r.encontros,
        'Horas de Formação': r.horas,
        'Presença Média (%)': r.presencaMedia !== null ? r.presencaMedia : '',
        'Score (0-100)': r.score,
      }));
      const wsRede = XLSX.utils.json_to_sheet(build(rankingRedeFiltrado, 'Rede'));
      wsRede['!cols'] = [{ wch: 10 }, { wch: 35 }, { wch: 10 }, { wch: 20 }, { wch: 12 }, { wch: 18 }, { wch: 18 }, { wch: 14 }];
      XLSX.utils.book_append_sheet(wb, wsRede, 'Por Rede');
      const wsEscola = XLSX.utils.json_to_sheet(build(rankingEscolaFiltrado, 'Escola'));
      wsEscola['!cols'] = [{ wch: 10 }, { wch: 35 }, { wch: 30 }, { wch: 10 }, { wch: 20 }, { wch: 12 }, { wch: 18 }, { wch: 18 }, { wch: 14 }];
      XLSX.utils.book_append_sheet(wb, wsEscola, 'Por Escola');
      XLSX.writeFile(wb, `painel_microciclos_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      toast.success('Excel exportado com sucesso!');
    } catch (e) {
      console.error('Erro ao exportar Excel:', e);
      toast.error('Erro ao exportar Excel');
    }
  }, [rankingRedeFiltrado, rankingEscolaFiltrado]);

  const scoreBadge = (score: number) =>
    score >= 75 ? 'default' : score >= 50 ? 'secondary' : 'destructive';

  const fmtData = (d: string) => format(parseISO(d + (d.length === 10 ? 'T00:00:00' : '')), 'dd/MM/yyyy', { locale: ptBR });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <TrendingUp className="h-6 w-6" />
          Painel - Microciclos
          {isLoading && hasLoaded && (
            <span className="text-xs font-normal text-muted-foreground animate-pulse">atualizando…</span>
          )}
        </h1>
        <Button onClick={exportToExcel} variant="outline" className="gap-2" disabled={isLoading || !hasLoaded || (rankingRede.length === 0 && rankingEscola.length === 0)}>
          <Download className="h-4 w-4" />
          Exportar Excel
        </Button>
      </div>
      <p className="text-muted-foreground">
        Ranking de Redes e Escolas com a melhor implementação do programa de microciclos
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Data Início</Label>
              <Input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Data Fim</Label>
              <Input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Programa</Label>
              <Select value={selectedPrograma} onValueChange={setSelectedPrograma}>
                <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {PROGRAMAS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Rede</Label>
              <Select value={selectedRede} onValueChange={setSelectedRede}>
                <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  {redesOptions.map(r => <SelectItem key={r.key} value={r.key}>{r.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Escola</Label>
              <Select value={selectedEscola} onValueChange={setSelectedEscola}>
                <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  {escolasOptions.map(e => <SelectItem key={e.key} value={e.key}>{e.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <ClipboardCheck className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{resumo.visitas}</p>
              <p className="text-xs text-muted-foreground">Visitas Técnicas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{resumo.avaliacaoGeral !== null ? resumo.avaliacaoGeral.toFixed(2) : '—'}</p>
              <p className="text-xs text-muted-foreground">Avaliação média (1–4)</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{resumo.encontros}</p>
              <p className="text-xs text-muted-foreground">Encontros realizados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <Clock className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{Math.round(resumo.horas * 10) / 10}h</p>
              <p className="text-xs text-muted-foreground">Horas de formação</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Memória de cálculo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="h-4 w-4" />
            Memória de Cálculo do Indicador (Score 0–100)
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong className="text-foreground">1. Avaliação das Visitas Técnicas</strong> — média das notas das perguntas 17 a 22 das visitas (escala 1–4), normalizada para 0–100: <code className="text-xs">nota = (média − 1) ÷ 3 × 100</code>.
          </p>
          <p>
            <strong className="text-foreground">2. Presença</strong> — percentual médio de presentes nos Encontros Formativos – Microciclos realizados (presentes ÷ convidados × 100).
          </p>
          <p>
            <strong className="text-foreground">3. Horas de Formação</strong> — horas acumuladas nos encontros, normalizadas pela maior carga entre as entidades no período: <code className="text-xs">nota = horas ÷ {maxHorasRanking || 0}h × 100</code>.
          </p>
          <p>
            <strong className="text-foreground">Score final</strong> — média simples dos indicadores disponíveis. Entidade sem encontros não é penalizada: o indicador ausente é excluído da média, não zerado.
          </p>
          <p className="text-xs">
            Exemplo: rede com avaliação média 3,5 (nota 83), presença média 90% (nota 90) e 12h de formação quando a maior carga é 24h (nota 50) → score = (83 + 90 + 50) ÷ 3 = <strong className="text-foreground">74</strong>.
          </p>
        </CardContent>
      </Card>

      {/* Gráfico */}
      <Card>
        <CardHeader className="space-y-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            {activeTab === 'rede' ? 'Redes' : 'Escolas'} por {METRICAS.find(m => m.value === chartMetric)?.label} ({METRICAS.find(m => m.value === chartMetric)?.unidade})
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            {METRICAS.map(m => (
              <Button key={m.value} size="sm" variant={chartMetric === m.value ? 'default' : 'outline'} onClick={() => setChartMetric(m.value)}>
                {m.label}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem dados para o gráfico.</p>
          ) : (
            <>
              <div style={{ height: Math.max(220, chartData.length * 28 + 40) }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" domain={chartMetric === 'score' ? [0, 100] : chartMetric === 'avaliacao' ? [0, 4] : [0, 'auto']} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis type="category" dataKey="nome" width={200} stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v: string) => v.length > 30 ? v.slice(0, 29) + '…' : v} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--popover-foreground))' }} />
                    <Bar dataKey="valor" name={METRICAS.find(m => m.value === chartMetric)?.label} fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {chartTotal > 20 && <p className="text-xs text-muted-foreground mt-2">Mostrando as 20 primeiras de {chartTotal}.</p>}
            </>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="rede" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <TabsList>
            <TabsTrigger value="rede">Por Rede</TabsTrigger>
            <TabsTrigger value="escola">Por Escola</TabsTrigger>
          </TabsList>
          {activeTab === 'escola' && selectedRede !== 'todas' && (
            <Button variant="outline" size="sm" className="gap-2" onClick={() => { setSelectedRede('todas'); setSelectedEscola('todas'); setActiveTab('rede'); }}>
              <ArrowLeft className="h-4 w-4" /> Voltar para todas as Redes
            </Button>
          )}
        </div>

        <TabsContent value="rede" className="mt-4">
          <p className="text-xs text-muted-foreground mb-2">Clique em uma Rede para ver as escolas.</p>
          <RankingTable ranking={paged.items} scope="rede" scoreBadge={scoreBadge} fmtData={fmtData} cobertura={cobertura} onRedeClick={(key) => { setSelectedRede(key); setSelectedEscola('todas'); setActiveTab('escola'); }} />
          <ListPagination paged={paged} itemLabel="rede(s)" />
        </TabsContent>

        <TabsContent value="escola" className="mt-4">
          <RankingTable ranking={paged.items} scope="escola" scoreBadge={scoreBadge} fmtData={fmtData} />
          <ListPagination paged={paged} itemLabel="escola(s)" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RankingTable({ ranking, scope, scoreBadge, onRedeClick, cobertura }: {
  ranking: EntidadeRank[];
  cobertura?: Map<string, { com: number; total: number }>;
  onRedeClick?: (key: string) => void;
  scope: 'rede' | 'escola';
  scoreBadge: (s: number) => 'default' | 'secondary' | 'destructive';
  fmtData: (d: string) => string;
}) {
  if (ranking.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Nenhuma entidade com visitas ou encontros de microciclos no período.</p>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-center p-3 font-medium">#</th>
                <th className="text-left p-3 font-medium">{scope === 'rede' ? 'Rede' : 'Escola'}</th>
                {scope === 'escola' && <th className="text-left p-3 font-medium">Rede</th>}
                <th className="text-center p-3 font-medium">Visitas</th>
                <th className="text-center p-3 font-medium">Avaliação (1–4)</th>
                <th className="text-center p-3 font-medium">Encontros</th>
                <th className="text-center p-3 font-medium">Horas</th>
                <th className="text-center p-3 font-medium">Presença</th>
                <th className="text-center p-3 font-medium">Score</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((r, i) => (
                <tr
                  key={r.key}
                  className={`border-b hover:bg-muted/50 ${onRedeClick ? 'cursor-pointer' : ''}`}
                  onClick={onRedeClick ? () => onRedeClick(r.key) : undefined}
                  title={onRedeClick ? 'Ver escolas desta Rede' : undefined}
                >
                  <td className="p-3 text-center font-medium">{i + 1}º</td>
                  <td className="p-3 font-medium break-words min-w-0">
                    <span className={onRedeClick ? 'text-primary underline-offset-2 hover:underline' : ''}>{r.nome}</span>
                    {cobertura?.get(r.key) && (
                      <span className="block text-xs font-normal text-muted-foreground">
                        {cobertura.get(r.key)!.com} de {cobertura.get(r.key)!.total} escolas com dados
                      </span>
                    )}
                  </td>
                  {scope === 'escola' && <td className="p-3 break-words min-w-0">{r.redeNome || ''}</td>}
                  <td className="p-3 text-center">{r.visitas}</td>
                  <td className="p-3 text-center">{r.avaliacaoMedia !== null ? r.avaliacaoMedia.toFixed(2) : '—'}</td>
                  <td className="p-3 text-center">{r.encontros > 0 ? r.encontros : '—'}</td>
                  <td className="p-3 text-center">{r.horas > 0 ? `${r.horas}h` : '—'}</td>
                  <td className="p-3 text-center">{r.presencaMedia !== null ? `${r.presencaMedia}%` : '—'}</td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Badge variant={scoreBadge(r.score)}>{r.score}</Badge>
                      <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, r.score)}%` }} />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
