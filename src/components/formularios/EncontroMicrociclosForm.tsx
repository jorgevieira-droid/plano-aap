import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
import { BinaryScaleLegendCard, BINARY_SCALE_OPTIONS, MICROCICLOS_ITEMS } from '@/pages/formularios/redesFormShared';
import type { RedesFormProps } from './ObservacaoAulaRedesForm';

interface MicrociclosFormProps extends RedesFormProps {
  registroAcaoId?: string;
  escolaId?: string;
  programa?: string[] | null;
  tipo?: string;
  segmento?: string;
  componente?: string;
  anoSerie?: string;
  aapId: string;
}

const schema = z.object({
  municipio: z.string().trim().min(1, 'Entidade é obrigatória'),
  data: z.date({ required_error: 'Data é obrigatória' }),
  formador: z.string().trim().min(1, 'Formador(a) é obrigatório'),
  local: z.string().optional(),
  horario: z.string().optional(),
  ponto_focal_rede: z.string().trim().min(1, 'Ponto Focal da Rede é obrigatório'),
  item_1: z.coerce.number().int().min(0).max(2),
  item_2: z.coerce.number().int().min(0).max(2),
  item_3: z.coerce.number().int().min(0).max(2),
  item_4: z.coerce.number().int().min(0).max(2),
  item_5: z.coerce.number().int().min(0).max(2),
  item_6: z.coerce.number().int().min(0).max(2),
  item_7: z.coerce.number().int().min(0).max(2),
  item_8: z.coerce.number().int().min(0).max(2),
  item_9: z.coerce.number().int().min(0).max(2),
  item_10: z.coerce.number().int().min(0).max(2),
  plataforma_acesso: z.string().optional(),
  plataforma_quizzes: z.string().optional(),
  plataforma_observacoes: z.string().optional(),
  relato_objetivo: z.string().optional(),
  pontos_fortes: z.string().optional(),
  aspectos_fortalecer: z.string().optional(),
  encaminhamentos_acordados: z.string().optional(),
  encaminhamentos_prazo: z.string().optional(),
  encaminhamentos_responsavel: z.string().optional(),
  proximo_encontro_data: z.string().optional(),
  proximo_encontro_pauta: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function EncontroMicrociclosForm({
  entidades, data, horarioInicio, local, onSuccess,
  registroAcaoId, escolaId, programa, tipo = 'encontro_microciclos_recomposicao',
  segmento = 'todos', componente = 'todos', anoSerie = 'todos', aapId,
}: MicrociclosFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const singleEntidade = entidades.length === 1;
  const parsedDate = data ? new Date(data + 'T12:00:00') : undefined;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      municipio: singleEntidade ? entidades[0].nome : '',
      data: parsedDate,
      horario: horarioInicio || '',
      local: local || '',
      ponto_focal_rede: '',
      relato_objetivo: '',
      pontos_fortes: '',
      aspectos_fortalecer: '',
      encaminhamentos_acordados: '',
      encaminhamentos_prazo: '',
      encaminhamentos_responsavel: '',
      proximo_encontro_data: '',
      proximo_encontro_pauta: '',
      plataforma_acesso: '',
      plataforma_quizzes: '',
      plataforma_observacoes: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const dataIso = format(values.data, 'yyyy-MM-dd');
      const payload: any = {
        registro_acao_id: registroAcaoId || null,
        aap_id: aapId,
        escola_id: escolaId || null,
        municipio: values.municipio,
        data: dataIso,
        formador: values.formador,
        local: values.local || null,
        horario: values.horario || null,
        ponto_focal_rede: values.ponto_focal_rede,
        item_1: values.item_1, item_2: values.item_2, item_3: values.item_3, item_4: values.item_4,
        item_5: values.item_5, item_6: values.item_6, item_7: values.item_7, item_8: values.item_8,
        item_9: values.item_9, item_10: values.item_10,
        plataforma_acesso: values.plataforma_acesso || null,
        plataforma_quizzes: values.plataforma_quizzes || null,
        plataforma_observacoes: values.plataforma_observacoes || null,
        relato_objetivo: values.relato_objetivo || null,
        pontos_fortes: values.pontos_fortes || null,
        aspectos_fortalecer: values.aspectos_fortalecer || null,
        encaminhamentos_acordados: values.encaminhamentos_acordados || null,
        encaminhamentos_prazo: values.encaminhamentos_prazo || null,
        encaminhamentos_responsavel: values.encaminhamentos_responsavel || null,
        proximo_encontro_data: values.proximo_encontro_data || null,
        proximo_encontro_pauta: values.proximo_encontro_pauta || null,
        status: 'enviado',
      };
      const { error } = await (supabase as any).from('relatorios_microciclos_recomposicao').insert(payload);
      if (error) throw error;

      // Auto-create next programacao if proximo_encontro_data is set
      if (values.proximo_encontro_data && escolaId) {
        const proxData = values.proximo_encontro_data;
        const { error: progErr } = await supabase.from('programacoes').insert({
          tipo,
          titulo: 'Encontro Formativo – Microciclos de Recomposição',
          descricao: values.proximo_encontro_pauta || null,
          data: proxData,
          horario_inicio: horarioInicio || '08:00:00',
          horario_fim: '12:00:00',
          escola_id: escolaId,
          aap_id: aapId,
          segmento,
          componente,
          ano_serie: anoSerie,
          status: 'prevista',
          programa: programa || null,
          formacao_origem_id: null,
          local: values.local || null,
        });
        if (progErr) {
          console.error('Erro ao criar próximo encontro:', progErr);
          toast.warning('Formulário salvo, mas o próximo encontro não pôde ser criado.');
        } else {
          toast.success('Formulário enviado e próximo encontro agendado!');
        }
      } else {
        toast.success('Formulário enviado com sucesso!');
      }
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
                  <FormItem><FormLabel>Município/Entidade*</FormLabel><FormControl><Input {...field} disabled /></FormControl><FormMessage /></FormItem>
                )} />
              ) : (
                <FormField control={form.control} name="municipio" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Município/Entidade*</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
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
                <FormLabel>Data</FormLabel>
                <Input value={parsedDate ? format(parsedDate, 'dd/MM/yyyy', { locale: ptBR }) : ''} disabled />
              </FormItem>

              <FormField control={form.control} name="formador" render={({ field }) => (
                <FormItem><FormLabel>Formador(a)*</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
              )} />

              <FormItem>
                <FormLabel>Horário</FormLabel>
                <Input value={horarioInicio || ''} disabled />
              </FormItem>

              <FormField control={form.control} name="local" render={({ field }) => (
                <FormItem><FormLabel>Local</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
              )} />

              <FormField control={form.control} name="ponto_focal_rede" render={({ field }) => (
                <FormItem><FormLabel>Ponto Focal da Rede*</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
              )} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-xl">Itens de Verificação</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {MICROCICLOS_ITEMS.map((item, index) => {
                const fieldName = `item_${index + 1}` as keyof FormValues;
                return (
                  <FormField key={fieldName} control={form.control} name={fieldName} render={({ field }) => (
                    <FormItem className="rounded-lg border border-border p-4">
                      <div className="mb-3 text-sm font-medium text-foreground">{index + 1}. {item}</div>
                      <FormControl>
                        <RadioGroup
                          value={field.value !== undefined ? String(field.value) : undefined}
                          onValueChange={(value) => field.onChange(Number(value))}
                          className="flex flex-col sm:flex-row gap-3"
                        >
                          {BINARY_SCALE_OPTIONS.map((opt) => (
                            <label key={opt.value} className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-4 py-3 text-sm font-medium hover:bg-muted/40">
                              <RadioGroupItem value={String(opt.value)} id={`${String(fieldName)}-${opt.value}`} />
                              <span>{opt.value} – {opt.label}</span>
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
                <FormItem>
                  <FormLabel>Percepções e evidências observadas no encontro</FormLabel>
                  <FormControl><Textarea {...field} value={field.value ?? ''} className="min-h-32" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-xl">Uso da Plataforma Trajetórias</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <FormField control={form.control} name="plataforma_acesso" render={({ field }) => (
                <FormItem>
                  <FormLabel>Acesso aos dados da Plataforma</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="autonoma">Acessam de forma autônoma</SelectItem>
                      <SelectItem value="com_apoio">Acessam com apoio</SelectItem>
                      <SelectItem value="nao_acessam">Não acessam</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="plataforma_quizzes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Quizzes registrados / utilizados</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="sistematicamente">Sistematicamente</SelectItem>
                      <SelectItem value="parcialmente">Parcialmente</SelectItem>
                      <SelectItem value="nao">Não utilizam</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="plataforma_observacoes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações sobre o uso da Plataforma</FormLabel>
                  <FormControl><Textarea {...field} value={field.value ?? ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-xl">Encaminhamentos</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <FormField control={form.control} name="pontos_fortes" render={({ field }) => (
                <FormItem><FormLabel>Pontos fortes</FormLabel><FormControl><Textarea {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="aspectos_fortalecer" render={({ field }) => (
                <FormItem><FormLabel>Aspectos a fortalecer</FormLabel><FormControl><Textarea {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="encaminhamentos_acordados" render={({ field }) => (
                <FormItem className="md:col-span-2"><FormLabel>Encaminhamentos acordados</FormLabel><FormControl><Textarea {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="encaminhamentos_prazo" render={({ field }) => (
                <FormItem><FormLabel>Prazo</FormLabel><FormControl><Input type="date" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="encaminhamentos_responsavel" render={({ field }) => (
                <FormItem><FormLabel>Responsável</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
              )} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Próximo Encontro</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <FormField control={form.control} name="proximo_encontro_data" render={({ field }) => (
                <FormItem>
                  <FormLabel>Data prevista do próximo encontro</FormLabel>
                  <FormControl><Input type="date" {...field} value={field.value ?? ''} /></FormControl>
                  <p className="text-xs text-muted-foreground">Se preenchida, um novo encontro será automaticamente agendado.</p>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="proximo_encontro_pauta" render={({ field }) => (
                <FormItem><FormLabel>Pauta prevista</FormLabel><FormControl><Textarea {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
              )} />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Enviar
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
