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

const Q1_OPCAO_OUTRO = 'outro';
const Q1_OPCOES = [
  { value: 'sim', label: 'Sim' },
  { value: 'em_processo', label: 'Está em processo de organização' },
  { value: 'nao_iniciou', label: 'Ainda não iniciou o processo de organização' },
  { value: Q1_OPCAO_OUTRO, label: 'Outro' },
];

const Q4_OPCAO_OUTRO = 'Outro';
const Q4_OPCOES = [
  'Modelo 1 (reagrupamento com turmas do mesmo ano de matrícula)',
  'Modelo 1 (reagrupamento com turmas de anos de matrícula distintos)',
  'Modelo 2 (professor adicional)',
  'Modelo 3 (agrupamento interno na sala de aula)',
  Q4_OPCAO_OUTRO,
  'Não há reagrupamento por níveis de proficiência',
];

const Q5_OPCOES = ['3º anos', '4º anos', '5º anos', '6º anos', '7º anos', '8º anos', '9º anos'];

const Q8_MATERIAL_OPCOES = [
  { value: 'cadernos_curadoria', label: 'Cadernos de Curadoria' },
  { value: 'horizonte_curadoria', label: 'Horizonte + Cadernos de Curadoria' },
  { value: 'curadoria_descobertas', label: 'Cadernos de Curadoria + Descobertas' },
  { value: 'descobertas', label: 'Descobertas' },
];

const Q9_OPCOES = [
  { value: 'sim_sistematicamente', label: 'Sim, registrados e utilizados sistematicamente' },
  { value: 'parcialmente', label: 'Sim, parcialmente: registrados de forma sistemática mas não utilizados para orientar decisões pedagógicas.' },
  { value: 'nao', label: 'Não, os professores participantes não estão realizando os registros de forma sistemática.' },
];

const Q10_OPCOES = [
  { value: 'sim_atpc', label: 'Sim, em ATPC / HTPC' },
  { value: 'sim_individual', label: 'Sim, mas em momentos em que não é possível reunir todos os professores participantes (hora atividade individual / horário individual de planejamento).' },
  { value: 'nao_cobre', label: 'Não, o tempo é previsto em ATPC/HTPC mas nunca é possível cobrir a agenda dos microciclos.' },
  { value: 'nao_previsto', label: 'Não, não há tempo previsto para esse momento formativo sobre os microciclos.' },
  { value: 'nao_se_aplica', label: 'Não se aplica' },
];

const Q14_OPCOES = [
  'Modelo 1 (reagrupamento com turmas do mesmo ano)',
  'Modelo 1 (reagrupamento com turmas de anos distintos)',
  'Modelo 2 (professor adicional)',
  'Modelo 3 (agrupamento interno na sala de aula)',
  'Não há reagrupamento por níveis de proficiência',
];

const Q15_OPCOES = [
  { value: 'sim_toda', label: 'Sim, durante toda a aula' },
  { value: 'parcialmente', label: 'Parcialmente, em alguns momentos da aula' },
  { value: 'nao', label: 'Não houve uso do material didático proposto' },
];

const Q16_OPCOES = ['Caderno 1', 'Caderno 2', 'Caderno 3', 'Caderno 4'];

interface RubricItem {
  key: 'q17' | 'q18' | 'q19' | 'q20' | 'q21' | 'q22';
  numero: number;
  pergunta: string;
  foco?: string;
  niveis: { nivel: string; texto: string }[];
}

const RUBRICAS: RubricItem[] = [
  {
    key: 'q17', numero: 19,
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
    key: 'q18', numero: 20,
    pergunta: 'O professor utilizou metodologias que favorecem a aprendizagem?',
    foco: "A caixa de 'ferramentas' do professor. A estratégia alcança quem tem dificuldade?",
    niveis: [
      { nivel: '1 – Insuficiente', texto: 'A aula é conduzida integralmente no formato expositivo, com cópia ou resolução individual silenciosa. Não há estratégia que promova interação entre pares ou prática guiada.' },
      { nivel: '2 – Em Desenvolvimento', texto: 'Há uma tentativa de incluir outra metodologia (ex.: duplas), mas sem estrutura: os alunos fazem a mesma coisa que fariam sozinhos, ou a atividade não chega a ser concluída.' },
      { nivel: '3 – Consolidado', texto: 'O professor usa ao menos uma estratégia ativa estruturada (prática guiada, duplas com papel definido, resolução de problemas com discussão). A estratégia é acessível a quem tem maior defasagem.' },
      { nivel: '4 – Avançado', texto: 'O professor combina estratégias de forma intencional e sequenciada (ex.: modelagem → prática guiada → prática independente). Alunos com maior defasagem têm suporte adicional embutido na estratégia.' },
    ],
  },
  {
    key: 'q19', numero: 21,
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
    key: 'q20', numero: 22,
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
    key: 'q21', numero: 23,
    pergunta: 'O professor gerenciou bem o tempo para atividades e dúvidas?',
    foco: 'Equilíbrio entre cumprir a sequência didática e garantir que os momentos de prática e dúvida não sejam atropelados.',
    niveis: [
      { nivel: '1 – Insuficiente', texto: 'A aula perde tempo em transições longas, organização de sala ou episódios de comportamento. A atividade principal não chega a ser concluída, ou as dúvidas não são atendidas por falta de tempo.' },
      { nivel: '2 – Em Desenvolvimento', texto: 'O tempo é parcialmente aproveitado, mas há desequilíbrio: ou a explicação inicial se estende demais e a prática fica para o final, ou a prática é interrompida antes que os alunos possam ter um tempo adequado para consolidar as aprendizagens almejadas.' },
      { nivel: '3 – Consolidado', texto: 'O professor divide o tempo de forma equilibrada entre explicação, prática e dúvidas. Os alunos têm tempo suficiente para trabalhar e tirar dúvidas. A aula encerra com uma síntese ou tarefa clara.' },
      { nivel: '4 – Avançado', texto: 'O professor usa o tempo com precisão intencional: monitora o relógio sem perder o fio da aula, ajusta o ritmo em tempo real (acelera, desacelera) e garante que encerramento e síntese sempre aconteçam.' },
    ],
  },
  {
    key: 'q22', numero: 24,
    pergunta: 'O clima da sala é de colaboração, respeito mútuo e favorável à aprendizagem?',
    foco: 'Segurança psicológica e respeito. O aluno precisa se sentir seguro para errar.',
    niveis: [
      { nivel: '1 – Insuficiente', texto: 'Há episódios de constrangimento explícito (professor corrige com tom depreciativo, alunos riem de erros de colegas sem intervenção). O erro é tratado como falha, não como etapa da aprendizagem.' },
      { nivel: '2 – Em Desenvolvimento', texto: "O ambiente é neutro: não há episódios explícitos de humilhação, mas o professor não constrói ativamente uma cultura de 'é ok errar'. Alunos evitam se expor por receio de julgamento." },
      { nivel: '3 – Consolidado', texto: "O professor normaliza o erro como parte do processo ('errar é parte de aprender'). As interações são respeitosas e o professor modela como tratar bem quem erra. Alunos participam sem receio visível." },
      { nivel: '4 – Avançado', texto: 'O professor cultiva ativamente a colaboração (ex.: pede que alunos ajudem colegas com respeito, celebra tentativas). O erro é usado como ponto de partida para a aprendizagem coletiva. O clima é de comunidade.' },
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
  q1_organizacao_rotina: z.string().optional(),
  q1_organizacao_rotina_outro: z.string().optional(),
  q2_inicio_aulas: z.string().optional(),
  q3_tres_encontros: z.string().optional(),
  q4_modelos_agrupamento: z.array(z.string()).default([]),
  q4_modelos_agrupamento_outro: z.string().optional(),
  q5_anos_escolares: z.array(z.string()).default([]),
  q6_num_turmas: z.coerce.number().int().min(0).optional().nullable(),
  q7_num_estudantes: z.coerce.number().int().min(0).optional().nullable(),
  q8_material_didatico: z.string().optional(),
  q8_material_suficiente: z.string().optional(),
  q9_registros_avaliacao: z.string().optional(),
  q10_tempo_formativo: z.string().optional(),
  // Parte 2
  q11_estudantes_matriculados: z.coerce.number().int().min(0).optional().nullable(),
  q12_estudantes_presentes: z.coerce.number().int().min(0).optional().nullable(),
  q14_aulas_ultimos_30_dias: z.coerce.number().int().min(0).optional().nullable(),
  q13_componente: z.string().optional(),
  q14_agrupamento_turma: z.string().optional(),
  q14_agrupamento_turma_outro: z.string().optional(),
  q15_uso_material: z.string().optional(),
  q16_cadernos_uso: z.array(z.string()).default([]),
  nota_q17: z.coerce.number().int().min(1).max(4).optional().nullable(),
  evidencia_q17: z.string().optional(),
  nota_q18: z.coerce.number().int().min(1).max(4).optional().nullable(),
  evidencia_q18: z.string().optional(),
  nota_q19: z.coerce.number().int().min(1).max(4).optional().nullable(),
  evidencia_q19: z.string().optional(),
  nota_q20: z.coerce.number().int().min(1).max(4).optional().nullable(),
  evidencia_q20: z.string().optional(),
  nota_q21: z.coerce.number().int().min(1).max(4).optional().nullable(),
  evidencia_q21: z.string().optional(),
  nota_q22: z.coerce.number().int().min(1).max(4).optional().nullable(),
  evidencia_q22: z.string().optional(),
  // Parte 3
  encA_pontos_fortes: z.string().optional(),
  encA_aspectos_fortalecer: z.string().optional(),
  encA_encaminhamentos: z.string().optional(),
  encB_pontos_fortes: z.string().optional(),
  encB_aspectos_fortalecer: z.string().optional(),
  encB_encaminhamentos: z.string().optional(),
  encC_pontos_fortes: z.string().optional(),
  encC_aspectos_fortalecer: z.string().optional(),
  encC_encaminhamentos: z.string().optional(),
  observacoes_gerais: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function VisitaTecnicaMicrociclosForm({
  entidades, data, horarioInicio, horarioFim, formadorNome, onSuccess, registroAcaoId, entidadeFilhoId,
}: VisitaTecnicaMicrociclosFormProps) {
  const { user } = useAuth();
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
      q4_modelos_agrupamento: [],
      q5_anos_escolares: [],
      q16_cadernos_uso: [],
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
      form.reset({
        municipio: existing.municipio || (singleEntidade ? entidades[0].nome : ''),
        nome_escola: existing.nome_escola || '',
        pessoa_acompanhou: existing.pessoa_acompanhou || '',
        professor_observado: existing.professor_observado || '',
        horario_inicio: existing.horario_inicio || horarioInicio || '',
        horario_fim: existing.horario_fim || horarioFim || '',
        numero_visita: existing.numero_visita || '',
        partes_visita: existing.partes_visita || [],
        q1_organizacao_rotina: existing.q1_organizacao_rotina || '',
        q1_organizacao_rotina_outro: existing.q1_organizacao_rotina_outro || '',
        q2_inicio_aulas: existing.q2_inicio_aulas || '',
        q3_tres_encontros: existing.q3_tres_encontros || '',
        q4_modelos_agrupamento: existing.q4_modelos_agrupamento || [],
        q4_modelos_agrupamento_outro: existing.q4_modelos_agrupamento_outro || '',
        q5_anos_escolares: existing.q5_anos_escolares || [],
        q6_num_turmas: existing.q6_num_turmas ?? null,
        q7_num_estudantes: existing.q7_num_estudantes ?? null,
        q8_material_didatico: existing.q8_material_didatico || '',
        q8_material_suficiente: existing.q8_material_suficiente || '',
        q9_registros_avaliacao: existing.q9_registros_avaliacao || '',
        q10_tempo_formativo: existing.q10_tempo_formativo || '',
        q11_estudantes_matriculados: existing.q11_estudantes_matriculados ?? null,
        q12_estudantes_presentes: existing.q12_estudantes_presentes ?? null,
        q14_aulas_ultimos_30_dias: existing.q14_aulas_ultimos_30_dias ?? null,
        q13_componente: existing.q13_componente || '',
        q14_agrupamento_turma: existing.q14_agrupamento_turma || '',
        q14_agrupamento_turma_outro: existing.q14_agrupamento_turma_outro || '',
        q15_uso_material: existing.q15_uso_material || '',
        q16_cadernos_uso: existing.q16_cadernos_uso || [],
        nota_q17: existing.nota_q17 ?? null, evidencia_q17: existing.evidencia_q17 || '',
        nota_q18: existing.nota_q18 ?? null, evidencia_q18: existing.evidencia_q18 || '',
        nota_q19: existing.nota_q19 ?? null, evidencia_q19: existing.evidencia_q19 || '',
        nota_q20: existing.nota_q20 ?? null, evidencia_q20: existing.evidencia_q20 || '',
        nota_q21: existing.nota_q21 ?? null, evidencia_q21: existing.evidencia_q21 || '',
        nota_q22: existing.nota_q22 ?? null, evidencia_q22: existing.evidencia_q22 || '',
        encA_pontos_fortes: existing.enca_pontos_fortes ?? existing.encA_pontos_fortes ?? '',
        encA_aspectos_fortalecer: existing.enca_aspectos_fortalecer ?? existing.encA_aspectos_fortalecer ?? '',
        encA_encaminhamentos: existing.enca_encaminhamentos ?? existing.encA_encaminhamentos ?? '',
        encB_pontos_fortes: existing.encb_pontos_fortes ?? existing.encB_pontos_fortes ?? '',
        encB_aspectos_fortalecer: existing.encb_aspectos_fortalecer ?? existing.encB_aspectos_fortalecer ?? '',
        encB_encaminhamentos: existing.encb_encaminhamentos ?? existing.encB_encaminhamentos ?? '',
        encC_pontos_fortes: existing.encc_pontos_fortes ?? existing.encC_pontos_fortes ?? '',
        encC_aspectos_fortalecer: existing.encc_aspectos_fortalecer ?? existing.encC_aspectos_fortalecer ?? '',
        encC_encaminhamentos: existing.encc_encaminhamentos ?? existing.encC_encaminhamentos ?? '',
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
    // Map camelCase enc[A|B|C]_* keys to DB lowercase column names
    const mapped: any = {};
    for (const [k, v] of Object.entries(values)) {
      const dbKey = /^enc[ABC]_/.test(k) ? k.slice(0, 3) + k.charAt(3).toLowerCase() + k.slice(4) : k;
      mapped[dbKey] = v;
    }
    const payload: any = {
      ...mapped,
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

  const renderEncBlock = (titulo: string, prefix: 'encA' | 'encB' | 'encC') => (
    <Card>
      <CardHeader><CardTitle className="text-base">{titulo}</CardTitle></CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <FormField control={form.control} name={`${prefix}_pontos_fortes` as any} render={({ field }) => (
          <FormItem><FormLabel>Principais pontos fortes observados</FormLabel><FormControl><Textarea rows={3} {...field} value={(field.value as string) || ''} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name={`${prefix}_aspectos_fortalecer` as any} render={({ field }) => (
          <FormItem><FormLabel>Aspectos críticos / a fortalecer</FormLabel><FormControl><Textarea rows={3} {...field} value={(field.value as string) || ''} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name={`${prefix}_encaminhamentos` as any} render={({ field }) => (
          <FormItem className="md:col-span-2"><FormLabel>Encaminhamentos acordados com o ponto focal</FormLabel><FormControl><Textarea rows={3} {...field} value={(field.value as string) || ''} /></FormControl><FormMessage /></FormItem>
        )} />
      </CardContent>
    </Card>
  );

  const watchQ1 = form.watch('q1_organizacao_rotina');
  const watchQ4 = form.watch('q4_modelos_agrupamento') || [];
  const watchQ14 = form.watch('q14_agrupamento_turma');
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
                  <Select value={field.value || undefined} onValueChange={field.onChange} disabled={!selectedRedeId}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione a escola" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {entidadesFilho.map(ef => <SelectItem key={ef.id} value={ef.nome}>{ef.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
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
              <CardTitle className="text-xl">Parte 1 — Implementação dos microciclos na escola</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="font-medium">1. A escola já se encontra organizada para garantir a rotina semanal de 3 encontros semanais de 1 hora-aula por componente?</Label>
                <div className="mt-2">{renderRadioOptions('q1_organizacao_rotina', Q1_OPCOES)}</div>
                {watchQ1 === Q1_OPCAO_OUTRO && (
                  <div className="mt-2">
                    <FormField control={form.control} name="q1_organizacao_rotina_outro" render={({ field }) => (
                      <FormItem><FormLabel>Outro (especificar)</FormLabel><FormControl><Input {...field} value={field.value || ''} placeholder="Descreva" /></FormControl></FormItem>
                    )} />
                  </div>
                )}
              </div>

              <FormField control={form.control} name="q2_inicio_aulas" render={({ field }) => (
                <FormItem>
                  <FormLabel>2. Quando iniciaram as aulas de recomposição, ou qual é a previsão de início?</FormLabel>
                  <FormControl><Textarea rows={2} {...field} value={field.value || ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div>
                <Label className="font-medium">3. A escola tem realizado 3 encontros semanais de 1 hora-aula por componente?</Label>
                <div className="mt-2">{renderRadioOptions('q3_tres_encontros', [
                  { value: 'sim', label: 'Sim' }, { value: 'nao', label: 'Não' },
                ])}</div>
              </div>

              <div>
                <Label className="font-medium">4. Qual o modelo de agrupamento adotado pela escola? (seleção múltipla)</Label>
                <div className="mt-2">{renderMultiCheckbox('q4_modelos_agrupamento', Q4_OPCOES)}</div>
                {watchQ4.includes(Q4_OPCAO_OUTRO) && (
                  <div className="mt-2">
                    <FormField control={form.control} name="q4_modelos_agrupamento_outro" render={({ field }) => (
                      <FormItem><FormLabel>Outro (especificar)</FormLabel><FormControl><Input {...field} value={field.value || ''} placeholder="Descreva outro modelo" /></FormControl></FormItem>
                    )} />
                  </div>
                )}
              </div>


              <div>
                <Label className="font-medium">5. Quais anos escolares estão sendo contemplados? (seleção múltipla)</Label>
                <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
                  <Controller control={form.control} name="q5_anos_escolares" render={({ field }) => (
                    <>
                      {Q5_OPCOES.map(opt => {
                        const current: string[] = field.value || [];
                        const checked = current.includes(opt);
                        return (
                          <label key={opt} className="flex items-center gap-2 rounded-md border border-border p-2 text-sm">
                            <Checkbox checked={checked} onCheckedChange={(state) => {
                              field.onChange(state ? [...current, opt] : current.filter(v => v !== opt));
                            }} />
                            <span>{opt}</span>
                          </label>
                        );
                      })}
                    </>
                  )} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField control={form.control} name="q6_num_turmas" render={({ field }) => (
                  <FormItem>
                    <FormLabel>6. Nº de turmas de recomposição na escola</FormLabel>
                    <FormControl><Input type="number" min={0} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="q7_num_estudantes" render={({ field }) => (
                  <FormItem>
                    <FormLabel>7. Nº de estudantes participantes</FormLabel>
                    <FormControl><Input type="number" min={0} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div>
                <Label className="font-medium">8. Qual material didático será utilizado?</Label>
                <div className="mt-2">{renderRadioOptions('q8_material_didatico', Q8_MATERIAL_OPCOES)}</div>
              </div>

              <div>
                <Label className="font-medium">9. O material didático está disponível em quantidade suficiente para todos os estudantes?</Label>
                <div className="mt-2">{renderRadioOptions('q8_material_suficiente', [
                  { value: 'sim', label: 'Sim' }, { value: 'nao', label: 'Não' },
                ])}</div>
              </div>

              <div>
                <Label className="font-medium">10. Os dados da avaliação de percurso estão sendo registrados na plataforma e utilizados?</Label>
                <div className="mt-2">{renderRadioOptions('q9_registros_avaliacao', Q9_OPCOES)}</div>
              </div>

              <div>
                <Label className="font-medium">11. O/A Coordenador/a Pedagógico/a ou outro profissional da unidade escolar (ponto focal) tem tempo dedicado na semana para os processos formativos relacionados aos microciclos?</Label>
                <div className="mt-2">{renderRadioOptions('q10_tempo_formativo', Q10_OPCOES)}</div>
              </div>
            </CardContent>
          </Card>

          {/* PARTE 2 — só exibida quando "Observação de aula" está marcada em "Durante a visita técnica, houve" */}
          {showParte2 && (
          <Card>
            <CardHeader><CardTitle className="text-xl">Parte 2 — Observação de aula</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField control={form.control} name="q11_estudantes_matriculados" render={({ field }) => (
                  <FormItem>
                    <FormLabel>12. Nº de estudantes matriculados na turma</FormLabel>
                    <FormControl><Input type="number" min={0} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="q12_estudantes_presentes" render={({ field }) => (
                  <FormItem>
                    <FormLabel>13. Nº de estudantes presentes</FormLabel>
                    <FormControl><Input type="number" min={0} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="q14_aulas_ultimos_30_dias" render={({ field }) => (
                <FormItem>
                  <FormLabel>14. Quantas aulas ocorreram nos últimos 30 dias?</FormLabel>
                  <FormControl><Input type="number" min={0} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div>
                <Label className="font-medium">15. Qual foi o componente curricular observado?</Label>
                <div className="mt-2">{renderRadioOptions('q13_componente', [
                  { value: 'lingua_portuguesa', label: 'Língua Portuguesa' },
                  { value: 'matematica', label: 'Matemática' },
                ])}</div>
              </div>

              <div>
                <Label className="font-medium">16. Qual o modelo de agrupamento adotado na turma?</Label>
                <div className="mt-2">
                  <FormField control={form.control} name="q14_agrupamento_turma" render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <RadioGroup value={field.value || ''} onValueChange={field.onChange} className="space-y-2">
                          {Q14_OPCOES.map((opt) => (
                            <div key={opt} className="flex items-start gap-2">
                              <RadioGroupItem value={opt} id={`q14-${opt}`} className="mt-1" />
                              <Label htmlFor={`q14-${opt}`} className="font-normal cursor-pointer break-words min-w-0">{opt}</Label>
                            </div>
                          ))}
                          <div className="flex items-start gap-2">
                            <RadioGroupItem value="outro" id="q14-outro" className="mt-1" />
                            <Label htmlFor="q14-outro" className="font-normal cursor-pointer">Outro</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                {watchQ14 === 'outro' && (
                  <div className="mt-2">
                    <FormField control={form.control} name="q14_agrupamento_turma_outro" render={({ field }) => (
                      <FormItem><FormLabel>Especifique</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl></FormItem>
                    )} />
                  </div>
                )}
              </div>

              <div>
                <Label className="font-medium">17. Observou-se o uso do material didático (cadernos de curadoria) durante a aula?</Label>
                <div className="mt-2">{renderRadioOptions('q15_uso_material', Q15_OPCOES)}</div>
              </div>

              <div>
                <Label className="font-medium">18. Cadernos em uso na turma: (seleção múltipla)</Label>
                <div className="mt-2">{renderMultiCheckbox('q16_cadernos_uso', Q16_OPCOES)}</div>
              </div>

              {/* Rubricas 19-24 (renumeração visual) */}
              <div className="space-y-4">
                {RUBRICAS.map(renderRubric)}
              </div>
            </CardContent>
          </Card>
          )}

          {/* PARTE 3 */}
          <Card>
            <CardHeader><CardTitle className="text-xl">Parte 3 — Encaminhamentos</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {renderEncBlock('Condições gerais da implementação dos microciclos na escola', 'encA')}
              {renderEncBlock('Aspectos metodológicos relevantes verificados na observação de aula (foco no adequado desenvolvimento do projeto)', 'encB')}
              {renderEncBlock('Análise do compilado de dados do relatório mensal da plataforma Trajetória', 'encC')}
            </CardContent>
          </Card>

          {/* Observações gerais */}
          <Card>
            <CardHeader><CardTitle className="text-base">Observações gerais — outros pontos relevantes relacionados à implementação da metodologia</CardTitle></CardHeader>
            <CardContent>
              <FormField control={form.control} name="observacoes_gerais" render={({ field }) => (
                <FormItem><FormControl><Textarea rows={4} {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
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
