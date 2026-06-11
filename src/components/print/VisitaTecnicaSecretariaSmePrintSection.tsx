import React from 'react';
import type { InstrumentField } from '@/hooks/useInstrumentFields';

export interface VisitaSmeCadastro {
  municipio?: string | null;
  data?: string | null;
  horario_inicio?: string | null;
  horario_fim?: string | null;
  tecnico?: string | null;
  nucleo_departamento?: string | null;
  observador_nome?: string | null;
}

interface Props {
  cadastro: VisitaSmeCadastro;
  fields: InstrumentField[];
  responses: Record<string, any> | null;
}

const styles = {
  section: { marginBottom: 18, padding: 12, border: '1px solid #ddd', borderRadius: 6 } as React.CSSProperties,
  sectionTitle: { fontSize: 14, fontWeight: 700, margin: '0 0 10px', color: '#1a3a5c', borderBottom: '2px solid #1a3a5c', paddingBottom: 4 } as React.CSSProperties,
  q: { marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #f0f0f0' } as React.CSSProperties,
  qLabel: { fontSize: 12, fontWeight: 600, marginBottom: 4 } as React.CSSProperties,
  qDesc: { fontSize: 10.5, color: '#555', marginBottom: 6 } as React.CSSProperties,
  text: { fontSize: 12, padding: 6, border: '1px solid #ddd', borderRadius: 4, whiteSpace: 'pre-wrap' as const, minHeight: 18 } as React.CSSProperties,
  blank: { borderBottom: '1px dashed #888', height: 14, marginTop: 4 } as React.CSSProperties,
  ratingList: { display: 'flex', flexDirection: 'column' as const, gap: 4, marginTop: 6 } as React.CSSProperties,
  ratingItem: { display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 11, padding: '4px 6px', borderRadius: 4 } as React.CSSProperties,
  ratingItemSelected: { background: '#eef3f8', border: '1px solid #1a3a5c' } as React.CSSProperties,
  circle: (filled: boolean) => ({ width: 12, height: 12, borderRadius: 6, border: '1.5px solid #333', background: filled ? '#1a3a5c' : 'transparent', display: 'inline-block', flexShrink: 0, marginTop: 2 } as React.CSSProperties),
  rubricNivel: { padding: 8, color: '#fff', fontSize: 11 } as React.CSSProperties,
};

const RUBRICA = [
  { value: 0, titulo: '0 — Não realizado', desc: 'Não foi feito ou não há qualquer evidência.', cor: '#c0392b' },
  { value: 1, titulo: '1 — Inicial', desc: 'Iniciado, mas sem consistência ou sem evidência clara.', cor: '#e67e22' },
  { value: 2, titulo: '2 — Parcial', desc: 'Realizado, mas incompleto, superficial ou irregular.', cor: '#f1c40f' },
  { value: 3, titulo: '3 — Consolidado', desc: 'Realizado de forma completa, estruturada e com evidências claras.', cor: '#27ae60' },
];

const TextValue: React.FC<{ value?: string | null }> = ({ value }) => {
  if (value && String(value).trim()) return <div style={styles.text}>{String(value)}</div>;
  return <><div style={styles.blank} /><div style={styles.blank} /><div style={styles.blank} /></>;
};

const RatingValue: React.FC<{ value: any; min: number; max: number; scaleLabels?: { value: number; label: string; description?: string }[] | null }> = ({ value, min, max, scaleLabels }) => {
  const opts: number[] = [];
  for (let v = min; v <= max; v++) opts.push(v);
  return (
    <div style={styles.ratingList}>
      {opts.map(n => {
        const selected = value === n;
        const sl = scaleLabels?.find(s => s.value === n);
        const fallback = RUBRICA.find(r => r.value === n);
        const titulo = sl?.label || fallback?.titulo || String(n);
        const desc = sl?.description || fallback?.desc || '';
        return (
          <div key={n} style={{ ...styles.ratingItem, ...(selected ? styles.ratingItemSelected : {}) }}>
            <span style={styles.circle(selected)} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: selected ? 700 : 600 }}>{titulo.startsWith(String(n)) ? titulo : `${n} — ${titulo}`}</div>
              {desc && <div style={{ color: '#555', marginTop: 1 }}>{desc}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
};


export const VisitaTecnicaSecretariaSmePrintSection: React.FC<Props> = ({ cadastro, fields, responses }) => {
  const horario = [cadastro.horario_inicio, cadastro.horario_fim].filter(Boolean).join(' – ');

  // Group fields by dimension preserving order
  const groups: { dimension: string; items: InstrumentField[] }[] = [];
  const seen = new Map<string, number>();
  fields.forEach(f => {
    const dim = f.dimension || 'Geral';
    if (!seen.has(dim)) {
      seen.set(dim, groups.length);
      groups.push({ dimension: dim, items: [] });
    }
    groups[seen.get(dim)!].items.push(f);
  });

  return (
    <>
      {/* Cadastro da visita */}
      <div style={styles.section} data-pdf-section>
        <h3 style={styles.sectionTitle}>Cadastro da visita</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px 24px', fontSize: 12 }}>
          <div><strong>Município/Entidade:</strong> {cadastro.municipio || '—'}</div>
          <div><strong>Data:</strong> {cadastro.data || '—'}</div>
          <div><strong>Horário:</strong> {horario || '—'}</div>
          <div><strong>Técnico(a):</strong> {cadastro.tecnico || '—'}</div>
          <div><strong>Núcleo/Departamento:</strong> {cadastro.nucleo_departamento || '—'}</div>
          <div><strong>Observador(a):</strong> {cadastro.observador_nome || '—'}</div>
        </div>
      </div>

      {/* Legenda */}
      <div style={styles.section} data-pdf-section>
        <h3 style={styles.sectionTitle}>Legenda das rubricas</h3>
        <div style={{ fontSize: 11, color: '#444', marginBottom: 8, fontStyle: 'italic' }}>
          Cada critério é avaliado por descritores comportamentais observáveis — o que o técnico verifica durante a visita, não uma impressão subjetiva.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
          {RUBRICA.map(r => (
            <div key={r.titulo} style={{ ...styles.rubricNivel, background: r.cor }}>
              <div style={{ fontWeight: 700, marginBottom: 2 }}>{r.titulo}</div>
              <div>{r.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Critérios por dimensão */}
      {groups.map(g => (
        <div key={g.dimension} style={styles.section}>
          <h3 style={styles.sectionTitle} data-pdf-section>{g.dimension}</h3>
          {g.items.map(f => {
            const v = responses ? responses[f.field_key] : undefined;
            return (
              <div key={f.id} style={styles.q} data-pdf-section>
                <div style={styles.qLabel}>{f.label}{f.is_required ? ' *' : ''}</div>
                {f.description && <div style={styles.qDesc}>{f.description}</div>}
                {f.field_type === 'rating' ? (
                  <RatingValue value={v} min={f.scale_min ?? 0} max={f.scale_max ?? 3} />
                ) : (f.field_type === 'text' || f.field_type === 'textarea') ? (
                  <TextValue value={v} />
                ) : (
                  <div style={{ fontSize: 12, marginTop: 4 }}>{v != null && v !== '' ? String(v) : '—'}</div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </>
  );
};
