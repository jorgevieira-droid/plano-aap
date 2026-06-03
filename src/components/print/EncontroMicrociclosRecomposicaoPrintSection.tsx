import React from 'react';
import { MICROCICLOS_ITEMS, BINARY_SCALE_OPTIONS } from '@/pages/formularios/redesFormShared';

export interface EncontroMicrociclosRecomposicaoData {
  municipio?: string | null;
  data?: string | null;
  formador?: string | null;
  horario?: string | null;
  local?: string | null;
  ponto_focal_rede?: string | null;
  item_1?: number | null;
  item_2?: number | null;
  item_3?: number | null;
  item_4?: number | null;
  item_5?: number | null;
  item_6?: number | null;
  item_7?: number | null;
  item_8?: number | null;
  item_9?: number | null;
  item_10?: number | null;
  relato_objetivo?: string | null;
  plataforma_acesso?: string | null;
  plataforma_quizzes?: string | null;
  plataforma_observacoes?: string | null;
  pontos_fortes?: string | null;
  aspectos_fortalecer?: string | null;
  encaminhamentos_acordados?: string | null;
  encaminhamentos_prazo?: string | null;
  encaminhamentos_responsavel?: string | null;
  proximo_encontro_data?: string | null;
  proximo_encontro_pauta?: string | null;
}

const PLATAFORMA_ACESSO_LABEL: Record<string, string> = {
  autonoma: 'Acessam de forma autônoma',
  com_apoio: 'Acessam com apoio',
  nao_acessam: 'Não acessam',
};

const PLATAFORMA_QUIZZES_LABEL: Record<string, string> = {
  sistematicamente: 'Sistematicamente',
  parcialmente: 'Parcialmente',
  nao: 'Não utilizam',
};

const Blank: React.FC<{ width?: string }> = ({ width = '100%' }) => (
  <div style={{ borderBottom: '1px dashed #888', height: '14px', width }} />
);

const TextBlock: React.FC<{ value?: string | null }> = ({ value }) => {
  if (value && value.trim()) {
    return (
      <div style={{ whiteSpace: 'pre-wrap', fontSize: 12, padding: 6, border: '1px solid #ddd', borderRadius: 4, minHeight: 30 }}>
        {value}
      </div>
    );
  }
  return (
    <div>
      <Blank /><div style={{ height: 6 }} /><Blank /><div style={{ height: 6 }} /><Blank />
    </div>
  );
};

const Field: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => (
  <div style={{ fontSize: 12 }}>
    <strong>{label}:</strong> {value && String(value).trim() ? value : '—'}
  </div>
);

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3 style={{ fontSize: 14, fontWeight: 700, margin: '12px 0 8px', color: '#1a3a5c', borderBottom: '2px solid #1a3a5c', paddingBottom: 4 }}>
    {children}
  </h3>
);

function RatingRow({ value }: { value?: number | null }) {
  return (
    <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
      {BINARY_SCALE_OPTIONS.map(opt => {
        const selected = value === opt.value;
        return (
          <div key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
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
            <span>{opt.value} – {opt.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export const EncontroMicrociclosRecomposicaoPrintSection: React.FC<{
  data: EncontroMicrociclosRecomposicaoData | null;
}> = ({ data }) => {
  const d = data || {};
  const items = MICROCICLOS_ITEMS.map((label, idx) => ({
    label,
    value: (d as any)[`item_${idx + 1}`] as number | null | undefined,
  }));

  return (
    <div>
      <div data-pdf-section="microciclos-cabecalho" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px 24px', marginBottom: 16, padding: 12, border: '1px solid #ddd', borderRadius: 6 }}>
        <Field label="Município/Entidade" value={d.municipio} />
        <Field label="Data" value={d.data} />
        <Field label="Formador(a)" value={d.formador} />
        <Field label="Horário" value={d.horario} />
        <Field label="Local" value={d.local} />
        <Field label="Ponto Focal da Rede" value={d.ponto_focal_rede} />
      </div>

      <div data-pdf-section="microciclos-itens">
        <SectionTitle>Itens de Verificação</SectionTitle>
        {items.map((it, idx) => (
          <div key={idx} style={{ marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid #f0f0f0' }}>
            <div style={{ fontSize: 12, fontWeight: 600 }}>{idx + 1}. {it.label}</div>
            <RatingRow value={it.value ?? undefined} />
          </div>
        ))}
      </div>

      <div data-pdf-section="microciclos-relato">
        <SectionTitle>Relato Objetivo</SectionTitle>
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Percepções e evidências observadas no encontro</div>
        <TextBlock value={d.relato_objetivo} />
      </div>

      <div data-pdf-section="microciclos-plataforma">
        <SectionTitle>Uso da Plataforma Trajetórias</SectionTitle>
        <div style={{ marginBottom: 8 }}>
          <Field label="Acesso aos dados da Plataforma" value={d.plataforma_acesso ? (PLATAFORMA_ACESSO_LABEL[d.plataforma_acesso] || d.plataforma_acesso) : null} />
        </div>
        <div style={{ marginBottom: 8 }}>
          <Field label="Quizzes registrados / utilizados" value={d.plataforma_quizzes ? (PLATAFORMA_QUIZZES_LABEL[d.plataforma_quizzes] || d.plataforma_quizzes) : null} />
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Observações sobre o uso da Plataforma</div>
        <TextBlock value={d.plataforma_observacoes} />
      </div>

      <div data-pdf-section="microciclos-encaminhamentos-fortes">
        <SectionTitle>Encaminhamentos</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Pontos fortes</div>
            <TextBlock value={d.pontos_fortes} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Aspectos a fortalecer</div>
            <TextBlock value={d.aspectos_fortalecer} />
          </div>
        </div>
      </div>

      <div data-pdf-section="microciclos-encaminhamentos-acordados">
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Encaminhamentos acordados</div>
        <TextBlock value={d.encaminhamentos_acordados} />
      </div>

      <div data-pdf-section="microciclos-encaminhamentos-prazo-resp" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Prazo" value={d.encaminhamentos_prazo} />
        <Field label="Responsável" value={d.encaminhamentos_responsavel} />
      </div>


      <div data-pdf-section="microciclos-proximo">
        <SectionTitle>Próximo Encontro</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Data prevista" value={d.proximo_encontro_data} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Pauta prevista</div>
            <TextBlock value={d.proximo_encontro_pauta} />
          </div>
        </div>
      </div>
    </div>
  );
};
