// Types for the application
export type UserRole = 'admin' | 'gestor' | 'aap_inicial' | 'aap_portugues' | 'aap_matematica';

export type Segmento = 'anos_iniciais' | 'anos_finais' | 'ensino_medio' | 'nao_se_aplica' | 'todos';

export type ComponenteCurricular = 'polivalente' | 'lingua_portuguesa' | 'matematica' | 'nao_se_aplica';

export type TipoAcao = 'visita' | 'formacao' | 'acompanhamento_aula';

export type StatusAcao = 'prevista' | 'realizada' | 'cancelada';

export type CargoProfessor = 'professor' | 'coordenador' | 'vice_diretor' | 'diretor' | 'equipe_tecnica_sme' | 'pec';

export type NotaAvaliacao = 1 | 2 | 3 | 4 | 5;

export interface User {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface Escola {
  id: string;
  codesc: string;
  codInep: string;
  nome: string;
  endereco?: string;
  telefone?: string;
  diretor?: string;
  createdAt: Date;
}

export interface Professor {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  escolaId: string;
  segmento: Segmento;
  componente: ComponenteCurricular;
  anoSerie: string;
  cargo: CargoProfessor;
  createdAt: Date;
}

export interface AAP {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  tipo: 'anos_iniciais' | 'lingua_portuguesa' | 'matematica';
  escolasIds: string[];
  userId: string;
  createdAt: Date;
}

export interface Programacao {
  id: string;
  tipo: TipoAcao;
  titulo: string;
  descricao?: string;
  data: Date;
  horarioInicio: string;
  horarioFim: string;
  escolaId: string;
  aapId: string;
  segmento: Segmento;
  componente: ComponenteCurricular;
  anoSerie: string;
  status: StatusAcao;
  motivoCancelamento?: string;
  reagendadoPara?: Date;
  tags?: string[];
  createdAt: Date;
}

export interface RegistroAcao {
  id: string;
  programacaoId: string;
  aapId: string;
  escolaId: string;
  tipo: TipoAcao;
  data: Date;
  segmento: Segmento;
  componente: ComponenteCurricular;
  anoSerie: string;
  turma?: string;
  observacoes?: string;
  dificuldades?: string;
  avancos?: string;
  tags?: string[];
  createdAt: Date;
}

export interface Presenca {
  id: string;
  registroAcaoId: string;
  professorId: string;
  presente: boolean;
}

export interface AvaliacaoAula {
  id: string;
  registroAcaoId: string;
  professorId: string;
  clareza_objetivos: NotaAvaliacao;
  dominio_conteudo: NotaAvaliacao;
  estrategias_didaticas: NotaAvaliacao;
  engajamento_turma: NotaAvaliacao;
  gestao_tempo: NotaAvaliacao;
  observacoes?: string;
}

export const notaAvaliacaoLabels: Record<NotaAvaliacao, string> = {
  1: 'Muito insatisfatório',
  2: 'Insatisfatório',
  3: 'Adequado',
  4: 'Bom',
  5: 'Excelente',
};

export interface DashboardStats {
  totalEscolas: number;
  totalProfessores: number;
  totalAAPs: number;
  formacoesPrevisitas: number;
  formacoesRealizadas: number;
  visitasPrevistas: number;
  visitasRealizadas: number;
  percentualPresenca: number;
}

export type ProgramaType = 'escolas' | 'regionais' | 'redes_municipais';

export interface FilterOptions {
  segmento?: Segmento | 'todos';
  componente?: ComponenteCurricular | 'todos';
  anoSerie?: string | 'todos';
  escolaId?: string | 'todos';
  aapId?: string | 'todos';
  programa?: ProgramaType | 'todos';
  mes?: number | 'todos';
  periodo?: {
    inicio: Date;
    fim: Date;
  };
}
