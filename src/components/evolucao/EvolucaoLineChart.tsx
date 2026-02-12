import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Legend } from 'recharts';
import { BarChart3 } from 'lucide-react';

export interface DynamicAvaliacao {
  id: string;
  data: string;
  ratings: Record<string, number>;
  textFields: Record<string, string>;
}

export interface DimensionGroup {
  name: string;
  keys: string[];
  color: string;  // base HSL like "217, 91%, 60%"
}

interface EvolucaoLineChartProps {
  avaliacoes: DynamicAvaliacao[];
  dimensoesLabels: Record<string, string>;
  dimensoesKeys: string[];
  scaleMax?: number;
  groups: DimensionGroup[];
}

export function EvolucaoLineChart({ avaliacoes, dimensoesLabels, dimensoesKeys, scaleMax = 4, groups }: EvolucaoLineChartProps) {
  if (avaliacoes.length === 0 || groups.length === 0) return null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  // Chart data: one group average per group per visit
  const chartData = avaliacoes.map((avaliacao, idx) => {
    const row: Record<string, any> = {
      name: `Visita ${idx + 1}`,
      fullLabel: `Visita ${idx + 1} (${formatDate(avaliacao.data)})`,
    };
    groups.forEach((group) => {
      const vals = group.keys.map(k => avaliacao.ratings[k] ?? 0).filter((_, i) => {
        // only count keys that have responses
        return avaliacao.ratings[group.keys[i]] !== undefined;
      });
      row[group.name] = vals.length > 0 ? Number((vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(2)) : 0;
    });
    return row;
  });

  // Overall trend
  const calcVisitAvg = (avaliacao: DynamicAvaliacao) => {
    const vals = dimensoesKeys.map(k => avaliacao.ratings[k] ?? 0);
    return vals.reduce((s, v) => s + v, 0) / vals.length;
  };
  const overallTrend = avaliacoes.length >= 2 ? calcVisitAvg(avaliacoes[avaliacoes.length - 1]) - calcVisitAvg(avaliacoes[0]) : 0;

  const yTicks = Array.from({ length: scaleMax + 1 }, (_, i) => i);

  // Helper to generate shade for individual item within a group
  const getItemColor = (group: DimensionGroup, itemIndex: number, totalInGroup: number) => {
    // lightest to darkest within the group
    const lightnessStart = 75;
    const lightnessEnd = 40;
    const step = totalInGroup > 1 ? (lightnessStart - lightnessEnd) / (totalInGroup - 1) : 0;
    const lightness = lightnessStart - (step * itemIndex);
    // Extract H, S from group color (format: "H, S%, L%")
    const parts = group.color.split(',').map(s => s.trim());
    const h = parts[0];
    const s = parts[1];
    return `hsl(${h}, ${s}, ${lightness}%)`;
  };

  // Individual dimension stats for boxes below
  const dimensionStats = dimensoesKeys.map((key) => {
    const values = avaliacoes.map(a => a.ratings[key] ?? 0);
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
    const delta = values.length >= 2 ? values[values.length - 1] - values[0] : 0;
    
    // Find group for this key
    const group = groups.find(g => g.keys.includes(key));
    const indexInGroup = group ? group.keys.indexOf(key) : 0;
    const totalInGroup = group ? group.keys.length : 1;
    const color = group ? getItemColor(group, indexInGroup, totalInGroup) : 'hsl(217, 91%, 60%)';
    
    return { key, name: dimensoesLabels[key] || key, avg: Number(avg.toFixed(2)), delta, color, groupName: group?.name || '' };
  });

  const overallAvg = dimensionStats.reduce((sum, d) => sum + d.avg, 0) / dimensionStats.length;

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
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              {groups.map((group) => (
                <Bar key={group.name} dataKey={group.name} fill={`hsl(${group.color})`} radius={[4, 4, 0, 0]}>
                  <LabelList dataKey={group.name} position="top" style={{ fontSize: '10px', fill: 'hsl(var(--foreground))' }} formatter={(v: number) => v.toFixed(1)} />
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Individual dimension boxes grouped by dimension group */}
        <div className="mt-6 space-y-4">
          {groups.map((group) => {
            const groupStats = dimensionStats.filter(s => s.groupName === group.name);
            if (groupStats.length === 0) return null;
            return (
              <div key={group.name}>
                <h4 className="text-sm font-semibold mb-2" style={{ color: `hsl(${group.color})` }}>
                  {group.name}
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {groupStats.map((stat) => (
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
                </div>
              </div>
            );
          })}
          {/* Overall average */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
        </div>
      </CardContent>
    </Card>
  );
}
