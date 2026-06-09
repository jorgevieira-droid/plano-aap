import React from 'react';

// Constantes alinhadas a VisitaTecnicaMicrociclosForm.tsx
const PARTES_VISITA = [
  'Conversa com o Coordenador Pedagógico sobre aspectos gerais da implementação',
  'Observação de aula',
  'Devolutiva ao Coordenador Pedagógico',
  'Presença de um técnico da SME',
];

const Q1_OPCOES = [
  { value: 'sim', label: 'Sim' },
  { value: 'em_processo', label: 'Está em processo de organização' },
  { value: 'nao_iniciou', label: 'Ainda não iniciou o processo de organização' },
  { value: 'outro', label: 'Outro' },
];

const Q3_OPCOES = [
  { value: 'sim', label: 'Sim' },
  { value: 'nao', label: 'Não' },
];

const Q4_OPCAO_OUTRO = 'Outro';
const Q4_OPCOES = [
  'Modelo 1 (reagrupamento com turmas do mesmo ano de matrícula)',
  'Modelo 1 (reagrupamento com turmas de anos de matrícula distintos)',
  'Modelo 2 (professor adicional)',
  'Modelo 3 (agrupamento interno na sala de aula)',
  Q4_OPCAO_OUTRO,
  'Não há reagrupamento por níveis de proficiência',
];

const Q5_OPCOES = ['3º anos', '4º anos', '5º anos', '6º anos', '7º anos', '8º anos', '9º anos'];

const Q8_MATERIAL_OPCOES = [
  { value: 'cadernos_curadoria', label: 'Cadernos de Curadoria' },
  { value: 'horizonte_curadoria', label: 'Horizonte + Cadernos de Curadoria' },
  { value: 'curadoria_descobertas', label: 'Cadernos de Curadoria + Descobertas' },
  { value: 'descobertas', label: 'Descobertas' },
];

const Q8_OPCOES = [
  { value: 'sim', label: 'Sim' },
  { value: 'parcial', label: 'Parcialmente' },
  { value: 'nao', label: 'Não' },
];

const Q9_OPCOES = [
  { value: 'sim_sistematicamente', label: 'Sim, registrados e utilizados sistematicamente' },
  { value: 'parcialmente', label: 'Sim, parcialmente: registrados de forma sistemática mas não utilizados para orientar decisões pedagógicas.' },
  { value: 'nao', label: 'Não, os professores participantes não estão realizando os registros de forma sistemática.' },
];

const Q10_OPCOES = [
  { value: 'sim_atpc', label: 'Sim, em ATPC / HTPC' },
  { value: 'sim_individual', label: 'Sim, mas em momentos em que não é possível reunir todos os professores participantes (hora atividade individual / horário individual de planejamento).' },
  { value: 'nao_cobre', label: 'Não, o tempo é previsto em ATPC/HTPC mas nunca é possível cobrir a agenda dos microciclos.' },
  { value: 'nao_previsto', label: 'Não, não há tempo previsto para esse momento formativo sobre os microciclos.' },
  { value: 'nao_se_aplica', label: 'Não se aplica' },
];

const Q14_OPCOES = [
  'Modelo 1 (reagrupamento com turmas do mesmo ano)',
  'Modelo 1 (reagrupamento com turmas de anos distintos)',
  'Modelo 2 (professor adicional)',
  'Modelo 3 (agrupamento interno na sala de aula)',
  'Não há reagrupamento por níveis de proficiência',
];

const Q15_OPCOES = [
  { value: 'sim_toda', label: 'Sim, durante toda a aula' },
  { value: 'parcialmente', label: 'Parcialmente, em alguns momentos da aula' },
  { value: 'nao', label: 'Não houve uso do material didático proposto' },
];

const Q16_OPCOES = ['Caderno 1', 'Caderno 2', 'Caderno 3', 'Caderno 4'];

interface RubricItem {
  key: 'q17' | 'q18' | 'q19' | 'q20' | 'q21' | 'q22';
  numero: number;
  pergunta: string;
  foco?: string;
  niveis: { nivel: string; texto: string }[];
}

const RUBRICAS: RubricItem[] = [
  {
    key: 'q17', numero: 19,
    pergunta: 'As intervenções estavam alinhadas ao caderno e à faixa de desempenho de cada grupo?',
    foco: 'Existem estudantes em diferentes níveis de proficiência dentro de um mesmo agrupamento. O professor não pode dar a mesma aula para todos se estão em níveis diferentes.',
    niveis: [
      { nivel: '1 – Insuficiente', texto: 'O professor usa uma única explicação para toda a turma, sem considerar diferenças de nível. Nenhum ajuste de linguagem, exemplo ou suporte é observado para estudantes com maior defasagem.' },
      { nivel: '2 – Em Desenvolvimento', texto: 'O professor reconhece verbalmente que há diferenças de nível, mas as intervenções seguem um único roteiro. Eventualmente reformula a orientação ao ser questionado, mas não demonstra conhecimento suficiente para adequar a tarefa proposta a um nível de complexidade alinhado ao nível de proficiência do estudante.' },
      { nivel: '3 – Consolidado', texto: 'O professor se prepara para utilizar materiais ou tarefas em ao menos dois níveis de complexidade e circula pela sala direcionando explicações distintas para grupos com diferentes proficiências.' },
      { nivel: '4 – Avançado', texto: 'O professor articula explicitamente o nível do caderno/faixa de proficiência com a estratégia de cada grupo, usa linguagem diferenciada, exemplos calibrados e oferece andaimes progressivos — sem deixar nenhum grupo ocioso ou perdido.' },
    ],
  },
  {
    key: 'q18', numero: 20,
    pergunta: 'O professor utilizou metodologias que favorecem a aprendizagem?',
    foco: "A caixa de 'ferramentas' do professor. A estratégia alcança quem tem dificuldade?",
    niveis: [
      { nivel: '1 – Insuficiente', texto: 'A aula é conduzida integralmente no formato expositivo, com cópia ou resolução individual silenciosa. Não há estratégia que promova interação entre pares ou prática guiada.' },
      { nivel: '2 – Em Desenvolvimento', texto: 'Há uma tentativa de incluir outra metodologia (ex.: duplas), mas sem estrutura: os alunos fazem a mesma coisa que fariam sozinhos, ou a atividade não chega a ser concluída.' },
      { nivel: '3 – Consolidado', texto: 'O professor usa ao menos uma estratégia ativa estruturada (prática guiada, duplas com papel definido, resolução de problemas com discussão). A estratégia é acessível a quem tem maior defasagem.' },
      { nivel: '4 – Avançado', texto: 'O professor combina estratégias de forma intencional e sequenciada (ex.: modelagem → prática guiada → prática independente). Alunos com maior defasagem têm suporte adicional embutido na estratégia.' },
    ],
  },
  {
    key: 'q19', numero: 19,
    pergunta: 'O objetivo de aprendizagem estava claro e foi comunicado aos estudantes?',
    foco: 'O aluno precisa saber o que está aprendendo e por que isso é importante para o seu progresso.',
    niveis: [
      { nivel: '1 – Insuficiente', texto: 'Nenhum objetivo é enunciado. Os alunos iniciam a atividade sem saber o que se espera deles ao final da aula.' },
      { nivel: '2 – Em Desenvolvimento', texto: "O professor menciona o tema ('vamos trabalhar frações'), mas sem precisar a habilidade-alvo ou o critério de sucesso ('ao final, você deve conseguir...')." },
      { nivel: '3 – Consolidado', texto: 'O objetivo é enunciado em linguagem acessível no início e retomado ao longo da aula. Os alunos conseguem, quando perguntados, dizer o que estão aprendendo.' },
      { nivel: '4 – Avançado', texto: "O objetivo é enunciado, conectado à trajetória do estudante ('você já sabe X; hoje vamos chegar em Y') e verificado no encerramento. Alunos sabem identificar se o alcançaram." },
    ],
  },
  {
    key: 'q20', numero: 20,
    pergunta: 'O professor verificou a compreensão dos estudantes?',
    foco: 'Monitoramento constante (avaliação formativa) para saber se a turma está acompanhando antes de avançar.',
    niveis: [
      { nivel: '1 – Insuficiente', texto: "O professor atribui novas atividades sem verificar se os alunos compreenderam. A única forma de 'checar' é perguntar 'entenderam?' e prosseguir após silêncio ou 'sim' coletivo." },
      { nivel: '2 – Em Desenvolvimento', texto: 'O professor faz perguntas, mas direciona apenas a quem levanta a mão ou aos mesmos alunos. Não obtém evidência sobre a compreensão da maioria da turma.' },
      { nivel: '3 – Consolidado', texto: 'O professor usa ao menos uma estratégia que gera evidência sobre todos os alunos (ex.: cada um resolve e mostra; circulação pela sala vendo cadernos). Ajusta o ritmo com base no que observa.' },
      { nivel: '4 – Avançado', texto: 'O professor usa múltiplas verificações ao longo da aula, registra ou memoriza quem precisa de mais apoio e diferencia o próximo passo com base nas evidências coletadas em tempo real.' },
    ],
  },
  {
    key: 'q21', numero: 21,
    pergunta: 'O professor gerenciou bem o tempo para atividades e dúvidas?',
    foco: 'Equilíbrio entre cumprir a sequência didática e garantir que os momentos de prática e dúvida não sejam atropelados.',
    niveis: [
      { nivel: '1 – Insuficiente', texto: 'A aula perde tempo em transições longas, organização de sala ou episódios de comportamento. A atividade principal não chega a ser concluída, ou as dúvidas não são atendidas por falta de tempo.' },
      { nivel: '2 – Em Desenvolvimento', texto: 'O tempo é parcialmente aproveitado, mas há desequilíbrio: ou a explicação inicial se estende demais e a prática fica para o final, ou a prática é interrompida antes que os alunos possam ter um tempo adequado para consolidar as aprendizagens almejadas.' },
      { nivel: '3 – Consolidado', texto: 'O professor divide o tempo de forma equilibrada entre explicação, prática e dúvidas. Os alunos têm tempo suficiente para trabalhar e tirar dúvidas. A aula encerra com uma síntese ou tarefa clara.' },
      { nivel: '4 – Avançado', texto: 'O professor usa o tempo com precisão intencional: monitora o relógio sem perder o fio da aula, ajusta o ritmo em tempo real (acelera, desacelera) e garante que encerramento e síntese sempre aconteçam.' },
    ],
  },
  {
    key: 'q22', numero: 22,
    pergunta: 'O clima da sala é de colaboração, respeito mútuo e favorável à aprendizagem?',
    foco: 'Segurança psicológica e respeito. O aluno precisa se sentir seguro para errar.',
    niveis: [
      { nivel: '1 – Insuficiente', texto: 'Há episódios de constrangimento explícito (professor corrige com tom depreciativo, alunos riem de erros de colegas sem intervenção). O erro é tratado como falha, não como etapa da aprendizagem.' },
      { nivel: '2 – Em Desenvolvimento', texto: "O ambiente é neutro: não há episódios explícitos de humilhação, mas o professor não constrói ativamente uma cultura de 'é ok errar'. Alunos evitam se expor por receio de julgamento." },
      { nivel: '3 – Consolidado', texto: "O professor normaliza o erro como parte do processo ('errar é parte de aprender'). As interações são respeitosas e o professor modela como tratar bem quem erra. Alunos participam sem receio visível." },
      { nivel: '4 – Avançado', texto: 'O professor cultiva ativamente a colaboração (ex.: pede que alunos ajudem colegas com respeito, celebra tentativas). O erro é usado como ponto de partida para a aprendizagem coletiva. O clima é de comunidade.' },
    ],
  },
];

export interface VisitaMicrociclosData {
  municipio?: string | null;
  nome_escola?: string | null;
  pessoa_acompanhou?: string | null;
  professor_observado?: string | null;
  formador?: string | null;
  horario_inicio?: string | null;
  horario_fim?: string | null;
  numero_visita?: string | null;
  partes_visita?: string[] | null;
  q1_organizacao_rotina?: string | null;
  q2_inicio_aulas?: string | null;
  q3_tres_encontros?: string | null;
  q4_modelos_agrupamento?: string[] | null;
  q4_modelos_agrupamento_outro?: string | null;
  q5_anos_escolares?: string[] | null;
  q6_num_turmas?: number | null;
  q7_num_estudantes?: number | null;
  q8_material_suficiente?: string | null;
  q9_registros_avaliacao?: string | null;
  q10_tempo_formativo?: string | null;
  q11_estudantes_matriculados?: number | null;
  q12_estudantes_presentes?: number | null;
  q13_componente?: string | null;
  q14_agrupamento_turma?: string | null;
  q14_agrupamento_turma_outro?: string | null;
  q15_uso_material?: string | null;
  q16_cadernos_uso?: string[] | null;
  nota_q17?: number | null; evidencia_q17?: string | null;
  nota_q18?: number | null; evidencia_q18?: string | null;
  nota_q19?: number | null; evidencia_q19?: string | null;
  nota_q20?: number | null; evidencia_q20?: string | null;
  nota_q21?: number | null; evidencia_q21?: string | null;
  nota_q22?: number | null; evidencia_q22?: string | null;
  enca_pontos_fortes?: string | null;
  enca_aspectos_fortalecer?: string | null;
  enca_encaminhamentos?: string | null;
  encb_pontos_fortes?: string | null;
  encb_aspectos_fortalecer?: string | null;
  encb_encaminhamentos?: string | null;
  encc_pontos_fortes?: string | null;
  encc_aspectos_fortalecer?: string | null;
  encc_encaminhamentos?: string | null;
  observacoes_gerais?: string | null;
}

const styles = {
  section: { marginBottom: 18, padding: 12, border: '1px solid #ddd', borderRadius: 6 } as React.CSSProperties,
  sectionTitle: { fontSize: 14, fontWeight: 700, margin: '0 0 10px', color: '#1a3a5c', borderBottom: '2px solid #1a3a5c', paddingBottom: 4 } as React.CSSProperties,
  q: { marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #f0f0f0' } as React.CSSProperties,
  qLabel: { fontSize: 12, fontWeight: 600, marginBottom: 4 } as React.CSSProperties,
  text: { fontSize: 12, padding: 6, border: '1px solid #ddd', borderRadius: 4, whiteSpace: 'pre-wrap', minHeight: 18 } as React.CSSProperties,
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
  return (
    <>
      <div style={styles.blank} /><div style={styles.blank} /><div style={styles.blank} />
    </>
  );
};

const Checks: React.FC<{ options: string[]; selected?: string[] | null; outro?: string | null; outroLabel?: string }> = ({ options, selected, outro, outroLabel = 'Outro' }) => {
  const sel = new Set(selected || []);
  return (
    <div>
      {options.map(o => (
        <div key={o} style={styles.optionRow}>
          <span style={{ ...styles.box, ...(sel.has(o) ? styles.boxFilled : {}) }} />
          <span>{o}</span>
        </div>
      ))}
      {outro && outro.trim() && (
        <div style={{ marginTop: 4, fontSize: 11 }}>
          <strong>{outroLabel}:</strong> {outro}
        </div>
      )}
    </div>
  );
};

const Radios: React.FC<{ options: { value: string; label: string }[]; selected?: string | null }> = ({ options, selected }) => (
  <div>
    {options.map(o => (
      <div key={o.value} style={styles.optionRow}>
        <span style={{ ...styles.box, borderRadius: 6, ...(selected === o.value ? styles.boxFilled : {}) }} />
        <span>{o.label}</span>
      </div>
    ))}
  </div>
);

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

export const VisitaMicrociclosPrintSection: React.FC<{ data: VisitaMicrociclosData | null }> = ({ data }) => {
  const d: VisitaMicrociclosData = data || {};
  return (
    <>
      {/* Cadastro complementar */}
      <div style={styles.section} data-pdf-section>
        <h3 style={styles.sectionTitle}>Identificação da visita</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px 24px', fontSize: 12 }}>
          <div><strong>Município:</strong> {d.municipio || '—'}</div>
          <div><strong>Escola:</strong> {d.nome_escola || '—'}</div>
          <div><strong>Formador:</strong> {d.formador || '—'}</div>
          <div><strong>Nº da Visita:</strong> {d.numero_visita || '—'}</div>
          <div><strong>Horário início:</strong> {d.horario_inicio || '—'}</div>
          <div><strong>Horário fim:</strong> {d.horario_fim || '—'}</div>
          <div style={{ gridColumn: '1 / -1' }}><strong>Pessoa que acompanhou:</strong> {d.pessoa_acompanhou || '—'}</div>
          <div style={{ gridColumn: '1 / -1' }}><strong>Professor observado:</strong> {d.professor_observado || '—'}</div>
        </div>
        <div style={{ marginTop: 10 }}>
          <div style={styles.qLabel}>Durante a visita técnica, houve (seleção múltipla):</div>
          <Checks options={PARTES_VISITA} selected={d.partes_visita} />
        </div>
      </div>

      {/* PARTE 1 */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle} data-pdf-section>Parte 1 — Implementação dos microciclos na escola</h3>

        <div style={styles.q} data-pdf-section>
          <div style={styles.qLabel}>1. A escola já se encontra organizada para garantir a rotina semanal de 3 encontros semanais de 1 hora-aula por componente?</div>
          <Radios options={Q1_OPCOES} selected={d.q1_organizacao_rotina} />
        </div>

        <div style={styles.q} data-pdf-section>
          <div style={styles.qLabel}>2. Quando iniciaram as aulas de recomposição, ou qual é a previsão de início?</div>
          <TextValue value={d.q2_inicio_aulas} />
        </div>

        <div style={styles.q} data-pdf-section>
          <div style={styles.qLabel}>3. A escola tem realizado 3 encontros semanais de 1 hora-aula por componente?</div>
          <Radios options={Q3_OPCOES} selected={d.q3_tres_encontros} />
        </div>

        <div style={styles.q} data-pdf-section>
          <div style={styles.qLabel}>4. Qual o modelo de agrupamento adotado pela escola? (seleção múltipla)</div>
          <Checks options={Q4_OPCOES} selected={d.q4_modelos_agrupamento} outro={d.q4_modelos_agrupamento_outro} outroLabel="Outro (especificar)" />
        </div>

        <div style={styles.q} data-pdf-section>
          <div style={styles.qLabel}>5. Quais anos escolares estão sendo contemplados? (seleção múltipla)</div>
          <Checks options={Q5_OPCOES} selected={d.q5_anos_escolares} />
        </div>

        <div style={styles.q} data-pdf-section>
          <div style={styles.qLabel}>6. Nº de turmas de recomposição na escola</div>
          <div style={styles.text}>{d.q6_num_turmas ?? ''}</div>
        </div>

        <div style={styles.q} data-pdf-section>
          <div style={styles.qLabel}>7. Nº de estudantes participantes</div>
          <div style={styles.text}>{d.q7_num_estudantes ?? ''}</div>
        </div>

        <div style={styles.q} data-pdf-section>
          <div style={styles.qLabel}>8. O material didático recebido foi suficiente para todos os estudantes?</div>
          <Radios options={Q8_OPCOES} selected={d.q8_material_suficiente} />
        </div>

        <div style={styles.q} data-pdf-section>
          <div style={styles.qLabel}>9. Os professores estão realizando os registros de avaliação dos estudantes?</div>
          <Radios options={Q9_OPCOES} selected={d.q9_registros_avaliacao} />
        </div>

        <div style={styles.q} data-pdf-section>
          <div style={styles.qLabel}>10. Há tempo previsto para o momento formativo sobre os microciclos com os professores participantes?</div>
          <Radios options={Q10_OPCOES} selected={d.q10_tempo_formativo} />
        </div>
      </div>

      {/* PARTE 2 */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle} data-pdf-section>Parte 2 — Observação de aula</h3>

        <div style={styles.q} data-pdf-section>
          <div style={styles.qLabel}>11. Nº de estudantes matriculados na turma observada</div>
          <div style={styles.text}>{d.q11_estudantes_matriculados ?? ''}</div>
        </div>

        <div style={styles.q} data-pdf-section>
          <div style={styles.qLabel}>12. Nº de estudantes presentes na aula observada</div>
          <div style={styles.text}>{d.q12_estudantes_presentes ?? ''}</div>
        </div>

        <div style={styles.q} data-pdf-section>
          <div style={styles.qLabel}>13. Componente curricular observado</div>
          <div style={styles.text}>{d.q13_componente || ''}</div>
        </div>

        <div style={styles.q} data-pdf-section>
          <div style={styles.qLabel}>14. Qual o modelo de agrupamento observado na turma?</div>
          <Radios
            options={Q14_OPCOES.map(o => ({ value: o, label: o }))}
            selected={d.q14_agrupamento_turma}
          />
          {d.q14_agrupamento_turma_outro && (
            <div style={{ marginTop: 4, fontSize: 11 }}><strong>Outro:</strong> {d.q14_agrupamento_turma_outro}</div>
          )}
        </div>

        <div style={styles.q} data-pdf-section>
          <div style={styles.qLabel}>15. Houve uso do material didático proposto durante a aula?</div>
          <Radios options={Q15_OPCOES} selected={d.q15_uso_material} />
        </div>

        <div style={styles.q} data-pdf-section>
          <div style={styles.qLabel}>16. Quais cadernos estão em uso? (seleção múltipla)</div>
          <Checks options={Q16_OPCOES} selected={d.q16_cadernos_uso} />
        </div>

        {RUBRICAS.map(r => {
          const nota = (d as any)[`nota_${r.key}`] as number | null | undefined;
          const evid = (d as any)[`evidencia_${r.key}`] as string | null | undefined;
          return (
            <div key={r.key} style={styles.rubric} data-pdf-section>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                {r.numero}. {r.pergunta}
              </div>
              {r.foco && <div style={{ fontSize: 10.5, color: '#555', marginBottom: 6 }}><strong>Foco:</strong> {r.foco}</div>}
              {r.niveis.map(n => (
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

      {/* PARTE 3 */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle} data-pdf-section>Parte 3 — Devolutiva ao Coordenador Pedagógico</h3>

        {([
          ['A. Condições gerais de implementação', 'enca'],
          ['B. Aspectos metodológicos da aula observada', 'encb'],
          ['C. Análise dos dados da plataforma Trajetória', 'encc'],
        ] as const).map(([titulo, prefix]) => (
          <div key={prefix} data-pdf-section style={{ marginBottom: 12, padding: 8, border: '1px solid #eee', borderRadius: 6 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>{titulo}</div>
            <div style={styles.q}>
              <div style={styles.qLabel}>Principais pontos fortes observados</div>
              <TextValue value={(d as any)[`${prefix}_pontos_fortes`]} />
            </div>
            <div style={styles.q}>
              <div style={styles.qLabel}>Aspectos críticos / a fortalecer</div>
              <TextValue value={(d as any)[`${prefix}_aspectos_fortalecer`]} />
            </div>
            <div style={styles.q}>
              <div style={styles.qLabel}>Encaminhamentos acordados com o ponto focal</div>
              <TextValue value={(d as any)[`${prefix}_encaminhamentos`]} />
            </div>
          </div>
        ))}

        <div style={styles.q} data-pdf-section>
          <div style={styles.qLabel}>Observações gerais</div>
          <TextValue value={d.observacoes_gerais} />
        </div>
      </div>
    </>
  );
};
