import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
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

const colors = {
  clareza_objetivos: 'hsl(217, 91%, 60%)',
  dominio_conteudo: 'hsl(142, 71%, 45%)',
  estrategias_didaticas: 'hsl(38, 92%, 50%)',
  engajamento_turma: 'hsl(0, 84%, 60%)',
  gestao_tempo: 'hsl(262, 83%, 58%)',
};

export function EvolucaoLineChart({ avaliacoes, dimensoesLabels }: EvolucaoLineChartProps) {
  if (avaliacoes.length === 0) return null;

  // Calculate averages for each dimension
  const chartData = dimensoesKeys.map((key) => {
    const values = avaliacoes.map(a => a[key]);
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
    const firstValue = values[0];
    const lastValue = values[values.length - 1];
    const delta = values.length >= 2 ? lastValue - firstValue : 0;
    
    return {
      name: dimensoesLabels[key],
      key,
      media: Number(avg.toFixed(2)),
      delta,
      color: colors[key],
    };
  });

  // Calculate overall average
  const overallAvg = chartData.reduce((sum, d) => sum + d.media, 0) / chartData.length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <BarChart3 className="w-5 h-5 text-primary" />
          Média por Dimensão
          <span className="text-sm font-normal ml-2 text-muted-foreground">
            (Média geral: {overallAvg.toFixed(1)})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
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
                angle={-25}
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
                formatter={(value: number, name: string, props: any) => {
                  const delta = props.payload?.delta;
                  const deltaText = delta !== undefined && delta !== 0
                    ? ` (${delta >= 0 ? '+' : ''}${delta.toFixed(1)})`
                    : '';
                  return [`${value.toFixed(1)}${deltaText}`, 'Média'];
                }}
              />
              <Bar 
                dataKey="media" 
                radius={[4, 4, 0, 0]}
                barSize={50}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend with stats */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {chartData.map((item) => (
            <div 
              key={item.key} 
              className="text-center p-3 rounded-lg bg-muted/30 border border-border/50"
            >
              <div 
                className="w-3 h-3 rounded-full mx-auto mb-1" 
                style={{ backgroundColor: item.color }}
              />
              <div className="text-xs text-muted-foreground truncate mb-1">
                {item.name}
              </div>
              <div className="text-lg font-bold" style={{ color: item.color }}>
                {item.media.toFixed(1)}
              </div>
              {avaliacoes.length >= 2 && item.delta !== 0 && (
                <div className={`text-xs ${item.delta >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {item.delta >= 0 ? '↑' : '↓'} {Math.abs(item.delta).toFixed(1)}
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
