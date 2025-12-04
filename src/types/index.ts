export type UserRole = 'admin' | 'aap_inicial' | 'aap_portugues' | 'aap_matematica';

export type Segmento = 'anos_iniciais' | 'anos_finais' | 'ensino_medio';

export type ComponenteCurricular = 'polivalente' | 'lingua_portuguesa' | 'matematica';

export type TipoAcao = 'visita' | 'formacao';

export type StatusAcao = 'prevista' | 'realizada' | 'cancelada';

export interface User {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface Escola {
  id: string;
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
  createdAt: Date;
}

export interface Presenca {
  id: string;
  registroAcaoId: string;
  professorId: string;
  presente: boolean;
}

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

export interface FilterOptions {
  segmento?: Segmento | 'todos';
  componente?: ComponenteCurricular | 'todos';
  anoSerie?: string | 'todos';
  escolaId?: string | 'todos';
  aapId?: string | 'todos';
  periodo?: {
    inicio: Date;
    fim: Date;
  };
}
