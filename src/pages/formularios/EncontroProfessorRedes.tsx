import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { BinaryScaleLegendCard, DatePickerField, PROFESSOR_ITEMS, RedesPageHeader } from './redesFormShared';

const schema = z.object({
  municipio: z.string().trim().min(1, 'Município é obrigatório'),
  data: z.date({ required_error: 'Data é obrigatória' }),
  componente_curricular: z.enum(['LP', 'Mat'], { required_error: 'Componente é obrigatório' }),
  horario: z.string().optional(),
  formador: z.string().trim().min(1, 'Formador(a) é obrigatório'),
  turma_ano: z.string().trim().min(1, 'Turma / Ano é obrigatório'),
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

export default function EncontroProfessorRedes() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      horario: '',
      relato_objetivo: '',
      pontos_fortes: '',
      aspectos_criticos: '',
      encaminhamentos: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const { error } = await (supabase as any).from('relatorios_professor_redes').insert({
        ...values,
        data: format(values.data, 'yyyy-MM-dd'),
        status: 'enviado',
      });
      if (error) throw error;
      toast.success('Formulário enviado com sucesso!');
      form.reset();
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao enviar formulário');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <RedesPageHeader
        title="Encontro Formativo Professor – REDES"
        description="Registro de observação do encontro formativo com professores e foco em implementação pedagógica."
      />

      <BinaryScaleLegendCard />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-xl">Identificação</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <FormField control={form.control} name="municipio" render={({ field }) => (
                <FormItem><FormLabel>Município*</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="data" render={({ field }) => (
                <FormItem><FormLabel>Data*</FormLabel><FormControl><DatePickerField value={field.value} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="componente_curricular" render={({ field }) => (
                <FormItem><FormLabel>Componente Curricular*</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl><SelectContent><SelectItem value="LP">LP</SelectItem><SelectItem value="Mat">Mat</SelectItem></SelectContent></Select><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="horario" render={({ field }) => (
                <FormItem><FormLabel>Horário</FormLabel><FormControl><Input type="time" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="formador" render={({ field }) => (
                <FormItem><FormLabel>Formador(a)*</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="turma_ano" render={({ field }) => (
                <FormItem><FormLabel>Turma / Ano*</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
              )} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-xl">Itens de Verificação</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {PROFESSOR_ITEMS.map((item, index) => {
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
                <FormItem><FormLabel>Percepções e evidências observadas no encontro formativo</FormLabel><FormControl><Textarea {...field} value={field.value ?? ''} className="min-h-36" /></FormControl><FormMessage /></FormItem>
              )} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-xl">Encaminhamentos</CardTitle></CardHeader>
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
