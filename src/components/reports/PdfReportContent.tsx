import { Eye, ClipboardCheck } from 'lucide-react';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import { InstrumentChartData } from '@/hooks/useInstrumentChartData';

interface SegmentoDistribuicao {
  name: string;
  percentual: number;
  color: string;
}

interface ExecucaoData {
  name: string;
  Previstas: number;
  Realizadas: number;
}

interface PresencaPorAAP {
  name: string;
  presenca: number;
  formacoes: number;
  visitas: number;
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
  formacoesRealizadas: number;
  formacoesPrevistas: number;
  visitasRealizadas: number;
  visitasPrevistas: number;
  acompanhamentosRealizados: number;
  acompanhamentosPrevistas: number;
  totalPresentes: number;
  totalPresencas: number;
  percentualPresenca: number;
  segmentoDistribuicao: SegmentoDistribuicao[];
  execucaoData: ExecucaoData[];
  presencaPorAAP: PresencaPorAAP[];
  presencaPorEscola: PresencaPorEscola[];
  radarData: RadarData[];
  satisfacaoData: SatisfacaoData[];
  totalAvaliacoes: number;
  instrumentChartData?: InstrumentChartData[];
}

export function PdfReportContent({
  formacoesRealizadas,
  formacoesPrevistas,
  visitasRealizadas,
  visitasPrevistas,
  acompanhamentosRealizados,
  acompanhamentosPrevistas,
  totalPresentes,
  totalPresencas,
  percentualPresenca,
  segmentoDistribuicao,
  execucaoData,
  presencaPorAAP,
  presencaPorEscola,
  radarData,
  satisfacaoData,
  totalAvaliacoes,
  instrumentChartData,
}: PdfReportContentProps) {
  // PDF uses fixed pixel values instead of responsive classes
  const StatCard = ({ children }: { children: React.ReactNode }) => (
    <div style={{
      backgroundColor: 'hsl(var(--card))',
      border: '1px solid hsl(var(--border))',
      borderRadius: '12px',
      padding: '16px',
      minWidth: 0,
    }}>
      {children}
    </div>
  );

  const ChartCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{
      backgroundColor: 'hsl(var(--card))',
      border: '1px solid hsl(var(--border))',
      borderRadius: '12px',
      padding: '24px',
      minWidth: 0,
    }}>
      <h3 style={{ 
        fontSize: '16px', 
        fontWeight: 600, 
        marginBottom: '24px',
        color: 'hsl(var(--foreground))'
      }}>
        {title}
      </h3>
      {children}
    </div>
  );

  return (
    <div style={{ 
      width: '1200px',
      minWidth: '1200px',
      maxWidth: '1200px',
      backgroundColor: 'hsl(var(--background))',
      padding: '8px',
    }}>
      {/* Summary Cards - Always 6 columns for PDF */}
      <div data-pdf-section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gap: '8px',
        marginBottom: '8px',
      }}>
        <StatCard>
          <p style={{ fontSize: '14px', color: 'hsl(var(--muted-foreground))' }}>Formações</p>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: 'hsl(var(--foreground))' }}>
            {formacoesRealizadas}/{formacoesPrevistas}
          </p>
          <div style={{ marginTop: '8px', height: '4px', backgroundColor: 'hsl(var(--muted))', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ 
              height: '100%', 
              backgroundColor: 'hsl(var(--primary))', 
              width: `${formacoesPrevistas > 0 ? (formacoesRealizadas/formacoesPrevistas) * 100 : 0}%`,
              borderRadius: '2px',
            }} />
          </div>
        </StatCard>

        <StatCard>
          <p style={{ fontSize: '14px', color: 'hsl(var(--muted-foreground))' }}>Visitas</p>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: 'hsl(var(--foreground))' }}>
            {visitasRealizadas}/{visitasPrevistas}
          </p>
          <div style={{ marginTop: '8px', height: '4px', backgroundColor: 'hsl(var(--muted))', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ 
              height: '100%', 
              backgroundColor: 'hsl(var(--primary))', 
              width: `${visitasPrevistas > 0 ? (visitasRealizadas/visitasPrevistas) * 100 : 0}%`,
              borderRadius: '2px',
            }} />
          </div>
        </StatCard>

        <StatCard>
          <p style={{ fontSize: '14px', color: 'hsl(var(--muted-foreground))', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Eye size={14} />
            Acompanhamentos
          </p>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: 'hsl(var(--foreground))' }}>
            {acompanhamentosRealizados}/{acompanhamentosPrevistas}
          </p>
          <div style={{ marginTop: '8px', height: '4px', backgroundColor: 'hsl(var(--muted))', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ 
              height: '100%', 
              backgroundColor: 'hsl(var(--primary))', 
              width: `${acompanhamentosPrevistas > 0 ? (acompanhamentosRealizados/acompanhamentosPrevistas) * 100 : 0}%`,
              borderRadius: '2px',
            }} />
          </div>
        </StatCard>

        <StatCard>
          <p style={{ fontSize: '14px', color: 'hsl(var(--muted-foreground))' }}>Professores Formados</p>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: 'hsl(var(--foreground))' }}>{totalPresentes}</p>
          <p style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))', marginTop: '4px' }}>participações registradas</p>
        </StatCard>

        <StatCard>
          <p style={{ fontSize: '14px', color: 'hsl(var(--muted-foreground))' }}>Taxa de Presença</p>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: 'hsl(var(--accent))' }}>{Math.round(percentualPresenca)}%</p>
          <p style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))', marginTop: '4px' }}>{totalPresentes} de {totalPresencas}</p>
        </StatCard>

        <StatCard>
          <p style={{ fontSize: '14px', color: 'hsl(var(--muted-foreground))', marginBottom: '8px' }}>% de ações por segmento</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {segmentoDistribuicao.map((seg) => (
              <div key={seg.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: 'hsl(var(--muted-foreground))', fontSize: '12px' }}>{seg.name}</span>
                <span style={{ fontWeight: 600 }}>{seg.percentual}%</span>
              </div>
            ))}
          </div>
        </StatCard>
      </div>

      {/* Charts Row 1 - Always 2 columns for PDF */}
      <div data-pdf-section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '8px',
        marginBottom: '8px',
      }}>
        <ChartCard title="Previsto vs Realizado">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={execucaoData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip 
                contentStyle={{ 
                  background: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Bar dataKey="Previstas" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Realizadas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Desempenho por AAP">
          {presencaPorAAP.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={presencaPorAAP}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip 
                  contentStyle={{ 
                    background: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Bar dataKey="formacoes" name="Formações" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="visitas" name="Visitas" fill="hsl(var(--info))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ textAlign: 'center', color: 'hsl(var(--muted-foreground))', padding: '32px 0' }}>Nenhum dado disponível</p>
          )}
        </ChartCard>
      </div>

      {/* Charts Row 2 - Always 2 columns for PDF */}
      <div data-pdf-section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '8px',
      }}>
        {/* Presence by School */}
        <div style={{
          backgroundColor: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          borderRadius: '12px',
          padding: '24px',
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: 'hsl(var(--foreground))' }}>
            Presença por Escola
          </h3>
          <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: 'hsl(var(--muted))' }}>
                <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 500, color: 'hsl(var(--muted-foreground))', borderBottom: '1px solid hsl(var(--border))' }}>Escola</th>
                <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 500, color: 'hsl(var(--muted-foreground))', borderBottom: '1px solid hsl(var(--border))' }}>%</th>
              </tr>
            </thead>
            <tbody>
              {presencaPorEscola.filter(e => e.totalPresencas > 0).map((escola, index) => (
                <tr key={escola.id} style={{ backgroundColor: index % 2 === 0 ? 'hsl(var(--background))' : 'hsl(var(--muted) / 0.3)' }}>
                  <td style={{ padding: '4px 8px', color: 'hsl(var(--foreground))', lineHeight: 1.4 }}>{escola.name}</td>
                  <td style={{ padding: '4px 8px', textAlign: 'right' }}>
                    <span style={{
                      fontWeight: 500,
                      color: escola.presenca >= 80 ? 'hsl(var(--success))' : 
                             escola.presenca >= 50 ? 'hsl(var(--warning))' : 
                             escola.presenca > 0 ? 'hsl(var(--destructive))' : 'hsl(var(--muted-foreground))'
                    }}>
                      {escola.totalPresencas > 0 ? `${escola.presenca}%` : '-'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {presencaPorEscola.length === 0 && (
            <p style={{ textAlign: 'center', color: 'hsl(var(--muted-foreground))', padding: '32px 0' }}>Nenhuma escola encontrada</p>
          )}
        </div>

        {/* Acompanhamento de Aula */}
        <div style={{
          backgroundColor: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          borderRadius: '12px',
          padding: '24px',
        }}>
          <h3 style={{ 
            fontSize: '16px', 
            fontWeight: 600, 
            marginBottom: '16px', 
            color: 'hsl(var(--foreground))',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Eye size={20} style={{ color: 'hsl(var(--warning))' }} />
            Acompanhamento de Aula ({totalAvaliacoes} avaliações)
          </h3>
          
          {totalAvaliacoes > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Radar Chart */}
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 500, color: 'hsl(var(--muted-foreground))', marginBottom: '12px' }}>
                  Médias por Dimensão
                </h4>
                <ResponsiveContainer width="100%" height={200}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <Radar name="Média" dataKey="value" stroke="hsl(var(--warning))" fill="hsl(var(--warning))" fillOpacity={0.5} />
                    <Tooltip 
                      contentStyle={{ 
                        background: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => [value.toFixed(2), 'Média']}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Média por Critério */}
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 500, color: 'hsl(var(--muted-foreground))', marginBottom: '12px' }}>
                  Média por Critério (1-5)
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {satisfacaoData.map(item => (
                    <div key={item.name} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px', 
                      padding: '8px',
                      backgroundColor: 'hsl(var(--muted) / 0.3)',
                      borderRadius: '8px'
                    }}>
                      <ProgressRing 
                        value={item.media} 
                        maxValue={5}
                        displayAsNumber
                        size={40} 
                        strokeWidth={4}
                      />
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <p style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))' }}>{item.name}</p>
                        <p style={{ fontWeight: 600 }}>{item.media.toFixed(1)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: 'hsl(var(--muted-foreground))', padding: '32px 0' }}>Nenhuma avaliação registrada</p>
          )}
        </div>
      </div>

      {/* Instrument Dimension Charts */}
      {instrumentChartData && instrumentChartData.length > 0 && (
        <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {instrumentChartData.map(item => {
            const barData = item.dimensions.map(d => ({
              name: d.label.length > 30 ? d.label.slice(0, 29) + '…' : d.label,
              fullName: d.label,
              Média: d.average,
              scaleMax: d.scaleMax,
            }));
            const scaleMax = item.dimensions[0]?.scaleMax || 5;
            const overallAvg = item.dimensions.reduce((s, d) => s + d.average, 0) / item.dimensions.length;

            return (
              <div key={item.formType} data-pdf-section style={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '12px',
                padding: '24px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <ClipboardCheck size={20} style={{ color: 'hsl(var(--primary))' }} />
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'hsl(var(--foreground))' }}>
                    {item.formLabel}
                  </h3>
                </div>
                <p style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))', marginBottom: '16px' }}>
                  {item.totalResponses} {item.totalResponses === 1 ? 'resposta' : 'respostas'} • Média geral: {overallAvg.toFixed(2)} / {scaleMax}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <div style={{ width: '520px', height: Math.max(200, barData.length * 40) + 'px' }}>
                    <BarChart data={barData} layout="vertical" width={520} height={Math.max(200, barData.length * 40)} margin={{ left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" domain={[0, scaleMax]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <YAxis dataKey="name" type="category" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} width={180} />
                      <Tooltip
                        contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                        formatter={(value: number, _: any, props: any) => [`${value.toFixed(2)} / ${props.payload.scaleMax}`, 'Média']}
                        labelFormatter={(label: string, payload: any[]) => payload?.[0]?.payload?.fullName || label}
                      />
                      <Bar dataKey="Média" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', alignContent: 'start' }}>
                    {item.dimensions.map(d => (
                      <div key={d.fieldKey} style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '10px', backgroundColor: 'hsl(var(--muted) / 0.3)', borderRadius: '8px',
                      }}>
                        <ProgressRing value={d.average} maxValue={d.scaleMax} displayAsNumber size={46} strokeWidth={5} />
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', lineHeight: 1.3 }}>{d.label}</p>
                          <p style={{ fontWeight: 600, fontSize: '13px' }}>{d.average.toFixed(1)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
