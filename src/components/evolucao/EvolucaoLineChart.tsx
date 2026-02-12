import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import { BarChart3 } from 'lucide-react';

export interface DynamicAvaliacao {
  id: string;
  data: string;
  ratings: Record<string, number>;
  textFields: Record<string, string>;
}

interface EvolucaoLineChartProps {
  avaliacoes: DynamicAvaliacao[];
  dimensoesLabels: Record<string, string>;
  dimensoesKeys: string[];
  scaleMax?: number;
}

const COLORS_PALETTE = [
  'hsl(217, 91%, 60%)',
  'hsl(142, 71%, 45%)',
  'hsl(38, 92%, 50%)',
  'hsl(0, 84%, 60%)',
  'hsl(262, 83%, 58%)',
  'hsl(190, 80%, 45%)',
  'hsl(320, 70%, 50%)',
  'hsl(50, 90%, 45%)',
  'hsl(170, 65%, 40%)',
  'hsl(280, 60%, 55%)',
  'hsl(15, 85%, 55%)',
  'hsl(200, 75%, 50%)',
];

export function EvolucaoLineChart({ avaliacoes, dimensoesLabels, dimensoesKeys, scaleMax = 4 }: EvolucaoLineChartProps) {
  if (avaliacoes.length === 0 || dimensoesKeys.length === 0) return null;

  const getColor = (idx: number) => COLORS_PALETTE[idx % COLORS_PALETTE.length];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const chartData = avaliacoes.map((avaliacao, idx) => {
    const row: Record<string, any> = {
      name: `Visita ${idx + 1}`,
      fullLabel: `Visita ${idx + 1} (${formatDate(avaliacao.data)})`,
      date: formatDate(avaliacao.data),
    };
    dimensoesKeys.forEach((key) => {
      row[key] = avaliacao.ratings[key] ?? 0;
    });
    return row;
  });

  const dimensionStats = dimensoesKeys.map((key, idx) => {
    const values = avaliacoes.map(a => a.ratings[key] ?? 0);
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
    const delta = values.length >= 2 ? values[values.length - 1] - values[0] : 0;
    return { key, name: dimensoesLabels[key] || key, avg: Number(avg.toFixed(2)), delta, color: getColor(idx) };
  });

  const overallAvg = dimensionStats.reduce((sum, d) => sum + d.avg, 0) / dimensionStats.length;

  const firstVisitAvg = dimensoesKeys.reduce((sum, key) => sum + (avaliacoes[0].ratings[key] ?? 0), 0) / dimensoesKeys.length;
  const lastVisitAvg = dimensoesKeys.reduce((sum, key) => sum + (avaliacoes[avaliacoes.length - 1].ratings[key] ?? 0), 0) / dimensoesKeys.length;
  const overallTrend = lastVisitAvg - firstVisitAvg;

  const yTicks = Array.from({ length: scaleMax + 1 }, (_, i) => i);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <BarChart3 className="w-5 h-5 text-primary" />
          Evolução por Visita
          {avaliacoes.length >= 2 && (
            <span className={`text-sm font-normal ml-2 ${overallTrend >= 0 ? 'text-success' : 'text-destructive'}`}>
              ({overallTrend >= 0 ? '+' : ''}{overallTrend.toFixed(2)} pontos desde a primeira visita)
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal vertical={false} />
              <XAxis type="category" dataKey="fullLabel" tick={{ fontSize: 10 }} interval={0} className="text-muted-foreground" />
              <YAxis type="number" domain={[0, scaleMax]} ticks={yTicks} tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              {dimensoesKeys.map((key, idx) => (
                <Bar key={key} dataKey={key} name={dimensoesLabels[key] || key} fill={getColor(idx)} radius={[4, 4, 0, 0]}>
                  <LabelList dataKey={key} position="top" style={{ fontSize: '10px', fill: 'hsl(var(--foreground))' }} />
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Summary per dimension */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {dimensionStats.map((stat) => (
            <div key={stat.key} className="text-center p-3 rounded-lg bg-muted/30 border border-border/50">
              <div className="w-3 h-3 rounded-full mx-auto mb-1" style={{ backgroundColor: stat.color }} />
              <div className="text-xs text-muted-foreground truncate mb-1">{stat.name}</div>
              <div className="text-lg font-bold" style={{ color: stat.color }}>{stat.avg.toFixed(1)}</div>
              {avaliacoes.length >= 2 && stat.delta !== 0 && (
                <div className={`text-xs ${stat.delta >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {stat.delta >= 0 ? '↑' : '↓'}{Math.abs(stat.delta).toFixed(1)}
                </div>
              )}
            </div>
          ))}
          <div className="text-center p-3 rounded-lg bg-primary/10 border border-primary/30">
            <div className="w-3 h-3 rounded-full mx-auto mb-1 bg-primary" />
            <div className="text-xs text-muted-foreground truncate mb-1">Média Geral</div>
            <div className="text-lg font-bold text-primary">{overallAvg.toFixed(1)}</div>
            {avaliacoes.length >= 2 && overallTrend !== 0 && (
              <div className={`text-xs ${overallTrend >= 0 ? 'text-success' : 'text-destructive'}`}>
                {overallTrend >= 0 ? '↑' : '↓'}{Math.abs(overallTrend).toFixed(1)}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
