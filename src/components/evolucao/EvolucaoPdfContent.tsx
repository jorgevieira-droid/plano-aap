import { cn } from '@/lib/utils';

interface Professor {
  id: string;
  nome: string;
  componente: string;
  ano_serie: string;
  segmento: string;
}

interface Escola {
  id: string;
  nome: string;
}

interface AAP {
  id: string;
  nome: string;
}

interface RegistroAvaliacaoAula {
  id: string;
  data: string;
  aap_nome: string;
  clareza_objetivos: number;
  dominio_conteudo: number;
  estrategias_didaticas: number;
  engajamento_turma: number;
  gestao_tempo: number;
  observacoes: string | null;
}

interface EvolucaoPdfContentProps {
  professor: Professor | null;
  escola: Escola | null;
  aap: AAP | null;
  avaliacoes: RegistroAvaliacaoAula[];
  dimensoesLabels: Record<string, string>;
  componenteLabels: Record<string, string>;
  segmentoLabels: Record<string, string>;
}

const dimensoesKeys = [
  'clareza_objetivos',
  'dominio_conteudo',
  'estrategias_didaticas',
  'engajamento_turma',
  'gestao_tempo',
] as const;

// Colors for each dimension
const dimensionColors: Record<string, string> = {
  clareza_objetivos: '#3b82f6',
  dominio_conteudo: '#22c55e',
  estrategias_didaticas: '#f59e0b',
  engajamento_turma: '#ef4444',
  gestao_tempo: '#8b5cf6',
};

const getColorStyle = (value: number): React.CSSProperties => {
  if (value >= 4.5) return { backgroundColor: 'hsl(142 76% 36%)', color: 'white' };
  if (value >= 3.5) return { backgroundColor: 'hsl(142 76% 50% / 0.6)', color: 'hsl(var(--foreground))' };
  if (value >= 2.5) return { backgroundColor: 'hsl(38 92% 50% / 0.6)', color: 'hsl(var(--foreground))' };
  if (value >= 1.5) return { backgroundColor: 'hsl(38 92% 50% / 0.9)', color: 'hsl(var(--foreground))' };
  return { backgroundColor: 'hsl(0 84% 60% / 0.6)', color: 'white' };
};

export function EvolucaoPdfContent({
  professor,
  escola,
  aap,
  avaliacoes,
  dimensoesLabels,
  componenteLabels,
  segmentoLabels,
}: EvolucaoPdfContentProps) {
  if (!professor || avaliacoes.length === 0) return null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  const formatDateLong = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const observacoesComTexto = avaliacoes.filter(a => a.observacoes && a.observacoes.trim().length > 0);

  return (
    <div style={{ 
      width: '1000px',
      minWidth: '1000px',
      maxWidth: '1000px',
      backgroundColor: '#ffffff',
      padding: '16px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      {/* Professor Summary */}
      <div style={{
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '24px',
      }}>
        <h2 style={{ 
          fontSize: '18px', 
          fontWeight: 600, 
          marginBottom: '12px',
          color: '#1e293b',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span style={{ color: '#eab308' }}>👁</span>
          Histórico — Acompanhamento de Aula
        </h2>
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '24px',
          fontSize: '14px',
        }}>
          <div>
            <span style={{ color: '#64748b' }}>Professor:</span>{' '}
            <span style={{ fontWeight: 500 }}>{professor.nome}</span>
          </div>
          <div>
            <span style={{ color: '#64748b' }}>Escola:</span>{' '}
            <span style={{ fontWeight: 500 }}>{escola?.nome}</span>
          </div>
          <div>
            <span style={{ color: '#64748b' }}>AAP:</span>{' '}
            <span style={{ fontWeight: 500 }}>{aap?.nome}</span>
          </div>
          {professor.segmento && (
            <div>
              <span style={{ color: '#64748b' }}>Segmento:</span>{' '}
              <span style={{ fontWeight: 500 }}>{segmentoLabels[professor.segmento] || professor.segmento}</span>
            </div>
          )}
          {professor.componente && (
            <div>
              <span style={{ color: '#64748b' }}>Componente:</span>{' '}
              <span style={{ fontWeight: 500 }}>{componenteLabels[professor.componente] || professor.componente}</span>
            </div>
          )}
        </div>
      </div>

      {/* Chart Section - Bar Chart by Visit */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '24px',
      }}>
        <h3 style={{ 
          fontSize: '16px', 
          fontWeight: 600, 
          marginBottom: '16px',
          color: '#1e293b',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          📊 Evolução por Visita
          {avaliacoes.length >= 2 && (() => {
            const firstVisitAvg = dimensoesKeys.reduce((sum, key) => sum + avaliacoes[0][key], 0) / dimensoesKeys.length;
            const lastVisitAvg = dimensoesKeys.reduce((sum, key) => sum + avaliacoes[avaliacoes.length - 1][key], 0) / dimensoesKeys.length;
            const trend = lastVisitAvg - firstVisitAvg;
            return (
              <span style={{ 
                fontSize: '13px', 
                fontWeight: 400, 
                color: trend >= 0 ? '#22c55e' : '#ef4444',
              }}>
                ({trend >= 0 ? '+' : ''}{trend.toFixed(2)} pontos desde a primeira visita)
              </span>
            );
          })()}
        </h3>
        
        {/* Simple Bar Chart using divs */}
        <div style={{ marginBottom: '16px' }}>
          {avaliacoes.map((avaliacao, visitIdx) => (
            <div key={avaliacao.id} style={{ marginBottom: '16px' }}>
              <div style={{ 
                fontSize: '12px', 
                fontWeight: 500, 
                color: '#64748b',
                marginBottom: '8px',
              }}>
                Visita {visitIdx + 1} ({formatDate(avaliacao.data)})
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', height: '60px' }}>
                {dimensoesKeys.map((key) => {
                  const value = avaliacao[key];
                  const heightPercent = (value / 5) * 100;
                  return (
                    <div 
                      key={key}
                      style={{ 
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        height: '100%',
                        justifyContent: 'flex-end',
                      }}
                    >
                      <span style={{ 
                        fontSize: '10px', 
                        fontWeight: 600,
                        marginBottom: '2px',
                        color: '#334155',
                      }}>
                        {value}
                      </span>
                      <div style={{
                        width: '100%',
                        height: `${heightPercent}%`,
                        backgroundColor: dimensionColors[key],
                        borderRadius: '4px 4px 0 0',
                        minHeight: '4px',
                      }} />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        
        {/* Dimension Labels */}
        <div style={{ 
          display: 'flex', 
          gap: '8px',
          borderTop: '1px solid #e2e8f0',
          paddingTop: '12px',
        }}>
          {dimensoesKeys.map((key) => (
            <div 
              key={key}
              style={{ 
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: dimensionColors[key],
              }} />
              <span style={{ 
                fontSize: '9px', 
                color: '#64748b',
                textAlign: 'center',
                lineHeight: 1.2,
              }}>
                {dimensoesLabels[key]}
              </span>
            </div>
          ))}
        </div>

        {/* Summary Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: '8px',
          marginTop: '16px',
        }}>
          {dimensoesKeys.map((key) => {
            const values = avaliacoes.map(a => a[key]);
            const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
            const delta = values.length >= 2 ? values[values.length - 1] - values[0] : 0;
            
            return (
              <div 
                key={key}
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '10px',
                  textAlign: 'center',
                }}
              >
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: dimensionColors[key],
                  margin: '0 auto 6px',
                }} />
                <div style={{ fontSize: '9px', color: '#64748b', marginBottom: '4px' }}>
                  {dimensoesLabels[key]}
                </div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: dimensionColors[key] }}>
                  {avg.toFixed(1)}
                </div>
                {avaliacoes.length >= 2 && delta !== 0 && (
                  <div style={{ 
                    fontSize: '10px', 
                    color: delta >= 0 ? '#22c55e' : '#ef4444',
                  }}>
                    {delta >= 0 ? '↑' : '↓'}{Math.abs(delta).toFixed(1)}
                  </div>
                )}
              </div>
            );
          })}
          
          {/* Overall Average Card */}
          {(() => {
            const overallAvg = dimensoesKeys.reduce((sum, key) => {
              const values = avaliacoes.map(a => a[key]);
              return sum + values.reduce((s, v) => s + v, 0) / values.length;
            }, 0) / dimensoesKeys.length;
            
            const firstVisitAvg = dimensoesKeys.reduce((sum, key) => sum + avaliacoes[0][key], 0) / dimensoesKeys.length;
            const lastVisitAvg = dimensoesKeys.reduce((sum, key) => sum + avaliacoes[avaliacoes.length - 1][key], 0) / dimensoesKeys.length;
            const trend = lastVisitAvg - firstVisitAvg;
            
            return (
              <div style={{
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '6px',
                padding: '10px',
                textAlign: 'center',
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#3b82f6',
                  margin: '0 auto 6px',
                }} />
                <div style={{ fontSize: '9px', color: '#64748b', marginBottom: '4px' }}>
                  Média Geral
                </div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#3b82f6' }}>
                  {overallAvg.toFixed(1)}
                </div>
                {avaliacoes.length >= 2 && trend !== 0 && (
                  <div style={{ 
                    fontSize: '10px', 
                    color: trend >= 0 ? '#22c55e' : '#ef4444',
                  }}>
                    {trend >= 0 ? '↑' : '↓'}{Math.abs(trend).toFixed(1)}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Evolution Matrix */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '24px',
      }}>
        <h3 style={{ 
          fontSize: '16px', 
          fontWeight: 600, 
          marginBottom: '16px',
          color: '#1e293b',
        }}>
          Matriz de Evolução por Dimensão
        </h3>
        <table style={{
          width: '100%', 
          borderCollapse: 'collapse',
          fontSize: '12px',
        }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ 
                textAlign: 'left', 
                padding: '12px 8px', 
                fontWeight: 500,
                color: '#64748b',
                minWidth: '160px',
              }}>
                Dimensão
              </th>
              {avaliacoes.map((avaliacao, idx) => (
                <th 
                  key={avaliacao.id} 
                  style={{ 
                    textAlign: 'center', 
                    padding: '12px 4px', 
                    fontWeight: 500,
                    color: '#64748b',
                    minWidth: '70px',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                    <span style={{ fontSize: '10px' }}>{formatDate(avaliacao.data)}</span>
                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>#{idx + 1}</span>
                  </div>
                </th>
              ))}
              <th style={{ 
                textAlign: 'center', 
                padding: '12px 4px', 
                fontWeight: 600,
                backgroundColor: '#f1f5f9',
                minWidth: '70px',
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                  <span style={{ fontSize: '10px' }}>Média</span>
                  <span style={{ fontSize: '10px', color: '#94a3b8' }}>Geral</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {dimensoesKeys.map((dimensao) => {
              const values = avaliacoes.map(a => a[dimensao]);
              const media = values.reduce((sum, v) => sum + v, 0) / values.length;
              
              return (
                <tr key={dimensao} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ 
                    padding: '10px 8px', 
                    fontWeight: 500,
                    color: '#334155',
                  }}>
                    {dimensoesLabels[dimensao]}
                  </td>
                  {avaliacoes.map((avaliacao) => {
                    const value = avaliacao[dimensao];
                    return (
                      <td key={avaliacao.id} style={{ textAlign: 'center', padding: '8px 4px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '36px',
                          height: '36px',
                          borderRadius: '6px',
                          fontWeight: 700,
                          fontSize: '14px',
                          ...getColorStyle(value),
                        }}>
                          {value}
                        </span>
                      </td>
                    );
                  })}
                  <td style={{ 
                    textAlign: 'center', 
                    padding: '8px 4px',
                    backgroundColor: '#f1f5f9',
                  }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '44px',
                      height: '36px',
                      borderRadius: '6px',
                      fontWeight: 700,
                      fontSize: '14px',
                      ...getColorStyle(media),
                    }}>
                      {media.toFixed(1)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ backgroundColor: '#f8fafc' }}>
              <td style={{ 
                padding: '12px 8px', 
                fontWeight: 600,
                color: '#1e293b',
              }}>
                Média da Visita
              </td>
              {avaliacoes.map((avaliacao) => {
                const visitaMedia = dimensoesKeys.reduce((sum, key) => sum + avaliacao[key], 0) / dimensoesKeys.length;
                return (
                  <td key={avaliacao.id} style={{ textAlign: 'center', padding: '8px 4px' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '36px',
                      height: '36px',
                      borderRadius: '6px',
                      fontWeight: 700,
                      fontSize: '14px',
                      ...getColorStyle(visitaMedia),
                    }}>
                      {visitaMedia.toFixed(1)}
                    </span>
                  </td>
                );
              })}
              <td style={{ 
                textAlign: 'center', 
                padding: '8px 4px',
                backgroundColor: '#f1f5f9',
              }}>
                {(() => {
                  const overallMedia = avaliacoes.reduce((sum, a) => 
                    sum + dimensoesKeys.reduce((s, key) => s + a[key], 0) / dimensoesKeys.length
                  , 0) / avaliacoes.length;
                  return (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '44px',
                      height: '36px',
                      borderRadius: '6px',
                      fontWeight: 700,
                      fontSize: '14px',
                      ...getColorStyle(overallMedia),
                    }}>
                      {overallMedia.toFixed(1)}
                    </span>
                  );
                })()}
              </td>
            </tr>
          </tfoot>
        </table>
        
        {/* Legend */}
        <div style={{ 
          marginTop: '16px', 
          display: 'flex', 
          flexWrap: 'wrap',
          alignItems: 'center', 
          gap: '16px',
          fontSize: '11px',
          color: '#64748b',
        }}>
          <span style={{ fontWeight: 500 }}>Legenda:</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '14px', height: '14px', borderRadius: '3px', backgroundColor: 'hsl(142 76% 36%)' }} />
            <span>5 - Excelente</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '14px', height: '14px', borderRadius: '3px', backgroundColor: 'hsl(142 76% 50% / 0.6)' }} />
            <span>4 - Bom</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '14px', height: '14px', borderRadius: '3px', backgroundColor: 'hsl(38 92% 50% / 0.6)' }} />
            <span>3 - Adequado</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '14px', height: '14px', borderRadius: '3px', backgroundColor: 'hsl(38 92% 50% / 0.9)' }} />
            <span>2 - Insatisfatório</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '14px', height: '14px', borderRadius: '3px', backgroundColor: 'hsl(0 84% 60% / 0.6)' }} />
            <span>1 - Muito Insatisfatório</span>
          </div>
        </div>
      </div>

      {/* Observations Section */}
      {observacoesComTexto.length > 0 && (
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '16px',
        }}>
          <h3 style={{ 
            fontSize: '16px', 
            fontWeight: 600, 
            marginBottom: '16px',
            color: '#1e293b',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span style={{ color: '#3b82f6' }}>💬</span>
            Observações
            <span style={{ 
              fontSize: '13px', 
              fontWeight: 400, 
              color: '#64748b',
            }}>
              ({observacoesComTexto.length} {observacoesComTexto.length === 1 ? 'registro' : 'registros'})
            </span>
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {observacoesComTexto.map((avaliacao) => (
              <div 
                key={avaliacao.id}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  backgroundColor: '#f8fafc',
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  marginBottom: '8px',
                  fontSize: '13px',
                  color: '#64748b',
                }}>
                  <span>📅</span>
                  <span style={{ fontWeight: 500 }}>{formatDateLong(avaliacao.data)}</span>
                  {avaliacao.aap_nome && (
                    <>
                      <span>•</span>
                      <span>{avaliacao.aap_nome}</span>
                    </>
                  )}
                </div>
                <p style={{ 
                  fontSize: '13px', 
                  lineHeight: 1.6,
                  color: '#334155',
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                }}>
                  {avaliacao.observacoes}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
