import { Escola, Professor, AAP, Programacao, RegistroAcao, Presenca, Segmento, ComponenteCurricular } from '@/types';

export const escolas: Escola[] = [
  { id: '1', nome: 'E.M. Professor Paulo Freire', endereco: 'Rua das Flores, 123', telefone: '(11) 1234-5678', diretor: 'Dr. Carlos Mendes', createdAt: new Date('2024-01-15') },
  { id: '2', nome: 'E.M. Monteiro Lobato', endereco: 'Av. Brasil, 456', telefone: '(11) 2345-6789', diretor: 'Dra. Ana Paula', createdAt: new Date('2024-01-15') },
  { id: '3', nome: 'E.M. Cecília Meireles', endereco: 'Rua dos Estudantes, 789', telefone: '(11) 3456-7890', diretor: 'Prof. Roberto Silva', createdAt: new Date('2024-01-20') },
  { id: '4', nome: 'E.M. Castro Alves', endereco: 'Praça da Educação, 321', telefone: '(11) 4567-8901', diretor: 'Dra. Maria Santos', createdAt: new Date('2024-02-01') },
  { id: '5', nome: 'E.M. Machado de Assis', endereco: 'Rua Literária, 654', telefone: '(11) 5678-9012', diretor: 'Prof. José Lima', createdAt: new Date('2024-02-10') },
];

export const professores: Professor[] = [
  // Escola 1
  { id: '1', nome: 'Fernanda Lima', email: 'fernanda@escola.edu.br', escolaId: '1', segmento: 'anos_iniciais', componente: 'polivalente', anoSerie: '1º Ano', createdAt: new Date() },
  { id: '2', nome: 'Ricardo Santos', email: 'ricardo@escola.edu.br', escolaId: '1', segmento: 'anos_iniciais', componente: 'polivalente', anoSerie: '2º Ano', createdAt: new Date() },
  { id: '3', nome: 'Juliana Costa', email: 'juliana@escola.edu.br', escolaId: '1', segmento: 'anos_finais', componente: 'lingua_portuguesa', anoSerie: '6º Ano', createdAt: new Date() },
  { id: '4', nome: 'Marcos Oliveira', email: 'marcos@escola.edu.br', escolaId: '1', segmento: 'anos_finais', componente: 'matematica', anoSerie: '6º Ano', createdAt: new Date() },
  { id: '5', nome: 'Patricia Souza', email: 'patricia@escola.edu.br', escolaId: '1', segmento: 'ensino_medio', componente: 'lingua_portuguesa', anoSerie: '1ª Série', createdAt: new Date() },
  
  // Escola 2
  { id: '6', nome: 'Bruno Ferreira', email: 'bruno@escola.edu.br', escolaId: '2', segmento: 'anos_iniciais', componente: 'polivalente', anoSerie: '3º Ano', createdAt: new Date() },
  { id: '7', nome: 'Carla Mendes', email: 'carla@escola.edu.br', escolaId: '2', segmento: 'anos_iniciais', componente: 'polivalente', anoSerie: '4º Ano', createdAt: new Date() },
  { id: '8', nome: 'Diego Almeida', email: 'diego@escola.edu.br', escolaId: '2', segmento: 'anos_finais', componente: 'matematica', anoSerie: '7º Ano', createdAt: new Date() },
  { id: '9', nome: 'Elena Rocha', email: 'elena@escola.edu.br', escolaId: '2', segmento: 'ensino_medio', componente: 'matematica', anoSerie: '2ª Série', createdAt: new Date() },
  
  // Escola 3
  { id: '10', nome: 'Felipe Nunes', email: 'felipe@escola.edu.br', escolaId: '3', segmento: 'anos_iniciais', componente: 'polivalente', anoSerie: '5º Ano', createdAt: new Date() },
  { id: '11', nome: 'Gabriela Dias', email: 'gabriela@escola.edu.br', escolaId: '3', segmento: 'anos_finais', componente: 'lingua_portuguesa', anoSerie: '8º Ano', createdAt: new Date() },
  { id: '12', nome: 'Henrique Castro', email: 'henrique@escola.edu.br', escolaId: '3', segmento: 'anos_finais', componente: 'matematica', anoSerie: '9º Ano', createdAt: new Date() },
  
  // Escola 4
  { id: '13', nome: 'Isabela Moura', email: 'isabela@escola.edu.br', escolaId: '4', segmento: 'ensino_medio', componente: 'lingua_portuguesa', anoSerie: '3ª Série', createdAt: new Date() },
  { id: '14', nome: 'João Pedro', email: 'joaop@escola.edu.br', escolaId: '4', segmento: 'ensino_medio', componente: 'matematica', anoSerie: '3ª Série', createdAt: new Date() },
  
  // Escola 5
  { id: '15', nome: 'Karen Silva', email: 'karen@escola.edu.br', escolaId: '5', segmento: 'anos_iniciais', componente: 'polivalente', anoSerie: '1º Ano', createdAt: new Date() },
  { id: '16', nome: 'Lucas Martins', email: 'lucas@escola.edu.br', escolaId: '5', segmento: 'anos_finais', componente: 'lingua_portuguesa', anoSerie: '7º Ano', createdAt: new Date() },
];

export const aaps: AAP[] = [
  { id: '1', nome: 'Maria Silva', email: 'maria.aap@programa.edu.br', telefone: '(11) 91234-5678', tipo: 'anos_iniciais', escolasIds: ['1', '2', '5'], userId: '2', createdAt: new Date() },
  { id: '2', nome: 'João Santos', email: 'joao.aap@programa.edu.br', telefone: '(11) 92345-6789', tipo: 'lingua_portuguesa', escolasIds: ['1', '3', '4'], userId: '3', createdAt: new Date() },
  { id: '3', nome: 'Ana Costa', email: 'ana.aap@programa.edu.br', telefone: '(11) 93456-7890', tipo: 'matematica', escolasIds: ['1', '2', '3', '4'], userId: '4', createdAt: new Date() },
];

const today = new Date();
const getDate = (daysFromToday: number) => {
  const date = new Date(today);
  date.setDate(date.getDate() + daysFromToday);
  return date;
};

export const programacoes: Programacao[] = [
  // Formações
  { id: '1', tipo: 'formacao', titulo: 'Formação em Alfabetização', descricao: 'Metodologias ativas para alfabetização', data: getDate(-5), horarioInicio: '08:00', horarioFim: '12:00', escolaId: '1', aapId: '1', segmento: 'anos_iniciais', componente: 'polivalente', anoSerie: '1º Ano', status: 'realizada', createdAt: new Date() },
  { id: '2', tipo: 'formacao', titulo: 'Formação em Leitura', descricao: 'Práticas de leitura em sala', data: getDate(-3), horarioInicio: '14:00', horarioFim: '17:00', escolaId: '1', aapId: '2', segmento: 'anos_finais', componente: 'lingua_portuguesa', anoSerie: '6º Ano', status: 'realizada', createdAt: new Date() },
  { id: '3', tipo: 'formacao', titulo: 'Formação em Matemática Básica', descricao: 'Resolução de problemas', data: getDate(2), horarioInicio: '08:00', horarioFim: '12:00', escolaId: '2', aapId: '3', segmento: 'anos_finais', componente: 'matematica', anoSerie: '7º Ano', status: 'prevista', createdAt: new Date() },
  { id: '4', tipo: 'formacao', titulo: 'Formação BNCC', descricao: 'Alinhamento curricular', data: getDate(5), horarioInicio: '08:00', horarioFim: '12:00', escolaId: '3', aapId: '1', segmento: 'anos_iniciais', componente: 'polivalente', anoSerie: '3º Ano', status: 'prevista', createdAt: new Date() },
  { id: '5', tipo: 'formacao', titulo: 'Literatura Contemporânea', descricao: 'Novos autores brasileiros', data: getDate(7), horarioInicio: '14:00', horarioFim: '17:00', escolaId: '4', aapId: '2', segmento: 'ensino_medio', componente: 'lingua_portuguesa', anoSerie: '3ª Série', status: 'prevista', createdAt: new Date() },
  
  // Visitas
  { id: '6', tipo: 'visita', titulo: 'Visita Pedagógica', descricao: 'Acompanhamento de aulas', data: getDate(-7), horarioInicio: '08:00', horarioFim: '11:00', escolaId: '2', aapId: '1', segmento: 'anos_iniciais', componente: 'polivalente', anoSerie: '4º Ano', status: 'realizada', createdAt: new Date() },
  { id: '7', tipo: 'visita', titulo: 'Visita de Observação', descricao: 'Observação de práticas pedagógicas', data: getDate(-2), horarioInicio: '13:00', horarioFim: '16:00', escolaId: '3', aapId: '2', segmento: 'anos_finais', componente: 'lingua_portuguesa', anoSerie: '8º Ano', status: 'realizada', createdAt: new Date() },
  { id: '8', tipo: 'visita', titulo: 'Acompanhamento Mensal', descricao: 'Visita mensal de acompanhamento', data: getDate(1), horarioInicio: '08:00', horarioFim: '11:00', escolaId: '1', aapId: '3', segmento: 'anos_finais', componente: 'matematica', anoSerie: '6º Ano', status: 'prevista', createdAt: new Date() },
  { id: '9', tipo: 'visita', titulo: 'Visita Técnica', descricao: 'Avaliação de metodologias', data: getDate(3), horarioInicio: '14:00', horarioFim: '17:00', escolaId: '5', aapId: '1', segmento: 'anos_iniciais', componente: 'polivalente', anoSerie: '1º Ano', status: 'prevista', createdAt: new Date() },
  { id: '10', tipo: 'visita', titulo: 'Visita de Suporte', descricao: 'Suporte pedagógico aos professores', data: getDate(8), horarioInicio: '08:00', horarioFim: '12:00', escolaId: '4', aapId: '3', segmento: 'ensino_medio', componente: 'matematica', anoSerie: '3ª Série', status: 'prevista', createdAt: new Date() },
];

export const registrosAcao: RegistroAcao[] = [
  { id: '1', programacaoId: '1', aapId: '1', escolaId: '1', tipo: 'formacao', data: getDate(-5), segmento: 'anos_iniciais', componente: 'polivalente', anoSerie: '1º Ano', turma: 'A', observacoes: 'Professores muito participativos', avancos: 'Boa compreensão das metodologias apresentadas', createdAt: new Date() },
  { id: '2', programacaoId: '2', aapId: '2', escolaId: '1', tipo: 'formacao', data: getDate(-3), segmento: 'anos_finais', componente: 'lingua_portuguesa', anoSerie: '6º Ano', turma: 'B', observacoes: 'Necessidade de mais materiais de apoio', dificuldades: 'Tempo limitado para atividades práticas', createdAt: new Date() },
  { id: '3', programacaoId: '6', aapId: '1', escolaId: '2', tipo: 'visita', data: getDate(-7), segmento: 'anos_iniciais', componente: 'polivalente', anoSerie: '4º Ano', observacoes: 'Aulas bem planejadas', avancos: 'Professores aplicando metodologias da última formação', createdAt: new Date() },
  { id: '4', programacaoId: '7', aapId: '2', escolaId: '3', tipo: 'visita', data: getDate(-2), segmento: 'anos_finais', componente: 'lingua_portuguesa', anoSerie: '8º Ano', observacoes: 'Ambiente de aprendizagem positivo', dificuldades: 'Falta de recursos tecnológicos', createdAt: new Date() },
];

export const presencas: Presenca[] = [
  // Registro 1 (Formação)
  { id: '1', registroAcaoId: '1', professorId: '1', presente: true },
  { id: '2', registroAcaoId: '1', professorId: '2', presente: true },
  
  // Registro 2 (Formação)
  { id: '3', registroAcaoId: '2', professorId: '3', presente: true },
  { id: '4', registroAcaoId: '2', professorId: '4', presente: false },
  
  // Registro 3 (Visita)
  { id: '5', registroAcaoId: '3', professorId: '6', presente: true },
  { id: '6', registroAcaoId: '3', professorId: '7', presente: true },
  
  // Registro 4 (Visita)
  { id: '7', registroAcaoId: '4', professorId: '11', presente: true },
];

export const segmentoLabels: Record<Segmento, string> = {
  anos_iniciais: 'Anos Iniciais',
  anos_finais: 'Anos Finais',
  ensino_medio: 'Ensino Médio',
};

export const componenteLabels: Record<ComponenteCurricular, string> = {
  polivalente: 'Polivalente',
  lingua_portuguesa: 'Língua Portuguesa',
  matematica: 'Matemática',
};

export const anoSerieOptions = {
  anos_iniciais: ['1º Ano', '2º Ano', '3º Ano', '4º Ano', '5º Ano'],
  anos_finais: ['6º Ano', '7º Ano', '8º Ano', '9º Ano'],
  ensino_medio: ['1ª Série', '2ª Série', '3ª Série'],
};
