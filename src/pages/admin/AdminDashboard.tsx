import { 
  School, 
  Users, 
  UserCheck, 
  Calendar, 
  ClipboardCheck, 
  Target,
  TrendingUp,
  FileCheck
} from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { escolas, professores, aaps, programacoes, registrosAcao, presencas } from '@/data/mockData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

export default function AdminDashboard() {
  // Calculate stats
  const totalEscolas = escolas.length;
  const totalProfessores = professores.length;
  const totalAAPs = aaps.length;
  
  const formacoesPrevistas = programacoes.filter(p => p.tipo === 'formacao').length;
  const formacoesRealizadas = programacoes.filter(p => p.tipo === 'formacao' && p.status === 'realizada').length;
  const visitasPrevistas = programacoes.filter(p => p.tipo === 'visita').length;
  const visitasRealizadas = programacoes.filter(p => p.tipo === 'visita' && p.status === 'realizada').length;
  
  const totalPresencas = presencas.filter(p => p.presente).length;
  const totalRegistros = presencas.length;
  const percentualPresenca = totalRegistros > 0 ? (totalPresencas / totalRegistros) * 100 : 0;

  // Chart data
  const execucaoData = [
    { name: 'Formações', previstas: formacoesPrevistas, realizadas: formacoesRealizadas },
    { name: 'Visitas', previstas: visitasPrevistas, realizadas: visitasRealizadas },
  ];

  const segmentoData = [
    { name: 'Anos Iniciais', value: professores.filter(p => p.segmento === 'anos_iniciais').length, color: 'hsl(215, 70%, 35%)' },
    { name: 'Anos Finais', value: professores.filter(p => p.segmento === 'anos_finais').length, color: 'hsl(160, 60%, 45%)' },
    { name: 'Ensino Médio', value: professores.filter(p => p.segmento === 'ensino_medio').length, color: 'hsl(38, 92%, 50%)' },
  ];

  const componenteData = [
    { name: 'Polivalente', value: professores.filter(p => p.componente === 'polivalente').length },
    { name: 'Português', value: professores.filter(p => p.componente === 'lingua_portuguesa').length },
    { name: 'Matemática', value: professores.filter(p => p.componente === 'matematica').length },
  ];

  // Upcoming activities
  const proximasAtividades = programacoes
    .filter(p => p.status === 'prevista')
    .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="page-header">Dashboard</h1>
        <p className="page-subtitle">Visão geral do Programa de Escolas</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Escolas"
          value={totalEscolas}
          icon={<School size={24} />}
          variant="primary"
        />
        <StatCard
          title="Professores"
          value={totalProfessores}
          icon={<Users size={24} />}
        />
        <StatCard
          title="AAPs Ativos"
          value={totalAAPs}
          icon={<UserCheck size={24} />}
        />
        <StatCard
          title="Ações Registradas"
          value={registrosAcao.length}
          icon={<ClipboardCheck size={24} />}
          variant="accent"
        />
      </div>

      {/* Execution Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress Rings */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="card-title mb-6 flex items-center gap-2">
            <Target size={20} className="text-primary" />
            Execução do Programa
          </h3>
          <div className="flex justify-around">
            <ProgressRing 
              value={(formacoesRealizadas / formacoesPrevistas) * 100} 
              label="Formações"
              sublabel={`${formacoesRealizadas}/${formacoesPrevistas}`}
            />
            <ProgressRing 
              value={(visitasRealizadas / visitasPrevistas) * 100} 
              label="Visitas"
              sublabel={`${visitasRealizadas}/${visitasPrevistas}`}
            />
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-card rounded-xl border border-border p-6 lg:col-span-2">
          <h3 className="card-title mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-primary" />
            Previsto vs Realizado
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={execucaoData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip 
                contentStyle={{ 
                  background: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="previstas" name="Previstas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="realizadas" name="Realizadas" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart - Segmentos */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="card-title mb-6">Professores por Segmento</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={segmentoData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
              >
                {segmentoData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  background: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart - Componentes */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="card-title mb-6">Professores por Componente</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={componenteData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis dataKey="name" type="category" tick={{ fill: 'hsl(var(--muted-foreground))' }} width={90} />
              <Tooltip 
                contentStyle={{ 
                  background: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="value" name="Quantidade" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Attendance & Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="card-title mb-4">Taxa de Presença</h3>
          <div className="flex flex-col items-center">
            <ProgressRing 
              value={percentualPresenca} 
              size={150}
              strokeWidth={12}
            />
            <p className="mt-4 text-sm text-muted-foreground">
              {totalPresencas} de {totalRegistros} presenças registradas
            </p>
          </div>
        </div>

        {/* Upcoming Activities */}
        <div className="bg-card rounded-xl border border-border p-6 lg:col-span-2">
          <h3 className="card-title mb-4 flex items-center gap-2">
            <Calendar size={20} className="text-primary" />
            Próximas Atividades
          </h3>
          <div className="space-y-3">
            {proximasAtividades.map((atividade) => {
              const escola = escolas.find(e => e.id === atividade.escolaId);
              const aap = aaps.find(a => a.id === atividade.aapId);
              
              return (
                <div 
                  key={atividade.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      {atividade.tipo === 'formacao' ? (
                        <FileCheck size={20} className="text-primary" />
                      ) : (
                        <Calendar size={20} className="text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{atividade.titulo}</p>
                      <p className="text-sm text-muted-foreground">
                        {escola?.nome} • {aap?.nome}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <StatusBadge variant={atividade.tipo === 'formacao' ? 'primary' : 'info'}>
                      {atividade.tipo === 'formacao' ? 'Formação' : 'Visita'}
                    </StatusBadge>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(atividade.data).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              );
            })}
            {proximasAtividades.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma atividade programada
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
