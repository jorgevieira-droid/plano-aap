import React from 'react';
import {
  RUBRICAS,
  PRATICAS_ESSENCIAIS,
  AVALIACAO_APOIO_OPTIONS,
  type RubricaNivel,
} from '@/components/formularios/apoioPresencialShared';

interface Props {
  responses: Record<string, any> | null;
}

const S = {
  section: { marginBottom: 14 } as React.CSSProperties,
  title: {
    fontSize: 13,
    fontWeight: 700,
    background: '#eef2f7',
    padding: '5px 8px',
    borderRadius: 4,
    marginBottom: 8,
    color: '#1a3a5c',
  } as React.CSSProperties,
  label: { fontSize: 11, fontWeight: 600 } as React.CSSProperties,
  value: { fontSize: 12, marginTop: 2 } as React.CSSProperties,
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '8px 24px',
    marginBottom: 8,
  } as React.CSSProperties,
  box: {
    whiteSpace: 'pre-wrap' as const,
    fontSize: 12,
    marginTop: 4,
    padding: 6,
    border: '1px solid #ddd',
    borderRadius: 4,
    minHeight: 24,
  },
};

const Field: React.FC<{ label: string; value?: any }> = ({ label, value }) => {
  const v =
    value === null || value === undefined || value === '' || (Array.isArray(value) && !value.length)
      ? '—'
      : Array.isArray(value)
        ? value.join(', ')
        : String(value);
  return (
    <div>
      <div style={S.label}>{label}</div>
      <div style={S.value}>{v}</div>
    </div>
  );
};

const TextBlock: React.FC<{ label: string; value?: any }> = ({ label, value }) => (
  <div style={{ marginBottom: 10 }}>
    <div style={S.label}>{label}</div>
    <div style={S.box}>{value && String(value).trim() ? String(value) : '—'}</div>
  </div>
);

const NotaCard: React.FC<{
  titulo: string;
  resumo?: string;
  niveis: RubricaNivel[];
  nota?: any;
}> = ({ titulo, resumo, niveis, nota }) => {
  const num = nota === null || nota === undefined || nota === '' ? null : Number(nota);
  const nivel = niveis.find((n) => n.value === num);
  return (
    <div
      style={{
        border: '1px solid #ddd',
        borderRadius: 4,
        padding: 8,
        marginBottom: 8,
        fontSize: 12,
      }}
    >
      <div style={{ fontWeight: 600 }}>{titulo}</div>
      {resumo && <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>{resumo}</div>}
      <div style={{ marginTop: 6 }}>
        <strong>Nota:</strong>{' '}
        {num === null ? '—' : `${num} — ${nivel?.label ?? ''}`}
      </div>
      {nivel?.description && (
        <div style={{ fontSize: 11, color: '#333', marginTop: 4 }}>{nivel.description}</div>
      )}
    </div>
  );
};

export const RegistroApoioPresencialPrintSection: React.FC<Props> = ({ responses }) => {
  const r = responses || {};
  const rubrica1 = RUBRICAS.find((x) => x.key === r.rubrica_1_key);
  const rubrica2 = RUBRICAS.find((x) => x.key === r.rubrica_2_key);
  const avaliacao = AVALIACAO_APOIO_OPTIONS.find((o) => o.value === Number(r.avaliacao_apoio));

  return (
    <div>
      <h3
        style={{
          fontSize: 14,
          fontWeight: 700,
          margin: '12px 0 8px',
          color: '#1a3a5c',
          borderBottom: '2px solid #1a3a5c',
          paddingBottom: 4,
        }}
      >
        Registro de Apoio Presencial
      </h3>

      <div style={S.section} data-pdf-section="apoio-realizacao">
        <div style={S.title}>2. Dados da Realização</div>
        <div style={S.grid}>
          <Field label="Turma do VOAR" value={r.turma_voar} />
          <Field label="Alunos presentes" value={r.alunos_presentes} />
          <Field
            label="Diferença entre horário previsto e real de início"
            value={r.diferenca_horario}
          />
          <Field label="Outros observadores" value={r.outros_observadores} />
          <Field label="Devolutiva realizada" value={r.devolutiva_realizada} />
          {r.devolutiva_realizada === 'Sim' && (
            <>
              <Field label="Data da devolutiva" value={r.data_devolutiva} />
              <Field label="Dobradinha" value={r.dobradinha} />
            </>
          )}
        </div>
        {r.devolutiva_realizada === 'Não' && (
          <TextBlock
            label="Motivo da não realização da devolutiva"
            value={r.motivo_nao_devolutiva}
          />
        )}
      </div>

      <div style={S.section} data-pdf-section="apoio-evidencias">
        <div style={S.title}>3. Coleta de Evidências</div>
        <TextBlock
          label="Registre as evidências da observação de aula"
          value={r.evidencias_observacao}
        />
      </div>

      <div style={S.section} data-pdf-section="apoio-devolutiva">
        <div style={S.title}>4. Devolutiva Formativa</div>
        <TextBlock
          label="Temas abordados na devolutiva"
          value={r.devolutiva_temas ?? r.foco_escolhido_professor}
        />
        <TextBlock
          label="Encaminhamentos combinados com o Professor"
          value={r.devolutiva_encaminhamentos ?? r.encaminhamentos_professor}
        />
        <TextBlock
          label="Participação e engajamento do Professor na devolutiva"
          value={r.devolutiva_participacao ?? r.subsidios_compartilhados}
        />
        {r.evidencias_trabalhadas && (
          <TextBlock
            label="Evidências trabalhadas (registro anterior)"
            value={r.evidencias_trabalhadas}
          />
        )}
      </div>

      <div style={S.section} data-pdf-section="apoio-rubrica-1">
        <div style={S.title}>5. Escolha da Rubrica de Observação</div>
        {rubrica1 ? (
          <>
            <div style={{ fontSize: 10, color: '#666', marginBottom: 4 }}>{rubrica1.foco}</div>
            <NotaCard
              titulo={`${rubrica1.numero} - ${rubrica1.titulo}`}
              resumo={rubrica1.resumo}
              niveis={rubrica1.niveis}
              nota={r.rubrica_1_nota}
            />
          </>
        ) : (
          <Field label="Rubrica observada" value={null} />
        )}
        <Field label="Existe outra rubrica escolhida?" value={r.tem_rubrica_2} />
      </div>

      {r.tem_rubrica_2 === 'Sim' && (
        <div style={S.section} data-pdf-section="apoio-rubrica-2">
          <div style={S.title}>6. Segunda Rubrica de Observação</div>
          {rubrica2 ? (
            <>
              <div style={{ fontSize: 10, color: '#666', marginBottom: 4 }}>{rubrica2.foco}</div>
              <NotaCard
                titulo={`${rubrica2.numero} - ${rubrica2.titulo}`}
                resumo={rubrica2.resumo}
                niveis={rubrica2.niveis}
                nota={r.rubrica_2_nota}
              />
            </>
          ) : (
            <Field label="Segunda rubrica observada" value={null} />
          )}
        </div>
      )}

      <div style={S.section} data-pdf-section="apoio-praticas">
        <div style={S.title}>6. Práticas Essenciais</div>
        <Field label="Você observou práticas essenciais?" value={r.observou_praticas} />
      </div>

      {r.observou_praticas === 'Sim' && (
        <div style={S.section} data-pdf-section="apoio-pratica-1">
          <div style={S.title}>7. Rubrica da Primeira Prática Essencial — Retomada</div>
          <NotaCard
            titulo={PRATICAS_ESSENCIAIS[0].titulo}
            resumo={PRATICAS_ESSENCIAIS[0].resumo}
            niveis={PRATICAS_ESSENCIAIS[0].niveis}
            nota={r.pratica_1_nota}
          />
          <Field label="Você observou outra prática essencial?" value={r.tem_pratica_2} />
        </div>
      )}

      {r.observou_praticas === 'Sim' && r.tem_pratica_2 === 'Sim' && (
        <div style={S.section} data-pdf-section="apoio-pratica-2">
          <div style={S.title}>8. Rubrica da Segunda Prática Essencial</div>
          <NotaCard
            titulo={PRATICAS_ESSENCIAIS[1].titulo}
            resumo={PRATICAS_ESSENCIAIS[1].resumo}
            niveis={PRATICAS_ESSENCIAIS[1].niveis}
            nota={r.pratica_2_nota}
          />
          <Field label="Você observou outra prática essencial?" value={r.tem_pratica_3} />
        </div>
      )}

      {r.observou_praticas === 'Sim' &&
        r.tem_pratica_2 === 'Sim' &&
        r.tem_pratica_3 === 'Sim' && (
          <div style={S.section} data-pdf-section="apoio-pratica-3">
            <div style={S.title}>9. Rubrica da Terceira Prática Essencial</div>
            <NotaCard
              titulo={PRATICAS_ESSENCIAIS[2].titulo}
              resumo={PRATICAS_ESSENCIAIS[2].resumo}
              niveis={PRATICAS_ESSENCIAIS[2].niveis}
              nota={r.pratica_3_nota}
            />
          </div>
        )}

      <div style={S.section} data-pdf-section="apoio-avaliacao">
        <div style={S.title}>10. Avaliação do Apoio Presencial</div>
        <Field
          label="Como você avalia o apoio presencial realizado?"
          value={avaliacao ? `${avaliacao.value} — ${avaliacao.label}` : null}
        />
        <TextBlock label="Justifique a sua resposta" value={r.avaliacao_apoio_justificativa} />
      </div>
    </div>
  );
};

export default RegistroApoioPresencialPrintSection;
