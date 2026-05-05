import React from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { InstrumentField } from '@/hooks/useInstrumentFields';

interface ProgramacaoLite {
  id: string;
  tipo: string;
  titulo: string;
  data: string;
  horario_inicio: string;
  horario_fim: string;
  segmento?: string | null;
  componente?: string | null;
  status: string;
  apoio_devolutiva?: string | null;
  apoio_focos?: string[] | null;
  apoio_obs_planejada?: boolean | null;
  apoio_etapa?: string | null;
  apoio_componente?: string | null;
  apoio_turma_voar?: string | null;
  apoio_escola_voar?: boolean | null;
  apoio_participantes?: string[] | null;
  apoio_participantes_outros?: string | null;
}

export interface AcaoPrintFormProps {
  acaoLabel: string;
  programacao: ProgramacaoLite;
  escolaNome?: string;
  responsavelNome?: string;
  professorNome?: string;
  fields: InstrumentField[];
  responses: Record<string, any> | null;
  textFields?: { label: string; value: string | null | undefined }[];
}

const Blank: React.FC<{ width?: string }> = ({ width = '100%' }) => (
  <div style={{ borderBottom: '1px dashed #888', height: '14px', width }} />
);

function renderResponseValue(field: InstrumentField, value: any) {
  if (field.field_type === 'rating') {
    const min = field.scale_min ?? 1;
    const max = field.scale_max ?? 4;
    const opts: number[] = [];
    for (let v = min; v <= max; v++) opts.push(v);
    return (
      <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
        {opts.map(v => {
          const selected = value === v;
          return (
            <div key={v} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
              <span
                style={{
                  display: 'inline-block',
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  border: '1.5px solid #333',
                  background: selected ? '#1a3a5c' : 'transparent',
                }}
              />
              <span>{v}</span>
            </div>
          );
        })}
      </div>
    );
  }
  if (field.field_type === 'text' || field.field_type === 'textarea') {
    if (value && typeof value === 'string' && value.trim()) {
      return (
        <div style={{ whiteSpace: 'pre-wrap', fontSize: 12, marginTop: 4, padding: 6, border: '1px solid #ddd', borderRadius: 4, minHeight: 30 }}>
          {value}
        </div>
      );
    }
    return (
      <div style={{ marginTop: 4 }}>
        <Blank /><div style={{ height: 6 }} /><Blank /><div style={{ height: 6 }} /><Blank />
      </div>
    );
  }
  if (typeof value !== 'undefined' && value !== null && value !== '') {
    return <div style={{ fontSize: 12, marginTop: 4 }}>{String(value)}</div>;
  }
  return <div style={{ marginTop: 4 }}><Blank /></div>;
}

export const AcaoPrintForm: React.FC<AcaoPrintFormProps> = ({
  acaoLabel,
  programacao,
  escolaNome,
  responsavelNome,
  professorNome,
  fields,
  responses,
  textFields = [],
}) => {
  // group fields by dimension preserving order
  const groups: { dimension: string; items: InstrumentField[] }[] = [];
  const seen = new Map<string, number>();
  fields.forEach(f => {
    const dim = f.dimension || '';
    if (!seen.has(dim)) {
      seen.set(dim, groups.length);
      groups.push({ dimension: dim, items: [] });
    }
    groups[seen.get(dim)!].items.push(f);
  });

  const dataFmt = (() => {
    try { return format(parseISO(programacao.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }); }
    catch { return programacao.data; }
  })();

  return (
    <div style={{ fontFamily: 'Helvetica, Arial, sans-serif', color: '#222', width: 1000, padding: 24 }}>
      {/* Header */}
      <div style={{ background: '#1a3a5c', color: '#fff', padding: '14px 18px', borderRadius: 6, marginBottom: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>{acaoLabel}</div>
        <div style={{ fontSize: 12, opacity: 0.9 }}>{programacao.titulo}</div>
      </div>

      {/* Cadastro */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px 24px', fontSize: 12, marginBottom: 16, padding: 12, border: '1px solid #ddd', borderRadius: 6 }}>
        <div><strong>Data:</strong> {dataFmt}</div>
        <div><strong>Horário:</strong> {programacao.horario_inicio} – {programacao.horario_fim}</div>
        <div><strong>Escola/Entidade:</strong> {escolaNome || '—'}</div>
        <div><strong>Responsável:</strong> {responsavelNome || '—'}</div>
        {professorNome && <div><strong>Professor:</strong> {professorNome}</div>}
        {programacao.segmento && <div><strong>Segmento:</strong> {programacao.segmento}</div>}
        {programacao.componente && <div><strong>Componente:</strong> {programacao.componente}</div>}
        <div><strong>Status:</strong> {programacao.status}</div>
      </div>

      {/* Cadastro específico Apoio Presencial */}
      {programacao.tipo === 'registro_apoio_presencial' && (
        <div style={{ fontSize: 12, marginBottom: 16, padding: 12, border: '1px solid #ddd', borderRadius: 6 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Cadastro do Apoio</div>
          <div><strong>Componente:</strong> {programacao.apoio_componente || '—'}</div>
          <div><strong>Etapa:</strong> {programacao.apoio_etapa || '—'}</div>
          <div><strong>Escola VOAR:</strong> {programacao.apoio_escola_voar === true ? 'Sim' : programacao.apoio_escola_voar === false ? 'Não' : '—'}</div>
          <div><strong>Turma VOAR:</strong> {programacao.apoio_turma_voar || '—'}</div>
          <div><strong>Devolutiva:</strong> {programacao.apoio_devolutiva || '—'}</div>
          <div><strong>Observação planejada:</strong> {programacao.apoio_obs_planejada === true ? 'Sim' : programacao.apoio_obs_planejada === false ? 'Não' : '—'}</div>
          {programacao.apoio_focos && programacao.apoio_focos.length > 0 && (
            <div><strong>Focos:</strong> {programacao.apoio_focos.join(', ')}</div>
          )}
          {programacao.apoio_participantes && programacao.apoio_participantes.length > 0 && (
            <div><strong>Participantes:</strong> {programacao.apoio_participantes.join(', ')}{programacao.apoio_participantes_outros ? ` — ${programacao.apoio_participantes_outros}` : ''}</div>
          )}
        </div>
      )}

      {/* Instrumento */}
      {groups.length > 0 && (
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 700, margin: '12px 0 8px', color: '#1a3a5c', borderBottom: '2px solid #1a3a5c', paddingBottom: 4 }}>
            Instrumento
          </h3>
          {groups.map((g, gi) => (
            <div key={gi} style={{ marginBottom: 14 }}>
              {g.dimension && (
                <div style={{ fontSize: 12, fontWeight: 700, background: '#eef2f7', padding: '4px 8px', borderRadius: 4, marginBottom: 6 }}>
                  {g.dimension}
                </div>
              )}
              {g.items.map(f => {
                const v = responses ? responses[f.field_key] : undefined;
                return (
                  <div key={f.id} style={{ marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid #f0f0f0' }}>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{f.label}</div>
                    {f.description && (
                      <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>{f.description}</div>
                    )}
                    {renderResponseValue(f, v)}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {textFields.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, margin: '12px 0 8px', color: '#1a3a5c', borderBottom: '2px solid #1a3a5c', paddingBottom: 4 }}>
            Campos descritivos
          </h3>
          {textFields.map((tf, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{tf.label}</div>
              {tf.value && tf.value.trim() ? (
                <div style={{ whiteSpace: 'pre-wrap', fontSize: 12, marginTop: 4, padding: 6, border: '1px solid #ddd', borderRadius: 4 }}>{tf.value}</div>
              ) : (
                <div style={{ marginTop: 4 }}>
                  <Blank /><div style={{ height: 6 }} /><Blank /><div style={{ height: 6 }} /><Blank />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
