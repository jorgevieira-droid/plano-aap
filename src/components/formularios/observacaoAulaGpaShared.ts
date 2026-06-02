export const GPA_ANO_OPTIONS = [
  '1º ANO', '2º ANO', '3º ANO', '4º ANO', '5º ANO',
  '6º ANO', '7º ANO', '8º ANO', '9º ANO',
] as const;

export const GPA_TURMA_OPTIONS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'] as const;

export const GPA_MATERIAL_DIDATICO_OPTIONS = [
  'Currículo em Ação',
  'Set/Moderna',
  'Material PNLD',
] as const;

export const GPA_CRITERIA = [
  {
    id: 1,
    dimension: 'D1 — Conhecimento Pedagógico do Conteúdo',
    title: 'As intervenções estavam alinhadas ao caderno e à faixa de desempenho do grupo?',
    focus: 'Existem estudantes em diferentes níveis de proficiência dentro de um mesmo agrupamento. O professor não pode dar a mesma aula para todos se estão em níveis diferentes.',
    levels: [
      'O professor usa uma única explicação para toda a turma, sem considerar diferenças de nível. Nenhum ajuste de linguagem, exemplo ou suporte é observado para estudantes com maior defasagem.',
      'O professor reconhece verbalmente que há diferenças de nível, mas as intervenções seguem um único roteiro. Eventualmente reformula a orientação ao ser questionado, mas não demonstra conhecimento suficiente para adequar a tarefa proposta a um nível de complexidade alinhado ao nível de proficiência do estudante.',
      'O professor se prepara para utilizar materiais ou tarefas em ao menos dois níveis de complexidade e circula pela sala direcionando explicações distintas para grupos com diferentes proficiências.',
      'O professor articula explicitamente o nível do caderno/faixa de proficiência com a estratégia de cada grupo, usa linguagem diferenciada, exemplos calibrados e oferece andaimes progressivos — sem deixar nenhum grupo ocioso ou perdido.',
    ],
  },
  {
    id: 2,
    dimension: 'D1 — Conhecimento Pedagógico do Conteúdo',
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
    dimension: 'D2 — Explicação e Metodologia',
    title: 'O professor demonstrou repertório para explicar o conteúdo de diferentes formas?',
    focus: "A metodologia deve ser o veículo que transporta o aluno do 'não saber' ao 'saber', especialmente em contextos de defasagem.",
    levels: [
      'Diante de erro ou dúvida, o professor repete a mesma explicação com as mesmas palavras, mais devagar ou mais alto. Não recorre a exemplos alternativos, materiais concretos ou representações visuais.',
      'O professor usa um segundo exemplo ao perceber dificuldade, mas o exemplo é da mesma natureza do anterior (abstrato, se o primeiro era abstrato). A variação é superficial.',
      'O professor transita entre ao menos duas representações distintas (ex.: algoritmo → material concreto ou desenho) quando detecta que a explicação inicial não foi suficiente.',
      'O professor usa múltiplas representações de forma planejada (concreto → pictórico → abstrato, ou analogia → modelo → aplicação), antecipa os erros mais comuns e prepara perguntas-guia para cada nível.',
    ],
  },
  {
    id: 4,
    dimension: 'D2 — Explicação e Metodologia',
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
    dimension: 'D3 — Engajamento e Verificação',
    title: 'A maioria dos alunos participou ativamente da aula?',
    focus: 'Engajamento coletivo e a capacidade do professor de converter o plano em uma experiência compartilhada.',
    levels: [
      'Menos da metade dos alunos está visivelmente envolvida. Há comportamentos frequentes de dispersão (conversas paralelas, uso de celular, cabeça baixa) sem intervenção do professor.',
      'A maioria acompanha passivamente (olham para o professor), mas poucos interagem ou demonstram participação ativa. O professor percebe a dispersão, mas as ações para motivar a participação dos estudantes são pontuais e de curto efeito.',
      'A maioria dos alunos participa ativamente (respondem perguntas, resolvem atividades, discutem em duplas). Quando há dispersão, o professor reengaja com estratégias eficazes antes que se generalize.',
      'Praticamente todos os alunos estão engajados durante toda a aula. O professor usa técnicas de participação universal (ex.: todos escrevem antes de falar, todos mostram o resultado), não apenas os que levantam a mão.',
    ],
  },
  {
    id: 6,
    dimension: 'D3 — Engajamento e Verificação',
    title: 'O professor fez intervenções que apoiam a compreensão?',
    focus: 'A capacidade do professor de atuar sobre a dúvida, oferecendo suportes para superar obstáculos cognitivos.',
    levels: [
      'O professor fornece a resposta diretamente ou ignora a dúvida, sem identificar o obstáculo cognitivo. O aluno que errou não entende por que errou.',
      "O professor tenta ajudar, mas a intervenção é genérica ('pensa bem', 'tenta de novo') sem identificar onde está a confusão do aluno.",
      'O professor identifica o ponto específico de confusão, faz perguntas que conduzem o aluno a perceber o erro e oferece suporte gradual (andaime), sem dar a resposta pronta.',
      'O professor usa o erro como oportunidade de aprendizagem coletiva, articula a intervenção ao nível do estudante e usa perguntas progressivas que levam à autocorreção. Outros alunos também se beneficiam da intervenção.',
    ],
  },
  {
    id: 7,
    dimension: 'D3 — Engajamento e Verificação',
    title: 'O professor verificou a compreensão dos estudantes?',
    focus: 'Monitoramento constante (avaliação formativa) para saber se a turma está acompanhando antes de avançar.',
    levels: [
      'Não há checagem sistemática da compreensão. O professor avança no conteúdo sem verificar se os alunos acompanharam.',
      "O professor faz perguntas, mas apenas para os alunos que levantam a mão, ou se limita a 'entenderam?' sem obter resposta real da turma.",
      'O professor usa ao menos uma estratégia de verificação que envolve toda a turma. Ajusta o andamento com base no que vê.',
      'O professor verifica a compreensão de forma contínua, usa diferentes técnicas ao longo da aula e usa os dados coletados para redirecionar a aula em tempo real.',
    ],
  },
  {
    id: 8,
    dimension: 'D4 — Clima e Gestão do Tempo',
    title: 'O clima da sala é de colaboração, respeito mútuo e favorável à aprendizagem?',
    focus: 'Segurança psicológica e respeito. O aluno precisa se sentir seguro para errar.',
    levels: [
      'Há episódios de constrangimento explícito (professor corrige com tom depreciativo, alunos riem de erros de colegas sem intervenção). O erro é tratado como falha.',
      "O ambiente é neutro: não há episódios explícitos de humilhação, mas o professor não constrói ativamente uma cultura de 'é ok errar'.",
      'O professor normaliza o erro como parte do processo. As interações são respeitosas e os alunos participam sem receio visível.',
      'O professor cultiva ativamente a colaboração. O erro é usado como ponto de partida para a aprendizagem coletiva. O clima é de comunidade.',
    ],
  },
  {
    id: 9,
    dimension: 'D4 — Clima e Gestão do Tempo',
    title: 'O professor gerenciou bem o tempo para atividades e dúvidas?',
    focus: 'Equilíbrio entre cumprir a sequência didática e garantir que os momentos de prática e dúvida não sejam atropelados.',
    levels: [
      'A aula perde tempo em transições longas, organização de sala ou episódios de comportamento. A atividade principal não chega a ser concluída, ou as dúvidas não são atendidas por falta de tempo.',
      'O tempo é parcialmente aproveitado, mas há desequilíbrio: ou a explicação inicial se estende demais e a prática fica para o final, ou a prática é interrompida antes que os alunos possam consolidar as aprendizagens.',
      'O professor divide o tempo de forma equilibrada entre explicação, prática e dúvidas. Os alunos têm tempo suficiente para trabalhar e tirar dúvidas. A aula encerra com uma síntese ou tarefa clara.',
      'O professor usa o tempo com precisão intencional: monitora o relógio sem perder o fio da aula, ajusta o tempo conforme necessário e garante que todos os momentos essenciais sejam contemplados.',
    ],
  },
] as const;
