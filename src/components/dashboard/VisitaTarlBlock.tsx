import { ClipboardCheck } from 'lucide-react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, Tooltip,
} from 'recharts';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { CRITERIOS_TARL, DIMENSOES_TARL } from '@/components/formularios/visitaTecnicaTarlShared';

export interface RelVisitaTarl {
  status: string;
  data: string | null;
  [key: string]: unknown;
}

interface Props {
  registros: RelVisitaTarl[];
}

const DIMENSAO_ORDEM = [
  DIMENSOES_TARL.D1, DIMENSOES_TARL.D2, DIMENSOES_TARL.D3, DIMENSOES_TARL.D4, DIMENSOES_TARL.D5,
];

export function VisitaTarlBlock({ registros }: Props) {
  if (!registros || registros.length === 0) return null;

  const calcularMedia = (key: string) => {
    const col = `nota_${key}`;
    const validos = registros.filter(r => {
      const v = r[col] as number | null | undefined;
      return v != null && v > 0;
    });
    if (validos.length === 0) return 0;
    const soma = validos.reduce((acc, r) => acc + ((r[col] as number) || 0), 0);
    return Number((soma / validos.length).toFixed(2));
  };

  const radarData = CRITERIOS_TARL.map(c => ({
    subject: c.codigo,
    fullName: c.titulo,
    value: calcularMedia(c.key),
    fullMark: 4,
  }));

  const ringsPorDimensao = DIMENSAO_ORDEM.map(dim => ({
    dimensao: dim,
    itens: CRITERIOS_TARL
      .filter(c => c.dimensao === dim)
      .map(c => ({
        name: `${c.codigo} — ${c.titulo}`,
        media: calcularMedia(c.key),
      })),
  }));

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <h3 className="card-title mb-6 flex items-center gap-2">
        <ClipboardCheck size={20} className="text-info" />
        Visita Técnica — T@RL ({registros.length} {registros.length === 1 ? 'visita' : 'visitas'})
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-4">Médias por Critério</h4>
          <ResponsiveContainer width="100%" height={420}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
              <PolarRadiusAxis angle={30} domain={[0, 4]} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <Radar name="Média" dataKey="value" stroke="hsl(var(--info))" fill="hsl(var(--info))" fillOpacity={0.5} />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => [value.toFixed(2), 'Média']}
                labelFormatter={(_label, payload: any[]) => payload?.[0]?.payload?.fullName || ''}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-4">Média por Critério (1-4)</h4>
          <div className="space-y-4">
            {ringsPorDimensao.map(grupo => (
              <div key={grupo.dimensao}>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  {grupo.dimensao}
                </p>
                <div className="grid grid-cols-1 gap-3">
                  {grupo.itens.map(item => (
                    <div key={item.name} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <ProgressRing
                        value={item.media}
                        maxValue={4}
                        displayAsNumber
                        size={48}
                        strokeWidth={5}
                      />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground break-words">{item.name}</p>
                        <p className="font-semibold">{item.media.toFixed(1)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
