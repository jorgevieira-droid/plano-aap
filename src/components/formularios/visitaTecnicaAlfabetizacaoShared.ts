export const ANO_OPCOES = [
  '1º Ano', '2º Ano', '3º Ano', '4º Ano', '5º Ano',
  '6º Ano', '7º Ano', '8º Ano', '9º Ano',
  '1ª Série', '2ª Série', '3ª Série',
];

export const TURMA_OPCOES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export const SEGMENTO_OPCOES = [
  { value: 'anos_iniciais', label: 'Anos iniciais' },
  { value: 'anos_finais',   label: 'Anos finais' },
];

export const NIVEL_IAB_OPCOES = [
  { value: '1', label: '1 — Básico Inicial' },
  { value: '2', label: '2 — Básico Consolidado' },
  { value: '3', label: '3 — Intermediário' },
  { value: '4', label: '4 — Avançado Inicial' },
  { value: '5', label: '5 — Avançado' },
];

export const MATERIAL_DIDATICO_OPCOES = [
  { value: 'curriculo_em_acao_iab', label: 'Currículo em Ação (IAB)' },
  { value: 'elefante_letrado',      label: 'Elefante Letrado' },
  { value: 'matific',               label: 'Matific' },
  { value: 'parc',                  label: 'PARC' },
];

export interface CriterioAlfab {
  key: 'q1' | 'q2' | 'q3' | 'q4' | 'q5' | 'q6' | 'q7' | 'q8';
  numero: number;
  dimensao: string;
  titulo: string;
  foco: string;
  niveis: { nivel: string; texto: string }[];
  permiteNaoSeAplica?: boolean;
}

export const CRITERIOS_ALFABETIZACAO: CriterioAlfab[] = [
  {
    key: 'q1', numero: 1, dimensao: 'D1 — Objetivos e Regularidade',
    titulo: 'O professor demonstra clareza sobre os objetivos de aprendizagem da etapa?',
    foco: 'O professor precisa saber o que os estudantes devem alcançar na etapa de alfabetização e como cada atividade contribui para esse fim.',
    niveis: [
      { nivel: '1 — Insuficiente', texto: 'O professor não demonstra conhecimento dos objetivos de aprendizagem da etapa. Conduz a aula sem referência ao nível esperado de leitura e escrita.' },
      { nivel: '2 — Em Desenvolvimento', texto: 'Menciona os objetivos de forma vaga, sem precisar quais habilidades estão sendo desenvolvidas ou o nível esperado.' },
      { nivel: '3 — Consolidado', texto: 'Demonstra clareza sobre os objetivos, conecta as atividades ao desenvolvimento esperado e comunica isso aos estudantes.' },
      { nivel: '4 — Avançado', texto: 'Articula com precisão os objetivos, diferencia níveis de proficiência da turma e ajusta intencionalmente as atividades.' },
    ],
  },
  {
    key: 'q2', numero: 2, dimensao: 'D1 — Objetivos e Regularidade',
    titulo: 'O quórum de estudantes na turma foi igual ou superior a 85% no dia da visita?',
    foco: 'A frequência escolar é condição para a aprendizagem. Quórum consistente indica que a escola garante o direito de presença dos estudantes.',
    niveis: [
      { nivel: '1 — Insuficiente', texto: 'Menos de 85% dos estudantes estão presentes e não há registro ou preocupação com o quórum.' },
      { nivel: '2 — Em Desenvolvimento', texto: 'Quórum abaixo de 85%, mas há tentativa de acompanhamento das faltas ou estratégias pontuais.' },
      { nivel: '3 — Consolidado', texto: 'Quórum igual ou superior a 85%, com acompanhamento sistemático das faltas.' },
      { nivel: '4 — Avançado', texto: 'Quórum ≥ 85% de forma consistente, com evidências de monitoramento e intervenções ativas para garantir frequência.' },
    ],
  },
  {
    key: 'q3', numero: 3, dimensao: 'D2 — Apoio e Material',
    titulo: 'O professor auxiliar atua com função pedagógica estruturada?',
    foco: 'O auxiliar deve ter papel pedagógico claro, complementar ao titular, com foco no apoio aos estudantes.',
    niveis: [
      { nivel: '1 — Insuficiente', texto: 'O auxiliar não tem função pedagógica clara; atua apenas em tarefas administrativas ou disciplinares.' },
      { nivel: '2 — Em Desenvolvimento', texto: 'O auxiliar tem alguma função pedagógica, mas sem estrutura ou intencionalidade.' },
      { nivel: '3 — Consolidado', texto: 'Atua com função pedagógica estruturada: circula pela sala, apoia grupos ou estudantes com defasagem de forma intencional.' },
      { nivel: '4 — Avançado', texto: 'Co-conduz momentos da aula com autonomia pedagógica. Há planejamento compartilhado evidente, com papéis complementares.' },
    ],
  },
  {
    key: 'q4', numero: 4, dimensao: 'D2 — Apoio e Material',
    titulo: 'O professor utiliza efetivamente o material didático do programa (Currículo em Ação e IAB) durante a aula?',
    foco: 'O material didático do programa é o principal suporte estruturado para a alfabetização. Quando marcado "Não se aplica à rede", a pergunta é desconsiderada no cálculo da média.',
    permiteNaoSeAplica: true,
    niveis: [
      { nivel: '1 — Insuficiente', texto: 'O material didático do programa não é utilizado durante a aula.' },
      { nivel: '2 — Em Desenvolvimento', texto: 'O material está presente, mas é utilizado parcialmente ou sem seguir a sequência pedagógica.' },
      { nivel: '3 — Consolidado', texto: 'Utiliza efetivamente o material do programa, seguindo a sequência e articulando com os objetivos.' },
      { nivel: '4 — Avançado', texto: 'Utiliza com domínio e intencionalidade, adapta os recursos para diferentes níveis de proficiência.' },
    ],
  },
  {
    key: 'q5', numero: 5, dimensao: 'D3 — Agrupamentos e Plataformas',
    titulo: 'Há evidências de agrupamento produtivo ou organização por níveis de proficiência?',
    foco: 'Agrupar estudantes por níveis de proficiência permite intervenções pedagógicas mais focadas.',
    niveis: [
      { nivel: '1 — Insuficiente', texto: 'Não há agrupamento por nível; toda a turma realiza a mesma atividade da mesma forma.' },
      { nivel: '2 — Em Desenvolvimento', texto: 'Há agrupamento pontual, mas sem critério claro de proficiência.' },
      { nivel: '3 — Consolidado', texto: 'Agrupamentos organizados por nível de proficiência com atividades diferenciadas.' },
      { nivel: '4 — Avançado', texto: 'Agrupamentos dinâmicos com monitoramento e mobilidade entre grupos conforme avanço dos estudantes.' },
    ],
  },
  {
    key: 'q6', numero: 6, dimensao: 'D3 — Agrupamentos e Plataformas',
    titulo: 'A escola está utilizando regularmente as plataformas Elefante Letrado, Matific e PARC?',
    foco: 'As plataformas digitais complementam o trabalho pedagógico e devem ser integradas à rotina.',
    niveis: [
      { nivel: '1 — Insuficiente', texto: 'Plataformas não utilizadas ou sem evidência de uso regular.' },
      { nivel: '2 — Em Desenvolvimento', texto: 'Uso esporádico de alguma das plataformas, sem regularidade.' },
      { nivel: '3 — Consolidado', texto: 'Plataformas utilizadas regularmente, integradas ao programa de alfabetização.' },
      { nivel: '4 — Avançado', texto: 'Uso intencional e sistemático; dados das plataformas informam intervenções individualizadas.' },
    ],
  },
  {
    key: 'q7', numero: 7, dimensao: 'D4 — Formação e Sondagens',
    titulo: 'O professor participou de formação continuada alinhada aos resultados das sondagens?',
    foco: 'A formação continuada é mais eficaz quando conectada à realidade da turma e aos resultados das sondagens.',
    niveis: [
      { nivel: '1 — Insuficiente', texto: 'Não participou de formações recentes ou as formações não estão alinhadas às sondagens.' },
      { nivel: '2 — Em Desenvolvimento', texto: 'Participou de alguma formação, mas não diretamente conectada aos resultados das sondagens.' },
      { nivel: '3 — Consolidado', texto: 'Participou de formação alinhada aos resultados das sondagens, com evidências de aplicação na prática.' },
      { nivel: '4 — Avançado', texto: 'Formação contínua e articulada com sondagens; o professor referencia conteúdos formativos na aula.' },
    ],
  },
  {
    key: 'q8', numero: 8, dimensao: 'D4 — Formação e Sondagens',
    titulo: 'Há evidências de que os resultados das sondagens orientam intervenções pedagógicas?',
    foco: 'Os dados de sondagem devem informar diretamente o planejamento e as intervenções pedagógicas em sala.',
    niveis: [
      { nivel: '1 — Insuficiente', texto: 'Resultados das sondagens não orientam o planejamento ou as intervenções.' },
      { nivel: '2 — Em Desenvolvimento', texto: 'Há alguma referência aos resultados, mas sem clareza sobre como informam as intervenções.' },
      { nivel: '3 — Consolidado', texto: 'Resultados das sondagens orientam o planejamento e há evidências de intervenções pedagógicas correspondentes.' },
      { nivel: '4 — Avançado', texto: 'Uso sistemático dos resultados para diferenciar intervenções e monitorar a evolução dos estudantes.' },
    ],
  },
];
