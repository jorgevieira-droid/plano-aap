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

export interface EvolucaoPdfContentProps {
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
  sectionTitle?: string;
  itemLabel?: string;
  includeZeroValues?: boolean;
}

const getColorStyle = (value: number, scaleMax: number = 4): React.CSSProperties => {
  const ratio = value / scaleMax;
  if (ratio >= 0.9) return { backgroundColor: 'hsl(142 76% 36%)', color: 'white' };
  if (ratio >= 0.7) return { backgroundColor: 'hsl(142 76% 50% / 0.6)', color: '#1e293b' };
  if (ratio >= 0.5) return { backgroundColor: 'hsl(38 92% 50% / 0.6)', color: '#1e293b' };
  if (ratio >= 0.3) return { backgroundColor: 'hsl(38 92% 50% / 0.9)', color: '#1e293b' };
  return { backgroundColor: 'hsl(0 84% 60% / 0.6)', color: 'white' };
};

const COLORS_PALETTE = [
  '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#ec4899', '#eab308', '#14b8a6', '#a855f7',
];

const containerStyle: React.CSSProperties = {
  width: '1000px', minWidth: '1000px', maxWidth: '1000px',
  backgroundColor: '#ffffff', padding: '16px',
  fontFamily: 'system-ui, -apple-system, sans-serif',
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
};

const formatDateLong = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
};

/**
 * Section 1: Summary + Chart + Summary Cards
 */
export function EvolucaoPdfSection1(props: EvolucaoPdfContentProps) {
  const { professor, escola, avaliacoes, dimensoesLabels, dimensoesKeys, segmentoLabels, componenteLabels, scaleMax = 4, sectionTitle = 'Histórico — Observação de Aula', itemLabel = 'Visita', includeZeroValues = false } = props;
  if (!professor || avaliacoes.length === 0 || dimensoesKeys.length === 0) return null;

  const getColor = (idx: number) => COLORS_PALETTE[idx % COLORS_PALETTE.length];

  return (
    <div style={containerStyle}>
      {/* Professor Summary */}
      <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '10px', color: '#1e293b' }}>
          {sectionTitle}
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', fontSize: '13px' }}>
          <div><span style={{ color: '#64748b' }}>Professor:</span> <span style={{ fontWeight: 500 }}>{professor.nome}</span></div>
          <div><span style={{ color: '#64748b' }}>Entidade:</span> <span style={{ fontWeight: 500 }}>{escola?.nome}</span></div>
          {professor.segmento && <div><span style={{ color: '#64748b' }}>Segmento:</span> <span style={{ fontWeight: 500 }}>{segmentoLabels[professor.segmento] || professor.segmento}</span></div>}
          {professor.componente && <div><span style={{ color: '#64748b' }}>Componente:</span> <span style={{ fontWeight: 500 }}>{componenteLabels[professor.componente] || professor.componente}</span></div>}
        </div>
      </div>

      {/* Chart Section */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '14px', color: '#1e293b' }}>
          📊 Evolução por Registro
          {avaliacoes.length >= 2 && (() => {
            const calcAvg = (avaliacao: DynamicAvaliacao) => {
              const vals = dimensoesKeys.map(key => avaliacao.ratings[key]).filter((v): v is number => v !== undefined && (includeZeroValues || v !== 0));
              return vals.length > 0 ? vals.reduce((sum, v) => sum + v, 0) / vals.length : 0;
            };
            const firstAvg = calcAvg(avaliacoes[0]);
            const lastAvg = calcAvg(avaliacoes[avaliacoes.length - 1]);
            const trend = lastAvg - firstAvg;
            return <span style={{ fontSize: '12px', fontWeight: 400, color: trend >= 0 ? '#22c55e' : '#ef4444' }}> ({trend >= 0 ? '+' : ''}{trend.toFixed(2)} pontos)</span>;
          })()}
        </h3>
        
        <div style={{ marginBottom: '12px' }}>
          {avaliacoes.map((avaliacao, visitIdx) => (
            <div key={avaliacao.id} style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: 500, color: '#64748b', marginBottom: '6px' }}>
                {itemLabel} {visitIdx + 1} ({formatDate(avaliacao.data)})
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end', height: '50px' }}>
                {dimensoesKeys.map((key, idx) => {
                  const value = avaliacao.ratings[key] ?? 0;
                  const heightPercent = (value / scaleMax) * 100;
                  return (
                    <div key={key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: '9px', fontWeight: 600, marginBottom: '2px', color: '#334155' }}>{value}</span>
                      <div style={{ width: '100%', height: `${heightPercent}%`, backgroundColor: getColor(idx), borderRadius: '3px 3px 0 0', minHeight: '3px' }} />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        
        {/* Dimension Labels */}
        <div style={{ display: 'flex', gap: '6px', borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
          {dimensoesKeys.map((key, idx) => (
            <div key={key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: getColor(idx) }} />
              <span style={{ fontSize: '8px', color: '#64748b', textAlign: 'center', lineHeight: 1.2 }}>{dimensoesLabels[key] || key}</span>
            </div>
          ))}
        </div>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(dimensoesKeys.length + 1, 6)}, 1fr)`, gap: '6px', marginTop: '14px' }}>
          {dimensoesKeys.map((key, idx) => {
            const values = avaliacoes.map(a => a.ratings[key] ?? 0);
            const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
            const delta = values.length >= 2 ? values[values.length - 1] - values[0] : 0;
            return (
              <div key={key} style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px', textAlign: 'center' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: getColor(idx), margin: '0 auto 4px' }} />
                <div style={{ fontSize: '8px', color: '#64748b', marginBottom: '3px' }}>{dimensoesLabels[key] || key}</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: getColor(idx) }}>{avg.toFixed(1)}</div>
                {avaliacoes.length >= 2 && delta !== 0 && (
                  <div style={{ fontSize: '9px', color: delta >= 0 ? '#22c55e' : '#ef4444' }}>{delta >= 0 ? '↑' : '↓'}{Math.abs(delta).toFixed(1)}</div>
                )}
              </div>
            );
          })}
          {(() => {
            const overallAvg = dimensoesKeys.reduce((sum, key) => {
              const values = avaliacoes.map(a => a.ratings[key] ?? 0);
              return sum + values.reduce((s, v) => s + v, 0) / values.length;
            }, 0) / dimensoesKeys.length;
            return (
              <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '8px', textAlign: 'center' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#3b82f6', margin: '0 auto 4px' }} />
                <div style={{ fontSize: '8px', color: '#64748b', marginBottom: '3px' }}>Média Geral</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#3b82f6' }}>{overallAvg.toFixed(1)}</div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

/**
 * Section 2: Evolution Matrix
 */
export function EvolucaoPdfSection2(props: EvolucaoPdfContentProps) {
  const { professor, avaliacoes, dimensoesLabels, dimensoesKeys, scaleMax = 4, includeZeroValues = false } = props;
  if (!professor || avaliacoes.length === 0 || dimensoesKeys.length === 0) return null;

  return (
    <div style={containerStyle}>
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '14px', color: '#1e293b' }}>
          Matriz de Evolução por Dimensão
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ textAlign: 'left', padding: '10px 6px', fontWeight: 500, color: '#64748b', minWidth: '140px' }}>Dimensão</th>
              {avaliacoes.map((avaliacao, idx) => (
                <th key={avaliacao.id} style={{ textAlign: 'center', padding: '10px 4px', fontWeight: 500, color: '#64748b', minWidth: '60px' }}>
                  <div style={{ fontSize: '10px' }}>{formatDate(avaliacao.data)}</div>
                  <div style={{ fontSize: '9px', color: '#94a3b8' }}>#{idx + 1}</div>
                </th>
              ))}
              <th style={{ textAlign: 'center', padding: '10px 4px', fontWeight: 600, backgroundColor: '#f1f5f9', minWidth: '60px' }}>
                <div style={{ fontSize: '10px' }}>Média</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {dimensoesKeys.map((dimensao) => {
              const values = avaliacoes.map(a => a.ratings[dimensao]).filter((v): v is number => v !== undefined && (includeZeroValues || v !== 0));
              const media = values.reduce((sum, v) => sum + v, 0) / values.length;
              return (
                <tr key={dimensao} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '8px 6px', fontWeight: 500, color: '#334155', fontSize: '10px' }}>{dimensoesLabels[dimensao] || dimensao}</td>
                  {avaliacoes.map((avaliacao) => {
                    const value = avaliacao.ratings[dimensao] ?? 0;
                    return (
                      <td key={avaliacao.id} style={{ textAlign: 'center', padding: '6px 4px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '6px', fontWeight: 700, fontSize: '12px', ...getColorStyle(value, scaleMax) }}>
                          {value}
                        </span>
                      </td>
                    );
                  })}
                  <td style={{ textAlign: 'center', padding: '6px 4px', backgroundColor: '#f1f5f9' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '32px', borderRadius: '6px', fontWeight: 700, fontSize: '12px', ...getColorStyle(media, scaleMax) }}>
                      {media.toFixed(1)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ backgroundColor: '#f8fafc' }}>
              <td style={{ padding: '10px 6px', fontWeight: 600, color: '#1e293b', fontSize: '10px' }}>Média do Registro</td>
              {avaliacoes.map((avaliacao) => {
                const vals = dimensoesKeys.map(key => avaliacao.ratings[key]).filter((v): v is number => v !== undefined && (includeZeroValues || v !== 0));
                const visitaMedia = vals.length > 0 ? vals.reduce((sum, v) => sum + v, 0) / vals.length : 0;
                return (
                  <td key={avaliacao.id} style={{ textAlign: 'center', padding: '6px 4px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '6px', fontWeight: 700, fontSize: '12px', ...getColorStyle(visitaMedia, scaleMax) }}>
                      {visitaMedia.toFixed(1)}
                    </span>
                  </td>
                );
              })}
              <td style={{ textAlign: 'center', padding: '6px 4px', backgroundColor: '#f1f5f9' }}>
                {(() => {
                  const allVals = avaliacoes.flatMap(a => dimensoesKeys.map(key => a.ratings[key]).filter((v): v is number => v !== undefined && (includeZeroValues || v !== 0)));
                  const overallMedia = allVals.length > 0 ? allVals.reduce((sum, v) => sum + v, 0) / allVals.length : 0;
                  return (
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '32px', borderRadius: '6px', fontWeight: 700, fontSize: '12px', ...getColorStyle(overallMedia, scaleMax) }}>
                      {overallMedia.toFixed(1)}
                    </span>
                  );
                })()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

/**
 * Section 3: Observations
 */
export function EvolucaoPdfSection3(props: EvolucaoPdfContentProps) {
  const { professor, avaliacoes, textFieldLabels } = props;
  if (!professor) return null;

  const observacoesComTexto = avaliacoes.filter(a =>
    Object.values(a.textFields).some(v => v && v.trim().length > 0)
  );

  if (observacoesComTexto.length === 0) return null;

  return (
    <div style={containerStyle}>
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '14px', color: '#1e293b' }}>
          💬 Observações
          <span style={{ fontSize: '12px', fontWeight: 400, color: '#64748b' }}>
            {' '}({observacoesComTexto.length} {observacoesComTexto.length === 1 ? 'registro' : 'registros'})
          </span>
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {observacoesComTexto.map((avaliacao) => (
            <div key={avaliacao.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 14px', backgroundColor: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontSize: '12px', color: '#64748b' }}>
                <span>📅</span>
                <span style={{ fontWeight: 500 }}>{formatDateLong(avaliacao.data)}</span>
              </div>
              {Object.entries(avaliacao.textFields)
                .filter(([, value]) => value && value.trim().length > 0)
                .map(([key, value]) => (
                  <div key={key} style={{ marginBottom: '5px' }}>
                    {textFieldLabels?.[key] && (
                      <div style={{ fontSize: '9px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>
                        {textFieldLabels[key]}
                      </div>
                    )}
                    <p style={{ fontSize: '11px', lineHeight: 1.5, color: '#334155', margin: 0, whiteSpace: 'pre-wrap' }}>{value}</p>
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Keep the legacy combined export for backwards compatibility
export function EvolucaoPdfContent(props: EvolucaoPdfContentProps) {
  return (
    <div>
      <EvolucaoPdfSection1 {...props} />
      <EvolucaoPdfSection2 {...props} />
      <EvolucaoPdfSection3 {...props} />
    </div>
  );
}
