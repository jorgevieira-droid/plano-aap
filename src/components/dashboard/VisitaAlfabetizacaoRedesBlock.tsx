import { ClipboardCheck } from 'lucide-react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, Tooltip,
} from 'recharts';
import { ProgressRing } from '@/components/ui/ProgressRing';
import {
  CRITERIO_LABELS_CURTOS,
  CRITERIOS,
  DIMENSOES,
} from '@/components/formularios/visitaAlfabetizacaoRedesShared';

export interface RelVisitaAlfaRedes {
  status: string;
  data: string | null;
  [key: string]: unknown;
}

interface Props {
  /** Registros já filtrados (ano/mês) com status 'enviado'. */
  registros: RelVisitaAlfaRedes[];
}

const DIMENSAO_ORDEM = [DIMENSOES.D1, DIMENSOES.D2, DIMENSOES.D3, DIMENSOES.D4];

export function VisitaAlfabetizacaoRedesBlock({ registros }: Props) {
  if (!registros || registros.length === 0) return null;

  const calcularMedia = (criterioNum: number) => {
    const key = `nota_criterio_${criterioNum}`;
    const validos = registros.filter(r => {
      const v = r[key] as number | null | undefined;
      return v != null && v > 0;
    });
    if (validos.length === 0) return 0;
    const soma = validos.reduce((acc, r) => acc + ((r[key] as number) || 0), 0);
    return Number((soma / validos.length).toFixed(2));
  };

  const radarData = CRITERIO_LABELS_CURTOS.map((label, i) => ({
    subject: label,
    value: calcularMedia(i + 1),
    fullMark: 4,
  }));

  const ringsPorDimensao = DIMENSAO_ORDEM.map(dim => ({
    dimensao: dim,
    itens: CRITERIOS
      .filter(c => c.dimensao === dim)
      .map(c => ({
        name: CRITERIO_LABELS_CURTOS[c.numero - 1],
        media: calcularMedia(c.numero),
      })),
  }));

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <h3 className="card-title mb-6 flex items-center gap-2">
        <ClipboardCheck size={20} className="text-info" />
        Visita Técnica — IAB (REDES) ({registros.length} {registros.length === 1 ? 'visita' : 'visitas'})
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar — 12 critérios */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-4">Médias por Critério</h4>
          <ResponsiveContainer width="100%" height={380}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
              <PolarRadiusAxis angle={30} domain={[0, 4]} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <Radar name="Média" dataKey="value" stroke="hsl(var(--info))" fill="hsl(var(--info))" fillOpacity={0.5} />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => [value.toFixed(2), 'Média']}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Progress rings agrupados por dimensão */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-4">Média por Critério (1-4)</h4>
          <div className="space-y-4">
            {ringsPorDimensao.map(grupo => (
              <div key={grupo.dimensao}>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  {grupo.dimensao}
                </p>
                <div className="grid grid-cols-2 gap-3">
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
