import { useState, useEffect } from 'react';
import { 
  School, 
  Users, 
  UserCheck, 
  Calendar,
  Filter,
  Loader2,
  ClipboardCheck,
  AlertTriangle,
  Eye
} from 'lucide-react';
import { useInstrumentChartData } from '@/hooks/useInstrumentChartData';
import { InstrumentDimensionCharts } from '@/components/charts/InstrumentDimensionCharts';
import { StatCard } from '@/components/ui/StatCard';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';

type ProgramaType = Database['public']['Enums']['programa_type'];

const programaLabels: Record<ProgramaType, string> = {
  escolas: 'Programa de Escolas',
  regionais: 'Programa de Regionais de Ensino',
  redes_municipais: 'Programa de Redes Municipais'
};

interface AvaliacaoAula {
  clareza_objetivos: number;
  dominio_conteudo: number;
  estrategias_didaticas: number;
  engajamento_turma: number;
  gestao_tempo: number;
}

interface AAPWithPrograma {
  user_id: string;
  programas: ProgramaType[];
  nome: string;
}

interface AvaliacaoWithEscola extends AvaliacaoAula {
  escola_id: string;
}

interface RegistroPendente {
  id: string;
  data: string;
  tipo: string;
  escola_id: string;
  programa: string[] | null;
  status: string;
  dias_atraso: number;
}

interface ProgramacaoDB {
  id: string;
  tipo: string;
  status: string;
  data: string;
  escola_id: string;
  aap_id: string;
  segmento: string;
  componente: string;
  programa: string[] | null;
}

interface PresencaDB {
  id: string;
  registro_acao_id: string;
  professor_id: string;
  presente: boolean;
}

interface RegistroAcaoDB {
  id: string;
  tipo: string;
  data: string;
  escola_id: string;
  aap_id: string;
  segmento: string;
  componente: string;
  programa: string[] | null;
}

interface Profile {
  id: string;
  nome: string;
}

export default function AdminDashboard() {
  const { profile, isAdmin, isGestor, isAAP, isManager } = useAuth();
  const [programaFilter, setProgramaFilter] = useState<ProgramaType | 'todos'>('todos');
  const { chartData: instrumentChartData, isLoading: isInstrumentChartsLoading } = useInstrumentChartData({
    escolaFilter: 'todos',
  });
  const [escolaFilter, setEscolaFilter] = useState<string>('todos');
  const [componenteFilter, setComponenteFilter] = useState<string>('todos');
  const [escolas, setEscolas] = useState<any[]>([]);
  const [professores, setProfessores] = useState<any[]>([]);
  const [aaps, setAaps] = useState<AAPWithPrograma[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoWithEscola[]>([]);
  const [registrosPendentes, setRegistrosPendentes] = useState<RegistroPendente[]>([]);
  const [programacoes, setProgramacoes] = useState<ProgramacaoDB[]>([]);
  const [presencas, setPresencas] = useState<PresencaDB[]>([]);
  const [registros, setRegistros] = useState<RegistroAcaoDB[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  
  // User-specific filters
  const [userProgramas, setUserProgramas] = useState<ProgramaType[]>([]);
  const [userEscolaIds, setUserEscolaIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      // Fetch user-specific data for filtering
      let userPrograms: ProgramaType[] = [];
      let userSchoolIds: string[] = [];
      
      if (profile?.id) {
        if (isManager && !isAdmin) {
          // Fetch N2/N3 programs from user_programas
          const { data: managerProgramas } = await supabase
            .from('user_programas')
            .select('programa')
            .eq('user_id', profile.id);
          userPrograms = (managerProgramas || []).map(p => p.programa as ProgramaType);
          
          // Fallback: also check gestor_programas for legacy N2
          if (userPrograms.length === 0 && isGestor) {
            const { data: gestorProgramas } = await supabase
              .from('gestor_programas')
              .select('programa')
              .eq('gestor_user_id', profile.id);
            userPrograms = (gestorProgramas || []).map(p => p.programa as ProgramaType);
          }
        } else if (isAAP) {
          // Fetch AAP's schools
          const { data: aapEscolas } = await supabase
            .from('aap_escolas')
            .select('escola_id')
            .eq('aap_user_id', profile.id);
          userSchoolIds = (aapEscolas || []).map(e => e.escola_id);
          
          // Fetch AAP's programs
          const { data: aapProgramas } = await supabase
            .from('aap_programas')
            .select('programa')
            .eq('aap_user_id', profile.id);
          userPrograms = (aapProgramas || []).map(p => p.programa as ProgramaType);
        }
      }
      
      setUserProgramas(userPrograms);
      setUserEscolaIds(userSchoolIds);
      
      // Fetch all data in parallel
      const [
        escolasRes,
        professoresRes,
        rolesRes,
        aapProgramasRes,
        userProgramasRes,
        avaliacoesRes,
        programacoesRes,
        presencasRes,
        registrosRes,
        profilesRes
      ] = await Promise.all([
        supabase.from('escolas').select('*').eq('ativa', true).order('nome'),
        supabase.from('professores').select('*').eq('ativo', true).order('nome'),
        supabase.from('user_roles').select('user_id, role').in('role', [
          'gestor', 'n3_coordenador_programa', 'n4_1_cped', 'n4_2_gpi', 'n5_formador',
          'aap_inicial', 'aap_portugues', 'aap_matematica'
        ]),
        supabase.from('aap_programas').select('aap_user_id, programa'),
        supabase.from('user_programas').select('user_id, programa'),
        supabase.from('avaliacoes_aula').select('clareza_objetivos, dominio_conteudo, estrategias_didaticas, engajamento_turma, gestao_tempo, escola_id'),
        supabase.from('programacoes').select('id, tipo, status, data, escola_id, aap_id, segmento, componente, programa'),
        supabase.from('presencas').select('id, registro_acao_id, professor_id, presente'),
        supabase.from('registros_acao').select('id, tipo, data, escola_id, aap_id, segmento, componente, programa'),
        supabase.from('profiles_directory').select('id, nome').order('nome')
      ]);
      
      // Fetch registros pendentes (agendados há mais de 2 dias e não realizados)
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0];
      
      const { data: registrosPendentesData } = await supabase
        .from('registros_acao')
        .select('id, data, tipo, escola_id, programa, status')
        .in('status', ['agendada', 'reagendada'])
        .lte('data', twoDaysAgoStr);
      
      // Calculate days overdue for each pending registro
      const pendentesComAtraso: RegistroPendente[] = (registrosPendentesData || []).map(reg => {
        const dataAgendada = new Date(reg.data);
        const diffTime = today.getTime() - dataAgendada.getTime();
        const diasAtraso = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        return { ...reg, dias_atraso: diasAtraso };
      });
      
      // Map Atores with their programs and names (legacy aap_programas + user_programas)
      const profilesData = profilesRes.data || [];
      const aapsWithProgramas: AAPWithPrograma[] = (rolesRes.data || []).map(role => {
        // Programas legados (aap_programas)
        const legacyProgramas = (aapProgramasRes.data || [])
          .filter(p => p.aap_user_id === role.user_id)
          .map(p => p.programa as ProgramaType);
        // Programas novos (user_programas)
        const newProgramas = (userProgramasRes.data || [])
          .filter(p => p.user_id === role.user_id)
          .map(p => p.programa as ProgramaType);
        // Combinar sem duplicatas
        const programas = [...new Set([...legacyProgramas, ...newProgramas])];
        const profileItem = profilesData.find(p => p.id === role.user_id);
        return { user_id: role.user_id, programas, nome: profileItem?.nome || 'Ator' };
      });
      
      // Apply role-based filtering
      let filteredEscolasData = escolasRes.data || [];
      let filteredProfessoresData = professoresRes.data || [];
      let filteredAvaliacoesData = avaliacoesRes.data || [];
      let filteredProgramacoesData = programacoesRes.data || [];
      let filteredRegistrosData = registrosRes.data || [];
      let filteredPendentesData = pendentesComAtraso;
      let filteredAapsData = aapsWithProgramas;
      
      if ((isManager && !isAdmin) && userPrograms.length > 0) {
        // Filter by gestor's programs
        filteredEscolasData = filteredEscolasData.filter(e => 
          e.programa?.some((p: string) => userPrograms.includes(p as ProgramaType))
        );
        filteredProfessoresData = filteredProfessoresData.filter(p => 
          p.programa?.some((prog: string) => userPrograms.includes(prog as ProgramaType))
        );
        filteredAvaliacoesData = filteredAvaliacoesData.filter(a => {
          const escola = filteredEscolasData.find(e => e.id === a.escola_id);
          return !!escola;
        });
        filteredProgramacoesData = filteredProgramacoesData.filter(p => 
          p.programa?.some(prog => userPrograms.includes(prog as ProgramaType))
        );
        filteredRegistrosData = filteredRegistrosData.filter(r => 
          r.programa?.some(prog => userPrograms.includes(prog as ProgramaType))
        );
        filteredPendentesData = filteredPendentesData.filter(r => 
          r.programa?.some(prog => userPrograms.includes(prog as ProgramaType))
        );
        filteredAapsData = filteredAapsData.filter(aap => 
          aap.programas.some(prog => userPrograms.includes(prog))
        );
      } else if (isAAP && userSchoolIds.length > 0) {
        // Filter by AAP's schools
        filteredEscolasData = filteredEscolasData.filter(e => userSchoolIds.includes(e.id));
        filteredProfessoresData = filteredProfessoresData.filter(p => userSchoolIds.includes(p.escola_id));
        filteredAvaliacoesData = filteredAvaliacoesData.filter(a => userSchoolIds.includes(a.escola_id));
        filteredProgramacoesData = filteredProgramacoesData.filter(p => 
          userSchoolIds.includes(p.escola_id) || p.aap_id === profile?.id
        );
        filteredRegistrosData = filteredRegistrosData.filter(r => 
          userSchoolIds.includes(r.escola_id) || r.aap_id === profile?.id
        );
        filteredPendentesData = filteredPendentesData.filter(r => userSchoolIds.includes(r.escola_id));
        // AAP sees only themselves
        filteredAapsData = filteredAapsData.filter(aap => aap.user_id === profile?.id);
      }
      
      setEscolas(filteredEscolasData);
      setProfessores(filteredProfessoresData);
      setAaps(filteredAapsData);
      setAvaliacoes(filteredAvaliacoesData);
      setRegistrosPendentes(filteredPendentesData);
      setProgramacoes(filteredProgramacoesData);
      setPresencas(presencasRes.data || []);
      setRegistros(filteredRegistrosData);
      setProfiles(profilesData);
      setLoading(false);
    };

    fetchData();
  }, [profile?.id, isAdmin, isGestor, isAAP, isManager]);

  // Auto-select program when user has only one
  useEffect(() => {
    if (!isAdmin && userProgramas.length === 1) {
      setProgramaFilter(userProgramas[0]);
    }
  }, [userProgramas, isAdmin]);

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Filter data based on selected program and escola
  let filteredEscolas = programaFilter === 'todos' 
    ? escolas 
    : escolas.filter(e => e.programa?.includes(programaFilter));
  
  // Apply escola filter
  if (escolaFilter !== 'todos') {
    filteredEscolas = filteredEscolas.filter(e => e.id === escolaFilter);
  }
  
  const filteredProfessores = programaFilter === 'todos'
    ? (escolaFilter === 'todos' 
        ? (componenteFilter === 'todos' ? professores : professores.filter(p => p.componente === componenteFilter))
        : professores.filter(p => {
            const matchEscola = p.escola_id === escolaFilter;
            const matchComponente = componenteFilter === 'todos' || p.componente === componenteFilter;
            return matchEscola && matchComponente;
          }))
    : professores.filter(p => {
        const matchPrograma = p.programa?.includes(programaFilter);
        const matchEscola = escolaFilter === 'todos' || p.escola_id === escolaFilter;
        const matchComponente = componenteFilter === 'todos' || p.componente === componenteFilter;
        return matchPrograma && matchEscola && matchComponente;
      });

  // Filter AAPs based on selected program
  const filteredAAPs = programaFilter === 'todos'
    ? aaps
    : aaps.filter(aap => aap.programas.includes(programaFilter));

  // Get escola IDs for the filtered program to filter avaliacoes
  const filteredEscolaIds = filteredEscolas.map(e => e.id);
  
  // Filter avaliacoes based on escola program, escola filter and componente
  const filteredAvaliacoes = avaliacoes.filter(av => {
    const matchPrograma = programaFilter === 'todos' || filteredEscolaIds.includes(av.escola_id);
    const matchEscola = escolaFilter === 'todos' || av.escola_id === escolaFilter;
    return matchPrograma && matchEscola;
  });

  // Filter registros pendentes based on selected program and escola
  const filteredRegistrosPendentes = registrosPendentes.filter(r => {
    const matchPrograma = programaFilter === 'todos' || (r.programa && r.programa.includes(programaFilter));
    const matchEscola = escolaFilter === 'todos' || r.escola_id === escolaFilter;
    return matchPrograma && matchEscola;
  });

  // Filter programacoes based on program, escola, componente and data <= today
  const filteredProgramacoes = programacoes.filter(p => {
    if (p.data > todayStr) return false;
    if (programaFilter !== 'todos' && (!p.programa || !p.programa.includes(programaFilter))) return false;
    if (escolaFilter !== 'todos' && p.escola_id !== escolaFilter) return false;
    if (componenteFilter !== 'todos' && p.componente !== componenteFilter) return false;
    return true;
  });

  // Filter registros based on program, escola and componente
  const filteredRegistros = registros.filter(r => {
    if (programaFilter !== 'todos' && (!r.programa || !r.programa.includes(programaFilter))) return false;
    if (escolaFilter !== 'todos' && r.escola_id !== escolaFilter) return false;
    if (componenteFilter !== 'todos' && r.componente !== componenteFilter) return false;
    return true;
  });

  // Calculate stats from real data
  const totalEscolas = filteredEscolas.length;
  const totalProfessores = filteredProfessores.length;
  const totalAAPs = filteredAAPs.length;
  const totalAvaliacoes = filteredAvaliacoes.length;
  const totalPendentes = filteredRegistrosPendentes.length;
  const totalCoordenadores = filteredProfessores.filter(p => p.cargo === 'coordenador').length;

  // ===== MÓDULO 2: Ações Previstas x Realizadas =====
  
  // By AAP
  const acoesPorAAP = filteredAAPs.map(aap => {
    const previstas = filteredProgramacoes.filter(p => p.aap_id === aap.user_id).length;
    const realizadas = filteredProgramacoes.filter(p => p.aap_id === aap.user_id && p.status === 'realizada').length;
    return {
      name: aap.nome.split(' ')[0],
      Previstas: previstas,
      Realizadas: realizadas
    };
  }).filter(a => a.Previstas > 0 || a.Realizadas > 0);

  // By Type
  const acoesPorTipo = [
    {
      name: 'Formação',
      Previstas: filteredProgramacoes.filter(p => p.tipo === 'formacao').length,
      Realizadas: filteredProgramacoes.filter(p => p.tipo === 'formacao' && p.status === 'realizada').length
    },
    {
      name: 'Visita',
      Previstas: filteredProgramacoes.filter(p => p.tipo === 'visita').length,
      Realizadas: filteredProgramacoes.filter(p => p.tipo === 'visita' && p.status === 'realizada').length
    },
    {
      name: 'Acompanhamento',
      Previstas: filteredProgramacoes.filter(p => p.tipo === 'acompanhamento_aula').length,
      Realizadas: filteredProgramacoes.filter(p => p.tipo === 'acompanhamento_aula' && p.status === 'realizada').length
    }
  ];

  // ===== MÓDULO 3: Professores e Presença por Componente e Ciclo =====
  
  const segmentoLabels: Record<string, string> = {
    anos_iniciais: 'Anos Iniciais',
    anos_finais: 'Anos Finais',
    ensino_medio: 'Ensino Médio'
  };

  const componenteLabels: Record<string, string> = {
    polivalente: 'Polivalente',
    lingua_portuguesa: 'Português',
    matematica: 'Matemática'
  };

  // Professores por Componente e Ciclo
  const professoresPorComponenteCiclo = ['polivalente', 'lingua_portuguesa', 'matematica'].flatMap(comp => 
    ['anos_iniciais', 'anos_finais', 'ensino_medio'].map(seg => ({
      name: `${componenteLabels[comp]} - ${segmentoLabels[seg]}`,
      componente: comp,
      segmento: seg,
      quantidade: filteredProfessores.filter(p => p.componente === comp && p.segmento === seg).length
    }))
  ).filter(item => item.quantidade > 0);

  // Presença por Componente e Ciclo
  const registroIds = filteredRegistros.map(r => r.id);
  const filteredPresencas = presencas.filter(p => registroIds.includes(p.registro_acao_id));

  const presencaPorComponenteCiclo = ['polivalente', 'lingua_portuguesa', 'matematica'].flatMap(comp => 
    ['anos_iniciais', 'anos_finais', 'ensino_medio'].map(seg => {
      const registrosDoGrupo = filteredRegistros.filter(r => r.componente === comp && r.segmento === seg);
      const registroIdsDoGrupo = registrosDoGrupo.map(r => r.id);
      const presencasDoGrupo = filteredPresencas.filter(p => registroIdsDoGrupo.includes(p.registro_acao_id));
      const presentes = presencasDoGrupo.filter(p => p.presente).length;
      const total = presencasDoGrupo.length;
      
      return {
        name: `${componenteLabels[comp]} - ${segmentoLabels[seg]}`,
        componente: comp,
        segmento: seg,
        percentual: total > 0 ? Math.round((presentes / total) * 100) : 0
      };
    })
  ).filter(item => item.percentual > 0);

  // ===== MÓDULO 4: Acompanhamento de Aula =====
  
  const calcularMediaDimensao = (dimensao: keyof AvaliacaoAula) => {
    if (filteredAvaliacoes.length === 0) return 0;
    const soma = filteredAvaliacoes.reduce((acc, av) => acc + av[dimensao], 0);
    return Number((soma / filteredAvaliacoes.length).toFixed(2));
  };

  const radarData = [
    { subject: 'Intencionalidade', value: calcularMediaDimensao('clareza_objetivos'), fullMark: 5 },
    { subject: 'Estratégias', value: calcularMediaDimensao('dominio_conteudo'), fullMark: 5 },
    { subject: 'Mediação', value: calcularMediaDimensao('estrategias_didaticas'), fullMark: 5 },
    { subject: 'Engajamento', value: calcularMediaDimensao('engajamento_turma'), fullMark: 5 },
    { subject: 'Avaliação', value: calcularMediaDimensao('gestao_tempo'), fullMark: 5 },
  ];

  const satisfacaoData = [
    { name: 'Intencionalidade pedagógica', media: calcularMediaDimensao('clareza_objetivos') },
    { name: 'Estratégias didáticas', media: calcularMediaDimensao('dominio_conteudo') },
    { name: 'Mediação docente', media: calcularMediaDimensao('estrategias_didaticas') },
    { name: 'Engajamento dos estudantes', media: calcularMediaDimensao('engajamento_turma') },
    { name: 'Avaliação durante a aula', media: calcularMediaDimensao('gestao_tempo') },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-header">Dashboard</h1>
          <p className="page-subtitle">
            {programaFilter === 'todos' 
              ? 'Visão geral de todos os programas' 
              : `Visão do ${programaLabels[programaFilter]}`}
          </p>
        </div>
        <div className="flex flex-col gap-2" data-tour="filters">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Filtros</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={programaFilter} onValueChange={(value) => setProgramaFilter(value as ProgramaType | 'todos')}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Programa" />
              </SelectTrigger>
              <SelectContent>
                {(isAdmin || userProgramas.length === 0) ? (
                  <>
                    <SelectItem value="todos">Programa</SelectItem>
                    <SelectItem value="escolas">Programa de Escolas</SelectItem>
                    <SelectItem value="regionais">Programa de Regionais de Ensino</SelectItem>
                    <SelectItem value="redes_municipais">Programa de Redes Municipais</SelectItem>
                  </>
                ) : userProgramas.length === 1 ? (
                  <SelectItem value={userProgramas[0]}>{programaLabels[userProgramas[0]]}</SelectItem>
                ) : (
                  <>
                    <SelectItem value="todos">Todos os Programas</SelectItem>
                    {userProgramas.map(prog => (
                      <SelectItem key={prog} value={prog}>{programaLabels[prog]}</SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
            <Select value={escolaFilter} onValueChange={setEscolaFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Escola" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Escola</SelectItem>
                {escolas.map((escola) => (
                  <SelectItem key={escola.id} value={escola.id}>{escola.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={componenteFilter} onValueChange={setComponenteFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Componente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Componente</SelectItem>
                <SelectItem value="polivalente">Polivalente</SelectItem>
                <SelectItem value="lingua_portuguesa">Português</SelectItem>
                <SelectItem value="matematica">Matemática</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* MÓDULO 1: Stats Grid with Clickable Cards */}
      <div className={`grid grid-cols-2 md:grid-cols-3 gap-4 ${isAAP ? 'lg:grid-cols-5' : 'lg:grid-cols-6'}`}>
        <div data-tour="stat-escolas">
          <StatCard
            title="Escola / Regional / Rede"
            value={totalEscolas}
            icon={<School size={24} />}
            variant="primary"
            href="/escolas"
          />
        </div>
        <div data-tour="stat-professores">
          <StatCard
            title="Professores"
            value={totalProfessores}
            icon={<Users size={24} />}
            href="/professores"
          />
        </div>
        {!isAAP && (
          <div data-tour="stat-aaps">
            <StatCard
              title="Consultores / Gestores / Formadores"
              value={totalAAPs}
              icon={<UserCheck size={24} />}
              href="/aaps"
            />
          </div>
        )}
        <div data-tour="stat-programacoes">
          <StatCard
            title="Coordenadores"
            value={totalCoordenadores}
            icon={<Calendar size={24} />}
            variant="accent"
            href="/professores"
          />
        </div>
        <div data-tour="stat-registros">
          <StatCard
            title="Avaliações de Aula"
            value={totalAvaliacoes}
            icon={<ClipboardCheck size={24} />}
            variant="primary"
            href="/registros"
          />
        </div>
        <div data-tour="stat-pendentes">
          <StatCard
            title="Ações Pendentes"
            value={totalPendentes}
            icon={<AlertTriangle size={24} />}
            variant={totalPendentes > 0 ? "destructive" : "default"}
            href="/registros?status=pendentes"
          />
        </div>
      </div>

      {/* Pending Actions Alert */}
      {totalPendentes > 0 && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-6" data-tour="pending-alerts">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-destructive/20 rounded-lg">
              <AlertTriangle className="text-destructive" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-destructive mb-2">
                {totalPendentes} {totalPendentes === 1 ? 'ação pendente' : 'ações pendentes'} há mais de 2 dias
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                As seguintes ações estão agendadas há mais de 2 dias e ainda não foram atualizadas:
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {filteredRegistrosPendentes.slice(0, 10).map((reg) => {
                  const escola = escolas.find(e => e.id === reg.escola_id);
                  return (
                    <div 
                      key={reg.id} 
                      className="flex items-center justify-between bg-background/50 rounded-lg p-3 text-sm"
                    >
                      <div>
                        <span className="font-medium">{reg.tipo}</span>
                        <span className="text-muted-foreground"> em </span>
                        <span className="font-medium">{escola?.nome || 'Escola não encontrada'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          {new Date(reg.data).toLocaleDateString('pt-BR')}
                        </span>
                        <span className="px-2 py-1 bg-destructive/20 text-destructive text-xs font-medium rounded">
                          {reg.dias_atraso} {reg.dias_atraso === 1 ? 'dia' : 'dias'} de atraso
                        </span>
                      </div>
                    </div>
                  );
                })}
                {totalPendentes > 10 && (
                  <p className="text-sm text-muted-foreground text-center pt-2">
                    ... e mais {totalPendentes - 10} {totalPendentes - 10 === 1 ? 'ação pendente' : 'ações pendentes'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {totalEscolas === 0 && totalProfessores === 0 && (
        <div className="bg-card rounded-xl border border-border p-8 text-center">
          <School size={48} className="mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Nenhum dado cadastrado</h3>
          <p className="text-muted-foreground">
            Comece cadastrando escolas e professores para visualizar os dados no dashboard.
          </p>
        </div>
      )}

      {/* MÓDULO 2: Ações Previstas x Realizadas */}
      {(acoesPorAAP.length > 0 || acoesPorTipo.some(t => t.Previstas > 0)) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" data-tour="charts-section">
          {/* By Ator do Programa */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="card-title mb-6">Ações Previstas x Realizadas - Por Ator do Programa</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Considerando ações com data até {today.toLocaleDateString('pt-BR')}
            </p>
            {acoesPorAAP.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={acoesPorAAP}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="Previstas" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Realizadas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nenhuma programação encontrada
              </div>
            )}
          </div>

          {/* By Type */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="card-title mb-6">Ações Previstas x Realizadas por Tipo</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Considerando ações com data até {today.toLocaleDateString('pt-BR')}
            </p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={acoesPorTipo}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip 
                  contentStyle={{ 
                    background: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Bar dataKey="Previstas" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Realizadas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* MÓDULO 3: Professores e Presença por Componente e Ciclo */}
      {(professoresPorComponenteCiclo.length > 0 || presencaPorComponenteCiclo.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Professores por Componente e Ciclo */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="card-title mb-6">Professores por Componente e Ciclo</h3>
            {professoresPorComponenteCiclo.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={professoresPorComponenteCiclo} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} 
                    width={160} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [value, 'Professores']}
                  />
                  <Bar dataKey="quantidade" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                Cadastre professores para visualizar
              </div>
            )}
          </div>

          {/* Presença por Componente e Ciclo */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="card-title mb-6">% Presença em Formações por Componente e Ciclo</h3>
            {presencaPorComponenteCiclo.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={presencaPorComponenteCiclo} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} 
                    width={160} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`${value}%`, 'Presença']}
                  />
                  <Bar dataKey="percentual" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                Nenhum registro de presença encontrado
              </div>
            )}
          </div>
        </div>
      )}

      {/* MÓDULO 4: Acompanhamento de Aula */}
      {totalAvaliacoes > 0 && (
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="card-title mb-6 flex items-center gap-2">
            <Eye size={20} className="text-warning" />
            Acompanhamento de Aula - Avaliações ({totalAvaliacoes} avaliações)
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Radar Chart */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-4">Médias por Dimensão</h4>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Radar name="Média" dataKey="value" stroke="hsl(var(--warning))" fill="hsl(var(--warning))" fillOpacity={0.5} />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [value.toFixed(2), 'Média']}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Progress Rings */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-4">Média por Critério (1-5)</h4>
              <div className="grid grid-cols-2 gap-4">
                {satisfacaoData.map(item => (
                  <div key={item.name} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <ProgressRing 
                      value={item.media} 
                      maxValue={5}
                      displayAsNumber
                      size={50} 
                      strokeWidth={5}
                    />
                    <div>
                      <p className="text-xs text-muted-foreground">{item.name}</p>
                      <p className="font-semibold">{item.media.toFixed(1)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MÓDULO 5: Instrumentos Pedagógicos */}
      <InstrumentDimensionCharts chartData={instrumentChartData} isLoading={isInstrumentChartsLoading} />
    </div>
  );
}
