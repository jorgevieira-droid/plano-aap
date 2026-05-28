import React from 'react';
import { CRITERIOS, MATERIAL_DIDATICO_OPCOES, NIVEL_IAB_OPCOES } from '@/components/formularios/visitaAlfabetizacaoRedesShared';

export interface VisitaAlfabetizacaoRedesData {
  rede_municipal?: string | null;
  data?: string | null;
  nome_escola?: string | null;
  tecnico_visitante?: string | null;
  horario?: string | null;

  turma_ano?: string | null;
  nivel_iab?: string | null;
  qtd_estudantes?: number | null;
  segmento?: string | null;
  material_didatico?: string[] | null;
  alunos_masculino?: number | null;
  alunos_feminino?: number | null;

  pontos_fortes?: string | null;
  aspectos_fortalecer?: string | null;
  estrategias_sugeridas?: string | null;
  combinacao_acompanhamento?: string | null;

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

const Checks: React.FC<{ options: string[]; selected?: string[] | null }> = ({ options, selected }) => {
  const sel = new Set(selected || []);
  return (
    <div>
      {options.map(o => (
        <div key={o} style={styles.optionRow}>
          <span style={{ ...styles.box, ...(sel.has(o) ? styles.boxFilled : {}) }} />
          <span>{o}</span>
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

export const VisitaAlfabetizacaoRedesPrintSection: React.FC<{ data: VisitaAlfabetizacaoRedesData | null }> = ({ data }) => {
  const d: VisitaAlfabetizacaoRedesData = data || {};
  const nivelLabel = NIVEL_IAB_OPCOES.find(o => o.value === d.nivel_iab)?.label;

  // Group critérios by dimensao
  const grouped = CRITERIOS.reduce<Record<string, typeof CRITERIOS>>((acc, c) => {
    (acc[c.dimensao] ||= [] as any).push(c);
    return acc;
  }, {});

  return (
    <>
      {/* Identificação */}
      <div style={styles.section} data-pdf-section>
        <h3 style={styles.sectionTitle}>Identificação da visita</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px 24px', fontSize: 12 }}>
          <div><strong>Rede Municipal:</strong> {d.rede_municipal || '—'}</div>
          <div><strong>Escola:</strong> {d.nome_escola || '—'}</div>
          <div><strong>Técnico Visitante:</strong> {d.tecnico_visitante || '—'}</div>
          <div><strong>Horário:</strong> {d.horario || '—'}</div>
        </div>
      </div>

      {/* Caracterização da turma */}
      <div style={styles.section} data-pdf-section>
        <h3 style={styles.sectionTitle}>Caracterização da turma</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px 24px', fontSize: 12, marginBottom: 10 }}>
          <div><strong>Turma / Ano:</strong> {d.turma_ano || '—'}</div>
          <div><strong>Nível IAB:</strong> {nivelLabel || d.nivel_iab || '—'}</div>
          <div><strong>Qtd. estudantes na turma:</strong> {d.qtd_estudantes ?? '—'}</div>
          <div><strong>Segmento:</strong> {d.segmento || '—'}</div>
          <div><strong>Alunos presentes — Masculino:</strong> {d.alunos_masculino ?? '—'}</div>
          <div><strong>Alunos presentes — Feminino:</strong> {d.alunos_feminino ?? '—'}</div>
        </div>
        <div style={styles.q}>
          <div style={styles.qLabel}>Material Didático IAB utilizado</div>
          <Checks options={MATERIAL_DIDATICO_OPCOES} selected={d.material_didatico} />
        </div>
      </div>

      {/* Legenda */}
      <div style={styles.section} data-pdf-section>
        <h3 style={styles.sectionTitle}>Legenda das rubricas</h3>
        <div style={{ fontSize: 11, color: '#444', marginBottom: 6 }}>
          Cada critério é avaliado por descritores comportamentais observáveis — o que o visitante vê acontecer na escola/aula, não uma impressão subjetiva.
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
            const nota = (d as any)[`nota_criterio_${c.numero}`] as number | null | undefined;
            const evid = (d as any)[`evidencia_criterio_${c.numero}`] as string | null | undefined;
            return (
              <div key={c.numero} style={styles.rubric} data-pdf-section>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                  {c.numero}. {c.pergunta}
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
                  <Rating value={nota ?? null} />
                </div>
                <div style={{ marginTop: 6 }}>
                  <div style={styles.qLabel}>Evidência observada</div>
                  <TextValue value={evid} />
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {/* Encaminhamentos */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle} data-pdf-section>Encaminhamentos</h3>
        <div style={styles.q} data-pdf-section>
          <div style={styles.qLabel}>Pontos fortes observados</div>
          <TextValue value={d.pontos_fortes} />
        </div>
        <div style={styles.q} data-pdf-section>
          <div style={styles.qLabel}>Aspectos a fortalecer</div>
          <TextValue value={d.aspectos_fortalecer} />
        </div>
        <div style={styles.q} data-pdf-section>
          <div style={styles.qLabel}>Estratégias sugeridas</div>
          <TextValue value={d.estrategias_sugeridas} />
        </div>
        <div style={styles.q} data-pdf-section>
          <div style={styles.qLabel}>Combinações para acompanhamento futuro</div>
          <TextValue value={d.combinacao_acompanhamento} />
        </div>
      </div>
    </>
  );
};
