import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Legend } from 'recharts';
import { BarChart3, Asterisk } from 'lucide-react';

export interface DynamicAvaliacao {
  id: string;
  data: string;
  tipo?: string;
  tipoLabel?: string;
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
  requiredKeys?: Set<string>;
  title?: string;
  itemLabel?: string;
  includeZeroValues?: boolean;
}

export function EvolucaoLineChart({ avaliacoes, dimensoesLabels, dimensoesKeys, scaleMax = 4, groups, requiredKeys = new Set(), title = 'Evolução por Visita', itemLabel = 'Visita', includeZeroValues = false }: EvolucaoLineChartProps) {
  if (avaliacoes.length === 0 || groups.length === 0) return null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  // Chart data: one group average per group per record
  const chartData = avaliacoes.map((avaliacao, idx) => {
    const row: Record<string, any> = {
      name: `${itemLabel} ${idx + 1}`,
      fullLabel: `${itemLabel} ${idx + 1} (${formatDate(avaliacao.data)})`,
    };
    groups.forEach((group) => {
      const vals = group.keys
        .map(k => avaliacao.ratings[k])
        .filter((v): v is number => v !== undefined && (includeZeroValues || v !== 0));
      row[group.name] = vals.length > 0 ? Number((vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(2)) : null;
    });
    return row;
  });

  // Overall trend
  const calcVisitAvg = (avaliacao: DynamicAvaliacao) => {
    const vals = dimensoesKeys.map(k => avaliacao.ratings[k]).filter((v): v is number => v !== undefined && (includeZeroValues || v !== 0));
    return vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
  };
  const overallTrend = avaliacoes.length >= 2 ? calcVisitAvg(avaliacoes[avaliacoes.length - 1]) - calcVisitAvg(avaliacoes[0]) : 0;

  const yTicks = Array.from({ length: scaleMax + 1 }, (_, i) => i);

  // Helper to generate shade for individual item within a group
  const getItemColor = (group: DimensionGroup, itemIndex: number, totalInGroup: number) => {
    const lightnessStart = 75;
    const lightnessEnd = 40;
    const step = totalInGroup > 1 ? (lightnessStart - lightnessEnd) / (totalInGroup - 1) : 0;
    const lightness = lightnessStart - (step * itemIndex);
    const parts = group.color.split(',').map(s => s.trim());
    const h = parts[0];
    const s = parts[1];
    return `hsl(${h}, ${s}, ${lightness}%)`;
  };

  // Individual dimension stats
  const dimensionStats = dimensoesKeys.map((key) => {
    const values = avaliacoes.map(a => a.ratings[key]).filter((v): v is number => v !== undefined && (includeZeroValues || v !== 0));
    const avg = values.length > 0 ? values.reduce((sum, v) => sum + v, 0) / values.length : 0;
    const allValues = avaliacoes.map(a => a.ratings[key] ?? 0);
    const validValues = includeZeroValues ? allValues : allValues.filter(v => v > 0);
    const firstValue = validValues[0];
    const lastValue = validValues[validValues.length - 1];
    const delta = (firstValue !== undefined && lastValue !== undefined && avaliacoes.length >= 2) ? lastValue - firstValue : 0;
    
    const group = groups.find(g => g.keys.includes(key));
    const indexInGroup = group ? group.keys.indexOf(key) : 0;
    const totalInGroup = group ? group.keys.length : 1;
    const color = group ? getItemColor(group, indexInGroup, totalInGroup) : 'hsl(217, 91%, 60%)';
    const isRequired = requiredKeys.has(key);
    
    return { key, name: dimensoesLabels[key] || key, avg: Number(avg.toFixed(2)), delta, color, groupName: group?.name || '', isRequired };
  });

  const nonZeroStats = dimensionStats.filter(d => includeZeroValues || d.avg > 0);
  const overallAvg = nonZeroStats.length > 0 ? nonZeroStats.reduce((sum, d) => sum + d.avg, 0) / nonZeroStats.length : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <BarChart3 className="w-5 h-5 text-primary" />
          {title}
          {avaliacoes.length >= 2 && (
            <span className={`text-sm font-normal ml-2 ${overallTrend >= 0 ? 'text-success' : 'text-destructive'}`}>
              ({overallTrend >= 0 ? '+' : ''}{overallTrend.toFixed(2)} pontos desde o primeiro registro)
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
                  <LabelList dataKey={group.name} position="top" style={{ fontSize: '10px', fill: 'hsl(var(--foreground))' }} formatter={(v: number) => v ? v.toFixed(1) : ''} />
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
                    <div
                      key={stat.key}
                      className={`text-center p-3 rounded-lg border ${stat.isRequired ? 'bg-primary/5 border-primary/40 ring-1 ring-primary/20' : 'bg-muted/30 border-border/50'}`}
                    >
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stat.color }} />
                        {stat.isRequired && <Asterisk className="w-3 h-3 text-primary" />}
                      </div>
                      <div className="text-xs text-muted-foreground truncate mb-1">
                        {stat.name}
                        {stat.isRequired && <span className="text-primary font-semibold ml-1">*</span>}
                      </div>
                      <div className="text-lg font-bold" style={{ color: stat.color }}>{stat.avg > 0 ? stat.avg.toFixed(1) : '—'}</div>
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
          {/* Legend */}
          {requiredKeys.size > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
              <Asterisk className="w-3 h-3 text-primary" />
              <span>Pergunta obrigatória</span>
            </div>
          )}
          {/* Overall average */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-lg bg-primary/10 border border-primary/30">
              <div className="w-3 h-3 rounded-full mx-auto mb-1 bg-primary" />
              <div className="text-xs text-muted-foreground truncate mb-1">Média Geral</div>
              <div className="text-lg font-bold text-primary">{overallAvg > 0 ? overallAvg.toFixed(1) : '—'}</div>
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
