import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import {
  ANO_OPCOES, TURMA_OPCOES, SEGMENTO_OPCOES, NIVEL_IAB_OPCOES,
  MATERIAL_DIDATICO_OPCOES, CRITERIOS_ALFABETIZACAO,
} from './visitaTecnicaAlfabetizacaoShared';

export interface VisitaTecnicaAlfabetizacaoFormProps {
  entidades: { id: string; nome: string }[];
  data: string;
  horarioInicio?: string;
  horarioFim?: string;
  tecnicoVisitanteNome?: string;
  registroAcaoId: string;
  entidadeFilhoId?: string;
  onSuccess?: () => void;
}

const criteriosShape: Record<string, any> = {};
for (const c of CRITERIOS_ALFABETIZACAO) {
  criteriosShape[`nota_${c.key}`] = z.coerce.number().int().min(1).max(4).optional().nullable();
  criteriosShape[`evidencia_${c.key}`] = z.string().optional();
}

const schema = z.object({
  municipio: z.string().optional(),
  nome_escola: z.string().optional(),
  tecnico_visitante: z.string().optional(),
  horario_inicio: z.string().optional(),
  horario_fim: z.string().optional(),
  ano: z.string().optional(),
  turma: z.string().optional(),
  qtd_estudantes: z.coerce.number().int().min(0).optional().nullable(),
  nivel_iab: z.string().optional(),
  segmento: z.string().optional(),
  material_didatico: z.array(z.string()).optional(),
  alunos_masculino: z.coerce.number().int().min(0).optional().nullable(),
  alunos_feminino: z.coerce.number().int().min(0).optional().nullable(),
  q4_nao_se_aplica: z.boolean().optional(),
  observacoes_gerais: z.string().optional(),
  ...criteriosShape,
});

type FormValues = z.infer<typeof schema>;

const SCALE_OPTIONS = [
  { v: 1, label: '1 — Insuficiente' },
  { v: 2, label: '2 — Em Desenvolvimento' },
  { v: 3, label: '3 — Consolidado' },
  { v: 4, label: '4 — Avançado' },
];

function RubricLegendCard() {
  return (
    <Card>
      <CardHeader className="bg-[#1a3a5c] text-white rounded-t-lg">
        <CardTitle className="text-base">LEGENDA DAS RUBRICAS</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <p className="text-sm italic text-muted-foreground mb-3">
          Cada critério é avaliado por descritores comportamentais observáveis — o que o visitante vê acontecer na escola/aula, não uma impressão subjetiva.
        </p>
        <div className="grid gap-3 md:grid-cols-4 text-sm">
          <div className="rounded border border-border p-3 bg-red-50">
            <div className="font-semibold mb-1">1 — Insuficiente</div>
            <div className="text-muted-foreground">A prática observada indica ausência ou inadequação significativa do comportamento-alvo.</div>
          </div>
          <div className="rounded border border-border p-3 bg-yellow-50">
            <div className="font-semibold mb-1">2 — Em Desenvolvimento</div>
            <div className="text-muted-foreground">Há tentativa de atingir o comportamento-alvo, mas de forma incompleta ou inconsistente. A prática está em construção.</div>
          </div>
          <div className="rounded border border-border p-3 bg-green-50">
            <div className="font-semibold mb-1">3 — Consolidado</div>
            <div className="text-muted-foreground">O comportamento-alvo está presente de forma clara e consistente na maior parte da observação. A prática é autônoma.</div>
          </div>
          <div className="rounded border border-border p-3 bg-blue-50">
            <div className="font-semibold mb-1">4 — Avançado</div>
            <div className="text-muted-foreground">O comportamento-alvo é executado com intencionalidade e impacto ampliado. O técnico pode ser referência para pares.</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function VisitaTecnicaAlfabetizacaoForm({
  entidades, data, horarioInicio, horarioFim, tecnicoVisitanteNome,
  registroAcaoId, entidadeFilhoId, onSuccess,
}: VisitaTecnicaAlfabetizacaoFormProps) {
  const { user } = useAuth();
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [entidadesFilho, setEntidadesFilho] = useState<{ id: string; nome: string }[]>([]);
  const [selectedEntidadeId, setSelectedEntidadeId] = useState<string | null>(
    entidades.length === 1 ? entidades[0].id : null,
  );

  const singleEntidade = entidades.length === 1;
  const parsedDate = data ? new Date(data + 'T12:00:00') : undefined;

  const defaultCriterios: Record<string, any> = {};
  for (const c of CRITERIOS_ALFABETIZACAO) {
    defaultCriterios[`nota_${c.key}`] = null;
    defaultCriterios[`evidencia_${c.key}`] = '';
  }

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      municipio: singleEntidade ? entidades[0].nome : '',
      nome_escola: '',
      tecnico_visitante: tecnicoVisitanteNome || '',
      horario_inicio: horarioInicio || '',
      horario_fim: horarioFim || '',
      ano: '',
      turma: '',
      qtd_estudantes: null,
      nivel_iab: '',
      segmento: '',
      material_didatico: [],
      alunos_masculino: null,
      alunos_feminino: null,
      q4_nao_se_aplica: false,
      observacoes_gerais: '',
      ...defaultCriterios,
    } as any,
    mode: 'onSubmit',
  });

  // Hydrate from existing row
  useEffect(() => {
    if (!registroAcaoId) return;
    let cancelled = false;
    (async () => {
      const { data: existing } = await (supabase as any)
        .from('relatorios_visita_tecnica_alfabetizacao')
        .select('*')
        .eq('registro_acao_id', registroAcaoId)
        .maybeSingle();
      if (cancelled || !existing) return;
      const ent = entidades.find(e => e.nome === existing.municipio);
      if (ent) setSelectedEntidadeId(ent.id);

      const crit: Record<string, any> = {};
      for (const c of CRITERIOS_ALFABETIZACAO) {
        crit[`nota_${c.key}`] = existing[`nota_${c.key}`] ?? null;
        crit[`evidencia_${c.key}`] = existing[`evidencia_${c.key}`] ?? '';
      }
      form.reset({
        municipio: existing.municipio || (singleEntidade ? entidades[0].nome : ''),
        nome_escola: existing.nome_escola || '',
        tecnico_visitante: existing.tecnico_visitante || tecnicoVisitanteNome || '',
        horario_inicio: existing.horario_inicio || horarioInicio || '',
        horario_fim: existing.horario_fim || horarioFim || '',
        ano: existing.ano || '',
        turma: existing.turma || '',
        qtd_estudantes: existing.qtd_estudantes ?? null,
        nivel_iab: existing.nivel_iab != null ? String(existing.nivel_iab) : '',
        segmento: existing.segmento || '',
        material_didatico: existing.material_didatico || [],
        alunos_masculino: existing.alunos_masculino ?? null,
        alunos_feminino: existing.alunos_feminino ?? null,
        q4_nao_se_aplica: !!existing.q4_nao_se_aplica,
        observacoes_gerais: existing.observacoes_gerais || '',
        ...crit,
      } as any);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registroAcaoId]);

  // Fetch entidades_filho (escolas) for the selected município
  useEffect(() => {
    if (!selectedEntidadeId) { setEntidadesFilho([]); return; }
    (async () => {
      const { data: filhos } = await supabase
        .from('entidades_filho')
        .select('id, nome')
        .eq('escola_id', selectedEntidadeId)
        .eq('ativa', true)
        .order('nome');
      setEntidadesFilho(filhos || []);
      // Prefill nome_escola from the locked entidade_filho selected at scheduling
      if (entidadeFilhoId) {
        const match = (filhos || []).find(f => f.id === entidadeFilhoId);
        if (match && !form.getValues('nome_escola')) {
          form.setValue('nome_escola', match.nome);
        }
      }
    })();
  }, [selectedEntidadeId, entidadeFilhoId]);

  const persist = async (values: FormValues, status: 'rascunho' | 'enviado') => {
    if (!registroAcaoId) throw new Error('registro_acao_id ausente');
    const payload: any = {
      ...values,
      data: parsedDate ? format(parsedDate, 'yyyy-MM-dd', { locale: ptBR }) : null,
      nivel_iab: values.nivel_iab ? Number(values.nivel_iab) : null,
      material_didatico: values.material_didatico || [],
      registro_acao_id: registroAcaoId,
      created_by: user?.id,
      status,
      horario_inicio: values.horario_inicio || null,
      horario_fim: values.horario_fim || null,
    };
    const { error } = await (supabase as any)
      .from('relatorios_visita_tecnica_alfabetizacao')
      .upsert(payload, { onConflict: 'registro_acao_id' });
    if (error) throw error;
  };

  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    try {
      await persist(form.getValues(), 'rascunho');
      toast.success('Rascunho salvo com sucesso!');
      onSuccess?.();
    } catch (e: any) { toast.error(e?.message || 'Erro ao salvar rascunho'); }
    finally { setIsSavingDraft(false); }
  };

  const onSubmit = async (values: FormValues) => {
    const naoAplica = !!values.q4_nao_se_aplica;
    const missing = CRITERIOS_ALFABETIZACAO.filter(c => {
      if (c.key === 'q4' && naoAplica) return false;
      return !(values as any)[`nota_${c.key}`];
    });
    if (missing.length > 0) {
      toast.error(`Avalie todos os critérios (faltam ${missing.length}).`);
      return;
    }
    setIsSubmitting(true);
    try {
      await persist(values, 'enviado');
      toast.success('Formulário enviado com sucesso!');
      onSuccess?.();
    } catch (e: any) { toast.error(e?.message || 'Erro ao enviar formulário'); }
    finally { setIsSubmitting(false); }
  };

  const grouped = CRITERIOS_ALFABETIZACAO.reduce<Record<string, typeof CRITERIOS_ALFABETIZACAO>>((acc, c) => {
    (acc[c.dimensao] ||= [] as any).push(c);
    return acc;
  }, {});

  const watched = form.watch();
  const naoAplicaQ4 = !!watched.q4_nao_se_aplica;

  const dimMedias = Object.entries(grouped).map(([dim, items]) => {
    const notas = items
      .filter(c => !(c.key === 'q4' && naoAplicaQ4))
      .map(c => (watched as any)[`nota_${c.key}`])
      .filter((n): n is number => typeof n === 'number');
    const total = items.filter(c => !(c.key === 'q4' && naoAplicaQ4)).length;
    const media = notas.length > 0 ? (notas.reduce((a, b) => a + b, 0) / notas.length) : null;
    return { dim, notas: notas.length, total, media };
  });
  const allNotas = CRITERIOS_ALFABETIZACAO
    .filter(c => !(c.key === 'q4' && naoAplicaQ4))
    .map(c => (watched as any)[`nota_${c.key}`])
    .filter((n): n is number => typeof n === 'number');
  const totalCriterios = CRITERIOS_ALFABETIZACAO.length - (naoAplicaQ4 ? 1 : 0);
  const mediaGeral = allNotas.length > 0 ? (allNotas.reduce((a, b) => a + b, 0) / allNotas.length) : null;

  const toggleMaterial = (value: string, checked: boolean) => {
    const cur = (form.getValues('material_didatico') as string[]) || [];
    const next = checked ? Array.from(new Set([...cur, value])) : cur.filter(v => v !== value);
    form.setValue('material_didatico', next, { shouldDirty: true });
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

          {/* CADASTRO (campos vindos da programação) */}
          <Card>
            <CardHeader><CardTitle className="text-xl">Identificação da visita</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {singleEntidade ? (
                <FormField control={form.control} name="municipio" render={({ field }) => (
                  <FormItem><FormLabel>Município *</FormLabel><FormControl><Input {...field} value={field.value || ''} disabled /></FormControl><FormMessage /></FormItem>
                )} />
              ) : (
                <FormField control={form.control} name="municipio" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Município *</FormLabel>
                    <Select value={field.value || ''} onValueChange={(val) => {
                      field.onChange(val);
                      const ent = entidades.find(e => e.nome === val);
                      setSelectedEntidadeId(ent?.id || null);
                      form.setValue('nome_escola', '');
                    }}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {entidades.map(e => <SelectItem key={e.id} value={e.nome}>{e.nome}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              )}

              <FormItem>
                <FormLabel>Data *</FormLabel>
                <Input value={parsedDate ? format(parsedDate, 'dd/MM/yyyy', { locale: ptBR }) : ''} disabled />
              </FormItem>

              <FormField control={form.control} name="nome_escola" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Escola *</FormLabel>
                  <Select value={field.value || undefined} onValueChange={field.onChange} disabled={!selectedEntidadeId || !!entidadeFilhoId}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione a escola" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {entidadesFilho.map(ef => <SelectItem key={ef.id} value={ef.nome}>{ef.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="tecnico_visitante" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do(a) Técnico(a) Visitante</FormLabel>
                  <FormControl><Input {...field} value={field.value || ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="horario_inicio" render={({ field }) => (
                <FormItem><FormLabel>Hora início</FormLabel>
                  <FormControl><Input type="time" {...field} value={field.value || ''} /></FormControl>
                  <FormMessage /></FormItem>
              )} />

              <FormField control={form.control} name="horario_fim" render={({ field }) => (
                <FormItem><FormLabel>Hora fim</FormLabel>
                  <FormControl><Input type="time" {...field} value={field.value || ''} /></FormControl>
                  <FormMessage /></FormItem>
              )} />
            </CardContent>
          </Card>

          {/* GERENCIAMENTO */}
          <Card>
            <CardHeader><CardTitle className="text-xl">Gerenciamento</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <FormField control={form.control} name="ano" render={({ field }) => (
                <FormItem>
                  <FormLabel>Ano *</FormLabel>
                  <Select value={field.value || ''} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {ANO_OPCOES.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="turma" render={({ field }) => (
                <FormItem>
                  <FormLabel>Turma *</FormLabel>
                  <Select value={field.value || ''} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {TURMA_OPCOES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="qtd_estudantes" render={({ field }) => (
                <FormItem><FormLabel>Qtd. de estudantes na turma</FormLabel>
                  <FormControl><Input type="number" min={0} {...field} value={field.value ?? ''}
                    onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))} /></FormControl>
                  <FormMessage /></FormItem>
              )} />

              <FormField control={form.control} name="nivel_iab" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nível IAB em uso *</FormLabel>
                  <Select value={field.value || ''} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {NIVEL_IAB_OPCOES.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="segmento" render={({ field }) => (
                <FormItem>
                  <FormLabel>Segmento *</FormLabel>
                  <Select value={field.value || ''} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {SEGMENTO_OPCOES.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormItem className="md:col-span-2">
                <FormLabel>Material Didático *</FormLabel>
                <div className="grid gap-2 md:grid-cols-2">
                  {MATERIAL_DIDATICO_OPCOES.map(opt => {
                    const checked = (watched.material_didatico || []).includes(opt.value);
                    return (
                      <div key={opt.value} className="flex items-center gap-2">
                        <Checkbox id={`mat-${opt.value}`} checked={checked} onCheckedChange={(c) => toggleMaterial(opt.value, !!c)} />
                        <Label htmlFor={`mat-${opt.value}`} className="cursor-pointer text-sm font-normal">{opt.label}</Label>
                      </div>
                    );
                  })}
                </div>
              </FormItem>

              <FormField control={form.control} name="alunos_masculino" render={({ field }) => (
                <FormItem><FormLabel>Alunos presentes — Masculino</FormLabel>
                  <FormControl><Input type="number" min={0} {...field} value={field.value ?? ''}
                    onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))} /></FormControl>
                  <FormMessage /></FormItem>
              )} />

              <FormField control={form.control} name="alunos_feminino" render={({ field }) => (
                <FormItem><FormLabel>Alunos presentes — Feminino</FormLabel>
                  <FormControl><Input type="number" min={0} {...field} value={field.value ?? ''}
                    onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))} /></FormControl>
                  <FormMessage /></FormItem>
              )} />
            </CardContent>
          </Card>

          {/* Score consolidado */}
          <Card className="border-primary/40">
            <CardHeader>
              <CardTitle className="text-xl flex items-center justify-between flex-wrap gap-2">
                <span>Visita Técnica — Alfabetização</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {allNotas.length} de {totalCriterios} respondidas{mediaGeral != null && <> • Média geral: <strong>{mediaGeral.toFixed(2)} / 4</strong></>}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                {CRITERIOS_ALFABETIZACAO.map(c => {
                  const val = (watched as any)[`nota_${c.key}`];
                  const inativo = c.key === 'q4' && naoAplicaQ4;
                  const display = inativo ? 'N/A' : (typeof val === 'number' ? val.toFixed(1) : '—');
                  const color = inativo ? 'bg-muted text-muted-foreground'
                    : typeof val !== 'number' ? 'bg-muted text-muted-foreground'
                    : val >= 3 ? 'bg-green-100 text-green-900'
                    : val >= 2 ? 'bg-yellow-100 text-yellow-900'
                    : 'bg-red-100 text-red-900';
                  return (
                    <div key={c.key} className="flex items-center gap-3 rounded border border-border p-2">
                      <div className={`flex items-center justify-center min-w-12 h-12 rounded-full font-bold text-base ${color}`}>{display}</div>
                      <div className="text-sm flex-1">
                        <div className="font-medium">{c.numero}. {c.titulo}</div>
                        <div className="text-xs text-muted-foreground">{c.dimensao}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Legenda das rubricas */}
          <RubricLegendCard />

          {/* Critérios por dimensão */}
          {Object.entries(grouped).map(([dim, items]) => (
            <div key={dim} className="space-y-4">
              <h3 className="text-base font-semibold text-primary border-b pb-2">{dim}</h3>
              {items.map(c => {
                const inativo = c.key === 'q4' && naoAplicaQ4;
                return (
                  <Card key={c.key} className={inativo ? 'opacity-60' : ''}>
                    <CardHeader>
                      <CardTitle className="text-base">{c.numero}. {c.titulo}</CardTitle>
                      <p className="text-sm text-muted-foreground"><strong>Foco:</strong> {c.foco}</p>
                      {c.permiteNaoSeAplica && (
                        <div className="flex items-center gap-2 mt-2">
                          <Checkbox
                            id={`naoaplica-${c.key}`}
                            checked={naoAplicaQ4}
                            onCheckedChange={(checked) => form.setValue('q4_nao_se_aplica', !!checked, { shouldDirty: true })}
                          />
                          <Label htmlFor={`naoaplica-${c.key}`} className="cursor-pointer text-sm font-normal">
                            Não se aplica à rede (a pergunta ficará inativa e não será considerada na média)
                          </Label>
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Accordion type="single" collapsible>
                        <AccordionItem value="rubrica">
                          <AccordionTrigger className="text-sm">Ver descrição dos níveis</AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-2 text-sm">
                              {c.niveis.map(n => (
                                <div key={n.nivel} className="rounded border border-border p-2">
                                  <div className="font-semibold mb-1">{n.nivel}</div>
                                  <div className="text-muted-foreground">{n.texto}</div>
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>

                      <FormField control={form.control} name={`nota_${c.key}` as any} render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nota atribuída (1 a 4)</FormLabel>
                          <div className="flex flex-wrap gap-2">
                            {SCALE_OPTIONS.map(s => {
                              const selected = Number(field.value) === s.v;
                              return (
                                <Button
                                  key={s.v}
                                  type="button"
                                  size="sm"
                                  variant={selected ? 'default' : 'outline'}
                                  disabled={inativo}
                                  aria-pressed={selected}
                                  title={s.label}
                                  className="min-w-12"
                                  onClick={() => field.onChange(selected ? null : s.v)}
                                >
                                  {s.v}
                                </Button>
                              );
                            })}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <FormField control={form.control} name={`evidencia_${c.key}` as any} render={({ field }) => (
                        <FormItem>
                          <FormLabel>Evidência observada</FormLabel>
                          <FormControl><Textarea rows={3} disabled={inativo} {...field} value={(field.value as string) || ''} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ))}

          {/* Síntese */}
          <Card>
            <CardHeader><CardTitle className="text-xl">Síntese das notas por dimensão</CardTitle></CardHeader>
            <CardContent>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Dimensão</th>
                    <th className="text-center p-2">Critérios avaliados</th>
                    <th className="text-center p-2">Média</th>
                  </tr>
                </thead>
                <tbody>
                  {dimMedias.map(d => (
                    <tr key={d.dim} className="border-b">
                      <td className="p-2">{d.dim}</td>
                      <td className="text-center p-2">{d.notas} / {d.total}</td>
                      <td className="text-center p-2 font-semibold">{d.media != null ? d.media.toFixed(2) : '—'}</td>
                    </tr>
                  ))}
                  <tr className="bg-muted/30">
                    <td className="p-2 font-semibold">MÉDIA GERAL</td>
                    <td className="text-center p-2">{allNotas.length} / {totalCriterios}</td>
                    <td className="text-center p-2 font-bold">{mediaGeral != null ? mediaGeral.toFixed(2) : '—'}</td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Observações gerais */}
          <Card>
            <CardHeader><CardTitle className="text-base">Observações gerais</CardTitle></CardHeader>
            <CardContent>
              <FormField control={form.control} name="observacoes_gerais" render={({ field }) => (
                <FormItem>
                  <FormControl><Textarea rows={4} {...field} value={(field.value as string) || ''} placeholder="Observações adicionais sobre a visita" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          {/* Ações */}
          <div className="flex flex-wrap gap-3 justify-end sticky bottom-0 bg-background py-3 border-t">
            <Button type="button" variant="outline" onClick={handleSaveDraft} disabled={isSavingDraft || isSubmitting}>
              {isSavingDraft && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar rascunho
            </Button>
            <Button type="submit" disabled={isSavingDraft || isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Enviar formulário
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
