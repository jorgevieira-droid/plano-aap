
-- 1. Add columns to registros_alteracoes
ALTER TABLE public.registros_alteracoes
  ADD COLUMN IF NOT EXISTS operacao text,
  ADD COLUMN IF NOT EXISTS contexto jsonb;

CREATE INDEX IF NOT EXISTS idx_registros_alteracoes_tabela_created
  ON public.registros_alteracoes (tabela, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_registros_alteracoes_registro_id
  ON public.registros_alteracoes (registro_id);

-- 2. Trigger function to log changes on registros_acao
CREATE OR REPLACE FUNCTION public.log_registro_acao_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_op text;
  v_registro_id uuid;
  v_before jsonb;
  v_after jsonb;
  v_changed jsonb := '{}'::jsonb;
  v_contexto jsonb;
  v_escola_nome text;
  v_key text;
  v_old_val jsonb;
  v_new_val jsonb;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_op := 'INSERT';
    v_registro_id := NEW.id;
    v_before := NULL;
    v_after := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    v_op := 'UPDATE';
    v_registro_id := NEW.id;
    v_before := to_jsonb(OLD);
    v_after := to_jsonb(NEW);
    -- Diff: only fields that actually changed
    FOR v_key IN SELECT jsonb_object_keys(v_after) LOOP
      v_old_val := v_before -> v_key;
      v_new_val := v_after -> v_key;
      IF v_old_val IS DISTINCT FROM v_new_val AND v_key NOT IN ('updated_at') THEN
        v_changed := v_changed || jsonb_build_object(v_key, jsonb_build_object('antes', v_old_val, 'depois', v_new_val));
      END IF;
    END LOOP;
    -- Skip logging if only updated_at changed (no real diff)
    IF v_changed = '{}'::jsonb THEN
      RETURN NEW;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    v_op := 'DELETE';
    v_registro_id := OLD.id;
    v_before := to_jsonb(OLD);
    v_after := NULL;
  END IF;

  -- Build contexto snapshot for filters/display
  IF TG_OP = 'DELETE' THEN
    SELECT nome INTO v_escola_nome FROM public.escolas WHERE id = OLD.escola_id;
    v_contexto := jsonb_build_object(
      'tipo', OLD.tipo,
      'data_acao', OLD.data,
      'programa', OLD.programa,
      'escola_id', OLD.escola_id,
      'escola_nome', v_escola_nome,
      'aap_id', OLD.aap_id,
      'status', OLD.status
    );
  ELSE
    SELECT nome INTO v_escola_nome FROM public.escolas WHERE id = NEW.escola_id;
    v_contexto := jsonb_build_object(
      'tipo', NEW.tipo,
      'data_acao', NEW.data,
      'programa', NEW.programa,
      'escola_id', NEW.escola_id,
      'escola_nome', v_escola_nome,
      'aap_id', NEW.aap_id,
      'status', NEW.status
    );
  END IF;

  INSERT INTO public.registros_alteracoes (tabela, registro_id, usuario_id, operacao, alteracao, contexto)
  VALUES (
    'registros_acao',
    v_registro_id,
    auth.uid(),
    v_op,
    CASE TG_OP
      WHEN 'INSERT' THEN jsonb_build_object('after', v_after)
      WHEN 'UPDATE' THEN jsonb_build_object('changed_fields', v_changed)
      WHEN 'DELETE' THEN jsonb_build_object('before', v_before)
    END,
    v_contexto
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_registro_acao_changes ON public.registros_acao;
CREATE TRIGGER trg_log_registro_acao_changes
AFTER INSERT OR UPDATE OR DELETE ON public.registros_acao
FOR EACH ROW EXECUTE FUNCTION public.log_registro_acao_changes();

-- 3. Update RLS for SELECT — allow Admin (all) + Gestor/N3 scoped by programa
DROP POLICY IF EXISTS "Admin and gestor select registros_alteracoes" ON public.registros_alteracoes;
DROP POLICY IF EXISTS "N1N2N3 select registros_alteracoes" ON public.registros_alteracoes;

CREATE POLICY "N1N2N3 select registros_alteracoes"
ON public.registros_alteracoes
FOR SELECT
TO authenticated
USING (
  is_admin(auth.uid())
  OR (
    (is_gestor(auth.uid()) OR has_role(auth.uid(), 'n3_coordenador_programa'::app_role))
    AND tabela = 'registros_acao'
    AND contexto ? 'programa'
    AND EXISTS (
      SELECT 1 FROM public.user_programas up
      WHERE up.user_id = auth.uid()
        AND (up.programa)::text IN (
          SELECT jsonb_array_elements_text(contexto->'programa')
        )
    )
  )
);
