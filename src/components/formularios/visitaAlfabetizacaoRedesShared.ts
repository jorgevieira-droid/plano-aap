// Constantes compartilhadas entre o formulário e a impressão da
// "Visita Técnica — Alfabetização (REDES)" (checklist IAB).

export const TURMA_OPCOES = ['1º ano', '2º ano'] as const;
export const NIVEL_IAB_OPCOES = [
  { value: '1', label: '1 — 1º ano' },
  { value: '2', label: '2 — 2º ano' },
];
export const SEGMENTO_OPCOES = ['1º ano', '2º ano'] as const;

export const MATERIAL_DIDATICO_OPCOES = [
  'Aprender a ler',
  'Livro Gigante',
  'Mini livros',
  'Manual de Consciência Fonológica',
  'Caderno de Revisão 1',
  'Matemática 1º ano',
  'Ciências',
];

export interface CriterioIAB {
  numero: number;
  pergunta: string;
  foco?: string;
  dimensao: string;
  niveis: { nivel: string; texto: string }[];
}

export const DIMENSOES = {
  D1: 'DIMENSÃO 1 — OBJETIVOS E REGULARIDADE',
  D2: 'DIMENSÃO 2 — USO DO MATERIAL E DIDÁTICA METODOLÓGICA',
  D3: 'DIMENSÃO 3 — PARTICIPAÇÃO E ENGAJAMENTO',
  D4: 'DIMENSÃO 4 — FORMAÇÃO CONTINUADA E USO DE DADOS DA AVALIAÇÃO',
};

export const CRITERIOS: CriterioIAB[] = [
  {
    numero: 1, dimensao: DIMENSOES.D1,
    pergunta: 'O professor demonstra clareza sobre os objetivos da aula/material utilizado?',
    foco: 'O professor precisa saber o que os estudantes devem alcançar naquela aula e como cada atividade contribui para esse fim.',
    niveis: [
      { nivel: '1 — Insuficiente', texto: 'O professor não demonstra conhecimento dos objetivos de aprendizagem da aula. Conduz a aula sem referência explícita ao nível esperado de desenvolvimento das habilidades de leitura e escrita.' },
      { nivel: '2 — Em Desenvolvimento', texto: 'O professor menciona os objetivos de forma vaga, sem precisar quais habilidades de leitura e escrita estão sendo desenvolvidas ou qual o nível esperado para aquela aula.' },
      { nivel: '3 — Consolidado', texto: 'O professor demonstra clareza sobre os objetivos de aprendizagem da aula, conecta as atividades ao desenvolvimento esperado das habilidades de leitura e escrita e comunica isso aos estudantes.' },
      { nivel: '4 — Avançado', texto: 'O professor articula com precisão os objetivos de aprendizagem da etapa, diferencia os níveis de proficiência da turma e ajusta intencionalmente as atividades para que cada grupo avance rumo às metas esperadas.' },
    ],
  },
  {
    numero: 2, dimensao: DIMENSOES.D1,
    pergunta: 'O quórum de estudantes na turma foi igual ou superior a 85% no dia da visita?',
    foco: 'A frequência escolar é condição para a aprendizagem. Uma turma com quórum consistente indica que a escola garante o direito de presença de seus estudantes.',
    niveis: [
      { nivel: '1 — Insuficiente', texto: 'Menos de 85% dos estudantes estão presentes e não há registro ou preocupação manifesta com o quórum por parte da escola.' },
      { nivel: '2 — Em Desenvolvimento', texto: 'O quórum está abaixo de 85%, mas há tentativa de acompanhamento das faltas ou estratégias pontuais de chamamento.' },
      { nivel: '3 — Consolidado', texto: 'O quórum de estudantes é igual ou superior a 85% no dia da visita, indicando regularidade na frequência da turma.' },
      { nivel: '4 — Avançado', texto: 'O quórum é igual ou superior a 85% de forma consistente, com evidências de que a escola monitora e intervém ativamente para garantir a frequência de todos os estudantes.' },
    ],
  },
  {
    numero: 3, dimensao: DIMENSOES.D2,
    pergunta: 'O professor utiliza efetivamente o material didático do programa (IAB) durante a aula?',
    foco: 'O material didático do programa é o principal suporte estruturado para a alfabetização. Seu uso efetivo garante coerência metodológica e progressão das aprendizagens.',
    niveis: [
      { nivel: '1 — Insuficiente', texto: 'O material didático do programa (IAB) não é utilizado durante a aula. O professor conduz a aula com materiais próprios ou improvisa sem referência ao programa / faz adaptações que fogem ao objetivo do programa e da metodologia.' },
      { nivel: '2 — Em Desenvolvimento', texto: 'O material didático está presente na sala, mas é utilizado parcialmente ou de forma não estruturada, sem seguir a sequência pedagógica proposta pelo programa.' },
      { nivel: '3 — Consolidado', texto: 'O professor utiliza efetivamente o material didático do programa durante a aula, seguindo a sequência proposta e articulando as atividades com os objetivos de aprendizagem.' },
      { nivel: '4 — Avançado', texto: 'O professor utiliza o material com domínio e intencionalidade, adapta os recursos do programa para diferentes níveis de proficiência e demonstra conhecimento aprofundado da sequência pedagógica do IAB / Currículo em Ação.' },
    ],
  },
  {
    numero: 4, dimensao: DIMENSOES.D2,
    pergunta: 'A aula observada está de acordo com o cronograma previamente organizado?',
    foco: 'O cronograma de aplicação das aulas garante a linearidade e aplicabilidade de todo o conteúdo de maneira similar em todo o território municipal.',
    niveis: [
      { nivel: '1 — Insuficiente', texto: 'A aula observada não está de acordo com o cronograma, ou seja, não segue a proposta sequencial ou está atrasada mais de 2 aulas.' },
      { nivel: '2 — Em Desenvolvimento', texto: 'A aula observada está de acordo com o cronograma e pode estar atrasada em até 2 aulas. Ou ainda, está adiantada ou no prazo, mas sendo aplicada de maneira inadequada.' },
      { nivel: '3 — Consolidado', texto: 'A aula observada está de acordo com o cronograma, segue a proposta sequencial e está no prazo.' },
      { nivel: '4 — Avançado', texto: 'A aula observada está à frente do planejado, garantindo a proposta sequencial e conteúdos adequadamente trabalhados.' },
    ],
  },
  {
    numero: 5, dimensao: DIMENSOES.D2,
    pergunta: 'O professor aplica a sequência de aulas e atividades da própria aula de maneira efetiva?',
    foco: 'É importante que o professor siga as sequências do material para garantir a efetividade proposta pela metodologia.',
    niveis: [
      { nivel: '1 — Insuficiente', texto: 'O professor trabalha e aplica as aulas e atividades de maneira aleatória.' },
      { nivel: '2 — Em Desenvolvimento', texto: 'O professor trabalha as aulas em sequência correta, porém durante a aula faz atividades aleatórias presentes no material, ou faz as questões em sequência incorreta.' },
      { nivel: '3 — Consolidado', texto: 'O professor trabalha a ordem correta de aulas e atividades.' },
      { nivel: '4 — Avançado', texto: 'O professor trabalha a ordem correta de aulas, faz atividades na sequência determinada e complementa o material com outras atividades de mesmo tema.' },
    ],
  },
  {
    numero: 6, dimensao: DIMENSOES.D2,
    pergunta: 'O professor faz relação com o aprendizado anteriormente aprendido no material?',
    foco: 'O aprendizado se constrói com repetições constantes e relações com novos aprendizados. Revisar os conteúdos é importante para a consolidação da informação.',
    niveis: [
      { nivel: '1 — Insuficiente', texto: 'O professor não relembra os conteúdos já aprendidos.' },
      { nivel: '2 — Em Desenvolvimento', texto: 'O professor relembra conteúdos de maneira superficial e rápida.' },
      { nivel: '3 — Consolidado', texto: 'O professor retoma os conteúdos aprendidos de maneira efetiva e faz relação com os novos conteúdos.' },
      { nivel: '4 — Avançado', texto: 'O professor retoma os conteúdos aprendidos de maneira efetiva, faz relação com os novos conteúdos e aplica-os ao cotidiano.' },
    ],
  },
  {
    numero: 7, dimensao: DIMENSOES.D2,
    pergunta: 'O professor segue a proposta de trabalho metodológico do programa (IAB) durante a aula?',
    foco: 'É importante a aplicação efetiva da metodologia — a proposta trabalha com os fonemas, e isso precisa ser explicitamente trabalhado.',
    niveis: [
      { nivel: '1 — Insuficiente', texto: 'O professor trabalha de outra forma com a turma (ex.: trabalha sílabas e não fonemas; ou somente texto e compreensão).' },
      { nivel: '2 — Em Desenvolvimento', texto: 'O professor trabalha com outras habilidades, mas inicia a aplicação metodológica do programa (ex.: trabalha sílaba como principal e depois explica fonema).' },
      { nivel: '3 — Consolidado', texto: 'O professor trabalha de maneira efetiva a metodologia.' },
      { nivel: '4 — Avançado', texto: 'O professor trabalha de maneira efetiva a metodologia e amplia com outras habilidades secundárias.' },
    ],
  },
  {
    numero: 8, dimensao: DIMENSOES.D3,
    pergunta: 'Os alunos fazem perguntas e participam da aula?',
    foco: 'As questões podem indicar participação e interesse no aprendizado.',
    niveis: [
      { nivel: '1 — Insuficiente', texto: 'A turma não participa ou mostra interesse com o conteúdo.' },
      { nivel: '2 — Em Desenvolvimento', texto: 'A turma faz poucas perguntas, mas ainda sem muito envolvimento.' },
      { nivel: '3 — Consolidado', texto: 'A turma questiona e se interessa pelo conteúdo.' },
      { nivel: '4 — Avançado', texto: 'A turma faz questões, interage e dá exemplos que ampliam o conhecimento.' },
    ],
  },
  {
    numero: 9, dimensao: DIMENSOES.D3,
    pergunta: 'O professor responde com feedback positivo/construtivo às questões?',
    foco: 'As questões e suas respostas podem ser uma forma efetiva para aprender. O feedback positivo seria uma estratégia em que o professor explica a questão e usa-a para dar novas respostas e explicações.',
    niveis: [
      { nivel: '1 — Insuficiente', texto: 'O professor não explica a questão ou muda a forma de explicar para favorecer o conhecimento; ou dá a resposta de maneira direta.' },
      { nivel: '2 — Em Desenvolvimento', texto: 'O professor explica a dúvida, mas sem mudar a forma anteriormente explicada.' },
      { nivel: '3 — Consolidado', texto: 'O professor explica a dúvida de maneira a ampliar o conhecimento, mudando e ajustando a explicação e fazendo perguntas.' },
      { nivel: '4 — Avançado', texto: 'O professor explica a dúvida de maneira a ampliar o conhecimento, ajustando a explicação. Além disso, faz relação com outros aprendizados cotidianos e anteriores.' },
    ],
  },
  {
    numero: 10, dimensao: DIMENSOES.D3,
    pergunta: 'O professor utiliza instrução explícita?',
    foco: 'O uso de instrução explícita envolve estratégias como "Eu faço, nós fazemos, você faz". Assim, o professor modela a aprendizagem.',
    niveis: [
      { nivel: '1 — Insuficiente', texto: 'O professor apresenta-se como palestrante: explica e faz sozinho ou deixa que os estudantes façam as tarefas sozinhos.' },
      { nivel: '2 — Em Desenvolvimento', texto: 'O professor apresenta-se como palestrante, mas acompanha a execução da tarefa, sem servir de modelo ainda.' },
      { nivel: '3 — Consolidado', texto: 'O professor modela o aprendizado e acompanha a execução.' },
      { nivel: '4 — Avançado', texto: 'O professor modela o aprendizado, acompanha a execução e apresenta novas tarefas para ampliar conhecimentos.' },
    ],
  },
  {
    numero: 11, dimensao: DIMENSOES.D4,
    pergunta: 'O professor participou da formação IAB?',
    foco: 'A formação continuada é mais eficaz quando conectada à realidade da turma.',
    niveis: [
      { nivel: '1 — Insuficiente', texto: 'O professor não participou de formações continuadas recentes.' },
      { nivel: '2 — Em Desenvolvimento', texto: 'O professor participou de alguma formação, mas não de todo o percurso formativo.' },
      { nivel: '3 — Consolidado', texto: 'O professor participou da formação continuada em sua totalidade.' },
      { nivel: '4 — Avançado', texto: 'O professor participou de formações continuadas e ampliou com outros estudos além da formação.' },
    ],
  },
  {
    numero: 12, dimensao: DIMENSOES.D4,
    pergunta: 'Há evidências de que os resultados das avaliações orientam intervenções pedagógicas?',
    foco: 'As sondagens são o principal instrumento diagnóstico do programa. Quando seus resultados informam as práticas pedagógicas, a escola avança de uma lógica de ensino uniforme para uma lógica orientada por dados.',
    niveis: [
      { nivel: '1 — Insuficiente', texto: 'Não há evidências de que os resultados das sondagens orientem as práticas pedagógicas. As aulas seguem rotina fixa independentemente dos dados de proficiência.' },
      { nivel: '2 — Em Desenvolvimento', texto: 'O professor conhece os resultados das sondagens, mas as intervenções pedagógicas não estão sistematicamente alinhadas a eles. Há tentativas pontuais de diferenciação sem consistência.' },
      { nivel: '3 — Consolidado', texto: 'Há evidências claras de que os resultados das sondagens orientam as intervenções pedagógicas: atividades, agrupamentos e estratégias são ajustados com base nos dados de proficiência.' },
      { nivel: '4 — Avançado', texto: 'Os resultados das sondagens são utilizados de forma sistemática e prospectiva: o professor antecipa dificuldades, planeja intervenções específicas por nível e monitora a evolução de cada estudante com base em dados.' },
    ],
  },
];
