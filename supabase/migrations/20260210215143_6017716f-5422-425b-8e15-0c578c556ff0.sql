
-- =============================================================
-- INSTRUMENT_FIELDS: definição dos campos de cada instrumento
-- =============================================================
CREATE TABLE public.instrument_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_type text NOT NULL,
  field_key text NOT NULL,
  label text NOT NULL,
  description text,
  field_type text NOT NULL DEFAULT 'rating', -- rating, text, select_one, select_multi, number
  scale_min integer DEFAULT 1,
  scale_max integer DEFAULT 4,
  scale_labels jsonb, -- [{"value":1,"label":"...","description":"..."},...]
  dimension text, -- agrupamento visual
  sort_order integer NOT NULL DEFAULT 0,
  is_required boolean NOT NULL DEFAULT false,
  metadata jsonb, -- dados extras
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(form_type, field_key)
);

ALTER TABLE public.instrument_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view instrument_fields"
  ON public.instrument_fields FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage instrument_fields"
  ON public.instrument_fields FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- =============================================================
-- INSTRUMENT_RESPONSES: respostas dos formulários
-- =============================================================
CREATE TABLE public.instrument_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registro_acao_id uuid NOT NULL REFERENCES public.registros_acao(id) ON DELETE CASCADE,
  professor_id uuid REFERENCES public.professores(id),
  escola_id uuid NOT NULL REFERENCES public.escolas(id),
  aap_id uuid NOT NULL,
  form_type text NOT NULL,
  responses jsonb NOT NULL DEFAULT '{}',
  questoes_selecionadas jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.instrument_responses ENABLE ROW LEVEL SECURITY;

-- RLS: same pattern as avaliacoes_aula
CREATE POLICY "N1 Admins manage instrument_responses"
  ON public.instrument_responses FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "N2N3 Managers view instrument_responses"
  ON public.instrument_responses FOR SELECT
  USING (
    (public.is_gestor(auth.uid()) OR public.has_role(auth.uid(), 'n3_coordenador_programa'))
    AND EXISTS (
      SELECT 1 FROM registros_acao r
      JOIN user_programas up ON up.user_id = auth.uid()
      WHERE r.id = instrument_responses.registro_acao_id
        AND r.programa IS NOT NULL
        AND up.programa::text = ANY(r.programa)
    )
  );

CREATE POLICY "N4N5 Operational insert instrument_responses"
  ON public.instrument_responses FOR INSERT
  WITH CHECK (public.is_operational(auth.uid()) AND aap_id = auth.uid());

CREATE POLICY "N4N5 Operational update instrument_responses"
  ON public.instrument_responses FOR UPDATE
  USING (public.is_operational(auth.uid()) AND aap_id = auth.uid());

CREATE POLICY "N4N5 Operational delete instrument_responses"
  ON public.instrument_responses FOR DELETE
  USING (public.is_operational(auth.uid()) AND aap_id = auth.uid());

CREATE POLICY "N4N5 Operational view instrument_responses"
  ON public.instrument_responses FOR SELECT
  USING (public.is_operational(auth.uid()) AND aap_id = auth.uid());

CREATE POLICY "N6N7 Local insert instrument_responses"
  ON public.instrument_responses FOR INSERT
  WITH CHECK (public.is_local_user(auth.uid()) AND aap_id = auth.uid() AND public.user_has_entidade(auth.uid(), escola_id));

CREATE POLICY "N6N7 Local update instrument_responses"
  ON public.instrument_responses FOR UPDATE
  USING (public.is_local_user(auth.uid()) AND aap_id = auth.uid());

CREATE POLICY "N6N7 Local view instrument_responses"
  ON public.instrument_responses FOR SELECT
  USING (public.is_local_user(auth.uid()) AND public.user_has_entidade(auth.uid(), escola_id));

CREATE POLICY "N8 Observer insert instrument_responses"
  ON public.instrument_responses FOR INSERT
  WITH CHECK (
    public.is_observer(auth.uid()) AND aap_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM registros_acao r
      JOIN user_programas up ON up.user_id = auth.uid()
      WHERE r.id = instrument_responses.registro_acao_id
        AND r.programa IS NOT NULL
        AND up.programa::text = ANY(r.programa)
    )
  );

CREATE POLICY "N8 Observer view instrument_responses"
  ON public.instrument_responses FOR SELECT
  USING (
    public.is_observer(auth.uid())
    AND EXISTS (
      SELECT 1 FROM registros_acao r
      JOIN user_programas up ON up.user_id = auth.uid()
      WHERE r.id = instrument_responses.registro_acao_id
        AND r.programa IS NOT NULL
        AND up.programa::text = ANY(r.programa)
    )
  );

-- =============================================================
-- SEED: Observação de Aula (12 rating fields + 4 text + 4 extras)
-- =============================================================
INSERT INTO public.instrument_fields (form_type, field_key, label, description, field_type, scale_min, scale_max, scale_labels, dimension, sort_order, is_required, metadata) VALUES
-- Extras
('observacao_aula', 'material_didatico', 'Material Didático', NULL, 'select_one', NULL, NULL, NULL, 'Informações Gerais', 1, true, '{"options":["São Paulo em Ação","Orientação de Estudos","Tutoria"]}'),
('observacao_aula', 'qtd_alunos_masculino', 'Quantidade de Alunos Masculino', NULL, 'number', NULL, NULL, NULL, 'Informações Gerais', 2, true, NULL),
('observacao_aula', 'qtd_alunos_feminino', 'Quantidade de Alunos Feminino', NULL, 'number', NULL, NULL, NULL, 'Informações Gerais', 3, true, NULL),
('observacao_aula', 'observador', 'Observador(a)', 'Nome do ator para quem o evento está atribuído', 'text', NULL, NULL, NULL, 'Informações Gerais', 4, true, NULL),

-- Rating fields - Conhecimento pedagógico do conteúdo
('observacao_aula', 'conteudo_curriculo', 'O conteúdo trabalhado estava alinhado ao currículo (competências e habilidades)', 'Foco: A aula aborda o que é essencial para o ano/ciclo, respeitando a progressão necessária para a recomposição.', 'rating', 1, 4,
 '[{"value":1,"label":"Elementar","description":"O conteúdo trabalhado não possui conexão clara com as habilidades do currículo ou está desalinhado ao nível de desenvolvimento sem foco nas habilidades necessárias para sanar lacunas de anos anteriores."},{"value":2,"label":"Básico","description":"O conteúdo está previsto no currículo, mas é abordado de forma isolada, sem conexão com competências mais amplas ou com as lacunas identificadas."},{"value":3,"label":"Atingiu","description":"O conteúdo está perfeitamente alinhado às habilidades do currículo e o professor demonstra focar nos pré-requisitos essenciais para a recomposição."},{"value":4,"label":"Superou","description":"Além do alinhamento curricular, o professor integra diferentes habilidades e adapta o conteúdo em tempo real, identificando lacunas durante a aula."}]',
 'Conhecimento pedagógico do conteúdo', 10, true, NULL),

('observacao_aula', 'objetivo_claro', 'O objetivo de aprendizagem estava claro e foi comunicado aos estudantes', 'Foco: O aluno precisa saber o que está aprendendo e por que isso é importante para o seu progresso.', 'rating', 1, 4,
 '[{"value":1,"label":"Elementar","description":"Não há clareza sobre o que se pretende ensinar. O objetivo não é mencionado ou é confundido com a simples execução de uma tarefa."},{"value":2,"label":"Básico","description":"O objetivo existe e é mencionado, mas de forma técnica ou burocrática, sem que os estudantes compreendam o que deverão ser capazes de fazer ao final da aula."},{"value":3,"label":"Atingiu","description":"O objetivo é comunicado de forma clara e compreensível. Os estudantes sabem qual habilidade estão desenvolvendo e como ela se conecta ao que já sabem."},{"value":4,"label":"Superou","description":"O objetivo é retomado durante toda a aula como bússola. Os alunos conseguem explicar, com suas próprias palavras, o propósito da aprendizagem e como serão avaliados."}]',
 'Conhecimento pedagógico do conteúdo', 11, false, NULL),

-- Prática de ensino
('observacao_aula', 'estrategias_adequadas', 'O professor utilizou estratégias adequadas ao objetivo da aula', 'Foco: A metodologia deve ser o veículo que transporta o aluno do "não saber" ao "saber", especialmente em contextos de defasagem.', 'rating', 1, 4,
 '[{"value":1,"label":"Elementar","description":"As estratégias são predominantemente passivas ou descoladas do contexto."},{"value":2,"label":"Básico","description":"O professor utiliza estratégias padrão (ex: aula expositiva), mas não promove a compreensão."},{"value":3,"label":"Atingiu","description":"As estratégias são coerentes com o objetivo e promovem o desenvolvimento."},{"value":4,"label":"Superou","description":"Utiliza metodologias ativas e diferenciação."}]',
 'Prática de ensino', 20, false, NULL),

('observacao_aula', 'conteudo_organizado', 'O conteúdo foi apresentado de maneira bem organizada, objetiva e eficiente', 'Foco: A estrutura lógica da aula. Em recomposição, o tempo é ouro e a explicação não pode gerar mais confusão.', 'rating', 1, 4,
 '[{"value":1,"label":"Elementar","description":"A apresentação é confusa, com excesso de informações irrelevantes ou falta de conexão lógica."},{"value":2,"label":"Básico","description":"O conteúdo segue uma sequência lógica, mas a comunicação é burocrática ou extensa demais, perdendo a atenção dos alunos."},{"value":3,"label":"Atingiu","description":"A explicação é direta e bem estruturada. O professor utiliza bem o tempo, focando nos pontos cruciais do conteúdo."},{"value":4,"label":"Superou","description":"O conteúdo é sintetizado de forma brilhante. A eficiência é máxima: pouca fala do professor gera muito entendimento e tempo para prática."}]',
 'Prática de ensino', 21, true, NULL),

('observacao_aula', 'metodologias_aprendizagem', 'O professor utilizou metodologias que favorecem a aprendizagem', 'Foco: A "caixa de ferramentas" do professor. A estratégia alcança quem tem dificuldade?', 'rating', 1, 4,
 '[{"value":1,"label":"Elementar","description":"Utiliza uma única abordagem que ignora as diferentes necessidades da turma e as barreiras de aprendizagem existentes."},{"value":2,"label":"Básico","description":"Utiliza estratégias que funcionam para a média da turma, mas não oferece suportes para os alunos com lacunas severas."},{"value":3,"label":"Atingiu","description":"As escolhas metodológicas são intencionais e facilitam a absorção do conhecimento por diferentes perfis de alunos."},{"value":4,"label":"Superou","description":"Demonstra repertório vasto: adapta a metodologia instantaneamente ao notar uma dúvida, usando diferentes linguagens."}]',
 'Prática de ensino', 22, false, NULL),

('observacao_aula', 'metodologias_ativas', 'O professor utilizou metodologias ativas para promover um melhor aprendizado', 'Foco: O deslocamento do centro da aula. O aluno é quem "trabalha" o conhecimento.', 'rating', 1, 4,
 '[{"value":1,"label":"Elementar","description":"O professor retém toda a centralidade. Os alunos são apenas receptores passivos, realizando tarefas mecânicas."},{"value":2,"label":"Básico","description":"Há tentativas de interação, mas o controle da construção do pensamento ainda é 100% do professor."},{"value":3,"label":"Atingiu","description":"O professor atua como mediador. São propostas atividades onde os alunos precisam resolver problemas, colaborar em grupos ou explicar seus raciocínios."},{"value":4,"label":"Superou","description":"Os alunos lideram processos. O professor circula e provoca o pensamento crítico, intervindo apenas para elevar o nível do desafio."}]',
 'Prática de ensino', 23, false, NULL),

-- Engajamento e verificação
('observacao_aula', 'participacao_alunos', 'O professor conseguiu desenvolver o conteúdo de modo que a maioria dos alunos participaram da aula', 'Foco: Engajamento coletivo e a capacidade do professor de converter o plano de aula em uma experiência compartilhada por todos.', 'rating', 1, 4,
 '[{"value":1,"label":"Elementar","description":"A participação é passiva ou restrita a um grupo muito pequeno de alunos."},{"value":2,"label":"Básico","description":"Há participação da maioria em momentos pontuais, mas o engajamento é superficial."},{"value":3,"label":"Atingiu","description":"A maior parte dos alunos está ativamente envolvida nas atividades. O professor circula pela sala e faz convites à participação."},{"value":4,"label":"Superou","description":"Todos os alunos presentes participam ativamente. O professor demonstra sensibilidade para identificar quem está retraído e utiliza estratégias específicas para incluir cada estudante."}]',
 'Engajamento e verificação', 30, true, NULL),

('observacao_aula', 'intervencoes_compreensao', 'O professor fez intervenções que apoiam a compreensão', 'Foco: A capacidade do professor de atuar sobre a dúvida, oferecendo suportes que ajudem o aluno a superar um obstáculo cognitivo.', 'rating', 1, 4,
 '[{"value":1,"label":"Elementar","description":"O professor ignora ou não percebe os sinais de dúvida ou apenas repete a mesma explicação."},{"value":2,"label":"Básico","description":"O professor identifica a dúvida e oferece a resposta pronta."},{"value":3,"label":"Atingiu","description":"O professor faz intervenções precisas, utilizando exemplos e identificando a raiz da dificuldade."},{"value":4,"label":"Superou","description":"As intervenções são personalizadas: o professor identifica a dificuldade de diferentes alunos e adapta sua linguagem para garantir que todos avancem."}]',
 'Engajamento e verificação', 31, false, NULL),

('observacao_aula', 'questionamentos_reflexao', 'O professor fez questionamentos que promovem a reflexão', 'Foco: O uso de perguntas abertas que desafiam o aluno a pensar, em vez de apenas fornecer respostas curtas ou memorizadas.', 'rating', 1, 4,
 '[{"value":1,"label":"Elementar","description":"O professor não faz perguntas ou faz apenas perguntas de sim ou não e de resgate de memória."},{"value":2,"label":"Básico","description":"O professor faz perguntas que estimulam a memória, mas não avança para o porquê ou como."},{"value":3,"label":"Atingiu","description":"O professor utiliza perguntas que estimulam os alunos a explicar seus raciocínios, comparar ideias e justificar suas respostas."},{"value":4,"label":"Superou","description":"Os questionamentos geram um efeito cascata: a pergunta do professor estimula os alunos a questionarem uns aos outros e a aprofundarem a discussão."}]',
 'Engajamento e verificação', 32, false, NULL),

('observacao_aula', 'verificacao_compreensao', 'O professor verificou a compreensão dos estudantes', 'Foco: O monitoramento constante (avaliação formativa) para saber se a turma está acompanhando antes de avançar.', 'rating', 1, 4,
 '[{"value":1,"label":"Elementar","description":"O professor segue o conteúdo sem checar se os alunos estão acompanhando."},{"value":2,"label":"Básico","description":"A verificação é frágil, baseada em perguntas retóricas para a sala toda."},{"value":3,"label":"Atingiu","description":"O professor utiliza técnicas ativas de verificação."},{"value":4,"label":"Superou","description":"A verificação é sistemática e contínua. O professor utiliza os dados para ajustar o ritmo da aula."}]',
 'Engajamento e verificação', 33, false, NULL),

('observacao_aula', 'ajustes_pedagogicos', 'O professor fez ajustes pedagógicos a partir das respostas dos estudantes', 'Foco: A flexibilidade do professor em abandonar o roteiro planejado para atender a uma necessidade real demonstrada pelos alunos.', 'rating', 1, 4,
 '[{"value":1,"label":"Elementar","description":"O professor ignora erros ou dificuldades apresentadas pelos alunos e mantém o ritmo planejado."},{"value":2,"label":"Básico","description":"O professor percebe a dificuldade e faz uma breve pausa para repetir a explicação, mas não altera a estratégia."},{"value":3,"label":"Atingiu","description":"Ao notar erros comuns ou dúvidas persistentes, o professor propõe uma nova forma de explicar ou altera a atividade."},{"value":4,"label":"Superou","description":"O professor utiliza o erro como oportunidade de aprendizagem, transformando a dúvida de um aluno em um novo desafio para a turma."}]',
 'Engajamento e verificação', 34, false, NULL),

-- Clima e gestão
('observacao_aula', 'clima_sala', 'O clima na sala de aula é de colaboração, respeito mútuo e favorável à aprendizagem', 'Foco: A segurança psicológica e o respeito. O aluno precisa se sentir seguro para errar.', 'rating', 1, 4,
 '[{"value":1,"label":"Elementar","description":"O ambiente é hostil, excessivamente barulhento ou apático. Há desrespeito e o erro é desencorajado."},{"value":2,"label":"Básico","description":"O clima é de ordem, mas baseado apenas na autoridade. Há pouca colaboração entre os pares."},{"value":3,"label":"Atingiu","description":"Há um ambiente de respeito e cooperação. O professor media conflitos de forma positiva."},{"value":4,"label":"Superou","description":"Existe uma cultura de aprendizagem vibrante. Os alunos sentem total liberdade para arriscar."}]',
 'Clima e gestão do tempo', 40, true, NULL),

('observacao_aula', 'gestao_tempo', 'O professor conseguiu gerenciar bem o tempo para desenvolver a sequência didática, atividades e tirar as dúvidas', 'Foco: O equilíbrio entre cumprir a sequência didática e garantir que os momentos de prática e dúvida não sejam atropelados.', 'rating', 1, 4,
 '[{"value":1,"label":"Elementar","description":"A aula termina sem concluir a atividade principal, ou o tempo é gasto quase totalmente com a organização da turma."},{"value":2,"label":"Básico","description":"O professor cumpre o cronograma, mas de forma apressada. Momentos importantes são sacrificados."},{"value":3,"label":"Atingiu","description":"O tempo é bem distribuído entre a introdução, o desenvolvimento e a conclusão."},{"value":4,"label":"Superou","description":"A gestão do tempo é impecável: o professor maximiza o tempo de aprendizagem ativa."}]',
 'Clima e gestão do tempo', 41, true, NULL),

-- Text fields - Encaminhamentos
('observacao_aula', 'pontos_fortes', 'Pontos fortes da aula', NULL, 'text', NULL, NULL, NULL, 'Encaminhamentos', 50, false, NULL),
('observacao_aula', 'aspectos_fortalecer', 'Aspectos a fortalecer', NULL, 'text', NULL, NULL, NULL, 'Encaminhamentos', 51, false, NULL),
('observacao_aula', 'estrategias_sugeridas', 'Estratégias sugeridas', NULL, 'text', NULL, NULL, NULL, 'Encaminhamentos', 52, false, NULL),
('observacao_aula', 'combinacao_futura', 'Combinação para acompanhamento futuro', NULL, 'text', NULL, NULL, NULL, 'Encaminhamentos', 53, false, NULL),

-- =============================================================
-- SEED: Devolutiva Pedagógica (7 ratings)
-- =============================================================
('devolutiva_pedagogica', 'retomada_objetivo', 'Retomada do objetivo da aula observada', NULL, 'rating', 1, 4,
 '[{"value":1,"label":"Inicial","description":"O objetivo não é retomado ou é mencionado de forma genérica, sem conexão com a aula observada."},{"value":2,"label":"Em desenvolvimento","description":"O objetivo é retomado, mas com conexão parcial com as atividades realizadas."},{"value":3,"label":"Consolidado","description":"O objetivo é claramente retomado e analisado à luz do que foi observado na aula."},{"value":4,"label":"Avançado","description":"O objetivo é retomado de forma crítica, relacionando intenção pedagógica, estratégias utilizadas e evidências de aprendizagem dos estudantes."}]',
 NULL, 1, true, NULL),

('devolutiva_pedagogica', 'reconhecimento_pontos_fortes', 'Reconhecimento dos pontos fortes', NULL, 'rating', 1, 4,
 '[{"value":1,"label":"Inicial","description":"Reconhecimento genérico ou superficial."},{"value":2,"label":"Em desenvolvimento","description":"Pontos fortes identificados, mas pouco específicos ou pouco conectados à prática pedagógica."},{"value":3,"label":"Consolidado","description":"Pontos fortes claros, específicos e fundamentados em evidências da aula observada."},{"value":4,"label":"Avançado","description":"Pontos fortes analisados em profundidade, com explicitação do impacto positivo na aprendizagem dos estudantes."}]',
 NULL, 2, true, NULL),

('devolutiva_pedagogica', 'analise_dificuldades', 'Análise das dificuldades observadas', NULL, 'rating', 1, 4,
 '[{"value":1,"label":"Inicial","description":"Dificuldades não são mencionadas ou são tratadas de forma vaga."},{"value":2,"label":"Em desenvolvimento","description":"Dificuldades identificadas, mas sem aprofundamento nas causas."},{"value":3,"label":"Consolidado","description":"Dificuldades analisadas com base em situações concretas da aula."},{"value":4,"label":"Avançado","description":"Análise aprofundada das dificuldades, articulando prática docente, respostas dos estudantes e contexto da turma."}]',
 NULL, 3, true, NULL),

('devolutiva_pedagogica', 'definicao_focos', 'Definição de 1 ou 2 focos de desenvolvimento', NULL, 'rating', 1, 4,
 '[{"value":1,"label":"Inicial","description":"Focos pouco claros, muitos focos ou não relacionados às dificuldades observadas."},{"value":2,"label":"Em desenvolvimento","description":"Focos definidos, mas ainda amplos ou genéricos."},{"value":3,"label":"Consolidado","description":"Um ou dois focos claros, pertinentes e viáveis, alinhados às dificuldades identificadas."},{"value":4,"label":"Avançado","description":"Focos bem delimitados, priorizados estrategicamente e conectados a objetivos de aprendizagem."}]',
 NULL, 4, true, NULL),

('devolutiva_pedagogica', 'sugestao_estrategias', 'Sugestão de estratégias práticas', NULL, 'rating', 1, 4,
 '[{"value":1,"label":"Inicial","description":"Estratégias ausentes ou excessivamente teóricas."},{"value":2,"label":"Em desenvolvimento","description":"Estratégias sugeridas, mas com pouca clareza de como aplicar na sala de aula."},{"value":3,"label":"Consolidado","description":"Estratégias práticas, claras e diretamente aplicáveis ao contexto observado."},{"value":4,"label":"Avançado","description":"Estratégias contextualizadas, exemplificadas e articuladas à rotina do professor e da turma."}]',
 NULL, 5, true, NULL),

('devolutiva_pedagogica', 'combinacao_proximos_passos', 'Combinação de próximos passos', NULL, 'rating', 1, 4,
 '[{"value":1,"label":"Inicial","description":"Próximos passos não definidos ou pouco claros."},{"value":2,"label":"Em desenvolvimento","description":"Próximos passos definidos, mas sem prazo ou responsabilidade clara."},{"value":3,"label":"Consolidado","description":"Próximos passos acordados, com clareza sobre o que será feito e quando."},{"value":4,"label":"Avançado","description":"Próximos passos pactuados com acompanhamento definido e critérios de observação da mudança."}]',
 NULL, 6, true, NULL),

('devolutiva_pedagogica', 'principais_avancos', 'Principais avanços - Mudança de prática', NULL, 'rating', 1, 4,
 '[{"value":1,"label":"Inicial","description":"Mudanças não identificadas ou apenas intencionais."},{"value":2,"label":"Em desenvolvimento","description":"Indícios iniciais de mudança, ainda pouco consistentes."},{"value":3,"label":"Consolidado","description":"Mudanças observáveis na prática docente, relacionadas aos focos definidos."},{"value":4,"label":"Avançado","description":"Mudança de prática consolidada, com impacto percebido na participação e aprendizagem dos estudantes."}]',
 NULL, 7, true, NULL),

-- =============================================================
-- SEED: Qualidade das ATPCs (5 ratings + 1 text)
-- =============================================================
('qualidade_atpcs', 'planejamento_objetivos', 'Planejamento com objetivos claros e alinhados a LP/MAT', NULL, 'rating', 1, 4,
 '[{"value":1,"label":"Inicial"},{"value":2,"label":"Em desenvolvimento"},{"value":3,"label":"Consolidado"},{"value":4,"label":"Avançado"}]',
 NULL, 1, true, NULL),

('qualidade_atpcs', 'conteudo_formativo', 'Conteúdo formativo com foco didático', NULL, 'rating', 1, 4,
 '[{"value":1,"label":"Inicial"},{"value":2,"label":"Em desenvolvimento"},{"value":3,"label":"Consolidado"},{"value":4,"label":"Avançado"}]',
 NULL, 2, true, NULL),

('qualidade_atpcs', 'metodologia_participativa', 'Metodologia participativa', NULL, 'rating', 1, 4,
 '[{"value":1,"label":"Inicial"},{"value":2,"label":"Em desenvolvimento"},{"value":3,"label":"Consolidado"},{"value":4,"label":"Avançado"}]',
 NULL, 3, true, NULL),

('qualidade_atpcs', 'uso_pedagogico_dados', 'Uso pedagógico de dados', NULL, 'rating', 1, 4,
 '[{"value":1,"label":"Inicial"},{"value":2,"label":"Em desenvolvimento"},{"value":3,"label":"Consolidado"},{"value":4,"label":"Avançado"}]',
 NULL, 4, true, NULL),

('qualidade_atpcs', 'encaminhamentos_praticos', 'Encaminhamentos práticos para sala de aula', NULL, 'rating', 1, 4,
 '[{"value":1,"label":"Inicial"},{"value":2,"label":"Em desenvolvimento"},{"value":3,"label":"Consolidado"},{"value":4,"label":"Avançado"}]',
 NULL, 5, true, NULL),

('qualidade_atpcs', 'observacoes', 'Observações', NULL, 'text', NULL, NULL, NULL, NULL, 6, false, NULL),

-- =============================================================
-- SEED: Obs Uso Pedagógico de Dados (9 ratings in 3 dimensions)
-- =============================================================
('obs_uso_dados', 'organizacao_analise_dados', 'Organização e análise de dados', NULL, 'rating', 1, 4,
 '[{"value":1,"label":"Inicial"},{"value":2,"label":"Em desenvolvimento"},{"value":3,"label":"Consolidado"},{"value":4,"label":"Avançado"}]',
 'Antes da ATPC', 1, true, NULL),

('obs_uso_dados', 'definicao_habilidades', 'Definição de habilidades prioritárias', NULL, 'rating', 1, 4,
 '[{"value":1,"label":"Inicial"},{"value":2,"label":"Em desenvolvimento"},{"value":3,"label":"Consolidado"},{"value":4,"label":"Avançado"}]',
 'Antes da ATPC', 2, true, NULL),

('obs_uso_dados', 'relacao_lp_mat', 'Relação clara com LP ou MAT', NULL, 'rating', 1, 4,
 '[{"value":1,"label":"Inicial"},{"value":2,"label":"Em desenvolvimento"},{"value":3,"label":"Consolidado"},{"value":4,"label":"Avançado"}]',
 'Antes da ATPC', 3, true, NULL),

('obs_uso_dados', 'analise_coletiva', 'Análise coletiva dos dados', NULL, 'rating', 1, 4,
 '[{"value":1,"label":"Inicial"},{"value":2,"label":"Em desenvolvimento"},{"value":3,"label":"Consolidado"},{"value":4,"label":"Avançado"}]',
 'Durante a ATPC', 4, true, NULL),

('obs_uso_dados', 'levantamento_hipoteses', 'Levantamento de hipóteses', NULL, 'rating', 1, 4,
 '[{"value":1,"label":"Inicial"},{"value":2,"label":"Em desenvolvimento"},{"value":3,"label":"Consolidado"},{"value":4,"label":"Avançado"}]',
 'Durante a ATPC', 5, true, NULL),

('obs_uso_dados', 'discussao_estrategias', 'Discussão de estratégias didáticas', NULL, 'rating', 1, 4,
 '[{"value":1,"label":"Inicial"},{"value":2,"label":"Em desenvolvimento"},{"value":3,"label":"Consolidado"},{"value":4,"label":"Avançado"}]',
 'Durante a ATPC', 6, true, NULL),

('obs_uso_dados', 'definicao_plano_acao', 'Definição de plano de ação', NULL, 'rating', 1, 4,
 '[{"value":1,"label":"Inicial"},{"value":2,"label":"Em desenvolvimento"},{"value":3,"label":"Consolidado"},{"value":4,"label":"Avançado"}]',
 'Após a ATPC', 7, true, NULL),

('obs_uso_dados', 'estrategias_combinadas', 'Estratégias combinadas para aplicação em sala', NULL, 'rating', 1, 4,
 '[{"value":1,"label":"Inicial"},{"value":2,"label":"Em desenvolvimento"},{"value":3,"label":"Consolidado"},{"value":4,"label":"Avançado"}]',
 'Após a ATPC', 8, true, NULL),

('obs_uso_dados', 'monitoramento_previsto', 'Monitoramento previsto', NULL, 'rating', 1, 4,
 '[{"value":1,"label":"Inicial"},{"value":2,"label":"Em desenvolvimento"},{"value":3,"label":"Consolidado"},{"value":4,"label":"Avançado"}]',
 'Após a ATPC', 9, true, NULL),

-- =============================================================
-- SEED: Autoavaliação (5 ratings + 1 text)
-- =============================================================
('autoavaliacao', 'planejo_atpcs', 'Planejo ATPCs com base em dados e currículo', NULL, 'rating', 1, 3,
 '[{"value":1,"label":"Pouco consistente"},{"value":2,"label":"Em consolidação"},{"value":3,"label":"Consistente"}]',
 NULL, 1, true, NULL),

('autoavaliacao', 'conducao_discussoes', 'Conduzo discussões pedagógicas com foco didático', NULL, 'rating', 1, 3,
 '[{"value":1,"label":"Pouco consistente"},{"value":2,"label":"Em consolidação"},{"value":3,"label":"Consistente"}]',
 NULL, 2, true, NULL),

('autoavaliacao', 'acompanho_estrategias', 'Acompanho a aplicação das estratégias em sala', NULL, 'rating', 1, 3,
 '[{"value":1,"label":"Pouco consistente"},{"value":2,"label":"Em consolidação"},{"value":3,"label":"Consistente"}]',
 NULL, 3, true, NULL),

('autoavaliacao', 'articulo_formacao', 'Articulo formação e acompanhamento pedagógico', NULL, 'rating', 1, 3,
 '[{"value":1,"label":"Pouco consistente"},{"value":2,"label":"Em consolidação"},{"value":3,"label":"Consistente"}]',
 NULL, 4, true, NULL),

('autoavaliacao', 'sustento_rotinas', 'Sustento rotinas pedagógicas com autonomia', NULL, 'rating', 1, 3,
 '[{"value":1,"label":"Pouco consistente"},{"value":2,"label":"Em consolidação"},{"value":3,"label":"Consistente"}]',
 NULL, 5, true, NULL),

('autoavaliacao', 'comentarios', 'Comentários', NULL, 'text', NULL, NULL, NULL, NULL, 6, false, NULL),

-- =============================================================
-- SEED: Qualidade da Implementação (5 ratings + 2 texts)
-- =============================================================
('qualidade_implementacao', 'acoes_previstas', 'Ações previstas realizadas conforme plano', NULL, 'rating', 1, 4,
 '[{"value":1,"label":"Inicial","description":"Execução irregular; ações desconectadas do desenho; baixa previsibilidade."},{"value":2,"label":"Em desenvolvimento","description":"Execução parcial; ajustes frequentes; dependência elevada de intervenção externa."},{"value":3,"label":"Adequado","description":"Execução regular; alinhamento ao plano; pequenos ajustes necessários."},{"value":4,"label":"Consistente","description":"Execução sólida; alta fidelidade ao desenho; autonomia operacional."}]',
 NULL, 1, true, NULL),

('qualidade_implementacao', 'apfs_frequencia', 'As APFs estão sendo realizadas segundo a frequência prevista', NULL, 'rating', 1, 4,
 '[{"value":1,"label":"Inicial","description":"Execução irregular; ações desconectadas do desenho; baixa previsibilidade."},{"value":2,"label":"Em desenvolvimento","description":"Execução parcial; ajustes frequentes; dependência elevada de intervenção externa."},{"value":3,"label":"Adequado","description":"Execução regular; alinhamento ao plano; pequenos ajustes necessários."},{"value":4,"label":"Consistente","description":"Execução sólida; alta fidelidade ao desenho; autonomia operacional."}]',
 NULL, 2, true, NULL),

('qualidade_implementacao', 'coerencia_desenho', 'Coerência entre desenho do programa e a prática observada', NULL, 'rating', 1, 4,
 '[{"value":1,"label":"Inicial","description":"Execução irregular; ações desconectadas do desenho; baixa previsibilidade."},{"value":2,"label":"Em desenvolvimento","description":"Execução parcial; ajustes frequentes; dependência elevada de intervenção externa."},{"value":3,"label":"Adequado","description":"Execução regular; alinhamento ao plano; pequenos ajustes necessários."},{"value":4,"label":"Consistente","description":"Execução sólida; alta fidelidade ao desenho; autonomia operacional."}]',
 NULL, 3, true, NULL),

('qualidade_implementacao', 'cronograma_cumprido', 'O cronograma previsto de atividades está sendo cumprido', NULL, 'rating', 1, 4,
 '[{"value":1,"label":"Inicial","description":"Execução irregular; ações desconectadas do desenho; baixa previsibilidade."},{"value":2,"label":"Em desenvolvimento","description":"Execução parcial; ajustes frequentes; dependência elevada de intervenção externa."},{"value":3,"label":"Adequado","description":"Execução regular; alinhamento ao plano; pequenos ajustes necessários."},{"value":4,"label":"Consistente","description":"Execução sólida; alta fidelidade ao desenho; autonomia operacional."}]',
 NULL, 4, true, NULL),

('qualidade_implementacao', 'entregas_cumpridas', 'As entregas previstas estão sendo cumpridas', NULL, 'rating', 1, 4,
 '[{"value":1,"label":"Inicial","description":"Execução irregular; ações desconectadas do desenho; baixa previsibilidade."},{"value":2,"label":"Em desenvolvimento","description":"Execução parcial; ajustes frequentes; dependência elevada de intervenção externa."},{"value":3,"label":"Adequado","description":"Execução regular; alinhamento ao plano; pequenos ajustes necessários."},{"value":4,"label":"Consistente","description":"Execução sólida; alta fidelidade ao desenho; autonomia operacional."}]',
 NULL, 5, true, NULL),

('qualidade_implementacao', 'evidencias_observadas', 'Evidências observadas', NULL, 'text', NULL, NULL, NULL, NULL, 6, false, NULL),
('qualidade_implementacao', 'encaminhamentos', 'Encaminhamentos', NULL, 'text', NULL, NULL, NULL, NULL, 7, false, NULL),

-- =============================================================
-- SEED: Engajamento e Solidez da Parceria (5 ratings + 1 text)
-- =============================================================
('engajamento_solidez', 'clareza_papel_pe', 'Clareza sobre o papel da Parceiros da Educação no desenvolvimento pedagógico e da gestão', NULL, 'rating', 1, 4,
 '[{"value":1,"label":"Frágil","description":"Baixo engajamento; parceria reativa."},{"value":2,"label":"Em construção","description":"Engajamento pontual; dependência de mediação."},{"value":3,"label":"Ativa","description":"Participação consistente; corresponsabilidade."},{"value":4,"label":"Consolidada","description":"Parceria estratégica; alto nível de confiança."}]',
 NULL, 1, true, NULL),

('engajamento_solidez', 'clareza_papel_consultor', 'Clareza sobre o papel do Consultor/Gestor Pedagógico', NULL, 'rating', 1, 4,
 '[{"value":1,"label":"Frágil","description":"Baixo engajamento; parceria reativa."},{"value":2,"label":"Em construção","description":"Engajamento pontual; dependência de mediação."},{"value":3,"label":"Ativa","description":"Participação consistente; corresponsabilidade."},{"value":4,"label":"Consolidada","description":"Parceria estratégica; alto nível de confiança."}]',
 NULL, 2, true, NULL),

('engajamento_solidez', 'participacao_gestao', 'Participação da gestão escolar', NULL, 'rating', 1, 4,
 '[{"value":1,"label":"Frágil","description":"Baixo engajamento; parceria reativa."},{"value":2,"label":"Em construção","description":"Engajamento pontual; dependência de mediação."},{"value":3,"label":"Ativa","description":"Participação consistente; corresponsabilidade."},{"value":4,"label":"Consolidada","description":"Parceria estratégica; alto nível de confiança."}]',
 NULL, 3, true, NULL),

('engajamento_solidez', 'abertura_acompanhamento', 'Abertura para acompanhamento e devolutivas', NULL, 'rating', 1, 4,
 '[{"value":1,"label":"Frágil","description":"Baixo engajamento; parceria reativa."},{"value":2,"label":"Em construção","description":"Engajamento pontual; dependência de mediação."},{"value":3,"label":"Ativa","description":"Participação consistente; corresponsabilidade."},{"value":4,"label":"Consolidada","description":"Parceria estratégica; alto nível de confiança."}]',
 NULL, 4, true, NULL),

('engajamento_solidez', 'estabilidade_parceria', 'Estabilidade da parceria com a escola', NULL, 'rating', 1, 4,
 '[{"value":1,"label":"Frágil","description":"Baixo engajamento; parceria reativa."},{"value":2,"label":"Em construção","description":"Engajamento pontual; dependência de mediação."},{"value":3,"label":"Ativa","description":"Participação consistente; corresponsabilidade."},{"value":4,"label":"Consolidada","description":"Parceria estratégica; alto nível de confiança."}]',
 NULL, 5, true, NULL),

('engajamento_solidez', 'evidencias', 'Evidências', NULL, 'text', NULL, NULL, NULL, NULL, 6, false, NULL),

-- =============================================================
-- SEED: Observação Engajamento e Solidez (1 rating + 5 texts)
-- =============================================================
('obs_engajamento_solidez', 'situacao_geral', 'Situação Geral da Implementação', NULL, 'rating', 1, 4,
 '[{"value":1,"label":"Frágil","description":"Implementação desorganizada, com falhas relevantes de governança e alto risco para a execução e a tomada de decisão."},{"value":2,"label":"Em desenvolvimento","description":"Implementação parcial, com processos iniciados, porém ainda instáveis e com inconsistências no acompanhamento."},{"value":3,"label":"Adequada","description":"Implementação funcional, com processos definidos, acompanhamento regular e capacidade de ajuste."},{"value":4,"label":"Consistente","description":"Implementação consolidada, com governança estável, uso sistemático de dados e alto grau de confiabilidade."}]',
 NULL, 1, true, NULL),

('obs_engajamento_solidez', 'fraquezas', 'Fraquezas', NULL, 'text', NULL, NULL, NULL, NULL, 2, false, NULL),
('obs_engajamento_solidez', 'forcas', 'Forças', NULL, 'text', NULL, NULL, NULL, NULL, 3, false, NULL),
('obs_engajamento_solidez', 'principais_avancos', 'Principais Avanços', NULL, 'text', NULL, NULL, NULL, NULL, 4, false, NULL),
('obs_engajamento_solidez', 'principais_riscos', 'Principais Riscos', NULL, 'text', NULL, NULL, NULL, NULL, 5, false, NULL),
('obs_engajamento_solidez', 'recomendacoes_estrategicas', 'Recomendações Estratégicas', NULL, 'text', NULL, NULL, NULL, NULL, 6, false, NULL),

-- =============================================================
-- SEED: Sustentabilidade e Aprendizado (6 ratings + 1 text)
-- =============================================================
('sustentabilidade_programa', 'autonomia_escola', 'Autonomia crescente da escola', NULL, 'rating', 1, 4,
 '[{"value":1,"label":"Inicial","description":"Baixa geração de capacidade instalada."},{"value":2,"label":"Em transição","description":"Capacidade em construção, ainda frágil, com aprendizados identificados, mas pouco organizados ou pouco disseminados."},{"value":3,"label":"Sustentável","description":"Capacidade instalada funcional e replicável. Aprendizados sistematizados e incorporados às rotinas da escola."},{"value":4,"label":"Consolidado","description":"Consolidado e sustentável no médio e longo prazo. Aprendizados sistematizados, documentados e compartilhados como referência."}]',
 NULL, 1, true, NULL),

('sustentabilidade_programa', 'reducao_dependencia', 'Redução da dependência operacional', NULL, 'rating', 1, 4,
 '[{"value":1,"label":"Inicial","description":"Baixa geração de capacidade instalada."},{"value":2,"label":"Em transição","description":"Capacidade em construção, ainda frágil."},{"value":3,"label":"Sustentável","description":"Capacidade instalada funcional e replicável."},{"value":4,"label":"Consolidado","description":"Consolidado e sustentável no médio e longo prazo."}]',
 NULL, 2, true, NULL),

('sustentabilidade_programa', 'aprendizados_sistematizados', 'Aprendizados sistematizados', NULL, 'rating', 1, 4,
 '[{"value":1,"label":"Inicial","description":"Baixa geração de capacidade instalada."},{"value":2,"label":"Em transição","description":"Capacidade em construção, ainda frágil."},{"value":3,"label":"Sustentável","description":"Capacidade instalada funcional e replicável."},{"value":4,"label":"Consolidado","description":"Consolidado e sustentável no médio e longo prazo."}]',
 NULL, 3, true, NULL),

('sustentabilidade_programa', 'mudanca_pratica_docentes', 'Mudança positiva na prática dos docentes', NULL, 'rating', 1, 4,
 '[{"value":1,"label":"Inicial","description":"Baixa geração de capacidade instalada."},{"value":2,"label":"Em transição","description":"Capacidade em construção, ainda frágil."},{"value":3,"label":"Sustentável","description":"Capacidade instalada funcional e replicável."},{"value":4,"label":"Consolidado","description":"Consolidado e sustentável no médio e longo prazo."}]',
 NULL, 4, true, NULL),

('sustentabilidade_programa', 'acompanhamento_resultados', 'Acompanhamento sistemático de resultados avaliativos', NULL, 'rating', 1, 4,
 '[{"value":1,"label":"Inicial","description":"Baixa geração de capacidade instalada."},{"value":2,"label":"Em transição","description":"Capacidade em construção, ainda frágil."},{"value":3,"label":"Sustentável","description":"Capacidade instalada funcional e replicável."},{"value":4,"label":"Consolidado","description":"Consolidado e sustentável no médio e longo prazo."}]',
 NULL, 5, true, NULL),

('sustentabilidade_programa', 'melhoria_aprendizagem', 'Melhoria na aprendizagem dos estudantes', NULL, 'rating', 1, 4,
 '[{"value":1,"label":"Inicial","description":"Baixa geração de capacidade instalada."},{"value":2,"label":"Em transição","description":"Capacidade em construção, ainda frágil."},{"value":3,"label":"Sustentável","description":"Capacidade instalada funcional e replicável."},{"value":4,"label":"Consolidado","description":"Consolidado e sustentável no médio e longo prazo."}]',
 NULL, 6, true, NULL),

('sustentabilidade_programa', 'sintese_avaliativa', 'Síntese avaliativa', 'Para preencher este campo, analise dados qualitativos e quantitativos que traduzam o resultado das ações empreendidas.', 'text', NULL, NULL, NULL, NULL, 7, false, NULL),

-- =============================================================
-- SEED: Qualidade do Acompanhamento de Aula - Coordenador (12 ratings)
-- =============================================================
('qualidade_acomp_aula', 'planejamento_organizacao', '1. Planejamento, Organização e Registro da Ação', 'Planeja e organiza os acompanhamentos formativos em consonância com as atribuições da SEDUC, realizando visitas presenciais regulares e intencionais.', 'rating', 0, 4,
 '[{"value":0,"label":"Não Atende","description":"O PEC não demonstra evidência de ter executado o critério ou o faz de forma inadequada."},{"value":1,"label":"Inicial","description":"O PEC demonstra dificuldade na execução, atua de forma reativa, sem intencionalidade ou alinhamento claro com as diretrizes."},{"value":2,"label":"Em Desenvolvimento","description":"O PEC executa o critério, mas de forma inconsistente ou incompleta. Necessita de acompanhamento e suporte."},{"value":3,"label":"Proficiente","description":"O PEC executa o critério de forma consistente, atende às diretrizes e demonstra autonomia e competência."},{"value":4,"label":"Excelência","description":"O PEC domina o critério, atua de forma estratégica, proativa e autônoma, e seu trabalho gera impacto sistêmico."}]',
 NULL, 1, true, NULL),

('qualidade_acomp_aula', 'comunicacao', '2. Comunicação', 'Pratica escuta ativa, comunicação clara e objetiva, valorizando contribuições.', 'rating', 0, 4,
 '[{"value":0,"label":"Não Atende","description":"A comunicação é confusa, passiva ou ineficaz. Há falha em estabelecer canais de interação adequados."},{"value":1,"label":"Inicial","description":"A comunicação é genérica, carecendo de objetividade ou clareza nos pontos-chave."},{"value":2,"label":"Em Desenvolvimento","description":"A comunicação é clara, mas tende a ser unidirecional. Há pouca valorização da escuta ativa."},{"value":3,"label":"Proficiente","description":"Pratica a escuta ativa e mantém uma fala objetiva, estabelecendo diferentes canais de interação."},{"value":4,"label":"Excelência","description":"Pratica a escuta ativa assegurando o entendimento mútuo e mantém uma comunicação clara e objetiva. Promove a reflexão-ação-reflexão."}]',
 NULL, 2, true, NULL),

('qualidade_acomp_aula', 'formacao_continuada', '3. Formação Continuada', NULL, 'rating', 0, 4,
 '[{"value":0,"label":"Não Atende"},{"value":1,"label":"Inicial"},{"value":2,"label":"Em Desenvolvimento"},{"value":3,"label":"Proficiente"},{"value":4,"label":"Excelência"}]',
 NULL, 3, true, NULL),

('qualidade_acomp_aula', 'analise_problemas', '4. Análise e Resolução de Problemas', 'Utiliza fontes diversificadas de informação para tomar decisões ágeis e autônomas.', 'rating', 0, 4,
 '[{"value":0,"label":"Não Atende","description":"Ignora a necessidade de analisar informações para tomar decisões."},{"value":1,"label":"Inicial","description":"A análise de problemas se baseia em percepções pessoais ou em uma única fonte de informação."},{"value":2,"label":"Em Desenvolvimento","description":"Faz uso de dados, mas tem dificuldade em correlacionar informações de diferentes fontes."},{"value":3,"label":"Proficiente","description":"Faz uso de fontes diversificadas de informação, analisando-as para decisões ágeis e autônomas."},{"value":4,"label":"Excelência","description":"Utiliza fontes diversificadas inclusive de sala de aula, mantém-se atento aos desafios do contexto formativo, definindo soluções viáveis em parceria."}]',
 NULL, 4, true, NULL),

('qualidade_acomp_aula', 'gestao_aprendizagem', '5. Gestão de Aprendizagem', 'Trabalha em parceria com a liderança pedagógica, utilizando dados de desempenho estudantil.', 'rating', 0, 4,
 '[{"value":0,"label":"Não Atende","description":"Não colabora com a liderança pedagógica ou as orientações são contrárias às diretrizes."},{"value":1,"label":"Inicial","description":"A colaboração com a liderança pedagógica é passiva. Não há orientação clara sobre o uso de dados."},{"value":2,"label":"Em Desenvolvimento","description":"Colabora com a gestão na análise de dados, mas o foco é limitado aos resultados de avaliações."},{"value":3,"label":"Proficiente","description":"Colabora com a liderança pedagógica na análise de dados de desempenho para orientar decisões de ensino."},{"value":4,"label":"Excelência","description":"Trabalha em parceria com a liderança utilizando dados de desempenho em análises multidimensionais."}]',
 NULL, 5, true, NULL),

('qualidade_acomp_aula', 'materiais', '6. Materiais', 'Utiliza currículo, material digital e escopo sequência articulando teoria e prática.', 'rating', 0, 4,
 '[{"value":0,"label":"Não Atende","description":"Não utiliza o currículo ou os materiais pedagógicos oficiais como referência."},{"value":1,"label":"Inicial","description":"Limita-se a apresentar os materiais sem orientar o seu uso na prática pedagógica."},{"value":2,"label":"Em Desenvolvimento","description":"Utiliza os recursos pedagógicos, mas falta articulação clara entre a teoria, o material digital e o currículo."},{"value":3,"label":"Proficiente","description":"Utiliza o currículo, o material digital e o escopo sequência, fazendo uso intencional e planejado dos resultados/dados."},{"value":4,"label":"Excelência","description":"Utiliza amplamente o currículo, o material digital e o escopo sequência, articulando teoria e prática. Prioriza as habilidades com base nos dados."}]',
 NULL, 6, true, NULL),

('qualidade_acomp_aula', 'gestao_tempo_coord', '7. Gestão do Tempo', NULL, 'rating', 0, 4,
 '[{"value":0,"label":"Não Atende"},{"value":1,"label":"Inicial"},{"value":2,"label":"Em Desenvolvimento"},{"value":3,"label":"Proficiente"},{"value":4,"label":"Excelência"}]',
 NULL, 7, true, NULL),

('qualidade_acomp_aula', 'abertura_aprendizagem', '8. Abertura para a Aprendizagem', NULL, 'rating', 0, 4,
 '[{"value":0,"label":"Não Atende","description":"Recusa-se a participar de formações ou a receber feedback."},{"value":1,"label":"Inicial","description":"Apresenta resistência à formação continuada e ao feedback."},{"value":2,"label":"Em Desenvolvimento","description":"Reconhece a necessidade de aprender, mas demonstra resistência em sair da zona de conforto."},{"value":3,"label":"Proficiente","description":"Demonstra abertura para aprender, reconhecendo e incorporando boas ideias."},{"value":4,"label":"Excelência","description":"Demonstra abertura para aprender constantemente, encarando os erros como parte do processo de aprendizagem."}]',
 NULL, 8, true, NULL),

('qualidade_acomp_aula', 'uso_dados_diagnostico', '9. Uso de Dados para Diagnóstico e Ações Efetivas', NULL, 'rating', 0, 4,
 '[{"value":0,"label":"Não Atende","description":"Não há uso de dados de desempenho para orientar o acompanhamento."},{"value":1,"label":"Inicial","description":"Limita-se a descrever os indicadores, sem realizar um diagnóstico aprofundado."},{"value":2,"label":"Em Desenvolvimento","description":"Diagnóstico Básico e Ação Reativa: Analisa os dados e identifica defasagens, mas as ações são reativas."},{"value":3,"label":"Proficiente","description":"Diagnóstico Aprofundado: Realiza análise de dados para identificar defasagens e prioridades. Define objetivos claros."},{"value":4,"label":"Excelência","description":"Diagnóstico Preditor e Ação: Realiza análise aprofundada com intencionalidade na escolha das estratégias."}]',
 NULL, 9, true, NULL),

('qualidade_acomp_aula', 'obs_aula_feedback', '10. Observação de Aula e Feedback Qualificado', NULL, 'rating', 0, 4,
 '[{"value":0,"label":"Não Atende","description":"A observação de aula é ausente ou inadequada, e o feedback é prejudicial."},{"value":1,"label":"Inicial","description":"A observação de aula não ocorre ou é vista apenas como uma fiscalização."},{"value":2,"label":"Em Desenvolvimento","description":"A observação de aula é pouco frequente ou sem foco pedagógico claro."},{"value":3,"label":"Proficiente","description":"Realiza a observação de aulas e oferece feedback específico, acionável e fundamentado."},{"value":4,"label":"Excelência","description":"Realiza a observação de aula com foco pré-definido e protocolado, fornecendo feedback claro e propondo ações."}]',
 NULL, 10, true, NULL),

('qualidade_acomp_aula', 'articulacao_interfuncional', '11. Articulação Interfuncional e Fluxos de Apoio', NULL, 'rating', 0, 4,
 '[{"value":0,"label":"Não Atende","description":"Não estabelece parceria com o Supervisor. Não aciona os demais PECs ou o faz incorretamente."},{"value":1,"label":"Inicial","description":"Atua de forma isolada, não buscando parceria ou diálogo com o Supervisor."},{"value":2,"label":"Em Desenvolvimento","description":"A articulação é reativa, ocorrendo apenas mediante solicitação ou em momentos de crise."},{"value":3,"label":"Proficiente","description":"Trabalha em parceria com o Supervisor, estabelecendo canais de diálogo."},{"value":4,"label":"Excelência","description":"Mantém comunicação estratégica e proativa com o Supervisor e demais PECs, dominando os fluxos de acionamento."}]',
 NULL, 11, true, NULL),

('qualidade_acomp_aula', 'intervencao_pedagogica', '12. Intervenção Pedagógica Focada e Diferenciada', NULL, 'rating', 0, 4,
 '[{"value":0,"label":"Não Atende","description":"Ignora as necessidades específicas dos estudantes nos níveis Básico e Abaixo do Básico."},{"value":1,"label":"Inicial","description":"Menciona a necessidade de Recomposição, mas não fornece orientação metodológica."},{"value":2,"label":"Em Desenvolvimento","description":"A formação e o apoio são genéricos, sem microfoco nas habilidades críticas."},{"value":3,"label":"Proficiente","description":"Apoia a escola na estruturação do programa de Recomposição, orientando o CGP/CGPG."},{"value":4,"label":"Excelência","description":"Promove a execução estratégica e eficaz do programa de Recomposição. Garante formação e feedback microfocados."}]',
 NULL, 12, true, NULL),

-- =============================================================
-- SEED: Avaliação Formação Participante (4 ratings + 1 select_multi + 3 texts)
-- =============================================================
('avaliacao_formacao_participante', 'aderencia_tema', 'O tema trabalhado no encontro foi aderente ao meu contexto atual e relevante para o meu dia a dia', NULL, 'rating', 1, 5,
 '[{"value":1,"label":"Discordo Totalmente"},{"value":2,"label":"Discordo"},{"value":3,"label":"Neutro / Indiferente"},{"value":4,"label":"Concordo"},{"value":5,"label":"Concordo Totalmente"}]',
 NULL, 1, true, NULL),

('avaliacao_formacao_participante', 'clareza_objetivos', 'O(A) formador(a) apresentou, retomou e alcançou com clareza os objetivos do encontro', NULL, 'rating', 1, 5,
 '[{"value":1,"label":"Discordo Totalmente"},{"value":2,"label":"Discordo"},{"value":3,"label":"Neutro / Indiferente"},{"value":4,"label":"Concordo"},{"value":5,"label":"Concordo Totalmente"}]',
 NULL, 2, true, NULL),

('avaliacao_formacao_participante', 'escuta_ativa', 'O(A) formador(a) demonstrou escuta ativa ao promover e acolher as contribuições do encontro', NULL, 'rating', 1, 5,
 '[{"value":1,"label":"Discordo Totalmente"},{"value":2,"label":"Discordo"},{"value":3,"label":"Neutro / Indiferente"},{"value":4,"label":"Concordo"},{"value":5,"label":"Concordo Totalmente"}]',
 NULL, 3, true, NULL),

('avaliacao_formacao_participante', 'utilidade_pratica', 'O desdobramento desse encontro será extremamente útil na minha prática profissional', NULL, 'rating', 1, 5,
 '[{"value":1,"label":"Discordo Totalmente"},{"value":2,"label":"Discordo"},{"value":3,"label":"Neutro / Indiferente"},{"value":4,"label":"Concordo"},{"value":5,"label":"Concordo Totalmente"}]',
 NULL, 4, true, NULL),

('avaliacao_formacao_participante', 'expectativa_tematica', 'A partir do encontro realizado, qual a sua expectativa em relação à temática', NULL, 'select_multi', NULL, NULL, NULL, NULL, 5, true,
 '{"options":["Aprofundamento da temática","Instrumento para aplicação dessa temática","Oportunidade de usar/replicar a temática","Momentos de troca sobre desafios e/ou boas práticas entre pares","Não sei responder"]}'),

('avaliacao_formacao_participante', 'pontos_positivos', 'Pontos positivos da formação', NULL, 'text', NULL, NULL, NULL, NULL, 6, false, NULL),
('avaliacao_formacao_participante', 'pontos_melhoria', 'Pontos de melhoria da formação', NULL, 'text', NULL, NULL, NULL, NULL, 7, false, NULL),
('avaliacao_formacao_participante', 'comentarios_sugestoes', 'Comentários, sugestões ou outras percepções', NULL, 'text', NULL, NULL, NULL, NULL, 8, false, NULL);

-- Index for performance
CREATE INDEX idx_instrument_fields_form_type ON public.instrument_fields(form_type);
CREATE INDEX idx_instrument_responses_registro ON public.instrument_responses(registro_acao_id);
CREATE INDEX idx_instrument_responses_form_type ON public.instrument_responses(form_type);
