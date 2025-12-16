-- Add 'gestor' to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'gestor';

-- Add 'ativa' column to escolas table
ALTER TABLE public.escolas ADD COLUMN IF NOT EXISTS ativa boolean NOT NULL DEFAULT true;