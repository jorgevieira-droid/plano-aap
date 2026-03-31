import { ReactNode } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, ClipboardList } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export const BINARY_SCALE_OPTIONS = [
  { value: 0, label: 'Não Implementado' },
  { value: 1, label: 'Parcialmente' },
  { value: 2, label: 'Implementado' },
] as const;

export const MATERIAL_DIDATICO_OPTIONS = [
  'Curadoria AI (Anos Iniciais — PNLD)',
  'Curadoria AF — Aprender Sempre (Anos Finais)',
  'Curadoria AF — Horizonte (Anos Finais)',
  'Descobertas (Anos Iniciais — a partir de maio/26)',
] as const;

export const REDES_OBSERVACAO_CRITERIA = [
  {
    id: 1,
    title: 'As intervenções estavam alinhadas ao caderno e à faixa de desempenho do grupo?',
    focus: 'Existem estudantes em diferentes níveis de proficiência dentro de um mesmo agrupamento. O professor não pode dar a mesma aula para todos se estão em níveis diferentes.',
    levels: [
      'O professor usa uma única explicação para toda a turma, sem considerar diferenças de nível. Nenhum ajuste de linguagem, exemplo ou suporte é observado para estudantes com maior defasagem.',
      'O professor reconhece verbalmente que há diferenças de nível, mas as intervenções seguem um único roteiro. Eventualmente reformula a orientação ao ser questionado, mas não demonstra conhecimento suficiente para adequar a tarefa ao nível de proficiência do estudante.',
      'O professor se prepara para utilizar materiais ou tarefas em ao menos dois níveis de complexidade e circula pela sala direcionando explicações distintas para grupos com diferentes proficiências.',
      'O professor articula explicitamente o nível do caderno/faixa de proficiência com a estratégia de cada grupo, usa linguagem diferenciada, exemplos calibrados e oferece andaimes progressivos — sem deixar nenhum grupo ocioso ou perdido.',
    ],
  },
  {
    id: 2,
    title: 'O objetivo de aprendizagem estava claro e foi comunicado aos estudantes?',
    focus: 'O aluno precisa saber o que está aprendendo e por que isso é importante para o seu progresso.',
    levels: [
      'Nenhum objetivo é enunciado. Os alunos iniciam a atividade sem saber o que se espera deles ao final da aula.',
      "O professor menciona o tema ('vamos trabalhar frações'), mas sem precisar a habilidade-alvo ou o critério de sucesso.",
      'O objetivo é enunciado em linguagem acessível no início e retomado ao longo da aula. Os alunos conseguem, quando perguntados, dizer o que estão aprendendo.',
      "O objetivo é enunciado, conectado à trajetória do estudante ('você já sabe X; hoje vamos chegar em Y') e verificado no encerramento. Alunos sabem identificar se o alcançaram.",
    ],
  },
  {
    id: 3,
    title: 'O professor demonstrou repertório para explicar o conteúdo de diferentes formas?',
    focus: "A metodologia deve ser o veículo que transporta o aluno do 'não saber' ao 'saber', especialmente em contextos de defasagem.",
    levels: [
      'Diante de erro ou dúvida, o professor repete a mesma explicação com as mesmas palavras, mais devagar ou mais alto. Não recorre a exemplos alternativos, materiais concretos ou representações visuais.',
      'O professor usa um segundo exemplo ao perceber dificuldade, mas o exemplo é da mesma natureza do anterior. A variação é superficial.',
      'O professor transita entre ao menos duas representações distintas (ex.: algoritmo → material concreto ou desenho) quando detecta que a explicação inicial não foi suficiente.',
      'O professor usa múltiplas representações de forma planejada (concreto → pictórico → abstrato), antecipa os erros mais comuns e prepara perguntas-guia para cada nível.',
    ],
  },
  {
    id: 4,
    title: 'O professor utilizou metodologias que favorecem a aprendizagem?',
    focus: "A 'caixa de ferramentas' do professor. A estratégia alcança quem tem dificuldade?",
    levels: [
      'A aula é conduzida integralmente no formato expositivo, com cópia ou resolução individual silenciosa. Não há estratégia que promova interação entre pares ou prática guiada.',
      'Há uma tentativa de incluir outra metodologia (ex.: duplas), mas sem estrutura: os alunos fazem a mesma coisa que fariam sozinhos, ou a atividade não chega a ser concluída.',
      'O professor usa ao menos uma estratégia ativa estruturada (prática guiada, duplas com papel definido, resolução de problemas com discussão). A estratégia é acessível a quem tem maior defasagem.',
      'O professor combina estratégias de forma intencional e sequenciada (ex.: modelagem → prática guiada → prática independente). Alunos com maior defasagem têm suporte adicional embutido na estratégia.',
    ],
  },
  {
    id: 5,
    title: 'A maioria dos alunos participou ativamente da aula?',
    focus: 'Engajamento coletivo e a capacidade do professor de converter o plano em uma experiência compartilhada.',
    levels: [
      'Menos da metade dos alunos está visivelmente envolvida. Há comportamentos frequentes de dispersão (conversas paralelas, uso de celular, cabeça baixa) sem intervenção do professor.',
      'A maioria acompanha passivamente (olham para o professor), mas poucos interagem. O professor percebe a dispersão, mas as ações são pontuais e de curto efeito.',
      'A maioria dos alunos participa ativamente (respondem perguntas, resolvem atividades, discutem em duplas). Quando há dispersão, o professor reengaja com estratégias eficazes.',
      'Praticamente todos os alunos estão engajados durante toda a aula. O professor usa técnicas de participação universal (ex.: todos escrevem antes de falar, todos mostram o resultado).',
    ],
  },
  {
    id: 6,
    title: 'O professor fez intervenções que apoiam a compreensão?',
    focus: 'A capacidade do professor de atuar sobre a dúvida, oferecendo suportes para superar obstáculos cognitivos.',
    levels: [
      'O professor fornece a resposta diretamente ou ignora a dúvida, sem identificar o obstáculo cognitivo. O aluno que errou não entende por que errou.',
      "O professor tenta ajudar, mas a intervenção é genérica ('pensa bem', 'tenta de novo') sem identificar onde está a confusão do aluno.",
      'O professor identifica o ponto específico de confusão, faz perguntas que conduzem o aluno a perceber o erro e oferece suporte gradual (andaime), sem dar a resposta pronta.',
      'O professor usa o erro como oportunidade de aprendizagem coletiva e usa perguntas progressivas que levam à autocorreção. Outros alunos também se beneficiam da intervenção.',
    ],
  },
  {
    id: 7,
    title: 'O professor verificou a compreensão dos estudantes?',
    focus: 'Monitoramento constante (avaliação formativa) para saber se a turma está acompanhando antes de avançar.',
    levels: [
      'Não há checagem sistemática da compreensão. O professor avança no conteúdo sem verificar se os alunos acompanharam.',
      "O professor faz perguntas, mas apenas para os alunos que levantam a mão, ou a verificação se limita a 'entenderam?' sem obter resposta real da turma.",
      'O professor usa ao menos uma estratégia de verificação que envolve toda a turma. Ajusta o andamento com base no que vê.',
      'O professor verifica a compreensão de forma contínua, usa diferentes técnicas ao longo da aula e usa os dados coletados para redirecionar a aula em tempo real.',
    ],
  },
  {
    id: 8,
    title: 'O clima da sala é de colaboração, respeito mútuo e favorável à aprendizagem?',
    focus: 'Segurança psicológica e respeito. O aluno precisa se sentir seguro para errar.',
    levels: [
      'Há episódios de constrangimento explícito (professor corrige com tom depreciativo, alunos riem de erros de colegas sem intervenção). O erro é tratado como falha.',
      "O ambiente é neutro: não há episódios explícitos de humilhação, mas o professor não constrói ativamente uma cultura de 'é ok errar'.",
      'O professor normaliza o erro como parte do processo. As interações são respeitosas e alunos participam sem receio visível.',
      'O professor cultiva ativamente a colaboração. O erro é usado como ponto de partida para a aprendizagem coletiva. O clima é de comunidade.',
    ],
  },
  {
    id: 9,
    title: 'O professor gerenciou bem o tempo para atividades e dúvidas?',
    focus: 'Equilíbrio entre cumprir a sequência didática e garantir que os momentos de prática e dúvida não sejam atropelados.',
    levels: [
      'A aula perde tempo em transições longas ou episódios de comportamento. A atividade principal não chega a ser concluída, ou as dúvidas não são atendidas por falta de tempo.',
      'O tempo é parcialmente aproveitado, mas há desequilíbrio: a explicação se estende demais e a prática fica para o final, ou a prática é interrompida antes do tempo adequado.',
      'O professor divide o tempo de forma equilibrada entre explicação, prática e dúvidas. A aula encerra com uma síntese ou tarefa clara.',
      'O professor usa o tempo com precisão intencional, ajusta o ritmo em tempo real e garante que encerramento e síntese sempre aconteçam.',
    ],
  },
] as const;

export const ETEG_ITEMS = [
  'Os gestores e/ou equipe técnica utilizam regularmente a Plataforma Trajetórias para acompanhar a escola?',
  'Os gestores e/ou equipe técnica demonstram entendimento sobre as discussões dos dados de aprendizagem?',
  'O quórum de gestores e/ou equipe técnica na formação foi igual ou superior a 75%?',
  'Os gestores e/ou equipe técnica incorporaram à sua prática (rotina) a metodologia de gestão para aprendizagem (modelo SAEB)?',
  'Os gestores mantêm uma rotina de reunião com CP para planejar a caminhada pedagógica?',
  'Os gestores/equipe técnica se apoiam nos dados das avaliações para fazer os acompanhamentos (caminhada pedagógica) junto aos professores?',
  'A coordenação pedagógica estabelece junto aos docentes planos de ação com base nos dados das avaliações?',
  'Há evidências de que os dados das avaliações orientam as decisões pedagógicas da escola?',
] as const;

export const PROFESSOR_ITEMS = [
  'Todos os professores participam ativamente da formação?',
  'Os professores demonstram clareza sobre os objetivos da formação para 2026?',
  'O quórum de professores nessa formação foi igual ou superior a 75% no dia do encontro formativo?',
  'Há participação de outros atores que não de professores de 4º anos?',
  'O professor utiliza efetivamente o material didático adotado pela rede durante a aula?',
  'O professor acessa ou tem conhecimento dos dados da Plataforma Trajetórias que apresenta o resultado das aprendizagens dos estudantes?',
  'Há evidências de que os resultados da avaliação orientam o planejamento para intervenções pedagógicas em sala de aula?',
  'O conteúdo da pauta/atividade selecionada da avaliação atendeu a demanda dos professores?',
] as const;

interface HeaderProps {
  title: string;
  description: string;
}

export function RedesPageHeader({ title, description }: HeaderProps) {
  return (
    <div className="space-y-2">
      <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
        <ClipboardList className="h-4 w-4" />
        Formulários REDES
      </div>
      <div>
        <h1 className="page-header">{title}</h1>
        <p className="page-subtitle">{description}</p>
      </div>
    </div>
  );
}

interface DatePickerFieldProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function DatePickerField({ value, onChange, placeholder = 'Selecione uma data', disabled = false }: DatePickerFieldProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn('w-full justify-between font-normal', !value && 'text-muted-foreground')}
        >
          <span>{value ? format(value, 'dd/MM/yyyy', { locale: ptBR }) : placeholder}</span>
          <CalendarIcon className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={value} onSelect={onChange} initialFocus locale={ptBR} />
      </PopoverContent>
    </Popover>
  );
}

export function RubricaLegendCard() {
  const items = [
    ['1 – Insuficiente', 'A prática observada indica ausência ou inadequação significativa do comportamento-alvo.'],
    ['2 – Em Desenvolvimento', 'Há tentativa de atingir o comportamento-alvo, mas de forma incompleta ou inconsistente. A prática está em construção.'],
    ['3 – Consolidado', 'O comportamento-alvo está presente de forma clara e consistente na maior parte da aula. A prática é autônoma.'],
    ['4 – Avançado', 'O comportamento-alvo é executado com intencionalidade e impacto ampliado. O professor pode ser referência para pares.'],
  ] as const;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Legenda das Rubricas</CardTitle>
        <CardDescription>Escala de referência utilizada para atribuição das notas dos 9 critérios.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {items.map(([title, description]) => (
          <div key={title} className="rounded-lg border border-border bg-muted/30 p-4">
            <p className="font-semibold text-foreground">{title}</p>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function BinaryScaleLegendCard() {
  const items = [
    {
      title: '0 – Não implementado',
      description: 'A prática, processo ou condição não foi observada ou está ausente.',
      className: 'border-destructive/20 bg-destructive/10 text-destructive',
    },
    {
      title: '1 – Parcialmente implementado',
      description: 'Há evidências de iniciativa, mas a prática é incompleta ou inconsistente.',
      className: 'border-warning/20 bg-warning/10 text-warning',
    },
    {
      title: '2 – Implementado conforme previsto',
      description: 'A prática está consolidada e ocorre de forma sistemática e autônoma.',
      className: 'border-success/20 bg-success/10 text-success',
    },
  ] as const;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Escala de Resposta</CardTitle>
        <CardDescription>Use a escala abaixo para responder todos os itens de verificação.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 lg:grid-cols-3">
        {items.map((item) => (
          <div key={item.title} className={cn('rounded-lg border p-4', item.className)}>
            <Badge variant="outline" className="border-current/20 bg-transparent text-current">
              {item.title}
            </Badge>
            <p className="mt-3 text-sm leading-6">{item.description}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function SectionIntro({ title, description, children }: HeaderProps & { children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
