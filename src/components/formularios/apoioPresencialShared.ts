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

const RUBRICA_TITULOS = [
  'O conteúdo é alinhado ao currículo e possui foco nos pré-requisitos para que os estudantes avancem',
  'O objetivo de aprendizagem estava claro e foi significado junto aos estudantes',
  'O domínio conceitual permite a realização de explicações contextualizadas, exemplificações e adaptações',
  'A utilização intencional dos recursos pedagógicos (plataformas, materiais impressos e digitais, propostas didáticas preparadas pelo professor) favorece a aprendizagem',
  'A organização da aula em tempos adequados permite que ela seja realizada com começo, meio e fim',
  'As estratégias de aprendizagem são ativas e adequadas ao objetivo da aula*',
  'A abordagem e as estratégias utilizadas alcançam os estudantes com lacunas de aprendizagem*',
  'A compreensão dos estudantes foi checada para apoiar a retomada ou o avanço dos conteúdos',
  'Circulação em sala e mediação problematizadora',
  'O engajamento dos estudantes para iniciar a aula garante apoio à realização das atividades previstas',
  'O gerenciamento do tempo garante desenvolvimento da sequência didática, resolução de dúvidas e sistematização de aprendizagens',
  'A maior parte dos alunos participa da aula',
  'O clima na sala de aula é de colaboração, respeito mútuo e favorável à aprendizagem',
  'As intervenções docentes quando os estudantes estão dispersos ou em casos de conflito e indisciplina são respeitosas',
];

export const RUBRICAS: RubricaDef[] = RUBRICA_TITULOS.map((titulo, i) => {
  const numero = i + 1;
  if (numero === 1) {
    return {
      key: 'rubrica_1',
      numero,
      titulo,
      resumo:
        'A aula aborda o que é essencial para o ano/ciclo, previsto no currículo, respeitando a progressão necessária para a recomposição.',
      niveis: [
        {
          value: 3,
          label: 'Muito efetivo',
          description:
            'Além do alinhamento curricular, o professor integrou diferentes habilidades e conteúdos, adaptando em tempo real para sanar lacunas de anos anteriores identificadas durante a aula.',
        },
        {
          value: 2,
          label: 'Efetivo',
          description:
            'O conteúdo estava alinhado às habilidades do currículo e o professor focou nos pré-requisitos necessários para que os alunos avancem.',
        },
        {
          value: 1,
          label: 'Pouco efetivo',
          description:
            'O conteúdo estava alinhado às habilidades do currículo, mas foi abordado de forma isolada, superficial ou sem foco nos pré-requisitos necessários para que os alunos avancem.',
        },
        {
          value: 0,
          label: 'Nada efetivo',
          description:
            'O conteúdo trabalhado não possui conexão clara com as habilidades do currículo e/ou estava desalinhado ao nível de desenvolvimento da turma.',
        },
      ],
    };
  }
  return {
    key: `rubrica_${numero}`,
    numero,
    titulo,
    resumo: TBD,
    niveis: tbdNiveis(),
  };
});

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
