ALTER TABLE public.observacoes_aula_redes
  ALTER COLUMN municipio DROP NOT NULL,
  ALTER COLUMN data DROP NOT NULL,
  ALTER COLUMN nome_escola DROP NOT NULL,
  ALTER COLUMN nome_professor DROP NOT NULL,
  ALTER COLUMN turma_ano DROP NOT NULL,
  ALTER COLUMN caderno DROP NOT NULL,
  ALTER COLUMN segmento DROP NOT NULL,
  ALTER COLUMN material_didatico DROP NOT NULL,
  ALTER COLUMN alunos_masculino DROP NOT NULL,
  ALTER COLUMN alunos_feminino DROP NOT NULL;

CREATE OR REPLACE FUNCTION public.validate_observacoes_aula_redes_submission()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'enviado' THEN
    IF NEW.municipio IS NULL OR btrim(NEW.municipio) = '' THEN
      RAISE EXCEPTION 'Município é obrigatório para envio';
    END IF;
    IF NEW.data IS NULL THEN
      RAISE EXCEPTION 'Data é obrigatória para envio';
    END IF;
    IF NEW.nome_escola IS NULL OR btrim(NEW.nome_escola) = '' THEN
      RAISE EXCEPTION 'Nome da escola é obrigatório para envio';
    END IF;
    IF NEW.nome_professor IS NULL OR btrim(NEW.nome_professor) = '' THEN
      RAISE EXCEPTION 'Nome do professor é obrigatório para envio';
    END IF;
    IF NEW.turma_ano IS NULL OR btrim(NEW.turma_ano) = '' THEN
      RAISE EXCEPTION 'Turma/Ano é obrigatório para envio';
    END IF;
    IF NEW.caderno IS NULL THEN
      RAISE EXCEPTION 'Caderno é obrigatório para envio';
    END IF;
    IF NEW.segmento IS NULL OR btrim(NEW.segmento) = '' THEN
      RAISE EXCEPTION 'Segmento é obrigatório para envio';
    END IF;
    IF NEW.material_didatico IS NULL OR cardinality(NEW.material_didatico) = 0 THEN
      RAISE EXCEPTION 'Selecione ao menos um material didático para envio';
    END IF;
    IF NEW.alunos_masculino IS NULL THEN
      RAISE EXCEPTION 'Quantidade de alunos masculinos é obrigatória para envio';
    END IF;
    IF NEW.alunos_feminino IS NULL THEN
      RAISE EXCEPTION 'Quantidade de alunos femininos é obrigatória para envio';
    END IF;
    IF NEW.nota_criterio_1 IS NULL OR NEW.nota_criterio_2 IS NULL OR NEW.nota_criterio_3 IS NULL
       OR NEW.nota_criterio_4 IS NULL OR NEW.nota_criterio_5 IS NULL OR NEW.nota_criterio_6 IS NULL
       OR NEW.nota_criterio_7 IS NULL OR NEW.nota_criterio_8 IS NULL OR NEW.nota_criterio_9 IS NULL THEN
      RAISE EXCEPTION 'Todos os 9 critérios precisam ser avaliados antes do envio';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_observacoes_aula_redes_submission ON public.observacoes_aula_redes;

CREATE TRIGGER trg_validate_observacoes_aula_redes_submission
BEFORE INSERT OR UPDATE ON public.observacoes_aula_redes
FOR EACH ROW
EXECUTE FUNCTION public.validate_observacoes_aula_redes_submission();