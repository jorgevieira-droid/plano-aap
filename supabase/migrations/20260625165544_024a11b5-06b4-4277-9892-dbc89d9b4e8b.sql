ALTER TABLE IF EXISTS public.registros_acao
  ALTER COLUMN aap_id DROP NOT NULL;

ALTER TABLE IF EXISTS public.programacoes
  ALTER COLUMN aap_id DROP NOT NULL;

ALTER TABLE IF EXISTS public.avaliacoes_aula
  ALTER COLUMN aap_id DROP NOT NULL;

ALTER TABLE IF EXISTS public.notion_sync_config
  ALTER COLUMN system_user_id DROP NOT NULL;

ALTER TABLE IF EXISTS public.registros_alteracoes
  ALTER COLUMN usuario_id DROP NOT NULL;