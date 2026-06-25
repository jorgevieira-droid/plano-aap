-- Preserve história ao deletar usuário: trocar CASCADE por SET NULL nas FKs de "ator/autor"

-- registros_acao.aap_id
ALTER TABLE public.registros_acao DROP CONSTRAINT IF EXISTS registros_acao_aap_id_fkey;
ALTER TABLE public.registros_acao
  ADD CONSTRAINT registros_acao_aap_id_fkey
  FOREIGN KEY (aap_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- programacoes.aap_id
ALTER TABLE public.programacoes DROP CONSTRAINT IF EXISTS programacoes_aap_id_fkey;
ALTER TABLE public.programacoes
  ADD CONSTRAINT programacoes_aap_id_fkey
  FOREIGN KEY (aap_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- programacoes.created_by
ALTER TABLE public.programacoes DROP CONSTRAINT IF EXISTS programacoes_created_by_fkey;
ALTER TABLE public.programacoes
  ADD CONSTRAINT programacoes_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- avaliacoes_aula.aap_id
ALTER TABLE public.avaliacoes_aula DROP CONSTRAINT IF EXISTS avaliacoes_aula_aap_id_fkey;
ALTER TABLE public.avaliacoes_aula
  ADD CONSTRAINT avaliacoes_aula_aap_id_fkey
  FOREIGN KEY (aap_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- relatorios_eteg_redes.created_by
ALTER TABLE public.relatorios_eteg_redes DROP CONSTRAINT IF EXISTS relatorios_eteg_redes_created_by_fkey;
ALTER TABLE public.relatorios_eteg_redes
  ADD CONSTRAINT relatorios_eteg_redes_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- relatorios_professor_redes.created_by
ALTER TABLE public.relatorios_professor_redes DROP CONSTRAINT IF EXISTS relatorios_professor_redes_created_by_fkey;
ALTER TABLE public.relatorios_professor_redes
  ADD CONSTRAINT relatorios_professor_redes_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- relatorios_reuniao_acomp_alfabetizacao.avaliador_id (já é SET NULL 'n', mas garantir)
ALTER TABLE public.relatorios_reuniao_acomp_alfabetizacao DROP CONSTRAINT IF EXISTS relatorios_reuniao_acomp_alfabetizacao_avaliador_id_fkey;
ALTER TABLE public.relatorios_reuniao_acomp_alfabetizacao
  ADD CONSTRAINT relatorios_reuniao_acomp_alfabetizacao_avaliador_id_fkey
  FOREIGN KEY (avaliador_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- notion_sync_config.system_user_id
ALTER TABLE public.notion_sync_config DROP CONSTRAINT IF EXISTS fk_system_user;
ALTER TABLE public.notion_sync_config
  ADD CONSTRAINT fk_system_user
  FOREIGN KEY (system_user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- form_field_config.updated_by (já era NO ACTION, padronizar para SET NULL)
ALTER TABLE public.form_field_config DROP CONSTRAINT IF EXISTS form_field_config_updated_by_fkey;
ALTER TABLE public.form_field_config
  ADD CONSTRAINT form_field_config_updated_by_fkey
  FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Auditoria: permitir usuario_id NULL (ações de sistema/cascata legítimas)
ALTER TABLE public.registros_alteracoes ALTER COLUMN usuario_id DROP NOT NULL;

-- Trigger de log: não registrar DELETEs em cascata (auth.uid() NULL) para não poluir o histórico
CREATE OR REPLACE FUNCTION public.log_registro_acao_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    FOR v_key IN SELECT jsonb_object_keys(v_after) LOOP
      v_old_val := v_before -> v_key;
      v_new_val := v_after -> v_key;
      IF v_old_val IS DISTINCT FROM v_new_val AND v_key NOT IN ('updated_at') THEN
        v_changed := v_changed || jsonb_build_object(v_key, jsonb_build_object('antes', v_old_val, 'depois', v_new_val));
      END IF;
    END LOOP;
    IF v_changed = '{}'::jsonb THEN
      RETURN NEW;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    -- Pula log para deleções automáticas (cascata/sem usuário autenticado)
    IF auth.uid() IS NULL THEN
      RETURN OLD;
    END IF;
    v_op := 'DELETE';
    v_registro_id := OLD.id;
    v_before := to_jsonb(OLD);
    v_after := NULL;
  END IF;

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
$function$;