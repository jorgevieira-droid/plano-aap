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
import { useFormFieldConfig } from '@/hooks/useFormFieldConfig';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export interface VisitaTecnicaMicrociclosFormProps {
  entidades: { id: string; nome: string }[];
  data: string;
  horarioInicio?: string;
  horarioFim?: string;
  formadorNome?: string;
  onSuccess?: () => void;
  registroAcaoId?: string;
  entidadeFilhoId?: string;
}

const PARTES_VISITA = [
  'Conversa com o Coordenador Pedagógico sobre aspectos gerais da implementação',
  'Observação de aula',
  'Devolutiva ao Coordenador Pedagógico',
  'Presença de um técnico da SME',
];

const OUTRO = 'outro';

const FREQUENCIA_OPCOES = [
  { value: '1_vez', label: '1 vez por semana' },
  { value: '2_vezes', label: '2 vezes por semana' },
  { value: '3_vezes', label: '3 vezes por semana' },
  { value: OUTRO, label: 'Outro' },
];

const HORAS_AULA_OPCOES = [
  { value: '1_hora', label: '1 hora-aula por componente' },
  { value: '2_horas', label: '2 horas-aula por componente' },
  { value: '3_horas', label: '3 horas-aula por componente' },
  { value: OUTRO, label: 'Outro' },
];

const MATERIAL_OPCAO_OUTRO = 'Outro';
const MATERIAL_OPCOES = [
  'Cadernos de Curadoria',
  'Horizonte + Cadernos de Curadoria',
  'Cadernos de Curadoria + Descobertas',
  'Descobertas',
  MATERIAL_OPCAO_OUTRO,
];

const REGISTROS_OPCOES = [
  { value: 'sim_sistematicamente', label: 'Sim, registrados e utilizados sistematicamente' },
  { value: 'parcialmente', label: 'Sim, parcialmente: os dados são registrados de forma sistemática mas não têm sido utilizados para orientar decisões pedagógicas.' },
  { value: 'nao', label: 'Não, os professores participantes não estão realizando os registros de forma sistemática.' },
];

const TEMPO_FORMATIVO_OPCOES = [
  { value: 'sim_atpc', label: 'Sim, em ATPC / HTPC' },
  { value: 'sim_individual', label: 'Sim, mas em momentos em que não é possível reunir todos os professores participantes, como em hora atividade individual / horário individual de planejamento.' },
  { value: 'nao_cobre', label: 'Não, o tempo é previsto em ATPC/HTPC mas a pauta relacionada aos microciclos é pouco ou quase não é abordada.' },
  { value: 'nao_previsto', label: 'Não, não há tempo previsto para esse momento formativo sobre os microciclos.' },
  { value: 'nao_se_aplica', label: 'Não se aplica' },
];

const PROFESSORES_TRAJETORIA_OPCOES = [
  { value: 'sim_todos', label: 'Sim, todos ou quase todos' },
  { value: 'sim_maioria', label: 'Sim, a maioria' },
  { value: 'sim_alguns', label: 'Sim, alguns' },
  { value: 'nao', label: 'Não' },
];

const CAMINHADA_OPCOES = [
  { value: 'sim_todas_salas', label: 'Sim, em todas as salas da escola' },
  { value: 'sim_salas_microciclos', label: 'Sim, apenas nas salas em que ocorrem os Microciclos' },
  { value: 'nao', label: 'Não' },
];

const PROFESSOR_MODELO_OPCOES = [
  { value: 'sim', label: 'Sim' },
  { value: 'nao', label: 'Não' },
  { value: 'nao_avaliado', label: 'Ainda não foi avaliado' },
];

const AGRUPAMENTO_TURMA_OPCOES = [
  'Modelo 1 Seriado (reagrupamento com turmas do mesmo ano)',
  'Modelo 1 Multisseriado (reagrupamento com turmas de anos distintos)',
  'Modelo 2 (professor adicional)',
  'Modelo 3 (agrupamento interno na sala de aula)',
  'Não há reagrupamento por níveis de proficiência',
];

const USO_MATERIAL_OPCOES = [
  { value: 'sim_toda', label: 'Sim, durante toda a aula' },
  { value: 'parcialmente', label: 'Parcialmente, em alguns momentos da aula' },
  { value: 'nao', label: 'Não houve uso do material didático proposto' },
];

interface RubricItem {
  key: 'q17' | 'q19' | 'q20' | 'q21';
  numero: number;
  pergunta: string;
  foco?: string;
  niveis: { nivel: string; texto: string }[];
}

const RUBRICAS: RubricItem[] = [
  {
    key: 'q17', numero: 5,
    pergunta: 'As intervenções estavam alinhadas ao caderno e à faixa de desempenho de cada grupo?',
    foco: 'Existem estudantes em diferentes níveis de proficiência dentro de um mesmo agrupamento. O professor não pode dar a mesma aula para todos se estão em níveis diferentes.',
    niveis: [
      { nivel: '1 – Insuficiente', texto: 'O professor usa uma única explicação para toda a turma, sem considerar diferenças de nível. Nenhum ajuste de linguagem, exemplo ou suporte é observado para estudantes com maior defasagem.' },
      { nivel: '2 – Em Desenvolvimento', texto: 'O professor reconhece verbalmente que há diferenças de nível, mas as intervenções seguem um único roteiro. Eventualmente reformula a orientação ao ser questionado, mas não demonstra conhecimento suficiente para adequar a tarefa proposta a um nível de complexidade alinhado ao nível de proficiência do estudante.' },
      { nivel: '3 – Consolidado', texto: 'O professor se prepara para utilizar materiais ou tarefas em ao menos dois níveis de complexidade e circula pela sala direcionando explicações distintas para grupos com diferentes proficiências.' },
      { nivel: '4 – Avançado', texto: 'O professor articula explicitamente o nível do caderno/faixa de proficiência com a estratégia de cada grupo, usa linguagem diferenciada, exemplos calibrados e oferece andaimes progressivos — sem deixar nenhum grupo ocioso ou perdido.' },
    ],
  },
  {
    key: 'q19', numero: 6,
    pergunta: 'O objetivo de aprendizagem estava claro e foi comunicado aos estudantes?',
    foco: 'O aluno precisa saber o que está aprendendo e por que isso é importante para o seu progresso.',
    niveis: [
      { nivel: '1 – Insuficiente', texto: 'Nenhum objetivo é enunciado. Os alunos iniciam a atividade sem saber o que se espera deles ao final da aula.' },
      { nivel: '2 – Em Desenvolvimento', texto: "O professor menciona o tema ('vamos trabalhar frações'), mas sem precisar a habilidade-alvo ou o critério de sucesso ('ao final, você deve conseguir...')." },
      { nivel: '3 – Consolidado', texto: 'O objetivo é enunciado em linguagem acessível no início e retomado ao longo da aula. Os alunos conseguem, quando perguntados, dizer o que estão aprendendo.' },
      { nivel: '4 – Avançado', texto: "O objetivo é enunciado, conectado à trajetória do estudante ('você já sabe X; hoje vamos chegar em Y') e verificado no encerramento. Alunos sabem identificar se o alcançaram." },
    ],
  },
  {
    key: 'q20', numero: 7,
    pergunta: 'O professor verificou a compreensão dos estudantes?',
    foco: 'Monitoramento constante (avaliação formativa) para saber se a turma está acompanhando antes de avançar.',
    niveis: [
      { nivel: '1 – Insuficiente', texto: "O professor atribui novas atividades sem verificar se os alunos compreenderam. A única forma de 'checar' é perguntar 'entenderam?' e prosseguir após silêncio ou 'sim' coletivo." },
      { nivel: '2 – Em Desenvolvimento', texto: 'O professor faz perguntas, mas direciona apenas a quem levanta a mão ou aos mesmos alunos. Não obtém evidência sobre a compreensão da maioria da turma.' },
      { nivel: '3 – Consolidado', texto: 'O professor usa ao menos uma estratégia que gera evidência sobre todos os alunos (ex.: cada um resolve e mostra; circulação pela sala vendo cadernos). Ajusta o ritmo com base no que observa.' },
      { nivel: '4 – Avançado', texto: 'O professor usa múltiplas verificações ao longo da aula, registra ou memoriza quem precisa de mais apoio e diferencia o próximo passo com base nas evidências coletadas em tempo real.' },
    ],
  },
  {
    key: 'q21', numero: 8,
    pergunta: 'O professor gerenciou bem o tempo para atividades e dúvidas?',
    foco: 'Equilíbrio entre cumprir a sequência didática e garantir que os momentos de prática e dúvida não sejam atropelados.',
    niveis: [
      { nivel: '1 – Insuficiente', texto: 'A aula perde tempo em transições longas, organização de sala ou episódios de comportamento. A atividade principal não chega a ser concluída, ou as dúvidas não são atendidas por falta de tempo.' },
      { nivel: '2 – Em Desenvolvimento', texto: 'O tempo é parcialmente aproveitado, mas há desequilíbrio: ou a explicação inicial se estende demais e a prática fica para o final, ou a prática é interrompida antes que os alunos possam ter um tempo adequado para consolidar as aprendizagens almejadas.' },
      { nivel: '3 – Consolidado', texto: 'O professor divide o tempo de forma equilibrada entre explicação, prática e dúvidas. Os alunos têm tempo suficiente para trabalhar e tirar dúvidas. A aula encerra com uma síntese ou tarefa clara.' },
      { nivel: '4 – Avançado', texto: 'O professor usa o tempo com precisão intencional: monitora o relógio sem perder o fio da aula, ajusta o ritmo em tempo real (acelera, desacelera) e garante que encerramento e síntese sempre aconteçam.' },
    ],
  },
];

const schema = z.object({
  municipio: z.string().trim().min(1, 'Município é obrigatório'),
  nome_escola: z.string().trim().min(1, 'Escola é obrigatória'),
  pessoa_acompanhou: z.string().optional(),
  professor_observado: z.string().optional(),
  horario_inicio: z.string().optional(),
  horario_fim: z.string().optional(),
  numero_visita: z.string().optional(),
  partes_visita: z.array(z.string()).default([]),
  // Parte 1
  q_frequencia_semanal: z.string().optional(),
  q_frequencia_semanal_outro: z.string().optional(),
  q_horas_aula: z.string().optional(),
  q_horas_aula_outro: z.string().optional(),
  q_material_didatico_multi: z.array(z.string()).default([]),
  q_material_didatico_outro: z.string().optional(),
  q8_material_suficiente: z.string().optional(),
  q9_registros_avaliacao: z.string().optional(),
  q10_tempo_formativo: z.string().optional(),
  q_cp_consulta_trajetoria: z.string().optional(),
  q_professores_consultam_trajetoria: z.string().optional(),
  q_caminhada_pedagogica: z.string().optional(),
  // Parte 2
  q_professor_modelo: z.string().optional(),
  q13_componente: z.string().optional(),
  q14_agrupamento_turma: z.string().optional(),
  q14_agrupamento_turma_outro: z.string().optional(),
  q15_uso_material: z.string().optional(),
  nota_q17: z.coerce.number().int().min(1).max(4).optional().nullable(),
  evidencia_q17: z.string().optional(),
  nota_q19: z.coerce.number().int().min(1).max(4).optional().nullable(),
  evidencia_q19: z.string().optional(),
  nota_q20: z.coerce.number().int().min(1).max(4).optional().nullable(),
  evidencia_q20: z.string().optional(),
  nota_q21: z.coerce.number().int().min(1).max(4).optional().nullable(),
  evidencia_q21: z.string().optional(),
  // Parte 3
  observacoes_gerais: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function VisitaTecnicaMicrociclosForm({
  entidades, data, horarioInicio, horarioFim, formadorNome, onSuccess, registroAcaoId, entidadeFilhoId,
}: VisitaTecnicaMicrociclosFormProps) {
  const { user } = useAuth();
  const { isFieldEnabled } = useFormFieldConfig('observacao_aula_redes');
  const visibleRubricas = RUBRICAS.filter(r => isFieldEnabled(`nota_${r.key}`));
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
      nome_escola: '',
      pessoa_acompanhou: '',
      professor_observado: '',
      horario_inicio: horarioInicio || '',
      horario_fim: horarioFim || '',
      partes_visita: [],
      q_material_didatico_multi: [],
    },
    mode: 'onSubmit',
  });

  // Pre-fill from existing record
  useEffect(() => {
    if (!registroAcaoId) return;
    let cancelled = false;
    (async () => {
      const { data: existing } = await (supabase as any)
        .from('relatorios_visita_tecnica_microciclos')
        .select('*')
        .eq('registro_acao_id', registroAcaoId)
        .maybeSingle();
      if (cancelled || !existing) return;
      const ent = entidades.find(e => e.nome === existing.municipio);
      if (ent) setSelectedRedeId(ent.id);
      // Compatibilidade: registros antigos guardavam o material didático em uma coluna única
      const materialLegado = existing.q8_material_didatico
        ? MATERIAL_OPCOES.filter(opt =>
            opt.toLowerCase().replace(/[^a-z]/g, '') ===
            String(existing.q8_material_didatico).toLowerCase().replace(/[^a-z]/g, '')
          )
        : [];
      form.reset({
        municipio: existing.municipio || (singleEntidade ? entidades[0].nome : ''),
        nome_escola: existing.nome_escola || '',
        pessoa_acompanhou: existing.pessoa_acompanhou || '',
        professor_observado: existing.professor_observado || '',
        horario_inicio: existing.horario_inicio || horarioInicio || '',
        horario_fim: existing.horario_fim || horarioFim || '',
        numero_visita: existing.numero_visita || '',
        partes_visita: existing.partes_visita || [],
        q_frequencia_semanal: existing.q_frequencia_semanal || '',
        q_frequencia_semanal_outro: existing.q_frequencia_semanal_outro || '',
        q_horas_aula: existing.q_horas_aula || '',
        q_horas_aula_outro: existing.q_horas_aula_outro || '',
        q_material_didatico_multi: existing.q_material_didatico_multi || materialLegado,
        q_material_didatico_outro: existing.q_material_didatico_outro || '',
        q8_material_suficiente: existing.q8_material_suficiente || '',
        q9_registros_avaliacao: existing.q9_registros_avaliacao || '',
        q10_tempo_formativo: existing.q10_tempo_formativo || '',
        q_cp_consulta_trajetoria: existing.q_cp_consulta_trajetoria || '',
        q_professores_consultam_trajetoria: existing.q_professores_consultam_trajetoria || '',
        q_caminhada_pedagogica: existing.q_caminhada_pedagogica || '',
        q_professor_modelo: existing.q_professor_modelo || '',
        q13_componente: existing.q13_componente || '',
        q14_agrupamento_turma: existing.q14_agrupamento_turma || '',
        q14_agrupamento_turma_outro: existing.q14_agrupamento_turma_outro || '',
        q15_uso_material: existing.q15_uso_material || '',
        nota_q17: existing.nota_q17 ?? null, evidencia_q17: existing.evidencia_q17 || '',
        nota_q19: existing.nota_q19 ?? null, evidencia_q19: existing.evidencia_q19 || '',
        nota_q20: existing.nota_q20 ?? null, evidencia_q20: existing.evidencia_q20 || '',
        nota_q21: existing.nota_q21 ?? null, evidencia_q21: existing.evidencia_q21 || '',
        observacoes_gerais: existing.observacoes_gerais || '',
      } as any);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registroAcaoId]);

  // Fetch entidades_filho when a Rede is selected
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

  // When entidadeFilhoId is provided by cadastro, lock the school name in the form
  useEffect(() => {
    if (!entidadeFilhoId || entidadesFilho.length === 0) return;
    const match = entidadesFilho.find(ef => ef.id === entidadeFilhoId);
    if (match) form.setValue('nome_escola', match.nome);
  }, [entidadeFilhoId, entidadesFilho]);


  const persist = async (values: FormValues, status: 'rascunho' | 'enviado') => {
    if (!registroAcaoId) throw new Error('registro_acao_id ausente');
    // Zerar campos de rubricas desabilitadas em Configurar Formulários
    const cleaned: any = { ...values };
    for (const r of RUBRICAS) {
      if (!isFieldEnabled(`nota_${r.key}`)) {
        cleaned[`nota_${r.key}`] = null;
        cleaned[`evidencia_${r.key}`] = '';
      }
    }
    const payload: any = {
      ...cleaned,
      data: parsedDate ? format(parsedDate, 'yyyy-MM-dd', { locale: ptBR }) : null,
      formador: formadorNome || null,
      registro_acao_id: registroAcaoId,
      created_by: user?.id,
      status,
      numero_visita: values.numero_visita || null,
    };
    const { error } = await (supabase as any)
      .from('relatorios_visita_tecnica_microciclos')
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

  const renderMultiCheckbox = (
    name: keyof FormValues,
    options: string[],
  ) => (
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

  const renderRadioOptions = (
    name: keyof FormValues,
    options: { value: string; label: string }[],
  ) => (
    <FormField control={form.control} name={name as any} render={({ field }) => (
      <FormItem>
        <FormControl>
          <RadioGroup value={field.value as string || ''} onValueChange={field.onChange} className="space-y-2">
            {options.map(opt => (
              <div key={opt.value} className="flex items-start gap-2">
                <RadioGroupItem value={opt.value} id={`${name}-${opt.value}`} className="mt-1" />
                <Label htmlFor={`${name}-${opt.value}`} className="font-normal cursor-pointer break-words min-w-0">{opt.label}</Label>
              </div>
            ))}
          </RadioGroup>
        </FormControl>
        <FormMessage />
      </FormItem>
    )} />
  );

  const renderRubric = (item: RubricItem) => (
    <Card key={item.key}>
      <CardHeader>
        <CardTitle className="text-base">
          {item.numero}. {item.pergunta}
        </CardTitle>
        {item.foco && <p className="text-sm text-muted-foreground"><strong>Foco:</strong> {item.foco}</p>}
      </CardHeader>
      <CardContent className="space-y-4">
        <Accordion type="single" collapsible>
          <AccordionItem value="rubrica">
            <AccordionTrigger className="text-sm">Ver descrição dos níveis</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 text-sm">
                {item.niveis.map(n => (
                  <div key={n.nivel} className="rounded border border-border p-2">
                    <div className="font-semibold mb-1">{n.nivel}</div>
                    <div className="text-muted-foreground">{n.texto}</div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <FormField control={form.control} name={`nota_${item.key}` as any} render={({ field }) => (
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

        <FormField control={form.control} name={`evidencia_${item.key}` as any} render={({ field }) => (
          <FormItem>
            <FormLabel>Evidência observada</FormLabel>
            <FormControl><Textarea rows={3} {...field} value={(field.value as string) || ''} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </CardContent>
    </Card>
  );

  const watchFrequencia = form.watch('q_frequencia_semanal');
  const watchHorasAula = form.watch('q_horas_aula');
  const watchMaterial = form.watch('q_material_didatico_multi') || [];
  const watchAgrupamento = form.watch('q14_agrupamento_turma');
  const watchPartesVisita = form.watch('partes_visita') || [];
  const showParte2 = watchPartesVisita.includes('Observação de aula');

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
                  <FormItem><FormLabel>Município*</FormLabel><FormControl><Input {...field} disabled /></FormControl><FormMessage /></FormItem>
                )} />
              ) : (
                <FormField control={form.control} name="municipio" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Município*</FormLabel>
                    <Select value={field.value} onValueChange={(val) => {
                      field.onChange(val);
                      const ent = entidades.find(e => e.nome === val);
                      setSelectedRedeId(ent?.id || null);
                      form.setValue('nome_escola', '');
                    }}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecione o município" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {entidades.map(e => <SelectItem key={e.id} value={e.nome}>{e.nome}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              )}

              <FormItem>
                <FormLabel>Data da visita</FormLabel>
                <Input value={parsedDate ? format(parsedDate, 'dd/MM/yyyy', { locale: ptBR }) : ''} disabled />
              </FormItem>

              <FormField control={form.control} name="nome_escola" render={({ field }) => (
                <FormItem>
                  <FormLabel>Escola*</FormLabel>
                  {entidadeFilhoId ? (
                    <FormControl><Input value={field.value || ''} disabled /></FormControl>
                  ) : (
                    <Select value={field.value || undefined} onValueChange={field.onChange} disabled={!selectedRedeId}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecione a escola" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {entidadesFilho.map(ef => <SelectItem key={ef.id} value={ef.nome}>{ef.nome}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                  <FormMessage />
                </FormItem>
              )} />

              <FormItem>
                <FormLabel>Formador</FormLabel>
                <Input value={formadorNome || ''} disabled />
              </FormItem>

              <FormField control={form.control} name="pessoa_acompanhou" render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Pessoa da unidade escolar que acompanhou a visita</FormLabel>
                  <FormControl><Input {...field} value={field.value || ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="professor_observado" render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Professor observado</FormLabel>
                  <FormControl><Input {...field} value={field.value || ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="horario_inicio" render={({ field }) => (
                <FormItem><FormLabel>Horário de início</FormLabel><FormControl><Input type="time" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="horario_fim" render={({ field }) => (
                <FormItem><FormLabel>Horário de término</FormLabel><FormControl><Input type="time" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
              )} />

              <FormField control={form.control} name="numero_visita" render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Nº da Visita</FormLabel>
                  <Select value={field.value ?? ''} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="Não se aplica">Não se aplica</SelectItem>
                      {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                        <SelectItem key={n} value={`Visita ${n}`}>Visita {n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>


          {/* Roteiro explicativo */}
          <Card>
            <CardHeader><CardTitle className="text-base">Roteiro da visita técnica</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p><strong>Parte 1</strong> — 30 min — conversa com coordenador pedagógico sobre implementação dos microciclos na escola.</p>
              <p><strong>Parte 2</strong> — 50 min — observação de uma aula completa.</p>
              <p><strong>Parte 3</strong> — 60 min — devolutiva ao coordenador pedagógico (condições gerais, aspectos metodológicos e análise dos dados da plataforma Trajetória).</p>
            </CardContent>
          </Card>

          {/* Durante a visita técnica, houve */}
          <Card>
            <CardHeader><CardTitle className="text-base">Durante a visita técnica, houve: (seleção múltipla)</CardTitle></CardHeader>
            <CardContent>{renderMultiCheckbox('partes_visita', PARTES_VISITA)}</CardContent>
          </Card>

          {/* PARTE 1 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Parte 1 — Implementação dos microciclos na escola (últimos 30 dias)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="font-medium">1. As aulas de recomposição têm acontecido quantas vezes por semana?</Label>
                <div className="mt-2">{renderRadioOptions('q_frequencia_semanal', FREQUENCIA_OPCOES)}</div>
                {watchFrequencia === OUTRO && (
                  <div className="mt-2">
                    <FormField control={form.control} name="q_frequencia_semanal_outro" render={({ field }) => (
                      <FormItem><FormLabel>Outro (especificar)</FormLabel><FormControl><Input {...field} value={field.value || ''} placeholder="Descreva" /></FormControl></FormItem>
                    )} />
                  </div>
                )}
              </div>

              <div>
                <Label className="font-medium">2. São realizadas quantas horas-aula por componente?</Label>
                <div className="mt-2">{renderRadioOptions('q_horas_aula', HORAS_AULA_OPCOES)}</div>
                {watchHorasAula === OUTRO && (
                  <div className="mt-2">
                    <FormField control={form.control} name="q_horas_aula_outro" render={({ field }) => (
                      <FormItem><FormLabel>Outro (especificar)</FormLabel><FormControl><Input {...field} value={field.value || ''} placeholder="Descreva" /></FormControl></FormItem>
                    )} />
                  </div>
                )}
              </div>

              <div>
                <Label className="font-medium">3. Qual material didático será utilizado? (seleção múltipla)</Label>
                <div className="mt-2">{renderMultiCheckbox('q_material_didatico_multi', MATERIAL_OPCOES)}</div>
                {watchMaterial.includes(MATERIAL_OPCAO_OUTRO) && (
                  <div className="mt-2">
                    <FormField control={form.control} name="q_material_didatico_outro" render={({ field }) => (
                      <FormItem><FormLabel>Outro (especificar)</FormLabel><FormControl><Input {...field} value={field.value || ''} placeholder="Descreva" /></FormControl></FormItem>
                    )} />
                  </div>
                )}
              </div>

              <div>
                <Label className="font-medium">4. O material didático está disponível em quantidade suficiente para todos os estudantes?</Label>
                <div className="mt-2">{renderRadioOptions('q8_material_suficiente', [
                  { value: 'sim', label: 'Sim' }, { value: 'nao', label: 'Não' },
                ])}</div>
              </div>

              <div>
                <Label className="font-medium">5. Os dados da avaliação de percurso estão sendo registrados na plataforma e utilizados?</Label>
                <div className="mt-2">{renderRadioOptions('q9_registros_avaliacao', REGISTROS_OPCOES)}</div>
              </div>

              <div>
                <Label className="font-medium">6. O/A Coordenador/a Pedagógico/a ou outro profissional da unidade escolar (ponto focal) tem tempo dedicado na semana para realizar os processos formativos relacionados aos microciclos, de modo a replicar as orientações obtidas nos encontros formativos mensais?</Label>
                <div className="mt-2">{renderRadioOptions('q10_tempo_formativo', TEMPO_FORMATIVO_OPCOES)}</div>
              </div>

              <div>
                <Label className="font-medium">7. O coordenador pedagógico consulta os dados da plataforma Trajetória?</Label>
                <div className="mt-2">{renderRadioOptions('q_cp_consulta_trajetoria', [
                  { value: 'sim', label: 'Sim' }, { value: 'nao', label: 'Não' },
                ])}</div>
              </div>

              <div>
                <Label className="font-medium">8. Os professores consultam os dados da plataforma Trajetória?</Label>
                <div className="mt-2">{renderRadioOptions('q_professores_consultam_trajetoria', PROFESSORES_TRAJETORIA_OPCOES)}</div>
              </div>

              <div>
                <Label className="font-medium">9. A Direção da Escola faz caminhada pedagógica?</Label>
                <div className="mt-2">{renderRadioOptions('q_caminhada_pedagogica', CAMINHADA_OPCOES)}</div>
              </div>
            </CardContent>
          </Card>

          {/* PARTE 2 — só exibida quando "Observação de aula" está marcada em "Durante a visita técnica, houve" */}
          {showParte2 && (
          <Card>
            <CardHeader><CardTitle className="text-xl">Parte 2 — Observação de aula</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="font-medium">1. O professor é identificado como um professor "modelo", que consolida a metodologia?</Label>
                <div className="mt-2">{renderRadioOptions('q_professor_modelo', PROFESSOR_MODELO_OPCOES)}</div>
              </div>

              <div>
                <Label className="font-medium">2. Qual foi o componente curricular observado?</Label>
                <div className="mt-2">{renderRadioOptions('q13_componente', [
                  { value: 'lingua_portuguesa', label: 'Língua Portuguesa' },
                  { value: 'matematica', label: 'Matemática' },
                ])}</div>
              </div>

              <div>
                <Label className="font-medium">3. Qual o modelo de agrupamento adotado na turma?</Label>
                <div className="mt-2">
                  <FormField control={form.control} name="q14_agrupamento_turma" render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <RadioGroup value={field.value || ''} onValueChange={field.onChange} className="space-y-2">
                          {AGRUPAMENTO_TURMA_OPCOES.map((opt) => (
                            <div key={opt} className="flex items-start gap-2">
                              <RadioGroupItem value={opt} id={`agrup-${opt}`} className="mt-1" />
                              <Label htmlFor={`agrup-${opt}`} className="font-normal cursor-pointer break-words min-w-0">{opt}</Label>
                            </div>
                          ))}
                          <div className="flex items-start gap-2">
                            <RadioGroupItem value="outro" id="agrup-outro" className="mt-1" />
                            <Label htmlFor="agrup-outro" className="font-normal cursor-pointer">Outro</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                {watchAgrupamento === 'outro' && (
                  <div className="mt-2">
                    <FormField control={form.control} name="q14_agrupamento_turma_outro" render={({ field }) => (
                      <FormItem><FormLabel>Especifique</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl></FormItem>
                    )} />
                  </div>
                )}
              </div>

              <div>
                <Label className="font-medium">4. Observou-se o uso do material didático (cadernos de curadoria / Descobertas) durante a aula?</Label>
                <div className="mt-2">{renderRadioOptions('q15_uso_material', USO_MATERIAL_OPCOES)}</div>
              </div>

              {/* Rubricas 5-8 — filtradas por Configurar Formulários */}
              <div className="space-y-4">
                {visibleRubricas.map(renderRubric)}
              </div>
            </CardContent>
          </Card>
          )}

          {/* PARTE 3 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Parte 3 — Devolutiva ao Coordenador Pedagógico</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField control={form.control} name="observacoes_gerais" render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Observações gerais — outros pontos relevantes relacionados à implementação da metodologia ou devolutiva ao Coordenador Pedagógico (CP)
                  </FormLabel>
                  <FormControl><Textarea rows={6} {...field} value={field.value || ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-2">
            <Button type="button" variant="outline" onClick={handleSaveDraft} disabled={isSavingDraft || isSubmitting}>
              {isSavingDraft && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar rascunho
            </Button>
            <Button type="submit" disabled={isSubmitting || isSavingDraft}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Enviar formulário
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
