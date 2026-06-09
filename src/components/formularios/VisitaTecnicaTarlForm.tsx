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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

import {
  ANO_SERIE_OPCOES, TURMA_OPCOES, MODALIDADE_OPCOES,
  SIM_NAO_PARCIAL_OPCOES, NIVEL_LP_OPCOES, NIVEL_MAT_OPCOES,
  AVALIACAO_GERAL_OPCOES, CRITERIOS_TARL,
} from './visitaTecnicaTarlShared';

export interface VisitaTecnicaTarlFormProps {
  entidades: { id: string; nome: string }[];
  data: string;
  horarioInicio?: string;
  horarioFim?: string;
  anoSerie?: string;
  turma?: string;
  modalidade?: string;
  tecnicoVisitanteNome?: string;
  registroAcaoId: string;
  entidadeFilhoId?: string;
  onSuccess?: () => void;
}

const criteriosShape: Record<string, any> = {};
for (const c of CRITERIOS_TARL) {
  criteriosShape[`nota_${c.key}`] = z.coerce.number().int().min(1).max(4).optional().nullable();
  criteriosShape[`evidencia_${c.key}`] = z.string().optional();
}

const schema = z.object({
  municipio: z.string().trim().optional(),
  nome_escola: z.string().trim().optional(),
  tecnico_visitante: z.string().trim().optional(),
  horario_inicio: z.string().optional(),
  horario_fim: z.string().optional(),
  ano_serie: z.string().optional(),
  turma: z.string().optional(),
  modalidade: z.string().optional(),
  qtd_matriculados: z.coerce.number().int().min(0).optional().nullable(),
  qtd_presentes: z.coerce.number().int().min(0).optional().nullable(),
  agente_nome: z.string().optional(),
  agente_participou_formacao: z.string().optional(),
  nivel_lp: z.string().optional(),
  nivel_mat: z.string().optional(),
  plano_aula_assinado: z.string().optional(),
  replanejamento_15_dias: z.string().optional(),
  observacoes_iniciais: z.string().optional(),
  avaliacao_geral: z.string().optional(),
  ...criteriosShape,
});

type FormValues = z.infer<typeof schema>;

const SCALE_OPTIONS = [
  { v: 1, label: '1 — Insuficiente' },
  { v: 2, label: '2 — Em desenvolvimento' },
  { v: 3, label: '3 — Consolidado' },
  { v: 4, label: '4 — Avançado' },
];

export default function VisitaTecnicaTarlForm({
  entidades, data, horarioInicio, horarioFim, anoSerie, turma, modalidade,
  tecnicoVisitanteNome, registroAcaoId, onSuccess,
}: VisitaTecnicaTarlFormProps) {
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
  for (const c of CRITERIOS_TARL) {
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
      ano_serie: anoSerie || '',
      turma: turma || '',
      modalidade: modalidade || '',
      qtd_matriculados: null,
      qtd_presentes: null,
      agente_nome: '',
      agente_participou_formacao: '',
      nivel_lp: '',
      nivel_mat: '',
      plano_aula_assinado: '',
      replanejamento_15_dias: '',
      observacoes_iniciais: '',
      avaliacao_geral: '',
      ...defaultCriterios,
    } as any,
    mode: 'onSubmit',
  });

  // Hydrate from existing
  useEffect(() => {
    if (!registroAcaoId) return;
    let cancelled = false;
    (async () => {
      const { data: existing } = await (supabase as any)
        .from('relatorios_visita_tecnica_tarl')
        .select('*')
        .eq('registro_acao_id', registroAcaoId)
        .maybeSingle();
      if (cancelled || !existing) return;
      const ent = entidades.find(e => e.nome === existing.municipio);
      if (ent) setSelectedEntidadeId(ent.id);

      const crit: Record<string, any> = {};
      for (const c of CRITERIOS_TARL) {
        crit[`nota_${c.key}`] = existing[`nota_${c.key}`] ?? null;
        crit[`evidencia_${c.key}`] = existing[`evidencia_${c.key}`] ?? '';
      }
      form.reset({
        municipio: existing.municipio || (singleEntidade ? entidades[0].nome : ''),
        nome_escola: existing.nome_escola || '',
        tecnico_visitante: existing.tecnico_visitante || tecnicoVisitanteNome || '',
        horario_inicio: existing.horario_inicio || horarioInicio || '',
        horario_fim: existing.horario_fim || horarioFim || '',
        ano_serie: existing.ano_serie || anoSerie || '',
        turma: existing.turma || turma || '',
        modalidade: existing.modalidade || modalidade || '',
        qtd_matriculados: existing.qtd_matriculados ?? null,
        qtd_presentes: existing.qtd_presentes ?? null,
        agente_nome: existing.agente_nome || '',
        agente_participou_formacao: existing.agente_participou_formacao || '',
        nivel_lp: existing.nivel_lp || '',
        nivel_mat: existing.nivel_mat || '',
        plano_aula_assinado: existing.plano_aula_assinado || '',
        replanejamento_15_dias: existing.replanejamento_15_dias || '',
        observacoes_iniciais: existing.observacoes_iniciais || '',
        avaliacao_geral: existing.avaliacao_geral || '',
        ...crit,
      } as any);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registroAcaoId]);

  // Fetch entidades_filho
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
    })();
  }, [selectedEntidadeId]);

  const persist = async (values: FormValues, status: 'rascunho' | 'enviado') => {
    if (!registroAcaoId) throw new Error('registro_acao_id ausente');
    const payload: any = {
      ...values,
      data: parsedDate ? format(parsedDate, 'yyyy-MM-dd', { locale: ptBR }) : null,
      registro_acao_id: registroAcaoId,
      created_by: user?.id,
      status,
      horario_inicio: values.horario_inicio || null,
      horario_fim: values.horario_fim || null,
    };
    const { error } = await (supabase as any)
      .from('relatorios_visita_tecnica_tarl')
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
    // Validação: todas as 14 notas preenchidas
    const missing = CRITERIOS_TARL.filter(c => !(values as any)[`nota_${c.key}`]);
    if (missing.length > 0) {
      toast.error(`Avalie todos os critérios (faltam ${missing.length}).`);
      return;
    }
    if (!values.avaliacao_geral) {
      toast.error('Selecione a avaliação geral.');
      return;
    }
    if (!values.modalidade) {
      toast.error('Selecione a modalidade.');
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

  // Group criterios
  const grouped = CRITERIOS_TARL.reduce<Record<string, typeof CRITERIOS_TARL>>((acc, c) => {
    (acc[c.dimensao] ||= [] as any).push(c);
    return acc;
  }, {});

  // Médias
  const watchedValues = form.watch();
  const dimMedias = Object.entries(grouped).map(([dim, items]) => {
    const notas = items.map(c => (watchedValues as any)[`nota_${c.key}`]).filter((n): n is number => typeof n === 'number');
    const media = notas.length > 0 ? (notas.reduce((a, b) => a + b, 0) / notas.length) : null;
    return { dim, notas: notas.length, total: items.length, media };
  });
  const allNotas = CRITERIOS_TARL.map(c => (watchedValues as any)[`nota_${c.key}`]).filter((n): n is number => typeof n === 'number');
  const mediaGeral = allNotas.length > 0 ? (allNotas.reduce((a, b) => a + b, 0) / allNotas.length) : null;

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

          {/* Identificação */}
          <Card>
            <CardHeader><CardTitle className="text-xl">Identificação da visita</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {singleEntidade ? (
                <FormField control={form.control} name="municipio" render={({ field }) => (
                  <FormItem><FormLabel>Município / Rede *</FormLabel><FormControl><Input {...field} value={field.value || ''} disabled /></FormControl><FormMessage /></FormItem>
                )} />
              ) : (
                <FormField control={form.control} name="municipio" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Município / Rede *</FormLabel>
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
                  <FormLabel>Escola</FormLabel>
                  <Select value={field.value || undefined} onValueChange={field.onChange} disabled={!selectedEntidadeId}>
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
                  <FormLabel>Técnico(a) Visitante (Ator do Programa)</FormLabel>
                  <FormControl><Input {...field} value={field.value || ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="horario_inicio" render={({ field }) => (
                <FormItem><FormLabel>Horário de início</FormLabel>
                  <FormControl><Input type="time" {...field} value={field.value || ''} /></FormControl>
                  <FormMessage /></FormItem>
              )} />

              <FormField control={form.control} name="horario_fim" render={({ field }) => (
                <FormItem><FormLabel>Horário de término</FormLabel>
                  <FormControl><Input type="time" {...field} value={field.value || ''} /></FormControl>
                  <FormMessage /></FormItem>
              )} />

              <FormField control={form.control} name="ano_serie" render={({ field }) => (
                <FormItem>
                  <FormLabel>Ano / Série *</FormLabel>
                  <Select value={field.value || ''} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {ANO_SERIE_OPCOES.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
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

              <FormField control={form.control} name="modalidade" render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Modalidade *</FormLabel>
                  <RadioGroup value={field.value || ''} onValueChange={field.onChange} className="flex flex-wrap gap-6 mt-1">
                    {MODALIDADE_OPCOES.map(o => (
                      <div key={o.value} className="flex items-center gap-2">
                        <RadioGroupItem value={o.value} id={`mod-${o.value}`} />
                        <Label htmlFor={`mod-${o.value}`} className="cursor-pointer">{o.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          {/* Contexto da turma */}
          <Card>
            <CardHeader><CardTitle className="text-xl">Contexto da turma</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <FormField control={form.control} name="qtd_matriculados" render={({ field }) => (
                <FormItem><FormLabel>Qtd. estudantes matriculados</FormLabel>
                  <FormControl><Input type="number" min={0} {...field} value={field.value ?? ''}
                    onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))} /></FormControl>
                  <FormMessage /></FormItem>
              )} />

              <FormField control={form.control} name="qtd_presentes" render={({ field }) => (
                <FormItem><FormLabel>Qtd. estudantes presentes na visita</FormLabel>
                  <FormControl><Input type="number" min={0} {...field} value={field.value ?? ''}
                    onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))} /></FormControl>
                  <FormMessage /></FormItem>
              )} />

              <FormField control={form.control} name="agente_nome" render={({ field }) => (
                <FormItem className="md:col-span-2"><FormLabel>Nome do(a) agente educacional observado(a)</FormLabel>
                  <FormControl><Input {...field} value={field.value || ''} /></FormControl>
                  <FormMessage /></FormItem>
              )} />

              <FormField control={form.control} name="agente_participou_formacao" render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>O agente educacional participou da formação inicial?</FormLabel>
                  <RadioGroup value={field.value || ''} onValueChange={field.onChange} className="flex gap-6 mt-1">
                    {SIM_NAO_PARCIAL_OPCOES.map(o => (
                      <div key={o.value} className="flex items-center gap-2">
                        <RadioGroupItem value={o.value} id={`agf-${o.value}`} />
                        <Label htmlFor={`agf-${o.value}`} className="cursor-pointer">{o.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="nivel_lp" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nível predominante — Língua Portuguesa</FormLabel>
                  <Select value={field.value || ''} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {NIVEL_LP_OPCOES.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="nivel_mat" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nível predominante — Matemática</FormLabel>
                  <Select value={field.value || ''} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {NIVEL_MAT_OPCOES.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="plano_aula_assinado" render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>O plano de aula estava preenchido e assinado para o dia?</FormLabel>
                  <RadioGroup value={field.value || ''} onValueChange={field.onChange} className="flex gap-6 mt-1">
                    {SIM_NAO_PARCIAL_OPCOES.map(o => (
                      <div key={o.value} className="flex items-center gap-2">
                        <RadioGroupItem value={o.value} id={`pa-${o.value}`} />
                        <Label htmlFor={`pa-${o.value}`} className="cursor-pointer">{o.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="replanejamento_15_dias" render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Houve replanejamento/reagrupamento nos últimos 15 dias com base nas avaliações?</FormLabel>
                  <RadioGroup value={field.value || ''} onValueChange={field.onChange} className="flex gap-6 mt-1">
                    {SIM_NAO_PARCIAL_OPCOES.map(o => (
                      <div key={o.value} className="flex items-center gap-2">
                        <RadioGroupItem value={o.value} id={`rp-${o.value}`} />
                        <Label htmlFor={`rp-${o.value}`} className="cursor-pointer">{o.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="observacoes_iniciais" render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Observações iniciais (contexto da visita, particularidades da turma etc.)</FormLabel>
                  <FormControl><Textarea rows={3} {...field} value={(field.value as string) || ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          {/* Legenda */}
          <Card>
            <CardHeader><CardTitle className="text-base">Legenda das rubricas</CardTitle></CardHeader>
            <CardContent className="text-sm grid gap-2 md:grid-cols-2">
              <div><strong>1 — Insuficiente:</strong> prática não ocorreu ou contrária ao TaRL.</div>
              <div><strong>2 — Em desenvolvimento:</strong> ocorreu com erros conceituais ou baixo engajamento.</div>
              <div><strong>3 — Consolidado:</strong> ocorreu de forma correta e com bom engajamento.</div>
              <div><strong>4 — Avançado:</strong> executada com maestria, servindo de modelo.</div>
            </CardContent>
          </Card>

          {/* Dimensões e critérios */}
          {Object.entries(grouped).map(([dim, items]) => (
            <div key={dim} className="space-y-4">
              <h3 className="text-base font-semibold text-primary border-b pb-2">{dim}</h3>
              {items.map(c => (
                <Card key={c.key}>
                  <CardHeader>
                    <CardTitle className="text-base">{c.codigo} {c.titulo}</CardTitle>
                    <p className="text-sm text-muted-foreground"><strong>Foco:</strong> {c.foco}</p>
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
                        <Select value={field.value ? String(field.value) : ''} onValueChange={(v) => field.onChange(v ? Number(v) : null)}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Selecione a nota" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {SCALE_OPTIONS.map(s => <SelectItem key={s.v} value={String(s.v)}>{s.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name={`evidencia_${c.key}` as any} render={({ field }) => (
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
                    <td className="p-2 font-semibold">MÉDIA GERAL DA VISITA</td>
                    <td className="text-center p-2">{allNotas.length} / {CRITERIOS_TARL.length}</td>
                    <td className="text-center p-2 font-bold">{mediaGeral != null ? mediaGeral.toFixed(2) : '—'}</td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Avaliação geral */}
          <Card>
            <CardHeader><CardTitle className="text-xl">Avaliação geral da implementação na turma observada *</CardTitle></CardHeader>
            <CardContent>
              <FormField control={form.control} name="avaliacao_geral" render={({ field }) => (
                <FormItem>
                  <RadioGroup value={field.value || ''} onValueChange={field.onChange} className="space-y-2">
                    {AVALIACAO_GERAL_OPCOES.map(o => (
                      <div key={o.value} className="flex items-start gap-2 rounded border border-border p-2">
                        <RadioGroupItem value={o.value} id={`av-${o.value}`} className="mt-1" />
                        <Label htmlFor={`av-${o.value}`} className="cursor-pointer text-sm font-normal">{o.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
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
