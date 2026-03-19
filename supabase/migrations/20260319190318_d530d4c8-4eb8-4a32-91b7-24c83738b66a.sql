
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create sync state table
CREATE TABLE public.bigquery_sync_state (
  table_name text PRIMARY KEY,
  last_synced_at timestamp with time zone NOT NULL DEFAULT '1970-01-01T00:00:00Z',
  last_status text NOT NULL DEFAULT 'pending',
  last_error text,
  rows_exported integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bigquery_sync_state ENABLE ROW LEVEL SECURITY;

-- Only admins can view/manage
CREATE POLICY "Admins can manage bigquery_sync_state"
  ON public.bigquery_sync_state
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Seed initial rows for all tables to export
INSERT INTO public.bigquery_sync_state (table_name) VALUES
  ('avaliacoes_aula'),
  ('observacoes_aula_redes'),
  ('relatorios_eteg_redes'),
  ('relatorios_professor_redes'),
  ('registros_acao'),
  ('programacoes'),
  ('presencas'),
  ('escolas'),
  ('professores'),
  ('profiles');
