import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ClipboardCheck, Loader2 } from 'lucide-react';
import { InstrumentChartData } from '@/hooks/useInstrumentChartData';
import { ProgressRing } from '@/components/ui/ProgressRing';

interface Props {
  chartData: InstrumentChartData[];
  isLoading: boolean;
}

function truncateLabel(label: string, maxLen = 30): string {
  return label.length > maxLen ? label.slice(0, maxLen - 1) + '…' : label;
}

export function InstrumentDimensionCharts({ chartData, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="animate-spin text-primary" size={24} />
      </div>
    );
  }

  if (chartData.length === 0) return null;

  return (
    <div className="space-y-6">
      {chartData.map(item => {
        const barData = item.dimensions.map(d => ({
          name: truncateLabel(d.label),
          fullName: d.label,
          Média: d.average,
          scaleMax: d.scaleMax,
        }));

        const scaleMax = item.dimensions[0]?.scaleMax || 5;
        const overallAvg = item.dimensions.reduce((s, d) => s + d.average, 0) / item.dimensions.length;

        return (
          <div key={item.formType} className="bg-card rounded-xl border border-border p-6">
            <h3 className="card-title mb-2 flex items-center gap-2">
              <ClipboardCheck size={20} className="text-primary" />
              {item.formLabel}
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              {item.totalResponses} {item.totalResponses === 1 ? 'resposta' : 'respostas'} • Média geral: {overallAvg.toFixed(2)} / {scaleMax}
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bar Chart */}
              <div>
                <ResponsiveContainer width="100%" height={Math.max(200, barData.length * 40)}>
                  <BarChart data={barData} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      type="number"
                      domain={[0, scaleMax]}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                      width={180}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number, _: any, props: any) => [
                        `${value.toFixed(2)} / ${props.payload.scaleMax}`,
                        'Média',
                      ]}
                      labelFormatter={(label: string, payload: any[]) => payload?.[0]?.payload?.fullName || label}
                    />
                    <Bar dataKey="Média" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Progress Rings */}
              <div className="grid grid-cols-2 gap-3 content-start">
                {item.dimensions.map(d => (
                  <div key={d.fieldKey} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <ProgressRing
                      value={d.average}
                      maxValue={d.scaleMax}
                      displayAsNumber
                      size={46}
                      strokeWidth={5}
                    />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground line-clamp-2">{d.label}</p>
                      <p className="font-semibold text-sm">{d.average.toFixed(1)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
