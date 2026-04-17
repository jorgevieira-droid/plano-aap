
-- Create table for "Encontro Formativo - Microciclos de Recomposição" reports
CREATE TABLE public.relatorios_microciclos_recomposicao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  registro_acao_id uuid REFERENCES public.registros_acao(id) ON DELETE CASCADE,
  aap_id uuid NOT NULL,
  escola_id uuid REFERENCES public.escolas(id),

  -- Header
  municipio text,
  data date NOT NULL,
  formador text,
  local text,
  horario time,
  ponto_focal_rede text,

  -- 10 verification items (scale 0-2)
  item_1 integer CHECK (item_1 BETWEEN 0 AND 2),
  item_2 integer CHECK (item_2 BETWEEN 0 AND 2),
  item_3 integer CHECK (item_3 BETWEEN 0 AND 2),
  item_4 integer CHECK (item_4 BETWEEN 0 AND 2),
  item_5 integer CHECK (item_5 BETWEEN 0 AND 2),
  item_6 integer CHECK (item_6 BETWEEN 0 AND 2),
  item_7 integer CHECK (item_7 BETWEEN 0 AND 2),
  item_8 integer CHECK (item_8 BETWEEN 0 AND 2),
  item_9 integer CHECK (item_9 BETWEEN 0 AND 2),
  item_10 integer CHECK (item_10 BETWEEN 0 AND 2),

  -- Plataforma Trajetórias
  plataforma_acesso text,            -- 'autonoma' | 'com_apoio' | 'nao_acessam'
  plataforma_quizzes text,           -- 'sistematicamente' | 'parcialmente' | 'nao'
  plataforma_observacoes text,

  -- Relato e encaminhamentos
  relato_objetivo text,
  pontos_fortes text,
  aspectos_fortalecer text,
  encaminhamentos_acordados text,
  encaminhamentos_prazo date,
  encaminhamentos_responsavel text,

  -- Próximo encontro
  proximo_encontro_data date,
  proximo_encontro_pauta text,

  status text NOT NULL DEFAULT 'enviado'
);

CREATE INDEX idx_microciclos_registro_acao ON public.relatorios_microciclos_recomposicao(registro_acao_id);
CREATE INDEX idx_microciclos_aap ON public.relatorios_microciclos_recomposicao(aap_id);
CREATE INDEX idx_microciclos_escola ON public.relatorios_microciclos_recomposicao(escola_id);

ALTER TABLE public.relatorios_microciclos_recomposicao ENABLE ROW LEVEL SECURITY;

-- RLS: same pattern as relatorios_eteg_redes / instrument_responses
CREATE POLICY "N1 Admins manage microciclos"
ON public.relatorios_microciclos_recomposicao FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "N2N3 Managers view microciclos"
ON public.relatorios_microciclos_recomposicao FOR SELECT
USING (
  (is_gestor(auth.uid()) OR has_role(auth.uid(), 'n3_coordenador_programa'::app_role))
  AND (
    registro_acao_id IS NULL OR EXISTS (
      SELECT 1 FROM registros_acao r
      JOIN user_programas up ON up.user_id = auth.uid()
      WHERE r.id = relatorios_microciclos_recomposicao.registro_acao_id
        AND r.programa IS NOT NULL
        AND (up.programa)::text = ANY (r.programa)
    )
  )
);

CREATE POLICY "N4N5 Operational manage microciclos"
ON public.relatorios_microciclos_recomposicao FOR ALL
USING (is_operational(auth.uid()) AND aap_id = auth.uid())
WITH CHECK (is_operational(auth.uid()) AND aap_id = auth.uid());

-- Seed form availability for ALL programs
INSERT INTO public.form_config_settings (form_key, programas, min_optional_questions)
VALUES (
  'encontro_microciclos_recomposicao',
  ARRAY['escolas','regionais','redes_municipais']::programa_type[],
  0
)
ON CONFLICT (form_key) DO UPDATE
SET programas = EXCLUDED.programas;

-- Seed instrument_fields for the 10 items + qualitative fields (used by FormFieldConfigPage / MatrizAcoesPage)
INSERT INTO public.instrument_fields (form_type, field_key, label, field_type, dimension, scale_min, scale_max, sort_order, is_required)
VALUES
  ('encontro_microciclos_recomposicao', 'item_1',  'Clareza do ponto focal sobre os objetivos do microciclo de recomposição', 'rating', 'Verificação', 0, 2, 1, true),
  ('encontro_microciclos_recomposicao', 'item_2',  'Compreensão do agrupamento por proficiência e dos cadernos por faixa', 'rating', 'Verificação', 0, 2, 2, true),
  ('encontro_microciclos_recomposicao', 'item_3',  'Quórum no encontro foi igual ou superior a 75%', 'rating', 'Verificação', 0, 2, 3, true),
  ('encontro_microciclos_recomposicao', 'item_4',  'Acesso à Plataforma Trajetórias pelo ponto focal', 'rating', 'Verificação', 0, 2, 4, true),
  ('encontro_microciclos_recomposicao', 'item_5',  'Uso da avaliação diagnóstica para indicar os cadernos por faixa', 'rating', 'Verificação', 0, 2, 5, true),
  ('encontro_microciclos_recomposicao', 'item_6',  'Rotina de 3 encontros/semana com 1 hora-aula por componente', 'rating', 'Verificação', 0, 2, 6, true),
  ('encontro_microciclos_recomposicao', 'item_7',  'Aplicação dos Quizzes e registro via QR Code', 'rating', 'Verificação', 0, 2, 7, true),
  ('encontro_microciclos_recomposicao', 'item_8',  'Agrupamentos conforme orientação (modelos 1, 2 ou 3)', 'rating', 'Verificação', 0, 2, 8, true),
  ('encontro_microciclos_recomposicao', 'item_9',  'Material didático (cadernos) disponível e em uso', 'rating', 'Verificação', 0, 2, 9, true),
  ('encontro_microciclos_recomposicao', 'item_10', 'Resultados de percurso orientando o avanço pelas faixas', 'rating', 'Verificação', 0, 2, 10, true),
  ('encontro_microciclos_recomposicao', 'plataforma_acesso',     'Acesso aos dados na Plataforma Trajetórias', 'single_choice', 'Plataforma Trajetórias', NULL, NULL, 11, false),
  ('encontro_microciclos_recomposicao', 'plataforma_quizzes',    'Quizzes registrados / utilizados', 'single_choice', 'Plataforma Trajetórias', NULL, NULL, 12, false),
  ('encontro_microciclos_recomposicao', 'plataforma_observacoes','Observações sobre uso da Plataforma', 'textarea', 'Plataforma Trajetórias', NULL, NULL, 13, false),
  ('encontro_microciclos_recomposicao', 'pontos_fortes',         'Principais pontos fortes', 'textarea', 'Encaminhamentos', NULL, NULL, 14, false),
  ('encontro_microciclos_recomposicao', 'aspectos_fortalecer',   'Aspectos a fortalecer', 'textarea', 'Encaminhamentos', NULL, NULL, 15, false),
  ('encontro_microciclos_recomposicao', 'encaminhamentos_acordados','Encaminhamentos acordados', 'textarea', 'Encaminhamentos', NULL, NULL, 16, false),
  ('encontro_microciclos_recomposicao', 'proximo_encontro_data', 'Data prevista do próximo encontro', 'date', 'Próximo encontro', NULL, NULL, 17, false),
  ('encontro_microciclos_recomposicao', 'proximo_encontro_pauta','Pauta prevista do próximo encontro', 'textarea', 'Próximo encontro', NULL, NULL, 18, false)
ON CONFLICT DO NOTHING;
