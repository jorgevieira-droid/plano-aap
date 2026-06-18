import { ClipboardCheck } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LabelList,
} from 'recharts';
import { ProgressRing } from '@/components/ui/ProgressRing';

export interface RelVisitaMicrociclos {
  status: string;
  data: string | null;
  nota_q17?: number | null;
  nota_q18?: number | null;
  nota_q19?: number | null;
  nota_q20?: number | null;
  nota_q21?: number | null;
  nota_q22?: number | null;
  [key: string]: unknown;
}

interface Props {
  registros: RelVisitaMicrociclos[];
}

// Dimensões pontuadas (rubrica 1-4) do formulário Visita Técnica — Microciclos.
// Mantém o mapeamento numérico Q19..Q24 usado no PDF/print do instrumento.
const DIMENSOES_MICROCICLOS: Array<{ key: 'nota_q17' | 'nota_q18' | 'nota_q19' | 'nota_q20' | 'nota_q21' | 'nota_q22'; numero: number; pergunta: string }> = [
  { key: 'nota_q17', numero: 19, pergunta: 'As intervenções estavam alinhadas ao caderno e à faixa de desempenho de cada grupo?' },
  { key: 'nota_q18', numero: 20, pergunta: 'O professor utilizou metodologias que favorecem a aprendizagem?' },
  { key: 'nota_q19', numero: 21, pergunta: 'O objetivo de aprendizagem estava claro e foi comunicado aos estudantes?' },
  { key: 'nota_q20', numero: 22, pergunta: 'O professor verificou a compreensão dos estudantes?' },
  { key: 'nota_q21', numero: 23, pergunta: 'O professor gerenciou bem o tempo para atividades e dúvidas?' },
  { key: 'nota_q22', numero: 24, pergunta: 'O clima da sala é de colaboração, respeito mútuo e favorável à aprendizagem?' },
];

const truncate = (s: string, n = 36) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

export function VisitaMicrociclosBlock({ registros }: Props) {
  if (!registros || registros.length === 0) return null;

  const calcularMedia = (key: string) => {
    const validos = registros.filter(r => {
      const v = r[key] as number | null | undefined;
      return v != null && v > 0;
    });
    if (validos.length === 0) return 0;
    const soma = validos.reduce((acc, r) => acc + ((r[key] as number) || 0), 0);
    return Number((soma / validos.length).toFixed(2));
  };

  const itens = DIMENSOES_MICROCICLOS.map(d => ({
    key: d.key,
    numero: d.numero,
    pergunta: d.pergunta,
    short: truncate(d.pergunta),
    media: calcularMedia(d.key),
  }));

  const validas = itens.filter(i => i.media > 0);
  const mediaGeral = validas.length
    ? Number((validas.reduce((acc, i) => acc + i.media, 0) / validas.length).toFixed(2))
    : 0;

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <h3 className="card-title flex items-center gap-2">
        <ClipboardCheck size={20} className="text-info" />
        Visita Técnica — Microciclos ({registros.length} {registros.length === 1 ? 'visita' : 'visitas'})
      </h3>
      <p className="text-xs text-muted-foreground mb-6 mt-1">
        Média geral: {mediaGeral.toFixed(2)} / 4
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <ResponsiveContainer width="100%" height={Math.max(280, itens.length * 44)}>
            <BarChart data={itens} layout="vertical" margin={{ left: 10, right: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" domain={[0, 4]} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis
                dataKey="short"
                type="category"
                width={180}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => [value.toFixed(2), 'Média']}
                labelFormatter={(_label, payload: any[]) => payload?.[0]?.payload?.pergunta || ''}
              />
              <Bar dataKey="media" fill="hsl(var(--info))" radius={[0, 4, 4, 0]}>
                <LabelList
                  dataKey="media"
                  position="right"
                  formatter={(v: number) => (v ? v.toFixed(1) : '')}
                  style={{ fontSize: '11px', fill: 'hsl(var(--foreground))' }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 content-start">
          {itens.map(item => (
            <div key={item.key} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <ProgressRing
                value={item.media}
                maxValue={4}
                displayAsNumber
                size={48}
                strokeWidth={5}
              />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground break-words">{item.pergunta}</p>
                <p className="font-semibold">{item.media.toFixed(1)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
