// Constantes compartilhadas entre o formulário e a impressão da
// "Visita Técnica — T@RL" (checklist TaRL/CAMaL).

export const ANO_SERIE_OPCOES = [
  '1º ano', '2º ano', '3º ano', '4º ano', '5º ano',
  '6º ano', '7º ano', '9º ano',
  '1ª série', '2ª série', '3ª série',
] as const;

export const TURMA_OPCOES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as const;

export const MODALIDADE_OPCOES = [
  { value: 'estudante_em_foco', label: 'Estudante em Foco' },
  { value: 'recrie', label: 'Recrie' },
] as const;

export const SIM_NAO_PARCIAL_OPCOES = [
  { value: 'sim', label: 'Sim' },
  { value: 'nao', label: 'Não' },
  { value: 'parcial', label: 'Parcial' },
] as const;

export const NIVEL_LP_OPCOES = [
  { value: 'iniciante',    label: 'Iniciante' },
  { value: 'letra',        label: 'Letra' },
  { value: 'palavra',      label: 'Palavra' },
  { value: 'paragrafo',    label: 'Parágrafo' },
  { value: 'historia',     label: 'História' },
  { value: 'compreensao',  label: 'Compreensão' },
] as const;

export const NIVEL_MAT_OPCOES = [
  { value: 'iniciante',   label: 'Iniciante' },
  { value: '1_digito',    label: '1 Dígito' },
  { value: '2_digitos',   label: '2 Dígitos' },
  { value: 'subtracao',   label: 'Subtração' },
  { value: 'divisao',     label: 'Divisão' },
] as const;

export const AVALIACAO_GERAL_OPCOES = [
  { value: 'incipiente',    label: 'Implementação ainda incipiente — necessita acompanhamento intensivo' },
  { value: 'em_andamento',  label: 'Implementação em andamento — avanços visíveis, desafios significativos' },
  { value: 'consolidada',   label: 'Implementação consolidada — boas práticas com pontos isolados de melhoria' },
  { value: 'avancada',      label: 'Implementação avançada — referência metodológica para a rede' },
] as const;

export const DIMENSOES_TARL = {
  D1: 'DIMENSÃO 1 — ORGANIZAÇÃO E GESTÃO DE DADOS',
  D2: 'DIMENSÃO 2 — IMPLEMENTAÇÃO CAMaL (AULAS DINÂMICAS)',
  D3: 'DIMENSÃO 3 — CLIMA DE AULA E ENGAJAMENTO',
  D4: 'DIMENSÃO 4 — PLANEJAMENTO E USO DE DADOS',
  D5: 'DIMENSÃO 5 — GESTÃO DA REDE',
};

export interface CriterioTarl {
  key: string;       // ex: 'd1_1'
  codigo: string;    // ex: 'D1.1'
  titulo: string;
  foco: string;
  dimensao: string;
  niveis: { nivel: string; texto: string }[];
}

const N = (insuf: string, dev: string, cons: string, avan: string) => ([
  { nivel: '1 — Insuficiente', texto: insuf },
  { nivel: '2 — Em desenvolvimento', texto: dev },
  { nivel: '3 — Consolidado', texto: cons },
  { nivel: '4 — Avançado', texto: avan },
]);

export const CRITERIOS_TARL: CriterioTarl[] = [
  {
    key: 'd1_1', codigo: 'D1.1', dimensao: DIMENSOES_TARL.D1,
    titulo: 'Agrupamento por Nível de Aprendizagem',
    foco: 'Os estudantes estão fisicamente organizados por nível de aprendizagem (Letra, Palavra, Parágrafo… / 1 Dígito, 2 Dígitos…) e não por série/ano.',
    niveis: N(
      'Estudantes sentados em arranjo tradicional por série, sem separação por nível.',
      'Há tentativa de agrupamento, mas grupos heterogêneos ou não alinhados às avaliações.',
      'Grupos organizados conforme níveis identificados na avaliação; ajustes finos ainda necessários.',
      'Agrupamentos totalmente alinhados às avaliações; estudantes cientes do próprio nível e com autonomia.',
    ),
  },
  {
    key: 'd1_2', codigo: 'D1.2', dimensao: DIMENSOES_TARL.D1,
    titulo: 'Visibilidade do Progresso dos Estudantes',
    foco: 'O agente educacional tem um mapa dos estudantes por níveis visível e atualizado na sala.',
    niveis: N(
      'Nenhum registro visual de progresso fixado ou acessível na sala.',
      'Registro existe, mas desatualizado (+ de 2 semanas) ou pouco legível/acessível.',
      'Painel atualizado, legível e fixado em local visível; agente o utiliza como referência.',
      'Painel atualizado; agente e estudantes o consultam ativamente durante a aula.',
    ),
  },
  {
    key: 'd1_3', codigo: 'D1.3', dimensao: DIMENSOES_TARL.D1,
    titulo: 'Organização e Acesso aos Materiais Metodológicos',
    foco: 'Materiais do Caderno de Atividades TaRL (cartões, fichas, jogos, materiais concretos) organizados e acessíveis às crianças.',
    niveis: N(
      'Materiais ausentes, desorganizados ou inacessíveis aos estudantes.',
      'Materiais presentes, mas mal organizados ou de acesso restrito.',
      'Materiais organizados e disponíveis; estudantes acessam com mediação do agente.',
      'Materiais organizados de forma autônoma; estudantes acessam e devolvem com independência.',
    ),
  },
  {
    key: 'd2_1', codigo: 'D2.1', dimensao: DIMENSOES_TARL.D2,
    titulo: 'Estrutura da Aula em Três Momentos',
    foco: 'A aula incluiu Grande Grupo, Pequenos Grupos (por nível) e Prática Individual.',
    niveis: N(
      'Apenas um momento (ex.: só grande grupo) ou estrutura totalmente diferente da proposta.',
      'Dois momentos presentes, mas transições desorganizadas ou tempos desequilibrados.',
      'Três momentos com clareza e transições razoavelmente conduzidas.',
      'Três momentos com fluidez; transições ágeis; estudantes autônomos nos grupos/individual.',
    ),
  },
  {
    key: 'd2_2', codigo: 'D2.2', dimensao: DIMENSOES_TARL.D2,
    titulo: 'Atividades Multissensoriais (Ouvir–Falar–Ler–Escrever)',
    foco: 'Agente utiliza abordagem multissensorial combinando oralidade, leitura, escrita, movimentos, jogos ou canções.',
    niveis: N(
      'Aula expositiva ou centrada apenas em cópia/escrita; nenhuma atividade oral, corporal ou lúdica.',
      'Esforço para incluir mais de uma modalidade, mas execução tímida ou limitada.',
      'Pelo menos 3 modalidades combinadas de forma intencional durante a aula.',
      'Combinação fluida e intencional de todas as modalidades; jogos/movimento integrados.',
    ),
  },
  {
    key: 'd2_3', codigo: 'D2.3', dimensao: DIMENSOES_TARL.D2,
    titulo: 'Instrução Customizada por Nível de Grupo',
    foco: 'Agente varia perguntas, dificuldade e materiais conforme o nível do subgrupo.',
    niveis: N(
      'Mesma atividade e exigência para todos; nenhuma diferenciação observada.',
      'Tentativa de diferenciar, mas variação superficial.',
      'Atividades e perguntas claramente ajustadas a cada grupo; agente seguro.',
      'Diferenciação precisa e intencional; agente antecipa dificuldades e adapta em tempo real.',
    ),
  },
  {
    key: 'd2_4', codigo: 'D2.4', dimensao: DIMENSOES_TARL.D2,
    titulo: 'Uso Adequado dos Materiais do Caderno de Atividades',
    foco: 'Agente utiliza materiais e fichas do Caderno TaRL em vez de depender de quadro/livros tradicionais.',
    niveis: N(
      'Aula conduzida exclusivamente com quadro/livro; materiais TaRL não utilizados.',
      'Materiais utilizados pontualmente ou descolados da sequência metodológica.',
      'Materiais utilizados alinhados à sequência proposta; agente domina o manuseio.',
      'Materiais utilizados com maestria; estudantes manuseiam autonomamente.',
    ),
  },
  {
    key: 'd3_1', codigo: 'D3.1', dimensao: DIMENSOES_TARL.D3,
    titulo: 'Ambiente Seguro para Errar',
    foco: 'Agente reage ao erro de forma positiva e construtiva, incentivando nova tentativa.',
    niveis: N(
      'Erros ignorados, repreendidos ou ridicularizados; estudantes inseguros.',
      'Evita reações negativas, mas não valoriza o erro como oportunidade; postura neutra.',
      'Erros acolhidos com encorajamento; agente usa o erro para retomar o raciocínio.',
      'Cultura explícita de aprendizagem pelo erro; estudantes se voluntariam sem certeza.',
    ),
  },
  {
    key: 'd3_2', codigo: 'D3.2', dimensao: DIMENSOES_TARL.D3,
    titulo: 'Participação Ativa dos Estudantes',
    foco: 'A maioria das crianças — especialmente as de nível mais baixo — engajada ativamente.',
    niveis: N(
      'Maioria passiva; participação restrita a poucos; nível mais baixo fora das atividades.',
      'Participação moderada; dispersão visível; estudantes de nível baixo pouco acionados.',
      'Maioria participa ativamente; estudantes de diferentes níveis são acionados.',
      'Praticamente toda a turma engajada; estudantes de nível mais baixo protagonizam.',
    ),
  },
  {
    key: 'd3_3', codigo: 'D3.3', dimensao: DIMENSOES_TARL.D3,
    titulo: 'Cooperação entre Pares e Protagonismo Estudantil',
    foco: 'Há colaboração entre estudantes (ajuda mútua, explicação entre pares) e evidências de protagonismo.',
    niveis: N(
      'Trabalho individual ou competitivo; nenhuma colaboração observada.',
      'Alguma interação entre pares sem intencionalidade pedagógica; protagonismo ausente.',
      'Estudantes ajudam colegas; iniciativas de explicar/demonstrar com mediação do agente.',
      'Estudantes conduzem partes da atividade e ensinam colegas com autonomia.',
    ),
  },
  {
    key: 'd4_2', codigo: 'D4.2', dimensao: DIMENSOES_TARL.D4,
    titulo: 'Uso Pedagógico dos Dados das Avaliações',
    foco: 'Decisões pedagógicas (agrupamentos, atividades, foco da mediação) ancoradas nos resultados das avaliações.',
    niveis: N(
      'Agente não relaciona níveis com avaliações; decisões sem respaldo nos dados.',
      'Agente conhece os dados, mas planejamento/agrupamentos pouco os refletem.',
      'Agrupamentos e atividades alinhados aos resultados; agente demonstra uso dos dados.',
      'Dados orientam todo o planejamento; agente antecipa dificuldades com base em evidências.',
    ),
  },
  {
    key: 'd4_3', codigo: 'D4.3', dimensao: DIMENSOES_TARL.D4,
    titulo: 'Registros de Acompanhamento da Aprendizagem',
    foco: 'Agente mantém registros atualizados do progresso (fichas, cadernetas, planilhas) para monitoramento contínuo.',
    niveis: N(
      'Nenhum registro de progresso individual; agente não descreve evolução de estudantes.',
      'Registros existem mas incompletos/desatualizados; não usados pedagogicamente.',
      'Registros atualizados e organizados; agente os consulta e relata evolução.',
      'Registros sistemáticos integrados ao planejamento; decisões pedagógicas evidenciadas.',
    ),
  },
  {
    key: 'd5_1', codigo: 'D5.1', dimensao: DIMENSOES_TARL.D5,
    titulo: 'Apoio e Engajamento da Gestão Escolar',
    foco: 'Direção/coordenação demonstram conhecimento do projeto, apoio ativo ao agente e abertura para acompanhamento.',
    niveis: N(
      'Gestão desconhece o projeto; pouco/nenhum suporte; resistência ao acompanhamento.',
      'Conhecimento superficial; apoio pontual; participação passiva.',
      'Gestão conhece, apoia e participa das devolutivas com abertura construtiva.',
      'Gestão parceira ativa: acompanha, usa dados e fortalece a cultura de acompanhamento.',
    ),
  },
  {
    key: 'd5_2', codigo: 'D5.2', dimensao: DIMENSOES_TARL.D5,
    titulo: 'Receptividade às Devolutivas Formativas',
    foco: 'Agente demonstra abertura para feedbacks, reflete sobre a prática e se compromete com ajustes.',
    niveis: N(
      'Agente rejeita/ignora feedbacks; postura defensiva; sem comprometimento.',
      'Ouve feedbacks, mas demonstra insegurança/resistência; adesão incerta.',
      'Acolhe feedbacks, reflete e se compromete com encaminhamentos específicos.',
      'Protagoniza a reflexão; identifica pontos de melhoria e planeja ações autônomas.',
    ),
  },
];
