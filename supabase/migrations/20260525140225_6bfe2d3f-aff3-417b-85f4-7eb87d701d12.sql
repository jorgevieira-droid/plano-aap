
-- 1. Fix mutable search_path on pgmq helper functions
CREATE OR REPLACE FUNCTION public.enqueue_email(queue_name text, payload jsonb)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN pgmq.send(queue_name, payload);
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN pgmq.send(queue_name, payload);
END;
$function$;

CREATE OR REPLACE FUNCTION public.read_email_batch(queue_name text, batch_size integer, vt integer)
 RETURNS TABLE(msg_id bigint, read_ct integer, message jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY SELECT r.msg_id, r.read_ct, r.message FROM pgmq.read(queue_name, vt, batch_size) r;
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN;
END;
$function$;

CREATE OR REPLACE FUNCTION public.delete_email(queue_name text, message_id bigint)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN pgmq.delete(queue_name, message_id);
EXCEPTION WHEN undefined_table THEN
  RETURN FALSE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.move_to_dlq(source_queue text, dlq_name text, message_id bigint, payload jsonb)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE new_id BIGINT;
BEGIN
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  PERFORM pgmq.delete(source_queue, message_id);
  RETURN new_id;
EXCEPTION WHEN undefined_table THEN
  BEGIN
    PERFORM pgmq.create(dlq_name);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  BEGIN
    PERFORM pgmq.delete(source_queue, message_id);
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
  RETURN new_id;
END;
$function$;

-- 2. Revoke EXECUTE from anon and authenticated on email queue helpers
-- (these should only be callable via service role from edge functions)
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM anon, authenticated, public;

-- 3. Revoke EXECUTE from anon on SECURITY DEFINER role helpers
-- (RLS still works because authenticated users keep EXECUTE)
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_gestor(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_admin_or_gestor(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_manager(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_operational(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_local_user(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_observer(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.shares_entidade(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.shares_programa(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.user_has_programa(uuid, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.user_has_entidade(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.user_has_escola_via_programa(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.user_has_full_data_access(uuid, uuid, text[]) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.gestor_has_programa(uuid, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.gestor_can_view_escola(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.gestor_can_view_professor(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.gestor_can_view_registro(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.gestor_can_view_programacao(uuid, uuid) FROM anon, public;

-- 4. Lock down setup_first_admin — should never be callable by clients
REVOKE EXECUTE ON FUNCTION public.setup_first_admin(text) FROM anon, authenticated, public;
