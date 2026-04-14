import { ProgressRing } from '@/components/ui/ProgressRing';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import { InstrumentChartData } from '@/hooks/useInstrumentChartData';


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
  presencaPorEscola: PresencaPorEscola[];
  radarData: RadarData[];
  satisfacaoData: SatisfacaoData[];
  totalAvaliacoes: number;
  instrumentChartData?: InstrumentChartData[];
}

export function PdfReportContent({
  execucaoData,
  presencaPorEscola,
  radarData,
  satisfacaoData,
  totalAvaliacoes,
  instrumentChartData,
}: PdfReportContentProps) {
  return (
    <div className="p-8 space-y-8 bg-white text-black">
      <h1 className="text-2xl font-bold mb-6">Relatório de Acompanhamento</h1>

      <div>
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
