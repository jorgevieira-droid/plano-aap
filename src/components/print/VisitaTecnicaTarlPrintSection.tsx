import React from 'react';
import {
  CRITERIOS_TARL,
  MODALIDADE_OPCOES,
  NIVEL_LP_OPCOES,
  NIVEL_MAT_OPCOES,
  AVALIACAO_GERAL_OPCOES,
  SIM_NAO_PARCIAL_OPCOES,
} from '@/components/formularios/visitaTecnicaTarlShared';

export interface VisitaTecnicaTarlData {
  municipio?: string | null;
  nome_escola?: string | null;
  tecnico_visitante?: string | null;
  data?: string | null;
  horario_inicio?: string | null;
  horario_fim?: string | null;

  ano_serie?: string | null;
  turma?: string | null;
  modalidade?: string | null;
  qtd_matriculados?: number | null;
  qtd_presentes?: number | null;
  agente_nome?: string | null;
  agente_participou_formacao?: string | null;
  nivel_lp?: string | null;
  nivel_mat?: string | null;
  plano_aula_assinado?: string | null;
  replanejamento_15_dias?: string | null;
  observacoes_iniciais?: string | null;

  avaliacao_geral?: string | null;

  [key: string]: any;
}

const styles = {
  section: { marginBottom: 18, padding: 12, border: '1px solid #ddd', borderRadius: 6 } as React.CSSProperties,
  sectionTitle: { fontSize: 14, fontWeight: 700, margin: '0 0 10px', color: '#1a3a5c', borderBottom: '2px solid #1a3a5c', paddingBottom: 4 } as React.CSSProperties,
  q: { marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #f0f0f0' } as React.CSSProperties,
  qLabel: { fontSize: 12, fontWeight: 600, marginBottom: 4 } as React.CSSProperties,
  text: { fontSize: 12, padding: 6, border: '1px solid #ddd', borderRadius: 4, whiteSpace: 'pre-wrap' as const, minHeight: 18 } as React.CSSProperties,
  blank: { borderBottom: '1px dashed #888', height: 14, marginTop: 4 } as React.CSSProperties,
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

function labelFrom(opts: readonly { value: string; label: string }[], v?: string | null) {
  return opts.find(o => o.value === v)?.label;
}

export const VisitaTecnicaTarlPrintSection: React.FC<{ data: VisitaTecnicaTarlData | null }> = ({ data }) => {
  const d: VisitaTecnicaTarlData = data || {};
  const horario = [d.horario_inicio, d.horario_fim].filter(Boolean).join(' – ');

  const grouped = CRITERIOS_TARL.reduce<Record<string, typeof CRITERIOS_TARL>>((acc, c) => {
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
        <h3 style={styles.sectionTitle}>Caracterização da turma e do agente</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px 24px', fontSize: 12 }}>
          <div><strong>Ano/Série:</strong> {d.ano_serie || '—'}</div>
          <div><strong>Turma:</strong> {d.turma || '—'}</div>
          <div><strong>Modalidade:</strong> {labelFrom(MODALIDADE_OPCOES, d.modalidade) || d.modalidade || '—'}</div>
          <div><strong>Matriculados:</strong> {d.qtd_matriculados ?? '—'}</div>
          <div><strong>Presentes:</strong> {d.qtd_presentes ?? '—'}</div>
          <div><strong>Agente:</strong> {d.agente_nome || '—'}</div>
          <div><strong>Participou da formação:</strong> {labelFrom(SIM_NAO_PARCIAL_OPCOES, d.agente_participou_formacao) || d.agente_participou_formacao || '—'}</div>
          <div><strong>Nível LP:</strong> {labelFrom(NIVEL_LP_OPCOES, d.nivel_lp) || d.nivel_lp || '—'}</div>
          <div><strong>Nível MAT:</strong> {labelFrom(NIVEL_MAT_OPCOES, d.nivel_mat) || d.nivel_mat || '—'}</div>
          <div><strong>Plano de aula assinado:</strong> {labelFrom(SIM_NAO_PARCIAL_OPCOES, d.plano_aula_assinado) || d.plano_aula_assinado || '—'}</div>
          <div><strong>Replanejamento (15 dias):</strong> {labelFrom(SIM_NAO_PARCIAL_OPCOES, d.replanejamento_15_dias) || d.replanejamento_15_dias || '—'}</div>
        </div>
        {d.observacoes_iniciais && (
          <div style={{ marginTop: 10 }}>
            <div style={styles.qLabel}>Observações iniciais</div>
            <TextValue value={d.observacoes_iniciais} />
          </div>
        )}
      </div>

      {/* Legenda */}
      <div style={styles.section} data-pdf-section>
        <h3 style={styles.sectionTitle}>Legenda das rubricas</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, fontSize: 11 }}>
          <div><strong>1 — Insuficiente:</strong> ausência ou inadequação significativa.</div>
          <div><strong>2 — Em desenvolvimento:</strong> tentativa incompleta ou inconsistente.</div>
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
            return (
              <div key={c.key} style={styles.rubric} data-pdf-section>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                  {c.codigo} — {c.titulo}
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

      {/* Avaliação geral */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle} data-pdf-section>Avaliação geral da implementação</h3>
        <div style={{ fontSize: 12 }}>
          {labelFrom(AVALIACAO_GERAL_OPCOES, d.avaliacao_geral) || (
            <>
              <div style={styles.blank} />
              <div style={styles.blank} />
            </>
          )}
        </div>
      </div>
    </>
  );
};
