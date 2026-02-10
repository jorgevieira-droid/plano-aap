import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { History, Search, Users, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { calcularHorasFormacao, professorAtivoNaFormacao } from '@/lib/utils';

interface FormacaoData {
  id: string;
  titulo: string;
  data: string;
  horario_inicio: string;
  horario_fim: string;
  segmento: string;
  componente: string;
  escola_id: string;
  escola_nome: string;
  formador_nome: string;
  programa: string[] | null;
}

interface ProfessorData {
  id: string;
  nome: string;
  escola_id: string;
  escola_nome: string;
  segmento: string;
  componente: string;
  ativo: boolean;
  created_at: string;
  data_desativacao: string | null;
}

interface PresencaData {
  professor_id: string;
  registro_acao_id: string;
  presente: boolean;
}

interface RegistroAcaoData {
  id: string;
  programacao_id: string | null;
  data: string;
}

export default function HistoricoPresencaPage() {
  const [escolas, setEscolas] = useState<{ id: string; nome: string }[]>([]);
  const [selectedEscola, setSelectedEscola] = useState('all');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [formacoes, setFormacoes] = useState<FormacaoData[]>([]);
  const [professores, setProfessores] = useState<ProfessorData[]>([]);
  const [presencas, setPresencas] = useState<PresencaData[]>([]);
  const [registros, setRegistros] = useState<RegistroAcaoData[]>([]);

  useEffect(() => {
    supabase.from('escolas').select('id, nome').eq('ativa', true).order('nome')
      .then(({ data }) => { if (data) setEscolas(data); });
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      // Fetch formações realizadas
      let formQuery = supabase
        .from('programacoes')
        .select('id, titulo, data, horario_inicio, horario_fim, segmento, componente, escola_id, programa, escolas!inner(nome), profiles!programacoes_aap_id_fkey(nome)')
        .eq('tipo', 'formacao')
        .eq('status', 'realizada')
        .order('data', { ascending: false });

      if (selectedEscola !== 'all') formQuery = formQuery.eq('escola_id', selectedEscola);
      if (dataInicio) formQuery = formQuery.gte('data', dataInicio);
      if (dataFim) formQuery = formQuery.lte('data', dataFim);

      const { data: formData } = await formQuery;
      const mappedFormacoes: FormacaoData[] = (formData || []).map((f: any) => ({
        id: f.id, titulo: f.titulo, data: f.data,
        horario_inicio: f.horario_inicio, horario_fim: f.horario_fim,
        segmento: f.segmento, componente: f.componente,
        escola_id: f.escola_id, escola_nome: f.escolas?.nome || '',
        formador_nome: f.profiles?.nome || '', programa: f.programa,
      }));
      setFormacoes(mappedFormacoes);

      // Fetch registros_acao for these formações
      const formIds = mappedFormacoes.map(f => f.id);
      if (formIds.length > 0) {
        const { data: regData } = await supabase
          .from('registros_acao')
          .select('id, programacao_id, data')
          .in('programacao_id', formIds);
        setRegistros(regData || []);

        const regIds = (regData || []).map(r => r.id);
        if (regIds.length > 0) {
          const { data: presData } = await supabase
            .from('presencas')
            .select('professor_id, registro_acao_id, presente')
            .in('registro_acao_id', regIds);
          setPresencas(presData || []);
        } else {
          setPresencas([]);
        }
      } else {
        setRegistros([]);
        setPresencas([]);
      }

      // Fetch professores
      let profQuery = supabase
        .from('professores')
        .select('id, nome, escola_id, segmento, componente, ativo, created_at, data_desativacao, escolas!inner(nome)');
      if (selectedEscola !== 'all') profQuery = profQuery.eq('escola_id', selectedEscola);

      const { data: profData } = await profQuery;
      setProfessores((profData || []).map((p: any) => ({
        id: p.id, nome: p.nome, escola_id: p.escola_id,
        escola_nome: p.escolas?.nome || '', segmento: p.segmento,
        componente: p.componente, ativo: p.ativo,
        created_at: p.created_at, data_desativacao: p.data_desativacao,
      })));

      setIsLoading(false);
    };
    fetchData();
  }, [selectedEscola, dataInicio, dataFim]);

  // Map registro -> programacao
  const registroPorProgramacao = useMemo(() => {
    const map: Record<string, string[]> = {};
    registros.forEach(r => {
      if (r.programacao_id) {
        if (!map[r.programacao_id]) map[r.programacao_id] = [];
        map[r.programacao_id].push(r.id);
      }
    });
    return map;
  }, [registros]);

  // Por Formação stats
  const formacaoStats = useMemo(() => {
    return formacoes.map(f => {
      const horas = calcularHorasFormacao(f.horario_inicio, f.horario_fim);
      const regIds = registroPorProgramacao[f.id] || [];
      const presencasFormacao = presencas.filter(p => regIds.includes(p.registro_acao_id));
      const total = presencasFormacao.length;
      const presentes = presencasFormacao.filter(p => p.presente).length;
      const pct = total > 0 ? Math.round((presentes / total) * 100) : 0;
      return { ...f, horas, totalParticipantes: total, presentes, pctPresenca: pct };
    });
  }, [formacoes, registroPorProgramacao, presencas]);

  // Por Professor stats
  const professorStats = useMemo(() => {
    return professores.map(prof => {
      // Formações elegíveis (professor estava ativo na data)
      const elegiveis = formacoes.filter(f =>
        f.escola_id === prof.escola_id &&
        professorAtivoNaFormacao(prof.created_at, prof.data_desativacao, f.data)
      );

      let presencasCount = 0;
      let horasAcumuladas = 0;

      elegiveis.forEach(f => {
        const regIds = registroPorProgramacao[f.id] || [];
        const presente = presencas.some(p =>
          regIds.includes(p.registro_acao_id) && p.professor_id === prof.id && p.presente
        );
        if (presente) {
          presencasCount++;
          horasAcumuladas += calcularHorasFormacao(f.horario_inicio, f.horario_fim);
        }
      });

      const pct = elegiveis.length > 0 ? Math.round((presencasCount / elegiveis.length) * 100) : 0;

      return {
        ...prof,
        formacoesElegiveis: elegiveis.length,
        presencas: presencasCount,
        pctPresenca: pct,
        horasAcumuladas: Math.round(horasAcumuladas * 10) / 10,
      };
    }).filter(p => p.formacoesElegiveis > 0)
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [professores, formacoes, registroPorProgramacao, presencas]);

  const formatSegmento = (s: string) => {
    const map: Record<string, string> = { anos_iniciais: 'Anos Iniciais', anos_finais: 'Anos Finais', ensino_medio: 'Ensino Médio', todos: 'Todos' };
    return map[s] || s;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <History className="h-6 w-6" />
          Histórico de Presença
        </h1>
        <p className="text-muted-foreground mt-1">
          Acumulado de presença por formação e por professor
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Escola</Label>
              <Select value={selectedEscola} onValueChange={setSelectedEscola}>
                <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as escolas</SelectItem>
                  {escolas.map(e => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data Início</Label>
              <Input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Data Fim</Label>
              <Input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="formacao">
        <TabsList>
          <TabsTrigger value="formacao" className="gap-2">
            <Calendar className="h-4 w-4" /> Por Formação
          </TabsTrigger>
          <TabsTrigger value="professor" className="gap-2">
            <Users className="h-4 w-4" /> Por Professor
          </TabsTrigger>
        </TabsList>

        <TabsContent value="formacao" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {isLoading ? (
                <p className="text-muted-foreground">Carregando...</p>
              ) : formacaoStats.length === 0 ? (
                <p className="text-muted-foreground">Nenhuma formação realizada encontrada.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium">Formação</th>
                        <th className="text-left p-3 font-medium">Data</th>
                        <th className="text-left p-3 font-medium">Escola</th>
                        <th className="text-center p-3 font-medium">Horas</th>
                        <th className="text-center p-3 font-medium">Presentes</th>
                        <th className="text-center p-3 font-medium">Total</th>
                        <th className="text-center p-3 font-medium">% Presença</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formacaoStats.map(f => (
                        <tr key={f.id} className="border-b hover:bg-muted/50">
                          <td className="p-3 font-medium">{f.titulo}</td>
                          <td className="p-3">{format(parseISO(f.data), 'dd/MM/yyyy', { locale: ptBR })}</td>
                          <td className="p-3">{f.escola_nome}</td>
                          <td className="p-3 text-center">{f.horas.toFixed(1)}h</td>
                          <td className="p-3 text-center">{f.presentes}</td>
                          <td className="p-3 text-center">{f.totalParticipantes}</td>
                          <td className="p-3 text-center">
                            <Badge variant={f.pctPresenca >= 75 ? 'default' : f.pctPresenca >= 50 ? 'secondary' : 'destructive'}>
                              {f.pctPresenca}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="professor" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {isLoading ? (
                <p className="text-muted-foreground">Carregando...</p>
              ) : professorStats.length === 0 ? (
                <p className="text-muted-foreground">Nenhum professor com formações elegíveis encontrado.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium">Professor</th>
                        <th className="text-left p-3 font-medium">Escola</th>
                        <th className="text-center p-3 font-medium">Status</th>
                        <th className="text-center p-3 font-medium">Elegíveis</th>
                        <th className="text-center p-3 font-medium">Presenças</th>
                        <th className="text-center p-3 font-medium">% Presença</th>
                        <th className="text-center p-3 font-medium">Horas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {professorStats.map(p => (
                        <tr key={p.id} className="border-b hover:bg-muted/50">
                          <td className="p-3 font-medium">{p.nome}</td>
                          <td className="p-3">{p.escola_nome}</td>
                          <td className="p-3 text-center">
                            <Badge variant={p.ativo ? 'default' : 'secondary'}>
                              {p.ativo ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </td>
                          <td className="p-3 text-center">{p.formacoesElegiveis}</td>
                          <td className="p-3 text-center">{p.presencas}</td>
                          <td className="p-3 text-center">
                            <Badge variant={p.pctPresenca >= 75 ? 'default' : p.pctPresenca >= 50 ? 'secondary' : 'destructive'}>
                              {p.pctPresenca}%
                            </Badge>
                          </td>
                          <td className="p-3 text-center">{p.horasAcumuladas}h</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
