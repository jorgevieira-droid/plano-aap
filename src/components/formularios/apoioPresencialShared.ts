// Dados compartilhados dos instrumentos do "Olhar Parceiro"
// (Registro de Apoio Presencial, Formação do Coordenador e Encaminhamentos Internos)

export const TBD = 'A ser desenvolvido';

export interface RubricaNivel {
  value: number;
  label: string;
  description: string;
}

export interface RubricaDef {
  key: string;
  numero: number;
  titulo: string;
  resumo: string;
  foco: string;
  niveis: RubricaNivel[];
}

const NIVEL_LABELS = ['Nada efetivo', 'Pouco efetivo', 'Efetivo', 'Muito efetivo'];

export const NIVEL_OPTIONS = [
  { value: 3, label: 'Muito efetivo' },
  { value: 2, label: 'Efetivo' },
  { value: 1, label: 'Pouco efetivo' },
  { value: 0, label: 'Nada efetivo' },
];

const tbdNiveis = (): RubricaNivel[] =>
  [3, 2, 1, 0].map((v) => ({ value: v, label: NIVEL_LABELS[v], description: TBD }));

export const FOCO_PLANEJAMENTO =
  'FOCO: PLANEJAMENTO, DOMÍNIO DE CONTEÚDO E RECURSOS PEDAGÓGICOS';
export const FOCO_ESTRATEGIAS = 'FOCO: ESTRATÉGIAS DIDÁTICAS';
export const FOCO_GESTAO = 'FOCO: GESTÃO DE SALA DE AULA';

export const RUBRICA_FOCOS = [FOCO_PLANEJAMENTO, FOCO_ESTRATEGIAS, FOCO_GESTAO];

const niveis = (
  muito: string,
  efetivo: string,
  pouco: string,
  nada: string,
): RubricaNivel[] => [
  { value: 3, label: 'Muito efetivo', description: muito },
  { value: 2, label: 'Efetivo', description: efetivo },
  { value: 1, label: 'Pouco efetivo', description: pouco },
  { value: 0, label: 'Nada efetivo', description: nada },
];

export const RUBRICAS: RubricaDef[] = [
  {
    key: 'rubrica_1',
    numero: 1,
    foco: FOCO_PLANEJAMENTO,
    titulo:
      'O conteúdo é alinhado ao currículo e possui foco nos pré-requisitos para que os estudantes avancem',
    resumo:
      'A aula aborda o que é essencial para o ano/ciclo, previsto no currículo, respeitando a progressão necessária para a recomposição.',
    niveis: niveis(
      'Além do alinhamento curricular, o professor integrou diferentes habilidades e conteúdos para sanar lacunas de aprendizagem.',
      'O conteúdo estava alinhado às habilidades do currículo e o professor focou nos pré-requisitos necessários para que os alunos avancem.',
      'O conteúdo estava alinhado às habilidades do currículo, mas foi abordado de forma isolada, superficial ou sem foco nos pré-requisitos necessários para que os alunos avancem.',
      'O conteúdo não possui conexão clara com as habilidades do currículo e/ou estava desalinhado ao nível de desenvolvimento da turma, sem considerar lacunas prévias.',
    ),
  },
  {
    key: 'rubrica_2',
    numero: 2,
    foco: FOCO_PLANEJAMENTO,
    titulo: 'O objetivo de aprendizagem estava claro e foi significado junto aos estudantes',
    resumo:
      'A apresentação do objetivo da aprendizagem oferece clareza aos estudantes sobre o que será aprendido e porquê.',
    niveis: niveis(
      'O objetivo foi apresentado, significado e retomado durante toda a aula como bússola, conectando ao que os estudantes já sabem e articulando as atividades.',
      'O objetivo foi apresentado pelo professor e conectado ao que os estudantes já sabem e ao que deverão ser capazes de fazer.',
      'O objetivo foi apresentado pelo professor de forma técnica ou burocrática, sem que os estudantes compreendessem o que deveriam ser capazes de fazer.',
      'O objetivo não foi apresentado pelo professor e nem pôde ser identificado a partir das explicações e atividades propostas ou ainda foi confundido com a simples execução de uma tarefa (ex.: "fazer a página 10").',
    ),
  },
  {
    key: 'rubrica_3',
    numero: 3,
    foco: FOCO_PLANEJAMENTO,
    titulo:
      'O domínio conceitual permite a realização de explicações contextualizadas, exemplificações e adaptações',
    resumo:
      'A segurança conceitual se manifesta em diferentes ações do professor: ao explicar conceitos, ao estabelecer relações entre ideias, ao responder perguntas inesperadas e ao aprofundar discussões.',
    niveis: niveis(
      'As explicações extrapolaram o material orientador. O professor estabeleceu relações com outros objetos de conhecimento, ofereceu exemplos variados e contextualizados na vida dos estudantes. O professor manteve coerência conceitual para resolução de dúvidas e adaptações para sanar lacunas de aprendizagem.',
      'As explicações foram realizadas de acordo com o material orientador. O professor manteve a coerência conceitual na resolução de dúvidas, na exemplificação e contextualização conceitual e nas adaptações realizadas.',
      'As explicações foram realizadas, porém o professor encontrou dificuldades para oferecer exemplificações variadas, contextualizar os conteúdos na vida dos estudantes, relacionar ideias e/ou realizar adaptações.',
      'As explicações foram superficiais ou desconectadas do material orientador, com falta de coerência conceitual ou de exemplificações variadas para resolver dúvidas ou contextualizar os conceitos na vida dos estudantes.',
    ),
  },
  {
    key: 'rubrica_4',
    numero: 4,
    foco: FOCO_PLANEJAMENTO,
    titulo:
      'A utilização intencional dos recursos pedagógicos (plataformas, materiais impressos e digitais, propostas didáticas preparadas pelo professor) favorece a aprendizagem',
    resumo:
      'Os recursos utilizados apoiam a aprendizagem de forma intencional e não apenas para cumprir metas ou seguir roteiros de forma mecânica.',
    niveis: niveis(
      'O professor demonstrou preparo e domínio na utilização dos recursos pedagógicos previstos no material orientador, além de trazer outros para conduzir a turma nas atividades ou realizar as adaptações necessárias. A conexão do uso dos recursos para o desenvolvimento das aprendizagens previstas ficou evidente.',
      'O professor utilizou os recursos pedagógicos orientados pelo material, apresentando conhecimento para manejá-los. Os recursos utilizados favoreceram as aprendizagens previstas e foi possível responder às dúvidas dos estudantes.',
      'O professor utilizou os recursos pedagógicos com alguma dificuldade para manejá-los, para sanar as dúvidas dos estudantes e/ou de forma que não ficasse clara a conexão do uso dos recursos para o desenvolvimento das aprendizagens previstas.',
      'Não houve utilização de recursos ou os recursos foram utilizados de forma desarticulada das aprendizagens esperadas. O professor apresentou dificuldades na orientação dos estudantes, no manejo dos recursos e na resolução de dúvidas.',
    ),
  },
  {
    key: 'rubrica_5',
    numero: 5,
    foco: FOCO_ESTRATEGIAS,
    titulo: 'As estratégias de aprendizagem são ativas e adequadas ao objetivo da aula',
    resumo:
      'A metodologia deve ser o veículo que transporta o aluno do "não saber" ao "saber", especialmente em contextos de defasagem.',
    niveis: niveis(
      'O professor utilizou estratégias de aprendizagem ativa. Os alunos lideraram processos (ex.: ensino por pares, debates, resolução de problemas reais). O professor ajustou os desafios de acordo com o nível de proficiência dos estudantes para atingir os objetivos da aula.',
      'O professor utilizou estratégias coerentes com o objetivo de aprendizagem, promovendo aprendizagem ativa na maior parte da aula, em que alunos precisaram resolver problemas, colaborar em grupos ou explicar seus raciocínios.',
      'O professor utilizou estratégias padrão (ex.: aula expositiva), sem a garantia da participação ativa dos estudantes na maior parte da aula. A construção do conhecimento esteve centrada no professor e os alunos tiveram pouco espaço para criar ou testar hipóteses.',
      'O professor utilizou estratégias passivas na maior parte da aula ou descoladas do objetivo de aprendizagem. O professor reteve a centralidade da aula. Os alunos realizaram tarefas de cópia ou repetição.',
    ),
  },
  {
    key: 'rubrica_6',
    numero: 6,
    foco: FOCO_ESTRATEGIAS,
    titulo:
      'A abordagem e as estratégias utilizadas alcançam os estudantes com lacunas de aprendizagem',
    resumo:
      'A diversificação de abordagens na turma é fundamental para que quem possui lacunas de aprendizagem possa aprender.',
    niveis: niveis(
      'O professor utilizou uma abordagem heterogênea, diversificando explicações, estratégias, recursos e atividades, para apoiar a superação das barreiras de aprendizagem da turma.',
      'O professor utilizou uma abordagem diferenciada para trabalhar as lacunas de aprendizagem, diversificando explicações e/ou atividades para os estudantes.',
      'O professor utilizou uma abordagem única para a turma, oferecendo as mesmas explicações e atividades para todos, buscando apoiar as dificuldades de aprendizagem individuais.',
      'O professor utilizou uma abordagem única, oferecendo as mesmas explicações e atividades para todos. Não houve foco na superação das dificuldades de aprendizagem existentes.',
    ),
  },
  {
    key: 'rubrica_7',
    numero: 7,
    foco: FOCO_ESTRATEGIAS,
    titulo:
      'A compreensão dos estudantes foi checada para apoiar a retomada ou o avanço dos conteúdos',
    resumo:
      'A aprendizagem se constrói em etapas e acompanhar esse percurso é fundamental para que todos possam progredir.',
    niveis: niveis(
      'O professor checou a compreensão dos estudantes, nos momentos importantes da aula, utilizando recursos e estratégias variadas. Houve adaptação do ritmo, retomada/avanço de conteúdos e mudança de estratégia ao notar uma dúvida/lacuna de aprendizagem.',
      'O professor checou a compreensão dos estudantes, ao longo da aula, com estratégias que geraram insumos para adaptar o ritmo e trabalhar em cima do erro dos estudantes, retomando ou avançando conteúdos e redirecionando as atividades.',
      'O professor checou se os estudantes estavam aprendendo, por meio de perguntas de resposta "sim ou não", ou de perguntas genéricas, como "entenderam?", onde o silêncio foi interpretado como compreensão.',
      'O professor raramente checou se os estudantes estavam aprendendo ou realizou a checagem de aprendizagem somente ao final da aula, sem tempo para trabalhar o erro e/ou retomar conteúdos.',
    ),
  },
  {
    key: 'rubrica_8',
    numero: 8,
    foco: FOCO_ESTRATEGIAS,
    titulo: 'Circulação em sala e mediação problematizadora',
    resumo:
      'A circulação permite o monitoramento das aprendizagens e a realização de uma mediação problematizadora que contribua para o avanço efetivo dos estudantes e não apenas o cumprimento do planejamento.',
    niveis: niveis(
      'O professor utilizou a circulação entre os estudantes/grupos para oferecer pistas e perguntas provocativas para diagnosticar e ajustar o desenvolvimento da aula, em tempo real, trabalhando o erro.',
      'O professor circulou pela sala e realizou mediações individuais/grupos, oferecendo pistas, provocações e orientação de acordo com a necessidade dos estudantes/grupos.',
      'O professor circulou pela sala, mas as interações com os estudantes/grupos foram breves, com foco em checar se estavam realizando as atividades ou tirando dúvidas pontuais dos estudantes/grupos.',
      'O professor permaneceu fixo ou dedicou-se à mediação de um estudante/grupo.',
    ),
  },
  {
    key: 'rubrica_9',
    numero: 9,
    foco: FOCO_ESTRATEGIAS,
    titulo:
      'A organização do conteúdo em tempos adequados permite que a aula seja realizada com começo, meio e fim',
    resumo:
      'A estrutura lógica da aula. Para o desenvolvimento do conteúdo é importante conectar os estudantes ao conteúdo da aula, oferecer a prática guiada, a prática autônoma e a sistematização de aprendizagens.',
    niveis: niveis(
      'O professor organizou a aula com começo, meio e fim, garantindo o desenvolvimento do conteúdo em tempos adequados e realizando ajustes necessários em tempo real mediante os imprevistos que surgiram para trabalhar o conteúdo.',
      'O professor estruturou a aula e o desenvolvimento do conteúdo de forma a garantir começo, meio e fim da aula.',
      'O professor desenvolveu o conteúdo de forma apressada ou superficial em alguns momentos.',
      'O professor não conseguiu desenvolver o conteúdo, garantindo começo, meio e fim da aula.',
    ),
  },
  {
    key: 'rubrica_10',
    numero: 10,
    foco: FOCO_GESTAO,
    titulo:
      'O engajamento dos estudantes para iniciar a aula apoia a realização das atividades previstas',
    resumo:
      'Engajar os estudantes para iniciar a aula em curto espaço de tempo apoia o desenvolvimento das atividades planejadas.',
    niveis: niveis(
      'O professor utilizou menos de 10 min para iniciar a aula e engajar os alunos, provendo o objetivo da aula, combinados/rotina, retomadas, levantamento de curiosidades...',
      'O professor utilizou até 10 min para iniciar a aula e engajar os alunos, promovendo o objetivo da aula, combinados/rotina, retomadas, levantamento de curiosidades...',
      'O professor utilizou menos de 10 minutos para iniciar e não engajou os estudantes.',
      'O professor utilizou mais de 10 minutos para iniciar a aula e não engajou os alunos.',
    ),
  },
  {
    key: 'rubrica_11',
    numero: 11,
    foco: FOCO_GESTAO,
    titulo:
      'O gerenciamento do tempo garante desenvolvimento da sequência didática, resolução de dúvidas e sistematização de aprendizagens',
    resumo:
      'O equilíbrio entre cumprir a sequência didática e garantir que os momentos de prática e dúvida não sejam atropelados é fundamental para a aprendizagem.',
    niveis: niveis(
      'O professor realizou a gestão do tempo de modo a maximizar o "tempo de aprendizagem ativa". Mesmo com imprevistos o professor garantiu o essencial. Foi possível tirar as dúvidas dos estudantes, realizar atividades práticas e sistematizar as aprendizagens.',
      'O professor distribuiu o tempo da aula e os tempos foram suficientes para as tarefas, explicações e sistematização de aprendizagens, ainda que com alguma dificuldade para lidar com os imprevistos e dúvidas.',
      'O professor cumpriu os momentos importantes da aula de forma apressada e superficial e/ou não conseguiu realizar algum deles mediante os imprevistos que surgiram.',
      'O professor terminou a aula sem concluir a atividade principal. O tempo foi gasto quase totalmente com a organização da turma e explicações, sobrando pouco para dúvidas e atividades práticas.',
    ),
  },
  {
    key: 'rubrica_12',
    numero: 12,
    foco: FOCO_GESTAO,
    titulo: 'A maior parte dos alunos participa da aula',
    resumo:
      'O engajamento coletivo e a capacidade do professor de converter o plano de aula em uma experiência compartilhada por todos.',
    niveis: niveis(
      'A maior parte dos estudantes apresentou engajamento na aula, estando atentos às explicações e participando das atividades. O professor realizou a mobilização da turma para participar com estratégias e recursos variados.',
      'A maior parte dos estudantes estava envolvida na aula, embora alguns permanecessem dispersos ou participassem temporariamente. O professor não apresentou dificuldades para mobilizar a participação.',
      'Alguns estudantes participaram da aula, são sempre os mesmos que respondem, conduzem atividades, enquanto outros permanecem dispersos ou passivos. O professor utiliza pouca variação de estratégias para promover a participação.',
      'Grande parte dos estudantes estavam desconectados da aula, com alto nível de dispersão (dormindo, conversas paralelas, bagunça) e sem envolvimento significativo nas atividades propostas. O professor teve dificuldade para promover o envolvimento dos estudantes na aula.',
    ),
  },
  {
    key: 'rubrica_13',
    numero: 13,
    foco: FOCO_GESTAO,
    titulo:
      'O clima na sala de aula é de colaboração, respeito mútuo e favorável à aprendizagem',
    resumo:
      'O respeito e a segurança para errar, especialmente quando está recuperando defasagens, apoia o desenvolvimento da aprendizagem.',
    niveis: niveis(
      'O clima foi de respeito e colaboração entre os estudantes e não houve situações de conflito. Os estudantes não apresentaram receio de participar e o professor trabalhou o erro como parte do processo de aprendizagem.',
      'O clima foi de respeito e participação. Os conflitos foram pontuais e mediados pelo professor.',
      'O clima foi de ordem baseado na autoridade do professor. Há pouca colaboração entre os pares e/ou os alunos têm receio de participar, alguns permaneceram dispersos ou apáticos.',
      'O ambiente estava barulhento e os estudantes estavam agitados, dispersos ou apáticos na maior parte da aula. O professor apresentou dificuldades para mediar conflitos.',
    ),
  },
  {
    key: 'rubrica_14',
    numero: 14,
    foco: FOCO_GESTAO,
    titulo:
      'As intervenções docentes quando os estudantes estão dispersos ou em casos de conflito e indisciplina são respeitosas',
    resumo:
      'As intervenções respeitosas em situações de dispersão, conflito e indisciplina preservam a relação com os estudantes e a motivação para aprender.',
    niveis: niveis(
      'As intervenções do professor nas situações de dispersão, indisciplina ou conflitos que surgiram foram realizadas de maneira respeitosa, apoiando a superação dos desafios e a construção de um clima positivo para a aprendizagem.',
      'As intervenções do professor nas situações de dispersão, indisciplina ou conflitos que surgiram foram realizadas de maneira respeitosa e firme, de modo a conter a situação no momento.',
      'O professor não realizou intervenções nas situações de dispersão, indisciplina ou conflitos.',
      'As intervenções do professor foram desrespeitosas ou inadequadas nas situações de dispersão, indisciplina e conflitos, de modo a fragilizar a relação com estudantes e motivação para aprender.',
    ),
  },
];

export interface PraticaDef {
  key: string;
  ordem: number;
  titulo: string;
  resumo: string;
  niveis: RubricaNivel[];
}

export const PRATICAS_ESSENCIAIS: PraticaDef[] = [
  {
    key: 'pratica_1',
    ordem: 1,
    titulo:
      'Retomada — O professor identifica e mobiliza os conhecimentos prévios necessários para que os estudantes abaixo do básico avancem',
    resumo:
      'A retomada parte daquilo que o estudante já sabe e mobiliza conhecimentos essenciais que funcionam como ponto de apoio para a nova aprendizagem. Os conhecimentos prévios são pontos de ancoragem e retomar não significa apresentar da mesma maneira a informação.',
    niveis: [
      {
        value: 3,
        label: 'Muito efetivo',
        description:
          'O professor mobilizou intencionalmente os conhecimentos prévios de forma que os estudantes estabeleceram conexões explícitas com os novos saberes, favorecendo a participação e avanço dos alunos abaixo do básico.',
      },
      {
        value: 2,
        label: 'Efetivo',
        description:
          'O professor mobilizou conhecimentos prévios e criou oportunidades para que os estudantes abaixo do básico progredissem no desenvolvimento da nova aprendizagem.',
      },
      {
        value: 1,
        label: 'Pouco efetivo',
        description:
          'O professor realizou uma retomada de conhecimentos anteriores de maneira geral para a turma, sem considerar o que os estudantes abaixo do básico já sabiam ou precisavam recuperar.',
      },
      {
        value: 0,
        label: 'Nada efetivo',
        description:
          'O professor iniciou ou avançou no conteúdo sem mobilizar conhecimentos prévios dos estudantes.',
      },
    ],
  },
  {
    key: 'pratica_2',
    ordem: 2,
    titulo: 'Segunda prática essencial',
    resumo: TBD,
    niveis: tbdNiveis(),
  },
  {
    key: 'pratica_3',
    ordem: 3,
    titulo: 'Terceira prática essencial',
    resumo: TBD,
    niveis: tbdNiveis(),
  },
];

export const APOIO_SEGMENTO_OPTIONS = ['EFAI', 'EFAF', 'EM'];

export const APOIO_COMPONENTE_OPTIONS_NEW = [
  'MAT',
  'OE MAT',
  'TUTOR MAT',
  'LP',
  'OE LP',
  'TUTOR LP',
  'MAT VOAR',
  'LP VOAR',
  'TUTOR EFAI',
  'REGENTE EFAI',
  'COLABORATIVO TUTOR EFAI',
];

export const OUTROS_OBSERVADORES_OPTIONS = ['Coordenador', 'PAAC', 'Diretor'];

export const DIFERENCA_HORARIO_OPTIONS = [
  'Até 10 minutos',
  'Entre 10 e 13 minutos',
  'Entre 13 e 15 minutos',
  'Mais de 15 minutos',
];

export const AVALIACAO_APOIO_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: 'Nada eficaz' },
  { value: 2, label: 'Pouco eficaz' },
  { value: 3, label: 'Eficaz' },
  { value: 4, label: 'Muito eficaz' },
];


export const GEM_TRANSCRITOR_URL =
  'https://gemini.google.com/gem/1F575CmUgF1ek9qofpCzhMTexiMJYKgqx?usp=sharing';

export const REGISTROS_COORDENADOR_OPTIONS = [
  'Evidências de grão fino',
  'Evidências de grão largo',
  'Inferências',
];

export const PARTICIPACAO_DEVOLUTIVA_OPTIONS = [
  'Como observador de devolutiva modelizada pelo consultor',
  'Como liderança da devolutiva',
  'Como co-liderança, dividindo as responsabilidades com o consultor',
];

export const ETAPA_OPTIONS = ['EFAI', 'EFAF', 'EM'];
