CREATE TABLE IF NOT EXISTS public.observacoes_aula_redes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  municipio TEXT NOT NULL,
  data DATE NOT NULL,
  nome_escola TEXT NOT NULL,
  nome_professor TEXT NOT NULL,
  observador TEXT,
  horario TIME,
  turma_ano TEXT NOT NULL,
  qtd_estudantes INTEGER,
  caderno INTEGER NOT NULL CHECK (caderno BETWEEN 1 AND 5),
  segmento TEXT NOT NULL CHECK (segmento IN ('anos_iniciais', 'anos_finais')),
  material_didatico TEXT[] NOT NULL,
  alunos_masculino INTEGER NOT NULL,
  alunos_feminino INTEGER NOT NULL,
  nota_criterio_1 INTEGER CHECK (nota_criterio_1 BETWEEN 1 AND 4),
  evidencia_criterio_1 TEXT,
  nota_criterio_2 INTEGER CHECK (nota_criterio_2 BETWEEN 1 AND 4),
  evidencia_criterio_2 TEXT,
  nota_criterio_3 INTEGER CHECK (nota_criterio_3 BETWEEN 1 AND 4),
  evidencia_criterio_3 TEXT,
  nota_criterio_4 INTEGER CHECK (nota_criterio_4 BETWEEN 1 AND 4),
  evidencia_criterio_4 TEXT,
  nota_criterio_5 INTEGER CHECK (nota_criterio_5 BETWEEN 1 AND 4),
  evidencia_criterio_5 TEXT,
  nota_criterio_6 INTEGER CHECK (nota_criterio_6 BETWEEN 1 AND 4),
  evidencia_criterio_6 TEXT,
  nota_criterio_7 INTEGER CHECK (nota_criterio_7 BETWEEN 1 AND 4),
  evidencia_criterio_7 TEXT,
  nota_criterio_8 INTEGER CHECK (nota_criterio_8 BETWEEN 1 AND 4),
  evidencia_criterio_8 TEXT,
  nota_criterio_9 INTEGER CHECK (nota_criterio_9 BETWEEN 1 AND 4),
  evidencia_criterio_9 TEXT,
  pontos_fortes TEXT,
  aspectos_fortalecer TEXT,
  estrategias_sugeridas TEXT,
  combinacao_acompanhamento TEXT,
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'enviado'))
);

CREATE TABLE IF NOT EXISTS public.relatorios_eteg_redes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  municipio TEXT NOT NULL,
  data DATE NOT NULL,
  equipe TEXT NOT NULL,
  horario TIME,
  observador TEXT NOT NULL,
  mes_referencia TEXT NOT NULL,
  item_1 INTEGER NOT NULL CHECK (item_1 BETWEEN 0 AND 2),
  item_2 INTEGER NOT NULL CHECK (item_2 BETWEEN 0 AND 2),
  item_3 INTEGER NOT NULL CHECK (item_3 BETWEEN 0 AND 2),
  item_4 INTEGER NOT NULL CHECK (item_4 BETWEEN 0 AND 2),
  item_5 INTEGER NOT NULL CHECK (item_5 BETWEEN 0 AND 2),
  item_6 INTEGER NOT NULL CHECK (item_6 BETWEEN 0 AND 2),
  item_7 INTEGER NOT NULL CHECK (item_7 BETWEEN 0 AND 2),
  item_8 INTEGER NOT NULL CHECK (item_8 BETWEEN 0 AND 2),
  relato_objetivo TEXT,
  pontos_fortes TEXT,
  aspectos_criticos TEXT,
  encaminhamentos TEXT,
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'enviado'))
);

CREATE TABLE IF NOT EXISTS public.relatorios_professor_redes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  municipio TEXT NOT NULL,
  data DATE NOT NULL,
  componente_curricular TEXT NOT NULL CHECK (componente_curricular IN ('LP', 'Mat')),
  horario TIME,
  formador TEXT NOT NULL,
  turma_ano TEXT NOT NULL,
  item_1 INTEGER NOT NULL CHECK (item_1 BETWEEN 0 AND 2),
  item_2 INTEGER NOT NULL CHECK (item_2 BETWEEN 0 AND 2),
  item_3 INTEGER NOT NULL CHECK (item_3 BETWEEN 0 AND 2),
  item_4 INTEGER NOT NULL CHECK (item_4 BETWEEN 0 AND 2),
  item_5 INTEGER NOT NULL CHECK (item_5 BETWEEN 0 AND 2),
  item_6 INTEGER NOT NULL CHECK (item_6 BETWEEN 0 AND 2),
  item_7 INTEGER NOT NULL CHECK (item_7 BETWEEN 0 AND 2),
  item_8 INTEGER NOT NULL CHECK (item_8 BETWEEN 0 AND 2),
  relato_objetivo TEXT,
  pontos_fortes TEXT,
  aspectos_criticos TEXT,
  encaminhamentos TEXT,
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'enviado'))
);

ALTER TABLE public.observacoes_aula_redes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relatorios_eteg_redes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relatorios_professor_redes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can manage observacoes_aula_redes" ON public.observacoes_aula_redes;
DROP POLICY IF EXISTS "Authenticated users can manage relatorios_eteg_redes" ON public.relatorios_eteg_redes;
DROP POLICY IF EXISTS "Authenticated users can manage relatorios_professor_redes" ON public.relatorios_professor_redes;

CREATE POLICY "Authenticated users can manage observacoes_aula_redes"
ON public.observacoes_aula_redes
FOR ALL
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage relatorios_eteg_redes"
ON public.relatorios_eteg_redes
FOR ALL
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage relatorios_professor_redes"
ON public.relatorios_professor_redes
FOR ALL
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);