import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth, AppRole } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface FieldConfig {
  enabled: boolean;
  required: boolean;
}

export const OBSERVACAO_AULA_FIELDS = [
  { key: 'clareza_objetivos', label: 'Intencionalidade Pedagógica', type: 'rating' },
  { key: 'dominio_conteudo', label: 'Estratégias Didáticas', type: 'rating' },
  { key: 'estrategias_didaticas', label: 'Mediação Docente', type: 'rating' },
  { key: 'engajamento_turma', label: 'Engajamento dos Estudantes', type: 'rating' },
  { key: 'gestao_tempo', label: 'Avaliação durante a Aula', type: 'rating' },
  { key: 'observacoes_professor', label: 'Observações (por professor)', type: 'text' },
  { key: 'observacoes_gerais', label: 'Observações Gerais da Visita', type: 'text' },
  { key: 'avancos', label: 'Avanços Identificados', type: 'text' },
  { key: 'dificuldades', label: 'Dificuldades Encontradas', type: 'text' },
  { key: 'turma', label: 'Turma', type: 'text' },
] as const;

export function useFormFieldConfig(formKey: string) {
  const { profile } = useAuth();
  const role = profile?.role;

  const { data, isLoading } = useQuery({
    queryKey: ['form_field_config', formKey, role],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('form_field_config')
        .select('field_key, enabled, required')
        .eq('form_key', formKey)
        .eq('role', role!);
      if (error) throw error;
      return data;
    },
    enabled: !!role,
  });

  const { data: settingsData } = useQuery({
    queryKey: ['form_config_settings', formKey],
    queryFn: async () => {
      const { data, error } = await (supabase as unknown as { from: (table: string) => any })
        .from('form_config_settings')
        .select('min_optional_questions')
        .eq('form_key', formKey)
        .single();
      if (error) return null;
      return data as { min_optional_questions: number } | null;
    },
  });

  const configMap = useMemo(() => {
    const map: Record<string, FieldConfig> = {};
    if (data) {
      for (const row of data) {
        map[row.field_key] = { enabled: row.enabled, required: row.required };
      }
    }
    return map;
  }, [data]);

  const minOptionalQuestions: number = (settingsData as unknown as { min_optional_questions: number } | null)?.min_optional_questions ?? 3;

  return {
    configMap,
    isFieldEnabled: (key: string) => configMap[key]?.enabled ?? true,
    isFieldRequired: (key: string) => configMap[key]?.required ?? false,
    isLoading,
    minOptionalQuestions,
  };
}

// Hook for admin to manage all configs
export function useFormFieldConfigAdmin(formKey: string) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['form_field_config_admin', formKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('form_field_config')
        .select('*')
        .eq('form_key', formKey)
        .order('field_key')
        .order('role');
      if (error) throw error;
      return data;
    },
  });

  const configByRole = useMemo(() => {
    const map: Record<string, Record<string, FieldConfig>> = {};
    if (data) {
      for (const row of data) {
        if (!map[row.role]) map[row.role] = {};
        map[row.role][row.field_key] = { enabled: row.enabled, required: row.required };
      }
    }
    return map;
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: async (updates: { field_key: string; role: string; enabled: boolean; required: boolean }[]) => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      
      for (const u of updates) {
        const { error } = await supabase
          .from('form_field_config')
          .upsert(
            {
              form_key: formKey,
              field_key: u.field_key,
              role: u.role as any,
              enabled: u.enabled,
              required: u.required,
              updated_at: new Date().toISOString(),
              updated_by: userId,
            },
            { onConflict: 'form_key,field_key,role' }
          );
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form_field_config_admin', formKey] });
      queryClient.invalidateQueries({ queryKey: ['form_field_config', formKey] });
    },
  });

  return { configByRole, isLoading, updateConfig: updateMutation.mutateAsync, isUpdating: updateMutation.isPending };
}
