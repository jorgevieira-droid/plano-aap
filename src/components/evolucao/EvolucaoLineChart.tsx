import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

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
  clareza_objetivos: 'hsl(var(--primary))',
  dominio_conteudo: 'hsl(var(--success))',
  estrategias_didaticas: 'hsl(var(--warning))',
  engajamento_turma: 'hsl(var(--destructive))',
  gestao_tempo: 'hsl(var(--accent-foreground))',
  media: 'hsl(var(--muted-foreground))',
};

export function EvolucaoLineChart({ avaliacoes, dimensoesLabels }: EvolucaoLineChartProps) {
  if (avaliacoes.length === 0) return null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  // Transform data for the chart
  const chartData = avaliacoes.map((avaliacao, idx) => {
    const media = dimensoesKeys.reduce((sum, key) => sum + avaliacao[key], 0) / dimensoesKeys.length;
    return {
      name: formatDate(avaliacao.data),
      fullDate: new Date(avaliacao.data).toLocaleDateString('pt-BR'),
      visita: idx + 1,
      clareza_objetivos: avaliacao.clareza_objetivos,
      dominio_conteudo: avaliacao.dominio_conteudo,
      estrategias_didaticas: avaliacao.estrategias_didaticas,
      engajamento_turma: avaliacao.engajamento_turma,
      gestao_tempo: avaliacao.gestao_tempo,
      media: Number(media.toFixed(2)),
    };
  });

  // Calculate overall trend
  const firstMedia = chartData[0]?.media || 0;
  const lastMedia = chartData[chartData.length - 1]?.media || 0;
  const trend = lastMedia - firstMedia;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="w-5 h-5 text-primary" />
          Evolução Temporal
          {chartData.length >= 2 && (
            <span className={`text-sm font-normal ml-2 ${trend >= 0 ? 'text-success' : 'text-destructive'}`}>
              ({trend >= 0 ? '+' : ''}{trend.toFixed(2)} pontos desde a primeira visita)
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis 
                domain={[0, 5]} 
                ticks={[1, 2, 3, 4, 5]}
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
                labelFormatter={(value, payload) => {
                  const item = payload?.[0]?.payload;
                  return item ? `Visita #${item.visita} - ${item.fullDate}` : value;
                }}
              />
              <Legend 
                wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
              />
              {dimensoesKeys.map((key) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={dimensoesLabels[key]}
                  stroke={colors[key]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
              <Line
                type="monotone"
                dataKey="media"
                name="Média Geral"
                stroke={colors.media}
                strokeWidth={3}
                strokeDasharray="5 5"
                dot={{ r: 5, fill: 'hsl(var(--muted-foreground))' }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Stats */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {dimensoesKeys.map((key) => {
            const values = avaliacoes.map(a => a[key]);
            const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
            const firstValue = values[0];
            const lastValue = values[values.length - 1];
            const delta = lastValue - firstValue;
            
            return (
              <div 
                key={key} 
                className="text-center p-3 rounded-lg bg-muted/30 border border-border/50"
              >
                <div className="text-xs text-muted-foreground truncate mb-1">
                  {dimensoesLabels[key]}
                </div>
                <div className="text-lg font-bold" style={{ color: colors[key] }}>
                  {avg.toFixed(1)}
                </div>
                {values.length >= 2 && (
                  <div className={`text-xs ${delta >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {delta >= 0 ? '↑' : '↓'} {Math.abs(delta).toFixed(1)}
                  </div>
                )}
              </div>
            );
          })}
          <div className="text-center p-3 rounded-lg bg-muted/50 border border-border">
            <div className="text-xs text-muted-foreground truncate mb-1">
              Média Geral
            </div>
            <div className="text-lg font-bold text-foreground">
              {(avaliacoes.reduce((sum, a) => 
                sum + dimensoesKeys.reduce((s, key) => s + a[key], 0) / dimensoesKeys.length
              , 0) / avaliacoes.length).toFixed(1)}
            </div>
            {chartData.length >= 2 && (
              <div className={`text-xs ${trend >= 0 ? 'text-success' : 'text-destructive'}`}>
                {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
