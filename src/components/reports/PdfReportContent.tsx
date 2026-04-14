import { ClipboardCheck } from 'lucide-react';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import { InstrumentChartData } from '@/hooks/useInstrumentChartData';
import { ACAO_TYPE_INFO, AcaoTipo } from '@/config/acaoPermissions';


interface ExecucaoData {
  name: string;
  Previstas: number;
  Realizadas: number;
}

interface PresencaPorEscola {
  id: string;
  name: string;
  presenca: number;
  totalPresencas: number;
}

interface RadarData {
  subject: string;
  value: number;
  fullMark: number;
}

interface SatisfacaoData {
  name: string;
  media: number;
  cor: string;
}

interface PdfReportContentProps {
  execucaoData: ExecucaoData[];
  desempenhoPorAtor: Record<string, string | number>[];
  enabledTipos: AcaoTipo[];
  presencaPorEscola: PresencaPorEscola[];
  radarData: RadarData[];
  satisfacaoData: SatisfacaoData[];
  totalAvaliacoes: number;
  instrumentChartData?: InstrumentChartData[];
}

const BAR_COLORS_PREV = [
  'hsl(215, 50%, 70%)', 'hsl(160, 40%, 65%)', 'hsl(30, 50%, 65%)', 'hsl(280, 40%, 70%)',
  'hsl(350, 45%, 70%)', 'hsl(190, 45%, 65%)', 'hsl(45, 55%, 65%)', 'hsl(120, 35%, 65%)',
];
const BAR_COLORS_REAL = [
  'hsl(215, 70%, 45%)', 'hsl(160, 60%, 40%)', 'hsl(30, 70%, 45%)', 'hsl(280, 55%, 50%)',
  'hsl(350, 60%, 50%)', 'hsl(190, 60%, 40%)', 'hsl(45, 75%, 45%)', 'hsl(120, 50%, 40%)',
];

export function PdfReportContent({
  execucaoData,
  desempenhoPorAtor,
  enabledTipos,
  presencaPorEscola,
  radarData,
  satisfacaoData,
  totalAvaliacoes,
  instrumentChartData,
}: PdfReportContentProps) {
  return (
    <div className="p-8 space-y-8 bg-white text-black">
      <h1 className="text-2xl font-bold mb-6">Relatório de Acompanhamento</h1>

      <div className="grid grid-cols-2 gap-4">
        <div className="border p-4 rounded-lg">
          <h2 className="font-semibold mb-4">Previsto vs Realizado</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={execucaoData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Previstas" fill="#94a3b8" />
              <Bar dataKey="Realizadas" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="border p-4 rounded-lg">
          <h2 className="font-semibold mb-4">Desempenho por Ator</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={desempenhoPorAtor}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Legend />
              {enabledTipos.map((tipo, i) => {
                const label = ACAO_TYPE_INFO[tipo]?.label || tipo;
                return [
                  <Bar key={`${tipo}_prev`} dataKey={`${label} Prev.`} fill={BAR_COLORS_PREV[i % BAR_COLORS_PREV.length]} />,
                  <Bar key={`${tipo}_real`} dataKey={`${label} Real.`} fill={BAR_COLORS_REAL[i % BAR_COLORS_REAL.length]} />,
                ];
              })}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="border p-4 rounded-lg">
        <h2 className="font-semibold mb-4">Presença por Escola</h2>
        <div className="space-y-2">
          {presencaPorEscola.map((escola) => (
            <div key={escola.id} className="flex items-center justify-between">
              <span className="text-sm">{escola.name}</span>
              <div className="w-64 h-4 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600" 
                  style={{ width: `${(escola.presenca / (escola.totalPresencas || 1)) * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium">
                {Math.round((escola.presenca / (escola.totalPresencas || 1)) * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
