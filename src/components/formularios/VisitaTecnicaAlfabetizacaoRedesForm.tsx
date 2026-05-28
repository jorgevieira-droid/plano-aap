import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
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
  CRITERIOS, DIMENSOES, MATERIAL_DIDATICO_OPCOES,
  NIVEL_IAB_OPCOES, SEGMENTO_OPCOES, TURMA_OPCOES,
} from './visitaAlfabetizacaoRedesShared';

export interface VisitaTecnicaAlfabetizacaoRedesFormProps {
  entidades: { id: string; nome: string }[];
  data: string;
  horario?: string;
  tecnicoVisitanteNome?: string;
  registroAcaoId: string;
  onSuccess?: () => void;
}

const criteriosShape: Record<string, any> = {};
for (const c of CRITERIOS) {
  criteriosShape[`nota_criterio_${c.numero}`] = z.coerce.number().int().min(1).max(4).optional().nullable();
  criteriosShape[`evidencia_criterio_${c.numero}`] = z.string().optional();
}

const schema = z.object({
  rede_municipal: z.string().trim().optional(),
  nome_escola: z.string().trim().optional(),
  tecnico_visitante: z.string().trim().optional(),
  horario: z.string().optional(),
  turma_ano: z.string().optional(),
  nivel_iab: z.string().optional(),
  qtd_estudantes: z.coerce.number().int().min(0).optional().nullable(),
  segmento: z.string().optional(),
  material_didatico: z.array(z.string()).default([]),
  alunos_masculino: z.coerce.number().int().min(0).optional().nullable(),
  alunos_feminino: z.coerce.number().int().min(0).optional().nullable(),
  pontos_fortes: z.string().optional(),
  aspectos_fortalecer: z.string().optional(),
  estrategias_sugeridas: z.string().optional(),
  combinacao_acompanhamento: z.string().optional(),
  ...criteriosShape,
});

type FormValues = z.infer<typeof schema>;

export default function VisitaTecnicaAlfabetizacaoRedesForm({
  entidades, data, horario, tecnicoVisitanteNome, registroAcaoId, onSuccess,
}: VisitaTecnicaAlfabetizacaoRedesFormProps) {
  const { user } = useAuth();
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [entidadesFilho, setEntidadesFilho] = useState<{ id: string; nome: string }[]>([]);
  const [selectedRedeId, setSelectedRedeId] = useState<string | null>(
    entidades.length === 1 ? entidades[0].id : null,
  );

  const singleEntidade = entidades.length === 1;
  const parsedDate = data ? new Date(data + 'T12:00:00') : undefined;

  const defaultCriterios: Record<string, any> = {};
  for (const c of CRITERIOS) {
    defaultCriterios[`nota_criterio_${c.numero}`] = null;
    defaultCriterios[`evidencia_criterio_${c.numero}`] = '';
  }

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      rede_municipal: singleEntidade ? entidades[0].nome : '',
      nome_escola: '',
      tecnico_visitante: tecnicoVisitanteNome || '',
      horario: horario || '',
      turma_ano: '',
      nivel_iab: '',
      qtd_estudantes: null,
      segmento: '',
      material_didatico: [],
      alunos_masculino: null,
      alunos_feminino: null,
      pontos_fortes: '',
      aspectos_fortalecer: '',
      estrategias_sugeridas: '',
      combinacao_acompanhamento: '',
      ...defaultCriterios,
    } as any,
    mode: 'onSubmit',
  });

  // Hydrate from existing record
  useEffect(() => {
    if (!registroAcaoId) return;
    let cancelled = false;
    (async () => {
      const { data: existing } = await (supabase as any)
        .from('relatorios_visita_tecnica_alfabetizacao_redes')
        .select('*')
        .eq('registro_acao_id', registroAcaoId)
        .maybeSingle();
      if (cancelled || !existing) return;
      const ent = entidades.find(e => e.nome === existing.rede_municipal);
      if (ent) setSelectedRedeId(ent.id);

      const criterios: Record<string, any> = {};
      for (const c of CRITERIOS) {
        criterios[`nota_criterio_${c.numero}`] = existing[`nota_criterio_${c.numero}`] ?? null;
        criterios[`evidencia_criterio_${c.numero}`] = existing[`evidencia_criterio_${c.numero}`] ?? '';
      }
      form.reset({
        rede_municipal: existing.rede_municipal || (singleEntidade ? entidades[0].nome : ''),
        nome_escola: existing.nome_escola || '',
        tecnico_visitante: existing.tecnico_visitante || tecnicoVisitanteNome || '',
        horario: existing.horario || horario || '',
        turma_ano: existing.turma_ano || '',
        nivel_iab: existing.nivel_iab || '',
        qtd_estudantes: existing.qtd_estudantes ?? null,
        segmento: existing.segmento || '',
        material_didatico: existing.material_didatico || [],
        alunos_masculino: existing.alunos_masculino ?? null,
        alunos_feminino: existing.alunos_feminino ?? null,
        pontos_fortes: existing.pontos_fortes || '',
        aspectos_fortalecer: existing.aspectos_fortalecer || '',
        estrategias_sugeridas: existing.estrategias_sugeridas || '',
        combinacao_acompanhamento: existing.combinacao_acompanhamento || '',
        ...criterios,
      } as any);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registroAcaoId]);

  // Fetch entidades_filho when Rede is selected
  useEffect(() => {
    if (!selectedRedeId) { setEntidadesFilho([]); return; }
    (async () => {
      const { data: filhos } = await supabase
        .from('entidades_filho')
        .select('id, nome')
        .eq('escola_id', selectedRedeId)
        .eq('ativa', true)
        .order('nome');
      setEntidadesFilho(filhos || []);
    })();
  }, [selectedRedeId]);

  const persist = async (values: FormValues, status: 'rascunho' | 'enviado') => {
    if (!registroAcaoId) throw new Error('registro_acao_id ausente');
    const payload: any = {
      ...values,
      data: parsedDate ? format(parsedDate, 'yyyy-MM-dd', { locale: ptBR }) : null,
      registro_acao_id: registroAcaoId,
      created_by: user?.id,
      status,
      // Normalizar campos vazios
      horario: values.horario || null,
    };
    const { error } = await (supabase as any)
      .from('relatorios_visita_tecnica_alfabetizacao_redes')
      .upsert(payload, { onConflict: 'registro_acao_id' });
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

  const renderMultiCheckbox = (name: keyof FormValues, options: string[]) => (
    <Controller
      control={form.control}
      name={name as any}
      render={({ field }) => (
        <div className="space-y-2">
          {options.map(opt => {
            const current: string[] = (field.value as string[]) || [];
            const checked = current.includes(opt);
            return (
              <label key={opt} className="flex items-start gap-3 rounded-md border border-border p-2 text-sm">
                <Checkbox
                  checked={checked}
                  onCheckedChange={(state) => {
                    field.onChange(state ? [...current, opt] : current.filter((v) => v !== opt));
                  }}
                />
                <span className="break-words min-w-0">{opt}</span>
              </label>
            );
          })}
        </div>
      )}
    />
  );

  // Group criterios by dimension
  const grouped = CRITERIOS.reduce<Record<string, typeof CRITERIOS>>((acc, c) => {
    (acc[c.dimensao] ||= [] as any).push(c);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

          {/* Identificação */}
          <Card>
            <CardHeader><CardTitle className="text-xl">Identificação da visita</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {singleEntidade ? (
                <FormField control={form.control} name="rede_municipal" render={({ field }) => (
                  <FormItem><FormLabel>Rede Municipal*</FormLabel><FormControl><Input {...field} value={field.value || ''} disabled /></FormControl><FormMessage /></FormItem>
                )} />
              ) : (
                <FormField control={form.control} name="rede_municipal" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rede Municipal*</FormLabel>
                    <Select value={field.value || ''} onValueChange={(val) => {
                      field.onChange(val);
                      const ent = entidades.find(e => e.nome === val);
                      setSelectedRedeId(ent?.id || null);
                      form.setValue('nome_escola', '');
                    }}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecione a rede" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {entidades.map(e => <SelectItem key={e.id} value={e.nome}>{e.nome}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              )}

              <FormItem>
                <FormLabel>Data*</FormLabel>
                <Input value={parsedDate ? format(parsedDate, 'dd/MM/yyyy', { locale: ptBR }) : ''} disabled />
              </FormItem>

              <FormField control={form.control} name="nome_escola" render={({ field }) => (
                <FormItem>
                  <FormLabel>Escola*</FormLabel>
                  <Select value={field.value || undefined} onValueChange={field.onChange} disabled={!selectedRedeId}>
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
                  <FormLabel>Técnico(a) Visitante*</FormLabel>
                  <FormControl><Input {...field} value={field.value || ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="horario" render={({ field }) => (
                <FormItem>
                  <FormLabel>Horário</FormLabel>
                  <FormControl><Input type="time" {...field} value={field.value || ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          {/* Caracterização da turma */}
          <Card>
            <CardHeader><CardTitle className="text-xl">Caracterização da turma</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <FormField control={form.control} name="turma_ano" render={({ field }) => (
                <FormItem>
                  <FormLabel>Turma / Ano*</FormLabel>
                  <Select value={field.value || ''} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {TURMA_OPCOES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="nivel_iab" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nível IAB em uso*</FormLabel>
                  <Select value={field.value || ''} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {NIVEL_IAB_OPCOES.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="qtd_estudantes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Qtd. de estudantes na turma</FormLabel>
                  <FormControl><Input type="number" min={0} {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="segmento" render={({ field }) => (
                <FormItem>
                  <FormLabel>Segmento*</FormLabel>
                  <Select value={field.value || ''} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {SEGMENTO_OPCOES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="alunos_masculino" render={({ field }) => (
                <FormItem>
                  <FormLabel>Alunos presentes — Masculino*</FormLabel>
                  <FormControl><Input type="number" min={0} {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="alunos_feminino" render={({ field }) => (
                <FormItem>
                  <FormLabel>Alunos presentes — Feminino*</FormLabel>
                  <FormControl><Input type="number" min={0} {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="md:col-span-2">
                <Label className="mb-2 block">Material Didático IAB utilizado*</Label>
                {renderMultiCheckbox('material_didatico', MATERIAL_DIDATICO_OPCOES)}
              </div>
            </CardContent>
          </Card>

          {/* Dimensões e Critérios */}
          {Object.entries(grouped).map(([dimensao, items]) => (
            <div key={dimensao} className="space-y-4">
              <h3 className="text-base font-semibold text-primary border-b pb-2">{dimensao}</h3>
              {items.map(c => (
                <Card key={c.numero}>
                  <CardHeader>
                    <CardTitle className="text-base">{c.numero}. {c.pergunta}</CardTitle>
                    {c.foco && <p className="text-sm text-muted-foreground"><strong>Foco:</strong> {c.foco}</p>}
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

                    <FormField control={form.control} name={`nota_criterio_${c.numero}` as any} render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nota atribuída (1 a 4)</FormLabel>
                        <Select
                          value={field.value ? String(field.value) : ''}
                          onValueChange={(v) => field.onChange(v ? Number(v) : null)}
                        >
                          <FormControl><SelectTrigger><SelectValue placeholder="Selecione a nota" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="1">1 — Insuficiente</SelectItem>
                            <SelectItem value="2">2 — Em Desenvolvimento</SelectItem>
                            <SelectItem value="3">3 — Consolidado</SelectItem>
                            <SelectItem value="4">4 — Avançado</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name={`evidencia_criterio_${c.numero}` as any} render={({ field }) => (
                      <FormItem>
                        <FormLabel>Evidência observada</FormLabel>
                        <FormControl><Textarea rows={3} {...field} value={(field.value as string) || ''} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </CardContent>
                </Card>
              ))}
            </div>
          ))}

          {/* Encaminhamentos */}
          <Card>
            <CardHeader><CardTitle className="text-xl">Encaminhamentos</CardTitle></CardHeader>
            <CardContent className="grid gap-4">
              <FormField control={form.control} name="pontos_fortes" render={({ field }) => (
                <FormItem><FormLabel>Pontos fortes observados</FormLabel><FormControl><Textarea rows={3} {...field} value={(field.value as string) || ''} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="aspectos_fortalecer" render={({ field }) => (
                <FormItem><FormLabel>Aspectos a fortalecer</FormLabel><FormControl><Textarea rows={3} {...field} value={(field.value as string) || ''} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="estrategias_sugeridas" render={({ field }) => (
                <FormItem><FormLabel>Estratégias sugeridas</FormLabel><FormControl><Textarea rows={3} {...field} value={(field.value as string) || ''} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="combinacao_acompanhamento" render={({ field }) => (
                <FormItem><FormLabel>Combinações para acompanhamento futuro</FormLabel><FormControl><Textarea rows={3} {...field} value={(field.value as string) || ''} /></FormControl><FormMessage /></FormItem>
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
