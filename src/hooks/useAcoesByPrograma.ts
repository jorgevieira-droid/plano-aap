import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AcaoTipo, ACAO_TIPOS, ACAO_TYPE_INFO, ACAO_FORM_CONFIG } from '@/config/acaoPermissions';

const sortAcoesAZ = (tipos: AcaoTipo[]): AcaoTipo[] =>
  [...tipos].sort((a, b) =>
    (ACAO_TYPE_INFO[a]?.label || a).localeCompare(ACAO_TYPE_INFO[b]?.label || b, 'pt-BR', { sensitivity: 'base' })
  );

type ProgramaType = 'escolas' | 'regionais' | 'redes_municipais';

interface FormConfigSetting {
  form_key: string;
  programas: ProgramaType[];
}

/**
 * Fetches form_config_settings and returns action types enabled for a given program.
 * This is the source of truth for which actions appear in dashboards/reports.
 */
export function useAcoesByPrograma() {
  const { data: formConfigSettings = [], isLoading } = useQuery({
    queryKey: ['form_config_settings_programas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('form_config_settings')
        .select('form_key, programas');
      if (error) throw error;
      return (data || []) as FormConfigSetting[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  /**
   * Returns the action types enabled for a given program.
   * If programa is 'todos', returns all types.
   */
  const getAcoesByPrograma = (programa: ProgramaType | 'todos'): AcaoTipo[] => {
    if (programa === 'todos') return sortAcoesAZ(ACAO_TIPOS);

    // Get form_keys that include this program
    const enabledFormKeys = new Set(
      formConfigSettings
        .filter(fcs => fcs.programas.includes(programa))
        .map(fcs => fcs.form_key)
    );

    // If no config found, return all types (graceful fallback)
    if (enabledFormKeys.size === 0 && formConfigSettings.length === 0) return sortAcoesAZ(ACAO_TIPOS);

    return sortAcoesAZ(ACAO_TIPOS.filter(tipo => enabledFormKeys.has(tipo)));
  };

  /**
   * Checks if a specific action type is enabled for a program.
   */
  const isAcaoEnabledForPrograma = (tipo: AcaoTipo | string, programa: ProgramaType | 'todos'): boolean => {
    if (programa === 'todos') return true;
    const enabledAcoes = getAcoesByPrograma(programa);
    return enabledAcoes.includes(tipo as AcaoTipo);
  };

  /**
   * Determines which module categories should be shown for a program.
   */
  const getModuleVisibility = (programa: ProgramaType | 'todos') => {
    const enabledAcoes = getAcoesByPrograma(programa);

    // Standard module: needs actions with segmento/componente (escolas-type actions)
    const hasSegmentoActions = enabledAcoes.some(tipo => {
      const config = ACAO_FORM_CONFIG[tipo];
      return config?.showSegmento || config?.showComponente;
    });

    // Standard acompanhamento module (radar 1-5): needs observacao_aula or acompanhamento_aula
    const hasStandardAcompanhamento = enabledAcoes.includes('observacao_aula') || 
      enabledAcoes.includes('acompanhamento_aula' as AcaoTipo);

    // REDES module (radar 1-4): needs observacao_aula_redes
    const hasRedesObservacao = enabledAcoes.includes('observacao_aula_redes');

    return {
      showProfessoresComponente: hasSegmentoActions,
      showPresencaComponente: hasSegmentoActions,
      showStandardAcompanhamento: hasStandardAcompanhamento,
      showRedesAcompanhamento: hasRedesObservacao,
    };
  };

  return {
    getAcoesByPrograma,
    isAcaoEnabledForPrograma,
    getModuleVisibility,
    formConfigSettings,
    isLoading,
  };
}
