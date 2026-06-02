import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { supabase } from '@/integrations/supabase/client';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RubricaLegendCard } from '@/pages/formularios/redesFormShared';
import {
  GPA_ANO_OPTIONS,
  GPA_TURMA_OPTIONS,
  GPA_MATERIAL_DIDATICO_OPTIONS,
  GPA_CRITERIA,
} from './observacaoAulaGpaShared';

export interface GpaFormProps {
  municipio?: string;
  /** Id da Entidade Pai (escola/rede/regional) selecionada na programação. */
  escolaPaiId?: string;
  data: string;
  horarioInicio?: string;
  horarioFim?: string;
  observadorNome?: string;
  registroAcaoId?: string;
  onSuccess?: () => void;
}

const schema = z.object({
  entidade_filho_id: z.string().trim().min(1, 'Escola é obrigatória'),
  nome_professor: z.string().trim().min(1, 'Nome do professor é obrigatório'),
  ano: z.string().trim().min(1, 'Ano é obrigatório'),
  turma: z.string().trim().min(1, 'Turma é obrigatória'),
  qtd_estudantes: z.coerce.number().int().min(0).optional().nullable(),
  segmento: z.enum(['anos_iniciais', 'anos_finais']),
  material_didatico: z.array(z.string()).min(1, 'Selecione ao menos um material didático'),
  alunos_masculino: z.coerce.number().int().min(0, 'Informe um número válido'),
  alunos_feminino: z.coerce.number().int().min(0, 'Informe um número válido'),
  nota_criterio_1: z.coerce.number().int().min(1).max(4),
  evidencia_criterio_1: z.string().optional(),
  nota_criterio_2: z.coerce.number().int().min(1).max(4),
  evidencia_criterio_2: z.string().optional(),
  nota_criterio_3: z.coerce.number().int().min(1).max(4),
  evidencia_criterio_3: z.string().optional(),
  nota_criterio_4: z.coerce.number().int().min(1).max(4),
  evidencia_criterio_4: z.string().optional(),
  nota_criterio_5: z.coerce.number().int().min(1).max(4),
  evidencia_criterio_5: z.string().optional(),
  nota_criterio_6: z.coerce.number().int().min(1).max(4),
  evidencia_criterio_6: z.string().optional(),
  nota_criterio_7: z.coerce.number().int().min(1).max(4),
  evidencia_criterio_7: z.string().optional(),
  nota_criterio_8: z.coerce.number().int().min(1).max(4),
  evidencia_criterio_8: z.string().optional(),
  nota_criterio_9: z.coerce.number().int().min(1).max(4),
  evidencia_criterio_9: z.string().optional(),
  pontos_fortes: z.string().optional(),
  aspectos_fortalecer: z.string().optional(),
  estrategias_sugeridas: z.string().optional(),
  combinacao_acompanhamento: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function ObservacaoAulaGpaForm({
  municipio,
  escolaPaiId,
  data,
  horarioInicio,
  horarioFim,
  observadorNome,
  registroAcaoId,
  onSuccess,
}: GpaFormProps) {
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [entidadesFilho, setEntidadesFilho] = useState<Array<{ id: string; nome: string }>>([]);

  const parsedDate = data ? new Date(data + 'T12:00:00') : undefined;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      entidade_filho_id: '',
      qtd_estudantes: null,
      material_didatico: [],
      pontos_fortes: '',
      aspectos_fortalecer: '',
      estrategias_sugeridas: '',
      combinacao_acompanhamento: '',
    },
    mode: 'onSubmit',
  });

  // Carrega entidades filho da Entidade Pai
  useEffect(() => {
    if (!escolaPaiId) { setEntidadesFilho([]); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('entidades_filho')
        .select('id, nome')
        .eq('escola_id', escolaPaiId)
        .eq('ativa', true)
        .order('nome');
      if (!cancelled) setEntidadesFilho((data as any) || []);
    })();
    return () => { cancelled = true; };
  }, [escolaPaiId]);

  // Pré-carrega entidade_filho_id já vinculada ao registro_acao
  useEffect(() => {
    if (!registroAcaoId) return;
    (async () => {
      const { data: r } = await supabase
        .from('registros_acao')
        .select('entidade_filho_id')
        .eq('id', registroAcaoId)
        .maybeSingle();
      const efId = (r as any)?.entidade_filho_id;
      if (efId) form.setValue('entidade_filho_id', efId);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registroAcaoId]);


  // Pre-fill from existing record linked to this registro_acao
  useEffect(() => {
    if (!registroAcaoId) return;
    let cancelled = false;
    (async () => {
      const { data: existing } = await (supabase as any)
        .from('observacoes_aula_gpa')
        .select('*')
        .eq('registro_acao_id', registroAcaoId)
        .maybeSingle();
      if (cancelled || !existing) return;
      form.reset({
        nome_professor: existing.nome_professor || '',
        ano: existing.ano || '',
        turma: existing.turma || '',
        qtd_estudantes: existing.qtd_estudantes ?? null,
        segmento: existing.segmento || undefined,
        material_didatico: existing.material_didatico || [],
        alunos_masculino: existing.alunos_masculino ?? undefined,
        alunos_feminino: existing.alunos_feminino ?? undefined,
        nota_criterio_1: existing.nota_criterio_1 ?? undefined,
        evidencia_criterio_1: existing.evidencia_criterio_1 || '',
        nota_criterio_2: existing.nota_criterio_2 ?? undefined,
        evidencia_criterio_2: existing.evidencia_criterio_2 || '',
        nota_criterio_3: existing.nota_criterio_3 ?? undefined,
        evidencia_criterio_3: existing.evidencia_criterio_3 || '',
        nota_criterio_4: existing.nota_criterio_4 ?? undefined,
        evidencia_criterio_4: existing.evidencia_criterio_4 || '',
        nota_criterio_5: existing.nota_criterio_5 ?? undefined,
        evidencia_criterio_5: existing.evidencia_criterio_5 || '',
        nota_criterio_6: existing.nota_criterio_6 ?? undefined,
        evidencia_criterio_6: existing.evidencia_criterio_6 || '',
        nota_criterio_7: existing.nota_criterio_7 ?? undefined,
        evidencia_criterio_7: existing.evidencia_criterio_7 || '',
        nota_criterio_8: existing.nota_criterio_8 ?? undefined,
        evidencia_criterio_8: existing.evidencia_criterio_8 || '',
        nota_criterio_9: existing.nota_criterio_9 ?? undefined,
        evidencia_criterio_9: existing.evidencia_criterio_9 || '',
        pontos_fortes: existing.pontos_fortes || '',
        aspectos_fortalecer: existing.aspectos_fortalecer || '',
        estrategias_sugeridas: existing.estrategias_sugeridas || '',
        combinacao_acompanhamento: existing.combinacao_acompanhamento || '',
      } as any);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registroAcaoId]);

  const watchedNotes = form.watch([
    'nota_criterio_1','nota_criterio_2','nota_criterio_3','nota_criterio_4','nota_criterio_5','nota_criterio_6','nota_criterio_7','nota_criterio_8','nota_criterio_9',
  ]);

  const criteriosAvaliados = useMemo(() => watchedNotes.filter(Boolean).length, [watchedNotes]);
  const progress = (criteriosAvaliados / 9) * 100;

  const mediaGeral = useMemo(() => {
    const notas = watchedNotes.map(n => Number(n)).filter(n => n >= 1 && n <= 4);
    if (notas.length === 0) return null;
    return notas.reduce((s, n) => s + n, 0) / notas.length;
  }, [watchedNotes]);

  const persist = async (values: Partial<FormValues>, status: 'rascunho' | 'enviado') => {
    const payload: any = {
      municipio: municipio || null,
      nome_escola: nomeEscola || null,
      data: parsedDate ? format(parsedDate, 'yyyy-MM-dd', { locale: ptBR }) : null,
      horario_inicio: horarioInicio || null,
      horario_fim: horarioFim || null,
      observador: observadorNome || null,
      nome_professor: values.nome_professor,
      ano: values.ano,
      turma: values.turma,
      qtd_estudantes: values.qtd_estudantes ?? null,
      segmento: values.segmento,
      material_didatico: values.material_didatico,
      alunos_masculino: values.alunos_masculino ?? null,
      alunos_feminino: values.alunos_feminino ?? null,
      nota_criterio_1: values.nota_criterio_1,
      evidencia_criterio_1: values.evidencia_criterio_1 || null,
      nota_criterio_2: values.nota_criterio_2,
      evidencia_criterio_2: values.evidencia_criterio_2 || null,
      nota_criterio_3: values.nota_criterio_3,
      evidencia_criterio_3: values.evidencia_criterio_3 || null,
      nota_criterio_4: values.nota_criterio_4,
      evidencia_criterio_4: values.evidencia_criterio_4 || null,
      nota_criterio_5: values.nota_criterio_5,
      evidencia_criterio_5: values.evidencia_criterio_5 || null,
      nota_criterio_6: values.nota_criterio_6,
      evidencia_criterio_6: values.evidencia_criterio_6 || null,
      nota_criterio_7: values.nota_criterio_7,
      evidencia_criterio_7: values.evidencia_criterio_7 || null,
      nota_criterio_8: values.nota_criterio_8,
      evidencia_criterio_8: values.evidencia_criterio_8 || null,
      nota_criterio_9: values.nota_criterio_9,
      evidencia_criterio_9: values.evidencia_criterio_9 || null,
      pontos_fortes: values.pontos_fortes || null,
      aspectos_fortalecer: values.aspectos_fortalecer || null,
      estrategias_sugeridas: values.estrategias_sugeridas || null,
      combinacao_acompanhamento: values.combinacao_acompanhamento || null,
      status,
    };
    if (registroAcaoId) payload.registro_acao_id = registroAcaoId;

    if (registroAcaoId) {
      const { error } = await (supabase as any)
        .from('observacoes_aula_gpa')
        .upsert(payload, { onConflict: 'registro_acao_id' });
      if (error) throw error;
    } else {
      const { error } = await (supabase as any).from('observacoes_aula_gpa').insert(payload);
      if (error) throw error;
    }
  };

  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    try {
      await persist(form.getValues(), 'rascunho');
      toast.success('Rascunho salvo com sucesso!');
      onSuccess?.();
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao salvar rascunho');
    } finally {
      setIsSavingDraft(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      await persist(values, 'enviado');
      toast.success('Formulário enviado com sucesso!');
      onSuccess?.();
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao enviar formulário');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Progresso da avaliação</CardTitle>
              <CardDescription>{criteriosAvaliados} de 9 critérios avaliados</CardDescription>
            </div>
            <div className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              {criteriosAvaliados}/9
            </div>
          </div>
          <Progress value={progress} className="h-3" />
        </CardHeader>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Cabeçalho (read-only) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Cadastro</CardTitle>
              <CardDescription>Informações preenchidas na programação da ação.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <FormItem>
                <FormLabel>Município</FormLabel>
                <Input value={municipio || ''} disabled />
              </FormItem>
              <FormItem>
                <FormLabel>Data</FormLabel>
                <Input value={parsedDate ? format(parsedDate, 'dd/MM/yyyy', { locale: ptBR }) : ''} disabled />
              </FormItem>
              <FormItem className="md:col-span-2">
                <FormLabel>Nome da Escola</FormLabel>
                <Input value={nomeEscola || ''} disabled />
              </FormItem>
              <FormItem>
                <FormLabel>Observador(a)</FormLabel>
                <Input value={observadorNome || ''} disabled />
              </FormItem>
              <FormItem>
                <FormLabel>Horário</FormLabel>
                <Input value={[horarioInicio, horarioFim].filter(Boolean).join(' – ')} disabled />
              </FormItem>
            </CardContent>
          </Card>

          {/* Identificação */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Identificação</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <FormField control={form.control} name="nome_professor" render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Nome do professor(a) observado(a)*</FormLabel>
                  <FormControl><Input {...field} value={field.value ?? ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="ano" render={({ field }) => (
                <FormItem>
                  <FormLabel>Ano*</FormLabel>
                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione o ano" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {GPA_ANO_OPTIONS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="turma" render={({ field }) => (
                <FormItem>
                  <FormLabel>Turma*</FormLabel>
                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione a turma" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {GPA_TURMA_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="qtd_estudantes" render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Qtd. de estudantes na turma</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          {/* Segmento, Material e Alunos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Segmento, Material e Alunos</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 lg:grid-cols-3">
              <FormField control={form.control} name="segmento" render={({ field }) => (
                <FormItem>
                  <FormLabel>Segmento*</FormLabel>
                  <FormControl>
                    <RadioGroup value={field.value} onValueChange={field.onChange} className="space-y-3">
                      <div className="flex items-center gap-2"><RadioGroupItem value="anos_iniciais" id="gpa-seg-ai" /><Label htmlFor="gpa-seg-ai">Anos iniciais</Label></div>
                      <div className="flex items-center gap-2"><RadioGroupItem value="anos_finais" id="gpa-seg-af" /><Label htmlFor="gpa-seg-af">Anos finais</Label></div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <Controller control={form.control} name="material_didatico" render={({ field }) => (
                <FormItem>
                  <FormLabel>Material Didático*</FormLabel>
                  <div className="space-y-3">
                    {GPA_MATERIAL_DIDATICO_OPTIONS.map((option) => {
                      const checked = field.value?.includes(option) ?? false;
                      return (
                        <label key={option} className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm">
                          <Checkbox checked={checked} onCheckedChange={(state) => {
                            const current = field.value ?? [];
                            field.onChange(state ? [...current, option] : current.filter((item) => item !== option));
                          }} />
                          <span>{option}</span>
                        </label>
                      );
                    })}
                  </div>
                  <FormMessage>{form.formState.errors.material_didatico?.message}</FormMessage>
                </FormItem>
              )} />

              <div className="space-y-4">
                <h3 className="text-sm font-medium text-foreground">Alunos presentes</h3>
                <FormField control={form.control} name="alunos_masculino" render={({ field }) => (
                  <FormItem><FormLabel>Masculino*</FormLabel><FormControl><Input type="number" value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="alunos_feminino" render={({ field }) => (
                  <FormItem><FormLabel>Feminino*</FormLabel><FormControl><Input type="number" value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
            </CardContent>
          </Card>

          <RubricaLegendCard />

          {/* 9 Critérios */}
          <div className="space-y-4">
            {GPA_CRITERIA.map((criterion) => {
              const notaField = `nota_criterio_${criterion.id}` as keyof FormValues;
              const evidenciaField = `evidencia_criterio_${criterion.id}` as keyof FormValues;
              return (
                <Card key={criterion.id}>
                  <CardHeader>
                    <CardDescription className="uppercase text-xs tracking-wide">{criterion.dimension}</CardDescription>
                    <CardTitle className="text-lg font-semibold">Critério {criterion.id} — {criterion.title}</CardTitle>
                    <CardDescription className="italic">Foco: {criterion.focus}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Accordion type="single" collapsible>
                      <AccordionItem value={`criterion-${criterion.id}`}>
                        <AccordionTrigger>Ver descritores dos níveis ▾</AccordionTrigger>
                        <AccordionContent>
                          <div className="overflow-hidden rounded-lg border border-border">
                            <table className="w-full text-sm">
                              <thead className="bg-muted/50 text-left">
                                <tr>
                                  <th className="px-4 py-3 font-semibold">Nível</th>
                                  <th className="px-4 py-3 font-semibold">O observador vê...</th>
                                </tr>
                              </thead>
                              <tbody>
                                {criterion.levels.map((level, index) => (
                                  <tr key={index} className="border-t border-border align-top">
                                    <td className="px-4 py-3 font-medium text-foreground">{index + 1}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{level}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>

                    <FormField control={form.control} name={notaField} render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nota atribuída*</FormLabel>
                        <FormControl>
                          <RadioGroup value={field.value ? String(field.value) : undefined} onValueChange={(value) => field.onChange(Number(value))} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {[1,2,3,4].map((nota) => (
                              <label key={nota} className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-3 text-sm font-medium hover:bg-muted/40">
                                <RadioGroupItem value={String(nota)} id={`gpa-${String(notaField)}-${nota}`} />
                                <span>{nota}</span>
                              </label>
                            ))}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name={evidenciaField} render={({ field }) => (
                      <FormItem>
                        <FormLabel>Evidência observada</FormLabel>
                        <FormControl><Textarea {...field} value={(field.value as string) ?? ''} placeholder="Descreva evidências observadas na aula" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Encaminhamentos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Encaminhamentos</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <FormField control={form.control} name="pontos_fortes" render={({ field }) => (
                <FormItem><FormLabel>Pontos fortes da aula</FormLabel><FormControl><Textarea {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="aspectos_fortalecer" render={({ field }) => (
                <FormItem><FormLabel>Aspectos a fortalecer</FormLabel><FormControl><Textarea {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="estrategias_sugeridas" render={({ field }) => (
                <FormItem><FormLabel>Estratégias sugeridas</FormLabel><FormControl><Textarea {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="combinacao_acompanhamento" render={({ field }) => (
                <FormItem><FormLabel>Combinação para acompanhamento futuro</FormLabel><FormControl><Textarea {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
              )} />
            </CardContent>
          </Card>

          {/* Síntese das notas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Síntese das Notas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Nº</th>
                      <th className="px-3 py-2 font-semibold">Critério</th>
                      <th className="px-3 py-2 font-semibold">Nota</th>
                      <th className="px-3 py-2 font-semibold">Dimensão</th>
                    </tr>
                  </thead>
                  <tbody>
                    {GPA_CRITERIA.map((c, i) => {
                      const nota = watchedNotes[i];
                      const dim = c.dimension.split('—')[0].trim();
                      return (
                        <tr key={c.id} className="border-t border-border align-top">
                          <td className="px-3 py-2">{c.id}</td>
                          <td className="px-3 py-2 text-muted-foreground">{c.title}</td>
                          <td className="px-3 py-2 font-medium">{nota || '—'}</td>
                          <td className="px-3 py-2">{dim}</td>
                        </tr>
                      );
                    })}
                    <tr className="border-t border-border bg-muted/30 font-semibold">
                      <td className="px-3 py-2" colSpan={2}>MÉDIA GERAL</td>
                      <td className="px-3 py-2" colSpan={2}>{mediaGeral !== null ? mediaGeral.toFixed(2) : '—'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col justify-end gap-3 sm:flex-row">
            <Button type="button" variant="outline" onClick={handleSaveDraft} disabled={isSavingDraft || isSubmitting}>
              {isSavingDraft && <Loader2 className="h-4 w-4 animate-spin" />}Salvar Rascunho
            </Button>
            <Button type="submit" disabled={isSavingDraft || isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}Enviar
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
