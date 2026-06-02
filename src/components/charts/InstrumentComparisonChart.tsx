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

// Quebra a string em até `maxLines` linhas com no máximo `maxChars` cada
function wrapLabel(text: string, maxChars = 28, maxLines = 3): string[] {
  const words = (text || '').split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const w of words) {
    const candidate = current ? `${current} ${w}` : w;
    if (candidate.length <= maxChars) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = w;
      if (lines.length === maxLines - 1 && current.length > maxChars) {
        current = current.slice(0, maxChars - 1) + '…';
        break;
      }
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  if (lines.length > maxLines) {
    const truncated = lines.slice(0, maxLines);
    const last = truncated[maxLines - 1];
    truncated[maxLines - 1] = (last.length > maxChars - 1 ? last.slice(0, maxChars - 1) : last) + '…';
    return truncated;
  }
  return lines;
}

const MultilineTick = (props: any) => {
  const { x, y, payload } = props;
  const lines = wrapLabel(payload.value, 28, 3);
  const lineHeight = 12;
  const offsetY = -((lines.length - 1) * lineHeight) / 2;
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={-6}
        y={offsetY}
        textAnchor="end"
        fill="hsl(var(--foreground))"
        fontSize={11}
      >
        {lines.map((line, i) => (
          <tspan key={i} x={-6} dy={i === 0 ? 0 : lineHeight}>
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );
};

export function InstrumentComparisonChart({ dimensions, labelA, labelB, scaleMax }: Props) {
  const data = useMemo(
    () => dimensions.map(d => ({
      label: d.label,
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
    <div className="w-full" style={{ height: Math.max(320, 80 + dimensions.length * 72) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 16, right: 32, left: 8, bottom: 16 }}
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
            width={240}
            interval={0}
            tick={<MultilineTick />}
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
