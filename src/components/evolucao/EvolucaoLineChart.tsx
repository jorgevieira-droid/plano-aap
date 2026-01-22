import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BarChart3 } from 'lucide-react';

interface RegistroAvaliacaoAula {
  id: string;
  data: string;
  clareza_objetivos: number;
  dominio_conteudo: number;
  estrategias_didaticas: number;
  engajamento_turma: number;
  gestao_tempo: number;
}

interface EvolucaoLineChartProps {
  avaliacoes: RegistroAvaliacaoAula[];
  dimensoesLabels: Record<string, string>;
}

const dimensoesKeys = [
  'clareza_objetivos',
  'dominio_conteudo',
  'estrategias_didaticas',
  'engajamento_turma',
  'gestao_tempo',
] as const;

// Generate colors for visits (up to 10 visits with distinct colors)
const visitColors = [
  'hsl(217, 91%, 60%)',  // Blue
  'hsl(142, 71%, 45%)',  // Green
  'hsl(38, 92%, 50%)',   // Orange
  'hsl(0, 84%, 60%)',    // Red
  'hsl(262, 83%, 58%)',  // Purple
  'hsl(180, 70%, 45%)',  // Cyan
  'hsl(320, 70%, 55%)',  // Pink
  'hsl(45, 90%, 50%)',   // Yellow
  'hsl(200, 80%, 50%)',  // Light Blue
  'hsl(280, 60%, 50%)',  // Violet
];

export function EvolucaoLineChart({ avaliacoes, dimensoesLabels }: EvolucaoLineChartProps) {
  if (avaliacoes.length === 0) return null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  // Transform data: each dimension is a row, each visit is a column
  const chartData = dimensoesKeys.map((key) => {
    const row: Record<string, any> = {
      name: dimensoesLabels[key],
      key,
    };
    
    avaliacoes.forEach((avaliacao, idx) => {
      row[`visita_${idx + 1}`] = avaliacao[key];
    });
    
    return row;
  });

  // Calculate overall average per visit
  const visitAverages = avaliacoes.map((avaliacao, idx) => {
    const avg = dimensoesKeys.reduce((sum, key) => sum + avaliacao[key], 0) / dimensoesKeys.length;
    return { index: idx + 1, avg: avg.toFixed(1), date: formatDate(avaliacao.data) };
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <BarChart3 className="w-5 h-5 text-primary" />
          Comparação entre Visitas
          <span className="text-sm font-normal ml-2 text-muted-foreground">
            ({avaliacoes.length} visita{avaliacoes.length > 1 ? 's' : ''})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={true} vertical={false} />
              <XAxis 
                type="category"
                dataKey="name"
                tick={{ fontSize: 10 }}
                angle={-20}
                textAnchor="end"
                height={80}
                interval={0}
                className="text-muted-foreground"
              />
              <YAxis 
                type="number"
                domain={[0, 5]} 
                ticks={[0, 1, 2, 3, 4, 5]}
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Legend 
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
              />
              {avaliacoes.map((avaliacao, idx) => (
                <Bar
                  key={`visita_${idx + 1}`}
                  dataKey={`visita_${idx + 1}`}
                  name={`Visita ${idx + 1} (${formatDate(avaliacao.data)})`}
                  fill={visitColors[idx % visitColors.length]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Summary per visit */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {visitAverages.map((visit, idx) => (
            <div 
              key={visit.index} 
              className="text-center p-3 rounded-lg bg-muted/30 border border-border/50"
            >
              <div 
                className="w-3 h-3 rounded-full mx-auto mb-1" 
                style={{ backgroundColor: visitColors[idx % visitColors.length] }}
              />
              <div className="text-xs text-muted-foreground truncate mb-1">
                Visita {visit.index} ({visit.date})
              </div>
              <div className="text-lg font-bold" style={{ color: visitColors[idx % visitColors.length] }}>
                {visit.avg}
              </div>
              {idx > 0 && (
                <div className={`text-xs ${
                  parseFloat(visit.avg) >= parseFloat(visitAverages[idx - 1].avg) 
                    ? 'text-success' 
                    : 'text-destructive'
                }`}>
                  {parseFloat(visit.avg) >= parseFloat(visitAverages[idx - 1].avg) ? '↑' : '↓'}{' '}
                  {Math.abs(parseFloat(visit.avg) - parseFloat(visitAverages[idx - 1].avg)).toFixed(1)}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Scale Legend */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span className="font-medium">Escala:</span>
          <span>1 - Muito Insatisfatório</span>
          <span>2 - Insatisfatório</span>
          <span>3 - Adequado</span>
          <span>4 - Bom</span>
          <span>5 - Excelente</span>
        </div>
      </CardContent>
    </Card>
  );
}
