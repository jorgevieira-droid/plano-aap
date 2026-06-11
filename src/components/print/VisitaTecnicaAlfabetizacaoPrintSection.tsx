import React from 'react';
import {
  CRITERIOS_ALFABETIZACAO,
  MATERIAL_DIDATICO_OPCOES,
  NIVEL_IAB_OPCOES,
  SEGMENTO_OPCOES,
} from '@/components/formularios/visitaTecnicaAlfabetizacaoShared';

export interface VisitaTecnicaAlfabetizacaoData {
  municipio?: string | null;
  nome_escola?: string | null;
  tecnico_visitante?: string | null;
  data?: string | null;
  horario_inicio?: string | null;
  horario_fim?: string | null;

  ano?: string | null;
  turma?: string | null;
  nivel_iab?: string | null;
  segmento?: string | null;
  qtd_estudantes?: number | null;
  alunos_masculino?: number | null;
  alunos_feminino?: number | null;
  material_didatico?: string[] | null;

  q4_nao_se_aplica?: boolean | null;
  observacoes_gerais?: string | null;

  [key: string]: any;
}

const styles = {
  section: { marginBottom: 18, padding: 12, border: '1px solid #ddd', borderRadius: 6 } as React.CSSProperties,
  sectionTitle: { fontSize: 14, fontWeight: 700, margin: '0 0 10px', color: '#1a3a5c', borderBottom: '2px solid #1a3a5c', paddingBottom: 4 } as React.CSSProperties,
  q: { marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #f0f0f0' } as React.CSSProperties,
  qLabel: { fontSize: 12, fontWeight: 600, marginBottom: 4 } as React.CSSProperties,
  text: { fontSize: 12, padding: 6, border: '1px solid #ddd', borderRadius: 4, whiteSpace: 'pre-wrap' as const, minHeight: 18 } as React.CSSProperties,
  blank: { borderBottom: '1px dashed #888', height: 14, marginTop: 4 } as React.CSSProperties,
  optionRow: { display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 11, marginTop: 3 } as React.CSSProperties,
  box: { display: 'inline-block', width: 12, height: 12, border: '1.5px solid #333', flexShrink: 0, marginTop: 2 } as React.CSSProperties,
  boxFilled: { background: '#1a3a5c' } as React.CSSProperties,
  ratingRow: { display: 'flex', gap: 14, marginTop: 6 } as React.CSSProperties,
  ratingItem: { display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 } as React.CSSProperties,
  circle: (filled: boolean) => ({ width: 12, height: 12, borderRadius: 6, border: '1.5px solid #333', background: filled ? '#1a3a5c' : 'transparent', display: 'inline-block' } as React.CSSProperties),
  rubric: { marginBottom: 14, padding: 10, border: '1px solid #ddd', borderRadius: 6 } as React.CSSProperties,
  rubricNivel: { fontSize: 10.5, padding: 6, border: '1px solid #eee', borderRadius: 4, marginBottom: 4 } as React.CSSProperties,
};

const TextValue: React.FC<{ value?: string | null }> = ({ value }) => {
  if (value && value.trim()) return <div style={styles.text}>{value}</div>;
  return <><div style={styles.blank} /><div style={styles.blank} /></>;
};

const Checks: React.FC<{ options: { value: string; label: string }[]; selected?: string[] | null }> = ({ options, selected }) => {
  const sel = new Set(selected || []);
  return (
    <div>
      {options.map(o => (
        <div key={o.value} style={styles.optionRow}>
          <span style={{ ...styles.box, ...(sel.has(o.value) ? styles.boxFilled : {}) }} />
          <span>{o.label}</span>
        </div>
      ))}
    </div>
  );
};

const Rating: React.FC<{ value?: number | null }> = ({ value }) => (
  <div style={styles.ratingRow}>
    {[1, 2, 3, 4].map(n => (
      <div key={n} style={styles.ratingItem}>
        <span style={styles.circle(value === n)} />
        <span>{n}</span>
      </div>
    ))}
  </div>
);

export const VisitaTecnicaAlfabetizacaoPrintSection: React.FC<{ data: VisitaTecnicaAlfabetizacaoData | null }> = ({ data }) => {
  const d: VisitaTecnicaAlfabetizacaoData = data || {};
  const nivelLabel = NIVEL_IAB_OPCOES.find(o => o.value === d.nivel_iab)?.label;
  const segmentoLabel = SEGMENTO_OPCOES.find(o => o.value === d.segmento)?.label;
  const horario = [d.horario_inicio, d.horario_fim].filter(Boolean).join(' – ');

  const grouped = CRITERIOS_ALFABETIZACAO.reduce<Record<string, typeof CRITERIOS_ALFABETIZACAO>>((acc, c) => {
    (acc[c.dimensao] ||= [] as any).push(c);
    return acc;
  }, {});

  return (
    <>
      {/* Identificação */}
      <div style={styles.section} data-pdf-section>
        <h3 style={styles.sectionTitle}>Identificação da visita</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px 24px', fontSize: 12 }}>
          <div><strong>Município:</strong> {d.municipio || '—'}</div>
          <div><strong>Escola:</strong> {d.nome_escola || '—'}</div>
          <div><strong>Técnico Visitante:</strong> {d.tecnico_visitante || '—'}</div>
          <div><strong>Data:</strong> {d.data || '—'}</div>
          <div><strong>Horário:</strong> {horario || '—'}</div>
        </div>
      </div>

      {/* Caracterização */}
      <div style={styles.section} data-pdf-section>
        <h3 style={styles.sectionTitle}>Caracterização da turma</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px 24px', fontSize: 12, marginBottom: 10 }}>
          <div><strong>Ano:</strong> {d.ano || '—'}</div>
          <div><strong>Turma:</strong> {d.turma || '—'}</div>
          <div><strong>Nível IAB:</strong> {nivelLabel || d.nivel_iab || '—'}</div>
          <div><strong>Segmento:</strong> {segmentoLabel || d.segmento || '—'}</div>
          <div><strong>Qtd. estudantes na turma:</strong> {d.qtd_estudantes ?? '—'}</div>
          <div><strong>Alunos — Masculino:</strong> {d.alunos_masculino ?? '—'}</div>
          <div><strong>Alunos — Feminino:</strong> {d.alunos_feminino ?? '—'}</div>
        </div>
        <div style={styles.q}>
          <div style={styles.qLabel}>Material Didático IAB utilizado</div>
          <Checks options={MATERIAL_DIDATICO_OPCOES as any} selected={d.material_didatico} />
        </div>
      </div>

      {/* Legenda */}
      <div style={styles.section} data-pdf-section>
        <h3 style={styles.sectionTitle}>Legenda das rubricas</h3>
        <div style={{ fontSize: 11, color: '#444', marginBottom: 6 }}>
          Cada critério é avaliado por descritores observáveis em sala/escola — o que o visitante vê acontecer, não uma impressão subjetiva.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, fontSize: 11 }}>
          <div><strong>1 — Insuficiente:</strong> ausência ou inadequação significativa.</div>
          <div><strong>2 — Em Desenvolvimento:</strong> tentativa incompleta ou inconsistente.</div>
          <div><strong>3 — Consolidado:</strong> presente de forma clara e consistente.</div>
          <div><strong>4 — Avançado:</strong> intencionalidade e impacto ampliado.</div>
        </div>
      </div>

      {/* Critérios por dimensão */}
      {Object.entries(grouped).map(([dimensao, items]) => (
        <div key={dimensao} style={styles.section}>
          <h3 style={styles.sectionTitle} data-pdf-section>{dimensao}</h3>
          {items.map(c => {
            const nota = (d as any)[`nota_${c.key}`] as number | null | undefined;
            const evid = (d as any)[`evidencia_${c.key}`] as string | null | undefined;
            const naoAplica = c.key === 'q4' && d.q4_nao_se_aplica === true;
            return (
              <div key={c.key} style={styles.rubric} data-pdf-section>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                  {c.numero}. {c.titulo}
                </div>
                {c.foco && <div style={{ fontSize: 10.5, color: '#555', marginBottom: 6 }}><strong>Foco:</strong> {c.foco}</div>}
                {c.niveis.map(n => (
                  <div key={n.nivel} style={styles.rubricNivel}>
                    <div style={{ fontWeight: 700, marginBottom: 2 }}>{n.nivel}</div>
                    <div style={{ color: '#444' }}>{n.texto}</div>
                  </div>
                ))}
                <div style={{ marginTop: 6 }}>
                  <div style={styles.qLabel}>Nota atribuída (1 a 4)</div>
                  {naoAplica ? (
                    <div style={{ fontSize: 11, fontStyle: 'italic', color: '#1a3a5c' }}>Não se aplica à rede</div>
                  ) : (
                    <Rating value={nota ?? null} />
                  )}
                </div>
                {!naoAplica && (
                  <div style={{ marginTop: 6 }}>
                    <div style={styles.qLabel}>Evidência observada</div>
                    <TextValue value={evid} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}

      {/* Observações */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle} data-pdf-section>Observações gerais</h3>
        <div style={styles.q} data-pdf-section>
          <TextValue value={d.observacoes_gerais} />
        </div>
      </div>
    </>
  );
};
