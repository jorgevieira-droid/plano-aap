import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AcaoTipo, ACAO_TIPOS, ACAO_TYPE_INFO, ACAO_FORM_CONFIG } from '@/config/acaoPermissions';
import { INSTRUMENT_FORM_TYPES } from '@/hooks/useInstrumentFields';

const INSTRUMENT_TYPE_SET = new Set<string>(INSTRUMENT_FORM_TYPES.map(t => t.value));
// Tipos considerados "Formação" (geram presença e instrumentos por escola)
const FORMACAO_TIPOS: AcaoTipo[] = [
  'formacao',
  'acompanhamento_formacoes',
  'participa_formacoes',
  'encontro_eteg_redes',
  'encontro_professor_redes',
  'encontro_microciclos_recomposicao',
];
// Tipos que envolvem um Ator (AAP/Consultor/Formador) executor
const ATOR_TIPOS = new Set<AcaoTipo>(ACAO_TIPOS);

const sortAcoesAZ = (tipos: AcaoTipo[]): AcaoTipo[] =>
  [...tipos].sort((a, b) =>
    (ACAO_TYPE_INFO[a]?.label || a).localeCompare(ACAO_TYPE_INFO[b]?.label || b, 'pt-BR', { sensitivity: 'base' })
  );

type ProgramaType = 'escolas' | 'regionais' | 'redes_municipais';

interface FormConfigSetting {
  form_key: string;
  programas: ProgramaType[];
}

const getSettingForTipo = (settings: FormConfigSetting[], tipo: AcaoTipo | string) =>
  settings.find(fcs => fcs.form_key === tipo);

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
    // If no config found, return all types (graceful fallback)
    if (formConfigSettings.length === 0) return sortAcoesAZ(ACAO_TIPOS);

    return sortAcoesAZ(ACAO_TIPOS.filter(tipo => {
      const setting = getSettingForTipo(formConfigSettings, tipo);
      if (!setting) return true;
      return setting.programas.includes(programa);
    }));
  };

  /**
   * Checks if a specific action type is enabled for a program.
   */
  const isAcaoEnabledForPrograma = (tipo: AcaoTipo | string, programa: ProgramaType | 'todos'): boolean => {
    if (programa === 'todos') return true;
    const setting = getSettingForTipo(formConfigSettings, tipo);
    if (!setting) return true;
    return setting.programas.includes(programa);
  };

  const isAcaoInativa = (tipo: AcaoTipo | string): boolean => {
    const setting = getSettingForTipo(formConfigSettings, tipo);
    return !!setting && setting.programas.length === 0;
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

    // Formation module: presence per school comes from formacao-like actions
    const hasFormacao = enabledAcoes.some(tipo => FORMACAO_TIPOS.includes(tipo));

    // Ator filter: relevant when there's at least one program action with an executor
    const hasAtor = enabledAcoes.some(tipo => ATOR_TIPOS.has(tipo));

    return {
      showProfessoresComponente: hasSegmentoActions,
      showPresencaComponente: hasSegmentoActions,
      showSegmentoCharts: hasSegmentoActions,
      showStandardAcompanhamento: hasStandardAcompanhamento,
      showRedesAcompanhamento: hasRedesObservacao,
      showPresencaPorEscola: hasFormacao,
      showAtorFilter: hasAtor,
    };
  };

  /** Returns instrument form_type values enabled for a given program. */
  const getInstrumentFormTypesByPrograma = (programa: ProgramaType | 'todos'): string[] => {
    const enabled = getAcoesByPrograma(programa);
    return enabled.filter(tipo => INSTRUMENT_TYPE_SET.has(tipo)) as string[];
  };

  return {
    getAcoesByPrograma,
    isAcaoEnabledForPrograma,
    isAcaoInativa,
    getModuleVisibility,
    getInstrumentFormTypesByPrograma,
    formConfigSettings,
    isLoading,
  };
}
