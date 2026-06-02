import { useMemo } from 'react';
import {
  Bar, BarChart, CartesianGrid, LabelList, Legend, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts';
import type { DimensionComparison } from '@/hooks/useInstrumentComparisonData';

interface Props {
  dimensions: DimensionComparison[];
  labelA: string;
  labelB: string;
  scaleMax: number;
}

export function InstrumentComparisonChart({ dimensions, labelA, labelB, scaleMax }: Props) {
  const data = useMemo(
    () => dimensions.map(d => ({
      label: d.label.length > 28 ? d.label.slice(0, 26) + '…' : d.label,
      fullLabel: d.label,
      A: d.avgA ?? 0,
      B: d.avgB ?? 0,
      countA: d.countA,
      countB: d.countB,
    })),
    [dimensions],
  );

  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Nenhuma dimensão com avaliações nos períodos selecionados.
      </p>
    );
  }

  return (
    <div className="w-full" style={{ height: Math.max(320, 60 + dimensions.length * 48) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 16, right: 24, left: 16, bottom: 16 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            type="number"
            domain={[0, scaleMax]}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={200}
            tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 8,
              color: 'hsl(var(--foreground))',
            }}
            formatter={(value: any, name: any, item: any) => {
              const count = name === labelA ? item.payload.countA : item.payload.countB;
              return [`${Number(value).toFixed(2)} (n=${count})`, name];
            }}
            labelFormatter={(_, payload) => payload?.[0]?.payload?.fullLabel || ''}
          />
          <Legend />
          <Bar dataKey="A" name={labelA} fill="hsl(var(--primary))" radius={[0, 4, 4, 0]}>
            <LabelList dataKey="A" position="right" formatter={(v: number) => (v > 0 ? v.toFixed(2) : '')} style={{ fill: 'hsl(var(--foreground))', fontSize: 11 }} />
          </Bar>
          <Bar dataKey="B" name={labelB} fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]}>
            <LabelList dataKey="B" position="right" formatter={(v: number) => (v > 0 ? v.toFixed(2) : '')} style={{ fill: 'hsl(var(--foreground))', fontSize: 11 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
