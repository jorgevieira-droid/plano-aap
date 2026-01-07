import { useState, useEffect } from 'react';
import { 
  School, 
  Users, 
  UserCheck, 
  Calendar,
  Filter,
  Loader2
} from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Database } from '@/integrations/supabase/types';

type ProgramaType = Database['public']['Enums']['programa_type'];

const programaLabels: Record<ProgramaType, string> = {
  escolas: 'Programa de Escolas',
  regionais: 'Programa de Regionais de Ensino',
  redes_municipais: 'Programa de Redes Municipais'
};

export default function AdminDashboard() {
  const [programaFilter, setProgramaFilter] = useState<ProgramaType | 'todos'>('todos');
  const [escolas, setEscolas] = useState<any[]>([]);
  const [professores, setProfessores] = useState<any[]>([]);
  const [aapsCount, setAapsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // Fetch escolas
      const { data: escolasData } = await supabase
        .from('escolas')
        .select('*')
        .eq('ativa', true);
      
      // Fetch professores
      const { data: professoresData } = await supabase
        .from('professores')
        .select('*')
        .eq('ativo', true);
      
      // Fetch AAPs count
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id')
        .like('role', 'aap_%');
      
      setEscolas(escolasData || []);
      setProfessores(professoresData || []);
      setAapsCount(rolesData?.length || 0);
      setLoading(false);
    };

    fetchData();
  }, []);

  // Filter data based on selected program
  const filteredEscolas = programaFilter === 'todos' 
    ? escolas 
    : escolas.filter(e => e.programa?.includes(programaFilter));
  
  const filteredProfessores = programaFilter === 'todos'
    ? professores
    : professores.filter(p => p.programa?.includes(programaFilter));

  // Calculate stats from real data
  const totalEscolas = filteredEscolas.length;
  const totalProfessores = filteredProfessores.length;
  const totalAAPs = aapsCount;

  // Chart data based on real data
  const segmentoData = [
    { name: 'Anos Iniciais', value: filteredProfessores.filter(p => p.segmento === 'anos_iniciais').length, color: 'hsl(215, 70%, 35%)' },
    { name: 'Anos Finais', value: filteredProfessores.filter(p => p.segmento === 'anos_finais').length, color: 'hsl(160, 60%, 45%)' },
    { name: 'Ensino Médio', value: filteredProfessores.filter(p => p.segmento === 'ensino_medio').length, color: 'hsl(38, 92%, 50%)' },
  ];

  const componenteData = [
    { name: 'Polivalente', value: filteredProfessores.filter(p => p.componente === 'polivalente').length },
    { name: 'Português', value: filteredProfessores.filter(p => p.componente === 'lingua_portuguesa').length },
    { name: 'Matemática', value: filteredProfessores.filter(p => p.componente === 'matematica').length },
  ];

  const cargoData = [
    { name: 'Professores', value: filteredProfessores.filter(p => p.cargo === 'professor').length },
    { name: 'Coordenadores', value: filteredProfessores.filter(p => p.cargo === 'coordenador').length },
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
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-muted-foreground" />
          <Select value={programaFilter} onValueChange={(value) => setProgramaFilter(value as ProgramaType | 'todos')}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Filtrar por programa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Programas</SelectItem>
              <SelectItem value="escolas">Programa de Escolas</SelectItem>
              <SelectItem value="regionais">Programa de Regionais de Ensino</SelectItem>
              <SelectItem value="redes_municipais">Programa de Redes Municipais</SelectItem>
            </SelectContent>
          </Select>
        </div>
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
          title="AAPs / Formadores"
          value={totalAAPs}
          icon={<UserCheck size={24} />}
        />
        <StatCard
          title="Coordenadores"
          value={filteredProfessores.filter(p => p.cargo === 'coordenador').length}
          icon={<Calendar size={24} />}
          variant="accent"
        />
      </div>

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

      {/* Distribution Charts */}
      {(totalEscolas > 0 || totalProfessores > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart - Segmentos */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="card-title mb-6">Professores por Segmento</h3>
            {totalProfessores > 0 ? (
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
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                Cadastre professores para visualizar
              </div>
            )}
          </div>

          {/* Bar Chart - Componentes */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="card-title mb-6">Professores por Componente</h3>
            {totalProfessores > 0 ? (
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
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                Cadastre professores para visualizar
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cargo Distribution */}
      {totalProfessores > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="card-title mb-6">Distribuição por Cargo</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={cargoData}>
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
                <Bar dataKey="value" name="Quantidade" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Escolas por Programa */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="card-title mb-6">Escolas por Programa</h3>
            <div className="space-y-4">
              {(['escolas', 'regionais', 'redes_municipais'] as ProgramaType[]).map(prog => {
                const count = escolas.filter(e => e.programa?.includes(prog)).length;
                const percentage = totalEscolas > 0 ? (count / escolas.length) * 100 : 0;
                return (
                  <div key={prog} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{programaLabels[prog]}</span>
                      <span className="font-medium">{count} escolas</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
