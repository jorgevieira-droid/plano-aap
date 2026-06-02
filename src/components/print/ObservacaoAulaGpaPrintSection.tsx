import React from 'react';
import { GPA_CRITERIA } from '@/components/formularios/observacaoAulaGpaShared';

export interface ObservacaoAulaGpaData {
  municipio?: string | null;
  data?: string | null;
  nome_escola?: string | null;
  observador?: string | null;
  horario_inicio?: string | null;
  horario_fim?: string | null;
  nome_professor?: string | null;
  ano?: string | null;
  turma?: string | null;
  qtd_estudantes?: number | null;
  segmento?: string | null;
  material_didatico?: string[] | null;
  alunos_masculino?: number | null;
  alunos_feminino?: number | null;
  pontos_fortes?: string | null;
  aspectos_fortalecer?: string | null;
  estrategias_sugeridas?: string | null;
  combinacao_acompanhamento?: string | null;
  [key: string]: any; // nota_criterio_N / evidencia_criterio_N
}

const Blank: React.FC = () => (
  <div style={{ borderBottom: '1px dashed #888', height: 14, marginTop: 4 }} />
);

const cell: React.CSSProperties = {
  border: '1px solid #ccc', padding: '6px 8px', fontSize: 11, verticalAlign: 'top',
};
const head: React.CSSProperties = { ...cell, background: '#f3f4f6', fontWeight: 700 };

export const ObservacaoAulaGpaPrintSection: React.FC<{ data: ObservacaoAulaGpaData | null }> = ({ data }) => {
  const notas = GPA_CRITERIA.map((c, i) => {
    const k = `nota_criterio_${c.id}`;
    const v = data?.[k];
    return typeof v === 'number' ? v : null;
  });
  const validNotas = notas.filter((n): n is number => n !== null);
  const media = validNotas.length ? (validNotas.reduce((s, n) => s + n, 0) / validNotas.length) : null;

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Cadastro</div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
        <tbody>
          <tr>
            <td style={head}>Município</td><td style={cell}>{data?.municipio || '—'}</td>
            <td style={head}>Data</td><td style={cell}>{data?.data || '—'}</td>
          </tr>
          <tr>
            <td style={head}>Nome da Escola</td><td style={cell} colSpan={3}>{data?.nome_escola || '—'}</td>
          </tr>
          <tr>
            <td style={head}>Observador(a)</td><td style={cell}>{data?.observador || '—'}</td>
            <td style={head}>Horário</td><td style={cell}>{[data?.horario_inicio, data?.horario_fim].filter(Boolean).join(' – ') || '—'}</td>
          </tr>
        </tbody>
      </table>

      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Identificação</div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
        <tbody>
          <tr><td style={head}>Professor(a)</td><td style={cell} colSpan={3}>{data?.nome_professor || '—'}</td></tr>
          <tr>
            <td style={head}>Ano</td><td style={cell}>{data?.ano || '—'}</td>
            <td style={head}>Turma</td><td style={cell}>{data?.turma || '—'}</td>
          </tr>
          <tr>
            <td style={head}>Qtd. estudantes</td><td style={cell}>{data?.qtd_estudantes ?? '—'}</td>
            <td style={head}>Segmento</td><td style={cell}>{data?.segmento === 'anos_iniciais' ? 'Anos iniciais' : data?.segmento === 'anos_finais' ? 'Anos finais' : '—'}</td>
          </tr>
          <tr>
            <td style={head}>Material Didático</td><td style={cell} colSpan={3}>{data?.material_didatico?.length ? data.material_didatico.join(', ') : '—'}</td>
          </tr>
          <tr>
            <td style={head}>Alunos Masc.</td><td style={cell}>{data?.alunos_masculino ?? '—'}</td>
            <td style={head}>Alunos Fem.</td><td style={cell}>{data?.alunos_feminino ?? '—'}</td>
          </tr>
        </tbody>
      </table>

      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Critérios Avaliados (escala 1–4)</div>
      {GPA_CRITERIA.map((c) => {
        const nota = data?.[`nota_criterio_${c.id}`];
        const evidencia = data?.[`evidencia_criterio_${c.id}`];
        return (
          <div key={c.id} style={{ marginBottom: 12, padding: 10, border: '1px solid #ddd', borderRadius: 4 }} data-pdf-section="criterio">
            <div style={{ fontSize: 10, color: '#666', textTransform: 'uppercase' }}>{c.dimension}</div>
            <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2 }}>Critério {c.id} — {c.title}</div>
            <div style={{ fontSize: 11, marginTop: 6 }}>
              <strong>Nota: </strong>{[1,2,3,4].map(v => (
                <span key={v} style={{ marginRight: 8 }}>
                  <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 5, border: '1.5px solid #333', background: nota === v ? '#1a3a5c' : 'transparent', verticalAlign: 'middle' }} /> {v}
                </span>
              ))}
            </div>
            <div style={{ fontSize: 11, marginTop: 6 }}>
              <strong>Evidência observada:</strong>
              {evidencia && String(evidencia).trim() ? (
                <div style={{ whiteSpace: 'pre-wrap', padding: 6, border: '1px solid #ddd', borderRadius: 4, marginTop: 4, minHeight: 28 }}>{evidencia}</div>
              ) : (<><Blank /><Blank /></>)}
            </div>
          </div>
        );
      })}

      <div style={{ fontSize: 14, fontWeight: 700, margin: '16px 0 8px' }} data-pdf-section="encaminhamentos">Encaminhamentos</div>
      {[
        ['Pontos fortes da aula', data?.pontos_fortes],
        ['Aspectos a fortalecer', data?.aspectos_fortalecer],
        ['Estratégias sugeridas', data?.estrategias_sugeridas],
        ['Combinação para acompanhamento futuro', data?.combinacao_acompanhamento],
      ].map(([label, value]) => (
        <div key={label as string} style={{ marginBottom: 10, fontSize: 11 }}>
          <strong>{label}:</strong>
          {value && String(value).trim() ? (
            <div style={{ whiteSpace: 'pre-wrap', padding: 6, border: '1px solid #ddd', borderRadius: 4, marginTop: 4, minHeight: 30 }}>{value}</div>
          ) : (<><Blank /><Blank /></>)}
        </div>
      ))}

      <div style={{ fontSize: 14, fontWeight: 700, margin: '16px 0 8px' }} data-pdf-section="sintese">Síntese das Notas</div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={head}>Nº</th>
            <th style={head}>Critério</th>
            <th style={head}>Nota</th>
            <th style={head}>Dimensão</th>
          </tr>
        </thead>
        <tbody>
          {GPA_CRITERIA.map((c, i) => (
            <tr key={c.id}>
              <td style={cell}>{c.id}</td>
              <td style={cell}>{c.title}</td>
              <td style={cell}>{notas[i] ?? '—'}</td>
              <td style={cell}>{c.dimension.split('—')[0].trim()}</td>
            </tr>
          ))}
          <tr>
            <td style={{ ...head }} colSpan={2}>MÉDIA GERAL</td>
            <td style={{ ...head }} colSpan={2}>{media !== null ? media.toFixed(2) : '—'}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
