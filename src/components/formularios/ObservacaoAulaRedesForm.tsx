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
import { MATERIAL_DIDATICO_OPTIONS, REDES_OBSERVACAO_CRITERIA, RubricaLegendCard } from '@/pages/formularios/redesFormShared';

export interface RedesFormProps {
  entidades: { id: string; nome: string }[];
  data: string;
  horarioInicio: string;
  horarioFim?: string;
  local?: string;
  onSuccess?: () => void;
}

const schema = z.object({
  municipio: z.string().trim().min(1, 'Entidade é obrigatória'),
  data: z.date({ required_error: 'Data é obrigatória' }),
  nome_escola: z.string().trim().min(1, 'Nome da escola é obrigatório'),
  nome_professor: z.string().trim().min(1, 'Nome do professor é obrigatório'),
  observador: z.string().optional(),
  horario: z.string().optional(),
  turma_ano: z.string().trim().min(1, 'Turma / Ano é obrigatório'),
  qtd_estudantes: z.coerce.number().int().min(0).optional().nullable(),
  caderno: z.coerce.number().int().min(1).max(5),
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

export default function ObservacaoAulaRedesForm({ entidades, data, horarioInicio, onSuccess }: RedesFormProps) {
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [entidadesFilho, setEntidadesFilho] = useState<{ id: string; nome: string }[]>([]);
  const [selectedRedeId, setSelectedRedeId] = useState<string | null>(
    entidades.length === 1 ? entidades[0].id : null
  );

  const singleEntidade = entidades.length === 1;
  const parsedDate = data ? new Date(data + 'T12:00:00') : undefined;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      municipio: singleEntidade ? entidades[0].nome : '',
      data: parsedDate,
      horario: horarioInicio || '',
      observador: '',
      qtd_estudantes: null,
      material_didatico: [],
      pontos_fortes: '',
      aspectos_fortalecer: '',
      estrategias_sugeridas: '',
      combinacao_acompanhamento: '',
    },
    mode: 'onSubmit',
  });

  // Fetch entidades_filho when a Rede is selected
  useEffect(() => {
    if (!selectedRedeId) {
      setEntidadesFilho([]);
      return;
    }
    const fetchFilhos = async () => {
      const { data: filhos } = await supabase
        .from('entidades_filho')
        .select('id, nome')
        .eq('escola_id', selectedRedeId)
        .eq('ativa', true)
        .order('nome');
      setEntidadesFilho(filhos || []);
    };
    fetchFilhos();
  }, [selectedRedeId]);

  const TURMA_OPTIONS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

  const watchedNotes = form.watch([
    'nota_criterio_1','nota_criterio_2','nota_criterio_3','nota_criterio_4','nota_criterio_5','nota_criterio_6','nota_criterio_7','nota_criterio_8','nota_criterio_9',
  ]);

  const criteriosAvaliados = useMemo(() => watchedNotes.filter(Boolean).length, [watchedNotes]);
  const progress = (criteriosAvaliados / 9) * 100;

  const persist = async (values: Partial<FormValues>, status: 'rascunho' | 'enviado') => {
    const payload = {
      ...values,
      data: values.data instanceof Date ? format(values.data, 'yyyy-MM-dd', { locale: ptBR }) : null,
      qtd_estudantes: values.qtd_estudantes ?? null,
      alunos_masculino: values.alunos_masculino ?? null,
      alunos_feminino: values.alunos_feminino ?? null,
      status,
    };

    const { error } = await (supabase as any).from('observacoes_aula_redes').insert(payload);
    if (error) throw error;
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
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Informações Gerais</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {/* Rede (Município) */}
              {singleEntidade ? (
                <FormField control={form.control} name="municipio" render={({ field }) => (
                  <FormItem><FormLabel>Rede*</FormLabel><FormControl><Input {...field} disabled /></FormControl><FormMessage /></FormItem>
                )} />
              ) : (
                <FormField control={form.control} name="municipio" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rede*</FormLabel>
                    <Select value={field.value} onValueChange={(val) => {
                      field.onChange(val);
                      const ent = entidades.find(e => e.nome === val);
                      setSelectedRedeId(ent?.id || null);
                      form.setValue('nome_escola', '');
                    }}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecione a rede" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {entidades.map(e => (
                          <SelectItem key={e.id} value={e.nome}>{e.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              )}

              {/* Data — read-only from programação */}
              <FormItem>
                <FormLabel>Data</FormLabel>
                <Input value={parsedDate ? format(parsedDate, 'dd/MM/yyyy', { locale: ptBR }) : ''} disabled />
              </FormItem>

              {/* Escola (Entidade Filho) */}
              <FormField control={form.control} name="nome_escola" render={({ field }) => (
                <FormItem>
                  <FormLabel>Escola*</FormLabel>
                  <Select
                    value={field.value || undefined}
                    onValueChange={field.onChange}
                    disabled={!selectedRedeId}
                  >
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione a escola" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {entidadesFilho.map(ef => (
                        <SelectItem key={ef.id} value={ef.nome}>{ef.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Turma */}
              <FormField control={form.control} name="turma_ano" render={({ field }) => (
                <FormItem>
                  <FormLabel>Turma*</FormLabel>
                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione a turma" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {TURMA_OPTIONS.map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="nome_professor" render={({ field }) => (
                <FormItem><FormLabel>Nome do professor(a) observado(a)*</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="observador" render={({ field }) => (
                <FormItem><FormLabel>Formador</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
              )} />

              {/* Horário — read-only from programação */}
              <FormItem>
                <FormLabel>Horário</FormLabel>
                <Input value={horarioInicio || ''} disabled />
              </FormItem>
              <FormField control={form.control} name="qtd_estudantes" render={({ field }) => (
                <FormItem><FormLabel>Qtd. de estudantes na turma</FormLabel><FormControl><Input type="number" value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="caderno" render={({ field }) => (
                <FormItem className="md:col-span-2"><FormLabel>Caderno(s) em uso*</FormLabel><Select onValueChange={(value) => field.onChange(Number(value))} value={field.value ? String(field.value) : undefined}><FormControl><SelectTrigger><SelectValue placeholder="Selecione o caderno" /></SelectTrigger></FormControl><SelectContent><SelectItem value="1">1 = Básico Inicial</SelectItem><SelectItem value="2">2 = Básico Consolidado</SelectItem><SelectItem value="3">3 = Intermediário</SelectItem><SelectItem value="4">4 = Avançado Inicial</SelectItem><SelectItem value="5">5 = Avançado</SelectItem></SelectContent></Select><FormMessage /></FormItem>
              )} />
            </CardContent>
          </Card>

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
                      <div className="flex items-center gap-2"><RadioGroupItem value="anos_iniciais" id="seg-ai" /><Label htmlFor="seg-ai">Anos iniciais</Label></div>
                      <div className="flex items-center gap-2"><RadioGroupItem value="anos_finais" id="seg-af" /><Label htmlFor="seg-af">Anos finais</Label></div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <Controller control={form.control} name="material_didatico" render={({ field }) => (
                <FormItem>
                  <FormLabel>Material Didático*</FormLabel>
                  <div className="space-y-3">
                    {MATERIAL_DIDATICO_OPTIONS.map((option) => {
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

          <div className="space-y-4">
            {REDES_OBSERVACAO_CRITERIA.map((criterion) => {
              const notaField = `nota_criterio_${criterion.id}` as keyof FormValues;
              const evidenciaField = `evidencia_criterio_${criterion.id}` as keyof FormValues;
              return (
                <Card key={criterion.id}>
                  <CardHeader>
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
                                <RadioGroupItem value={String(nota)} id={`${notaField}-${nota}`} />
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
