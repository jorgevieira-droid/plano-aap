import type { DynamicAvaliacao } from './EvolucaoLineChart';

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

interface EvolucaoPdfContentProps {
  professor: Professor | null;
  escola: Escola | null;
  aap?: { id: string; nome: string } | null;
  avaliacoes: DynamicAvaliacao[];
  dimensoesLabels: Record<string, string>;
  dimensoesKeys: string[];
  componenteLabels: Record<string, string>;
  segmentoLabels: Record<string, string>;
  textFieldLabels?: Record<string, string>;
  scaleMax?: number;
}

const COLORS_PALETTE = [
  '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#ec4899', '#eab308', '#14b8a6', '#a855f7',
  '#f97316', '#0ea5e9',
];

const getColorStyle = (value: number, scaleMax: number = 4): React.CSSProperties => {
  const ratio = value / scaleMax;
  if (ratio >= 0.9) return { backgroundColor: 'hsl(142 76% 36%)', color: 'white' };
  if (ratio >= 0.7) return { backgroundColor: 'hsl(142 76% 50% / 0.6)', color: '#1e293b' };
  if (ratio >= 0.5) return { backgroundColor: 'hsl(38 92% 50% / 0.6)', color: '#1e293b' };
  if (ratio >= 0.3) return { backgroundColor: 'hsl(38 92% 50% / 0.9)', color: '#1e293b' };
  return { backgroundColor: 'hsl(0 84% 60% / 0.6)', color: 'white' };
};

export function EvolucaoPdfContent({
  professor,
  escola,
  aap,
  avaliacoes,
  dimensoesLabels,
  dimensoesKeys,
  componenteLabels,
  segmentoLabels,
  textFieldLabels,
  scaleMax = 4,
}: EvolucaoPdfContentProps) {
  if (!professor || avaliacoes.length === 0 || dimensoesKeys.length === 0) return null;

  const getColor = (idx: number) => COLORS_PALETTE[idx % COLORS_PALETTE.length];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  const formatDateLong = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const observacoesComTexto = avaliacoes.filter(a => 
    Object.values(a.textFields).some(v => v && v.trim().length > 0)
  );

  return (
    <div style={{ 
      width: '1000px', minWidth: '1000px', maxWidth: '1000px',
      backgroundColor: '#ffffff', padding: '16px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      {/* Professor Summary */}
      <div style={{
        backgroundColor: '#f8fafc', border: '1px solid #e2e8f0',
        borderRadius: '8px', padding: '16px', marginBottom: '24px',
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#eab308' }}>👁</span>
          Histórico — Observação de Aula
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', fontSize: '14px' }}>
          <div>
            <span style={{ color: '#64748b' }}>Professor:</span>{' '}
            <span style={{ fontWeight: 500 }}>{professor.nome}</span>
          </div>
          <div>
            <span style={{ color: '#64748b' }}>Entidade:</span>{' '}
            <span style={{ fontWeight: 500 }}>{escola?.nome}</span>
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
        backgroundColor: '#ffffff', border: '1px solid #e2e8f0',
        borderRadius: '8px', padding: '16px', marginBottom: '24px',
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
          📊 Evolução por Visita
          {avaliacoes.length >= 2 && (() => {
            const firstAvg = dimensoesKeys.reduce((sum, key) => sum + (avaliacoes[0].ratings[key] ?? 0), 0) / dimensoesKeys.length;
            const lastAvg = dimensoesKeys.reduce((sum, key) => sum + (avaliacoes[avaliacoes.length - 1].ratings[key] ?? 0), 0) / dimensoesKeys.length;
            const trend = lastAvg - firstAvg;
            return (
              <span style={{ fontSize: '13px', fontWeight: 400, color: trend >= 0 ? '#22c55e' : '#ef4444' }}>
                ({trend >= 0 ? '+' : ''}{trend.toFixed(2)} pontos desde a primeira visita)
              </span>
            );
          })()}
        </h3>
        
        <div style={{ marginBottom: '16px' }}>
          {avaliacoes.map((avaliacao, visitIdx) => (
            <div key={avaliacao.id} style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 500, color: '#64748b', marginBottom: '8px' }}>
                Visita {visitIdx + 1} ({formatDate(avaliacao.data)})
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', height: '60px' }}>
                {dimensoesKeys.map((key, idx) => {
                  const value = avaliacao.ratings[key] ?? 0;
                  const heightPercent = (value / scaleMax) * 100;
                  return (
                    <div key={key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: '10px', fontWeight: 600, marginBottom: '2px', color: '#334155' }}>{value}</span>
                      <div style={{ width: '100%', height: `${heightPercent}%`, backgroundColor: getColor(idx), borderRadius: '4px 4px 0 0', minHeight: '4px' }} />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        
        {/* Dimension Labels */}
        <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
          {dimensoesKeys.map((key, idx) => (
            <div key={key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: getColor(idx) }} />
              <span style={{ fontSize: '9px', color: '#64748b', textAlign: 'center', lineHeight: 1.2 }}>
                {dimensoesLabels[key] || key}
              </span>
            </div>
          ))}
        </div>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(dimensoesKeys.length + 1, 6)}, 1fr)`, gap: '8px', marginTop: '16px' }}>
          {dimensoesKeys.map((key, idx) => {
            const values = avaliacoes.map(a => a.ratings[key] ?? 0);
            const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
            const delta = values.length >= 2 ? values[values.length - 1] - values[0] : 0;
            return (
              <div key={key} style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px', textAlign: 'center' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: getColor(idx), margin: '0 auto 6px' }} />
                <div style={{ fontSize: '9px', color: '#64748b', marginBottom: '4px' }}>{dimensoesLabels[key] || key}</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: getColor(idx) }}>{avg.toFixed(1)}</div>
                {avaliacoes.length >= 2 && delta !== 0 && (
                  <div style={{ fontSize: '10px', color: delta >= 0 ? '#22c55e' : '#ef4444' }}>
                    {delta >= 0 ? '↑' : '↓'}{Math.abs(delta).toFixed(1)}
                  </div>
                )}
              </div>
            );
          })}
          {/* Overall Average */}
          {(() => {
            const overallAvg = dimensoesKeys.reduce((sum, key) => {
              const values = avaliacoes.map(a => a.ratings[key] ?? 0);
              return sum + values.reduce((s, v) => s + v, 0) / values.length;
            }, 0) / dimensoesKeys.length;
            const firstAvg = dimensoesKeys.reduce((sum, key) => sum + (avaliacoes[0].ratings[key] ?? 0), 0) / dimensoesKeys.length;
            const lastAvg = dimensoesKeys.reduce((sum, key) => sum + (avaliacoes[avaliacoes.length - 1].ratings[key] ?? 0), 0) / dimensoesKeys.length;
            const trend = lastAvg - firstAvg;
            return (
              <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '10px', textAlign: 'center' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3b82f6', margin: '0 auto 6px' }} />
                <div style={{ fontSize: '9px', color: '#64748b', marginBottom: '4px' }}>Média Geral</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#3b82f6' }}>{overallAvg.toFixed(1)}</div>
                {avaliacoes.length >= 2 && trend !== 0 && (
                  <div style={{ fontSize: '10px', color: trend >= 0 ? '#22c55e' : '#ef4444' }}>
                    {trend >= 0 ? '↑' : '↓'}{Math.abs(trend).toFixed(1)}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Evolution Matrix */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: '#1e293b' }}>
          Matriz de Evolução por Dimensão
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ textAlign: 'left', padding: '12px 8px', fontWeight: 500, color: '#64748b', minWidth: '160px' }}>Dimensão</th>
              {avaliacoes.map((avaliacao, idx) => (
                <th key={avaliacao.id} style={{ textAlign: 'center', padding: '12px 4px', fontWeight: 500, color: '#64748b', minWidth: '70px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                    <span style={{ fontSize: '10px' }}>{formatDate(avaliacao.data)}</span>
                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>#{idx + 1}</span>
                  </div>
                </th>
              ))}
              <th style={{ textAlign: 'center', padding: '12px 4px', fontWeight: 600, backgroundColor: '#f1f5f9', minWidth: '70px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                  <span style={{ fontSize: '10px' }}>Média</span>
                  <span style={{ fontSize: '10px', color: '#94a3b8' }}>Geral</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {dimensoesKeys.map((dimensao) => {
              const values = avaliacoes.map(a => a.ratings[dimensao] ?? 0);
              const media = values.reduce((sum, v) => sum + v, 0) / values.length;
              return (
                <tr key={dimensao} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 8px', fontWeight: 500, color: '#334155' }}>{dimensoesLabels[dimensao] || dimensao}</td>
                  {avaliacoes.map((avaliacao) => {
                    const value = avaliacao.ratings[dimensao] ?? 0;
                    return (
                      <td key={avaliacao.id} style={{ textAlign: 'center', padding: '8px 4px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '6px', fontWeight: 700, fontSize: '14px', ...getColorStyle(value, scaleMax) }}>
                          {value}
                        </span>
                      </td>
                    );
                  })}
                  <td style={{ textAlign: 'center', padding: '8px 4px', backgroundColor: '#f1f5f9' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '36px', borderRadius: '6px', fontWeight: 700, fontSize: '14px', ...getColorStyle(media, scaleMax) }}>
                      {media.toFixed(1)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ backgroundColor: '#f8fafc' }}>
              <td style={{ padding: '12px 8px', fontWeight: 600, color: '#1e293b' }}>Média da Visita</td>
              {avaliacoes.map((avaliacao) => {
                const visitaMedia = dimensoesKeys.reduce((sum, key) => sum + (avaliacao.ratings[key] ?? 0), 0) / dimensoesKeys.length;
                return (
                  <td key={avaliacao.id} style={{ textAlign: 'center', padding: '8px 4px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '6px', fontWeight: 700, fontSize: '14px', ...getColorStyle(visitaMedia, scaleMax) }}>
                      {visitaMedia.toFixed(1)}
                    </span>
                  </td>
                );
              })}
              <td style={{ textAlign: 'center', padding: '8px 4px', backgroundColor: '#f1f5f9' }}>
                {(() => {
                  const overallMedia = avaliacoes.reduce((sum, a) => 
                    sum + dimensoesKeys.reduce((s, key) => s + (a.ratings[key] ?? 0), 0) / dimensoesKeys.length
                  , 0) / avaliacoes.length;
                  return (
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '36px', borderRadius: '6px', fontWeight: 700, fontSize: '14px', ...getColorStyle(overallMedia, scaleMax) }}>
                      {overallMedia.toFixed(1)}
                    </span>
                  );
                })()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Observations Section */}
      {observacoesComTexto.length > 0 && (
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#3b82f6' }}>💬</span>
            Observações
            <span style={{ fontSize: '13px', fontWeight: 400, color: '#64748b' }}>
              ({observacoesComTexto.length} {observacoesComTexto.length === 1 ? 'registro' : 'registros'})
            </span>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {observacoesComTexto.map((avaliacao) => (
              <div key={avaliacao.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 16px', backgroundColor: '#f8fafc' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '13px', color: '#64748b' }}>
                  <span>📅</span>
                  <span style={{ fontWeight: 500 }}>{formatDateLong(avaliacao.data)}</span>
                </div>
                {Object.entries(avaliacao.textFields)
                  .filter(([, value]) => value && value.trim().length > 0)
                  .map(([key, value]) => (
                    <div key={key} style={{ marginBottom: '6px' }}>
                      {textFieldLabels?.[key] && (
                        <div style={{ fontSize: '10px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>
                          {textFieldLabels[key]}
                        </div>
                      )}
                      <p style={{ fontSize: '13px', lineHeight: 1.6, color: '#334155', margin: 0, whiteSpace: 'pre-wrap' }}>{value}</p>
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
