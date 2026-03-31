import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronsUpDown, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { BinaryScaleLegendCard, BINARY_SCALE_OPTIONS, ETEG_ITEMS } from '@/pages/formularios/redesFormShared';
import type { RedesFormProps } from './ObservacaoAulaRedesForm';

const schema = z.object({
  municipio: z.string().trim().min(1, 'Entidade é obrigatória'),
  data: z.date({ required_error: 'Data é obrigatória' }),
  equipe: z.string().trim().min(1, 'Equipe é obrigatória'),
  horario: z.string().optional(),
  observador: z.string().trim().min(1, 'Observador(a) é obrigatório'),
  mes_referencia: z.string().trim().min(1, 'Mês de referência é obrigatório'),
  turma_formacao: z.array(z.string()).optional(),
  item_1: z.coerce.number().int().min(0).max(2),
  item_2: z.coerce.number().int().min(0).max(2),
  item_3: z.coerce.number().int().min(0).max(2),
  item_4: z.coerce.number().int().min(0).max(2),
  item_5: z.coerce.number().int().min(0).max(2),
  item_6: z.coerce.number().int().min(0).max(2),
  item_7: z.coerce.number().int().min(0).max(2),
  item_8: z.coerce.number().int().min(0).max(2),
  relato_objetivo: z.string().optional(),
  pontos_fortes: z.string().optional(),
  aspectos_criticos: z.string().optional(),
  encaminhamentos: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function EncontroETEGRedesForm({ entidades, data, horarioInicio, onSuccess }: RedesFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [turmasFormacao, setTurmasFormacao] = useState<string[]>([]);
  const [turmaPopoverOpen, setTurmaPopoverOpen] = useState(false);

  useEffect(() => {
    const fetchTurmas = async () => {
      const { data: turmasData } = await supabase
        .from('professores')
        .select('turma_formacao')
        .not('turma_formacao', 'is', null)
        .eq('ativo', true);
      if (turmasData) {
        const unique = [...new Set(turmasData.map(d => (d as any).turma_formacao as string).filter(Boolean))].sort();
        setTurmasFormacao(unique);
      }
    };
    fetchTurmas();
  }, []);

  const singleEntidade = entidades.length === 1;
  const parsedDate = data ? new Date(data + 'T12:00:00') : undefined;

  const mesRef = parsedDate ? format(parsedDate, 'MMMM/yyyy', { locale: ptBR }) : '';

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      municipio: singleEntidade ? entidades[0].nome : '',
      data: parsedDate,
      horario: horarioInicio || '',
      mes_referencia: mesRef,
      turma_formacao: [],
      relato_objetivo: '',
      pontos_fortes: '',
      aspectos_criticos: '',
      encaminhamentos: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const payload: any = {
        ...values,
        data: format(values.data, 'yyyy-MM-dd'),
        status: 'enviado',
        turma_formacao: values.turma_formacao && values.turma_formacao.length > 0 ? values.turma_formacao : null,
      };
      const { error } = await (supabase as any).from('relatorios_eteg_redes').insert(payload);
      if (error) throw error;
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
      <BinaryScaleLegendCard />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-xl">Identificação</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {singleEntidade ? (
                <FormField control={form.control} name="municipio" render={({ field }) => (
                  <FormItem><FormLabel>Entidade*</FormLabel><FormControl><Input {...field} disabled /></FormControl><FormMessage /></FormItem>
                )} />
              ) : (
                <FormField control={form.control} name="municipio" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entidade*</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecione a entidade" /></SelectTrigger></FormControl>
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

              <FormItem>
                <FormLabel>Data</FormLabel>
                <Input value={parsedDate ? format(parsedDate, 'dd/MM/yyyy', { locale: ptBR }) : ''} disabled />
              </FormItem>

              <FormField control={form.control} name="equipe" render={({ field }) => (
                <FormItem><FormLabel>Equipe Gestora ou Equipe Técnica*</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
              )} />

              <FormItem>
                <FormLabel>Horário</FormLabel>
                <Input value={horarioInicio || ''} disabled />
              </FormItem>

              <FormField control={form.control} name="observador" render={({ field }) => (
                <FormItem><FormLabel>Observador(a)*</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="mes_referencia" render={({ field }) => (
                <FormItem><FormLabel>Mês de referência*</FormLabel><FormControl><Input {...field} value={field.value ?? ''} disabled /></FormControl><FormMessage /></FormItem>
              )} />

              <FormField control={form.control} name="turma_formacao" render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Turma de Formação</FormLabel>
                  <Popover open={turmaPopoverOpen} onOpenChange={setTurmaPopoverOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant="outline" role="combobox" type="button" className="w-full justify-between font-normal">
                          {field.value && field.value.length > 0
                            ? `${field.value.length} selecionada(s)`
                            : 'Selecione as turmas'}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-2 max-h-60 overflow-y-auto">
                      {turmasFormacao.length === 0 ? (
                        <p className="text-sm text-muted-foreground p-2">Nenhuma turma cadastrada</p>
                      ) : (
                        turmasFormacao.map(turma => {
                          const selected = field.value?.includes(turma) ?? false;
                          return (
                            <label key={turma} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer hover:bg-muted/50">
                              <Checkbox
                                checked={selected}
                                onCheckedChange={(checked) => {
                                  const current = field.value || [];
                                  field.onChange(
                                    checked
                                      ? [...current, turma]
                                      : current.filter(t => t !== turma)
                                  );
                                }}
                              />
                              <span>{turma}</span>
                            </label>
                          );
                        })
                      )}
                    </PopoverContent>
                  </Popover>
                  {field.value && field.value.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {field.value.map(t => (
                        <Badge key={t} variant="secondary" className="text-xs gap-1">
                          {t}
                          <X className="h-3 w-3 cursor-pointer" onClick={() => field.onChange(field.value!.filter(v => v !== t))} />
                        </Badge>
                      ))}
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-xl">Itens de Verificação</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {ETEG_ITEMS.map((item, index) => {
                const fieldName = `item_${index + 1}` as keyof FormValues;
                return (
                  <FormField key={fieldName} control={form.control} name={fieldName} render={({ field }) => (
                    <FormItem className="rounded-lg border border-border p-4">
                      <div className="mb-3 text-sm font-medium text-foreground">{index + 1}. {item}</div>
                      <FormControl>
                        <RadioGroup value={field.value !== undefined ? String(field.value) : undefined} onValueChange={(value) => field.onChange(Number(value))} className="grid grid-cols-3 gap-3">
                          {[0, 1, 2].map((value) => (
                            <label key={value} className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-border px-4 py-3 text-sm font-medium hover:bg-muted/40">
                              <RadioGroupItem value={String(value)} id={`${String(fieldName)}-${value}`} />
                              <span>{value}</span>
                            </label>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-xl">Relato Objetivo</CardTitle></CardHeader>
            <CardContent>
              <FormField control={form.control} name="relato_objetivo" render={({ field }) => (
                <FormItem><FormLabel>Percepções e evidências observadas na visita</FormLabel><FormControl><Textarea {...field} value={field.value ?? ''} className="min-h-36" /></FormControl><FormMessage /></FormItem>
              )} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-xl">Pontuação e Encaminhamentos</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <FormField control={form.control} name="pontos_fortes" render={({ field }) => (
                <FormItem><FormLabel>Principais pontos fortes observados</FormLabel><FormControl><Textarea {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="aspectos_criticos" render={({ field }) => (
                <FormItem><FormLabel>Aspectos críticos / a fortalecer</FormLabel><FormControl><Textarea {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="encaminhamentos" render={({ field }) => (
                <FormItem><FormLabel>Encaminhamentos acordados</FormLabel><FormControl><Textarea {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
              )} />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}Enviar</Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
