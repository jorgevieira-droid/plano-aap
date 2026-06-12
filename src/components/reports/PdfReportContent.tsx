import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Legend } from 'recharts';
import { InstrumentChartData } from '@/hooks/useInstrumentChartData';
import { InstrumentDimensionCharts } from '@/components/charts/InstrumentDimensionCharts';
import { VisitaAlfabetizacaoRedesBlock, RelVisitaAlfaRedes } from '@/components/dashboard/VisitaAlfabetizacaoRedesBlock';
import { VisitaAlfabetizacaoBlock, RelVisitaAlfa } from '@/components/dashboard/VisitaAlfabetizacaoBlock';
import { VisitaTarlBlock, RelVisitaTarl } from '@/components/dashboard/VisitaTarlBlock';

interface ExecucaoData {
  name: string;
  Previstas: number;
  Realizadas: number;
  Canceladas?: number;
}

interface PresencaPorEscola {
  id: string;
  name: string;
  presenca: number;
  totalPresencas: number;
}

interface PresencaPorTipo {
  name: string;
  Presença: number;
  Presentes: number;
  Total: number;
}

interface PdfReportContentProps {
  execucaoData: ExecucaoData[];
  presencaPorEscola: PresencaPorEscola[];
  presencaPorTipo?: PresencaPorTipo[];
  instrumentChartData?: InstrumentChartData[];
  relVisitaAlfaRedes?: RelVisitaAlfaRedes[];
  relVisitaAlfa?: RelVisitaAlfa[];
  relVisitaTarl?: RelVisitaTarl[];
  // Legacy props kept for backwards compat (no longer rendered)
  radarData?: any;
  satisfacaoData?: any;
  totalAvaliacoes?: number;
}

export function PdfReportContent({
  execucaoData,
  presencaPorEscola,
  presencaPorTipo = [],
  instrumentChartData = [],
  relVisitaAlfaRedes = [],
  relVisitaAlfa = [],
  relVisitaTarl = [],
}: PdfReportContentProps) {
  const hasExecucao = execucaoData?.some(d => (d.Previstas || 0) + (d.Realizadas || 0) > 0);
  const hasPresencaTipo = presencaPorTipo.length > 0;
  const hasPresencaEscola = presencaPorEscola?.some(e => e.totalPresencas > 0);

  return (
    <div className="p-6 space-y-6 bg-white text-black">
      {hasExecucao && (
        <div data-pdf-section className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-base font-semibold mb-4">Previsto vs Realizado</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={execucaoData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Previstas" fill="#94a3b8">
                <LabelList dataKey="Previstas" position="top" style={{ fontSize: '10px', fill: '#000' }} formatter={(v: number) => (v ? v : '')} />
              </Bar>
              <Bar dataKey="Realizadas" fill="#3b82f6">
                <LabelList dataKey="Realizadas" position="top" style={{ fontSize: '10px', fill: '#000' }} formatter={(v: number) => (v ? v : '')} />
              </Bar>
              {execucaoData?.some(d => (d.Canceladas || 0) > 0) && (
                <Bar dataKey="Canceladas" fill="#ef4444">
                  <LabelList dataKey="Canceladas" position="top" style={{ fontSize: '10px', fill: '#000' }} formatter={(v: number) => (v ? v : '')} />
                </Bar>
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Each instrument chart is its own PDF section to allow clean page breaks */}
      {instrumentChartData.map(item => (
        <div key={item.formType} data-pdf-section>
          <InstrumentDimensionCharts chartData={[item]} isLoading={false} />
        </div>
      ))}

      {relVisitaAlfaRedes.length > 0 && (
        <div data-pdf-section>
          <VisitaAlfabetizacaoRedesBlock registros={relVisitaAlfaRedes} />
        </div>
      )}

      {relVisitaAlfa.length > 0 && (
        <div data-pdf-section>
          <VisitaAlfabetizacaoBlock registros={relVisitaAlfa} />
        </div>
      )}

      {relVisitaTarl.length > 0 && (
        <div data-pdf-section>
          <VisitaTarlBlock registros={relVisitaTarl} />
        </div>
      )}

      {hasPresencaTipo && (
        <div data-pdf-section className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-base font-semibold mb-4">Presença por Tipo de Ação</h2>
          <ResponsiveContainer width="100%" height={Math.max(220, presencaPorTipo.length * 44)}>
            <BarChart data={presencaPorTipo} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} unit="%" fontSize={11} />
              <YAxis dataKey="name" type="category" fontSize={11} width={220} />
              <Tooltip formatter={(value: number, _name: string, props: any) => [`${value}% (${props.payload.Presentes}/${props.payload.Total})`, 'Presença']} />
              <Bar dataKey="Presença" fill="#3b82f6">
                <LabelList dataKey="Presença" position="right" style={{ fontSize: '10px', fill: '#000' }} formatter={(v: number) => (v ? `${v}%` : '')} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {hasPresencaEscola && (
        <div data-pdf-section className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-base font-semibold mb-4">Presença por Escola</h2>
          <table className="w-full text-[11px]">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left py-1.5 px-2 font-medium border-b border-gray-200">Escola</th>
                <th className="text-right py-1.5 px-2 font-medium border-b border-gray-200 w-20">%</th>
              </tr>
            </thead>
            <tbody>
              {presencaPorEscola.map((escola, index) => (
                <tr key={escola.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="py-1 px-2">{escola.name}</td>
                  <td className="py-1 px-2 text-right font-medium">
                    {escola.totalPresencas > 0 ? `${escola.presenca}%` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
