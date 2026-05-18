import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { FileSpreadsheet, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';

import { supabase } from '@/integrations/supabase/client';
import { useAuth, ProgramaType } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { INSTRUMENT_FORM_TYPES, useInstrumentFields } from '@/hooks/useInstrumentFields';
import { ACAO_TYPE_INFO } from '@/config/acaoPermissions';
import { programaLabels } from '@/config/roleConfig';

const sortAZ = (a: string, b: string) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' });

const slugify = (s: string) =>
  (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase() || 'relatorio';

const PROGRAMAS: ProgramaType[] = ['escolas', 'regionais', 'redes_municipais'];

const formatCell = (v: any): string => {
  if (v === null || v === undefined || v === '') return '';
  if (Array.isArray(v)) return v.map(formatCell).filter(Boolean).join(', ');
  if (typeof v === 'object') return JSON.stringify(v);
  if (typeof v === 'boolean') return v ? 'Sim' : 'Não';
  return String(v);
};

interface RegistroRow {
  id: string;
  created_at: string;
  responses: Record<string, any> | null;
  aap_id: string;
  registros_acao: {
    programa: string[] | null;
    tipo: string;
    data: string;
  } | null;
  profiles: { nome: string | null } | null;
}

export default function RelatorioInstrumentosPage() {
  const { profile, isAdmin } = useAuth();
  const navigate = useNavigate();

  const allowed = isAdmin
    || profile?.role === 'gestor'
    || profile?.role === 'n3_coordenador_programa';

  useEffect(() => {
    if (profile && !allowed) navigate('/unauthorized', { replace: true });
  }, [profile, allowed, navigate]);

  // Programas disponíveis ao usuário
  const userProgramas = useMemo<ProgramaType[]>(() => {
    if (isAdmin) return PROGRAMAS;
    return (profile?.programas || []) as ProgramaType[];
  }, [isAdmin, profile?.programas]);

  const [programa, setPrograma] = useState<ProgramaType | ''>('');
  const [instrumento, setInstrumento] = useState<string>('');
  const [atorId, setAtorId] = useState<string>('todos');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [shouldFetch, setShouldFetch] = useState(false);
  const [queryKeyTick, setQueryKeyTick] = useState(0);

  // Auto-seleciona único programa
  useEffect(() => {
    if (!programa && userProgramas.length === 1) setPrograma(userProgramas[0]);
  }, [userProgramas, programa]);

  // Reset cascata
  const onChangePrograma = (v: string) => {
    setPrograma(v as ProgramaType);
    setInstrumento('');
    setAtorId('todos');
    setDataInicio('');
    setDataFim('');
    setShouldFetch(false);
  };
  const onChangeInstrumento = (v: string) => {
    setInstrumento(v);
    setAtorId('todos');
    setDataInicio('');
    setDataFim('');
    setShouldFetch(false);
  };

  // Instrumentos disponíveis no programa selecionado
  const { data: formTypesNoPrograma = [] } = useQuery({
    queryKey: ['rel-instr-formtypes', programa],
    queryFn: async () => {
      if (!programa) return [] as string[];
      const { data, error } = await (supabase as any)
        .from('instrument_responses')
        .select('form_type, registros_acao!inner(programa)')
        .contains('registros_acao.programa', [programa])
        .limit(5000);
      if (error) throw error;
      const set = new Set<string>();
      (data || []).forEach((r: any) => r.form_type && set.add(r.form_type));
      return Array.from(set);
    },
    enabled: !!programa,
  });

  const instrumentosDisponiveis = useMemo(() => {
    const known = new Set(INSTRUMENT_FORM_TYPES.map(t => t.value));
    const items = INSTRUMENT_FORM_TYPES
      .filter(t => formTypesNoPrograma.includes(t.value))
      .map(t => ({ value: t.value as string, label: t.label as string }));
    // inclui form_types presentes mas não conhecidos (fallback)
    formTypesNoPrograma.forEach(ft => {
      if (!known.has(ft)) items.push({ value: ft, label: ft });
    });
    return items.sort((a, b) => sortAZ(a.label, b.label));
  }, [formTypesNoPrograma]);

  // Atores (qualquer ator com pelo menos uma resposta no escopo)
  const { data: atores = [] } = useQuery({
    queryKey: ['rel-instr-atores', programa, instrumento],
    queryFn: async () => {
      if (!programa || !instrumento) return [] as { id: string; nome: string }[];
      const { data, error } = await (supabase as any)
        .from('instrument_responses')
        .select('aap_id, profiles:aap_id(id, nome), registros_acao!inner(programa)')
        .eq('form_type', instrumento)
        .contains('registros_acao.programa', [programa])
        .limit(5000);
      if (error) throw error;
      const map = new Map<string, string>();
      (data || []).forEach((r: any) => {
        if (r.profiles?.id) map.set(r.profiles.id, r.profiles.nome || '—');
      });
      return Array.from(map, ([id, nome]) => ({ id, nome })).sort((a, b) => sortAZ(a.nome, b.nome));
    },
    enabled: !!programa && !!instrumento,
  });

  // Campos dinâmicos do instrumento
  const { fields } = useInstrumentFields(instrumento || undefined);
  const orderedFields = useMemo(
    () => [...fields].sort((a, b) => a.sort_order - b.sort_order),
    [fields],
  );

  // Relatório
  const { data: rows, isFetching } = useQuery({
    queryKey: ['rel-instr-rows', programa, instrumento, atorId, dataInicio, dataFim, queryKeyTick],
    queryFn: async () => {
      if (!programa || !instrumento) return [] as RegistroRow[];
      let q = (supabase as any)
        .from('instrument_responses')
        .select(`
          id, created_at, responses, aap_id,
          registros_acao!inner(programa, tipo, data),
          profiles:aap_id(nome)
        `)
        .eq('form_type', instrumento)
        .contains('registros_acao.programa', [programa])
        .order('created_at', { ascending: false })
        .limit(5000);
      if (atorId && atorId !== 'todos') q = q.eq('aap_id', atorId);
      if (dataInicio) q = q.gte('registros_acao.data', dataInicio);
      if (dataFim) q = q.lte('registros_acao.data', dataFim);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as RegistroRow[];
    },
    enabled: shouldFetch && !!programa && !!instrumento,
  });

  const handleGerar = () => {
    if (!programa || !instrumento) return;
    setShouldFetch(true);
    setQueryKeyTick(t => t + 1);
  };

  const instrumentoLabel = useMemo(
    () => instrumentosDisponiveis.find(i => i.value === instrumento)?.label || instrumento,
    [instrumentosDisponiveis, instrumento],
  );

  const tableRows = useMemo(() => {
    if (!rows) return [];
    return rows.map(r => {
      const fixed = {
        programa: programaLabels[programa as ProgramaType] || '',
        ator: r.profiles?.nome || '—',
        acao: ACAO_TYPE_INFO[r.registros_acao?.tipo as keyof typeof ACAO_TYPE_INFO]?.label || r.registros_acao?.tipo || '—',
        data: r.registros_acao?.data ? format(parseISO(r.registros_acao.data), 'dd/MM/yyyy') : '—',
      };
      const dyn: Record<string, string> = {};
      orderedFields.forEach(f => {
        dyn[f.field_key] = formatCell(r.responses?.[f.field_key]);
      });
      return { ...fixed, dyn };
    });
  }, [rows, orderedFields, programa]);

  const handleDownload = () => {
    if (!tableRows.length) return;
    const header = ['Programa', 'Ator', 'Ação', 'Data', ...orderedFields.map(f => f.label)];
    const aoa: any[][] = [header];
    tableRows.forEach(r => {
      aoa.push([r.programa, r.ator, r.acao, r.data, ...orderedFields.map(f => r.dyn[f.field_key] || '')]);
    });
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Relatório');
    const filename = `${slugify(programaLabels[programa as ProgramaType] || '')}_${slugify(instrumentoLabel)}_relatorio.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  if (!profile) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Relatório de Instrumentos</h1>
        <p className="text-sm text-muted-foreground">
          Visualize e baixe em Excel os registros de instrumentos preenchidos.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Programa *</Label>
              <Select value={programa} onValueChange={onChangePrograma}>
                <SelectTrigger><SelectValue placeholder="Selecione um programa" /></SelectTrigger>
                <SelectContent>
                  {userProgramas.map(p => (
                    <SelectItem key={p} value={p}>{programaLabels[p]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Instrumento *</Label>
              <Select value={instrumento} onValueChange={onChangeInstrumento} disabled={!programa}>
                <SelectTrigger>
                  <SelectValue placeholder={programa ? 'Selecione um instrumento' : 'Selecione o Programa primeiro'} />
                </SelectTrigger>
                <SelectContent>
                  {instrumentosDisponiveis.length === 0 && programa ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      Nenhum instrumento com registros neste programa.
                    </div>
                  ) : (
                    instrumentosDisponiveis.map(i => (
                      <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card className="border-dashed">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Filtros opcionais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Ator</Label>
                  <Select value={atorId} onValueChange={setAtorId} disabled={!programa || !instrumento}>
                    <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      {atores.map(a => (
                        <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Data início</Label>
                  <Input
                    type="date"
                    value={dataInicio}
                    onChange={e => setDataInicio(e.target.value)}
                    disabled={!programa || !instrumento}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data fim</Label>
                  <Input
                    type="date"
                    value={dataFim}
                    onChange={e => setDataFim(e.target.value)}
                    disabled={!programa || !instrumento}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleGerar} disabled={!programa || !instrumento || isFetching}>
              {isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Gerar Relatório
            </Button>
          </div>
        </CardContent>
      </Card>

      {shouldFetch && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle>Resultados {rows ? `(${rows.length})` : ''}</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={!tableRows.length}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Baixar XLS
            </Button>
          </CardHeader>
          <CardContent>
            {isFetching ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !tableRows.length ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Nenhum registro encontrado para os filtros selecionados.
              </p>
            ) : (
              <div className="overflow-x-auto max-h-[70vh]">
                <table className="min-w-max w-full border-collapse text-sm">
                  <thead className="sticky top-0 bg-background">
                    <tr className="border-b">
                      <th className="px-3 py-2 text-left font-medium">Programa</th>
                      <th className="px-3 py-2 text-left font-medium">Ator</th>
                      <th className="px-3 py-2 text-left font-medium">Ação</th>
                      <th className="px-3 py-2 text-left font-medium">Data</th>
                      {orderedFields.map(f => (
                        <th key={f.id} className="px-3 py-2 text-left font-medium whitespace-nowrap">
                          {f.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.map((r, idx) => (
                      <tr key={idx} className="border-b hover:bg-muted/40">
                        <td className="px-3 py-2">{r.programa}</td>
                        <td className="px-3 py-2">{r.ator}</td>
                        <td className="px-3 py-2">{r.acao}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{r.data}</td>
                        {orderedFields.map(f => (
                          <td key={f.id} className="px-3 py-2 align-top">
                            <div className="max-w-md whitespace-pre-wrap break-words">
                              {r.dyn[f.field_key]}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
