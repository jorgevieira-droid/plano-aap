
-- Remove overly broad authentication-only policies from notion_sync tables
-- These tables already have admin/gestor-specific policies

DROP POLICY IF EXISTS "Require authentication notion_sync_config" ON public.notion_sync_config;
DROP POLICY IF EXISTS "Require authentication notion_sync_log" ON public.notion_sync_log;
