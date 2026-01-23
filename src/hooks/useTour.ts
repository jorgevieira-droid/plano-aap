import { useState, useCallback, useEffect, useRef } from 'react';
import { driver, DriveStep, Config } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useAuth } from '@/contexts/AuthContext';

export type TourType = 'admin' | 'gestor' | 'aap';
export type PageTourType = 'dashboard' | 'programacao' | 'registros' | 'relatorios' | 'evolucao';

interface TourConfig {
  steps: DriveStep[];
  title: string;
}

// ========================
// TOUR DO DASHBOARD
// ========================

// Passos do tour para Admin - Dashboard
const adminDashboardSteps: DriveStep[] = [
  {
    element: '[data-tour="sidebar-menu"]',
    popover: {
      title: '📋 Menu Principal',
      description: 'Este é o seu menu de navegação. Acesse todas as funcionalidades do sistema a partir daqui.',
      side: 'right',
      align: 'start'
    }
  },
  {
    element: '[data-tour="user-profile"]',
    popover: {
      title: '👤 Seu Perfil',
      description: 'Clique aqui para acessar suas informações de perfil e alterar sua senha.',
      side: 'right',
      align: 'start'
    }
  },
  {
    element: '[data-tour="stat-escolas"]',
    popover: {
      title: '🏫 Escolas / Regionais / Redes',
      description: 'Visualize o total de escolas, regionais e redes cadastradas. Clique para gerenciar.',
      side: 'bottom',
      align: 'start'
    }
  },
  {
    element: '[data-tour="stat-professores"]',
    popover: {
      title: '👩‍🏫 Professores / Coordenadores',
      description: 'Acompanhe o número de professores e coordenadores cadastrados no sistema.',
      side: 'bottom',
      align: 'start'
    }
  },
  {
    element: '[data-tour="stat-aaps"]',
    popover: {
      title: '🎓 AAPs / Formadores',
      description: 'Gerencie os AAPs e formadores responsáveis pelo acompanhamento.',
      side: 'bottom',
      align: 'start'
    }
  },
  {
    element: '[data-tour="pending-alerts"]',
    popover: {
      title: '⚠️ Ações Pendentes',
      description: 'Aqui você vê as ações que estão pendentes há mais de 2 dias e precisam de atenção.',
      side: 'top',
      align: 'start'
    }
  },
  {
    element: '[data-tour="charts-section"]',
    popover: {
      title: '📊 Gráficos e Métricas',
      description: 'Visualize gráficos detalhados sobre ações por AAP, tipos de ação, presença e avaliações.',
      side: 'top',
      align: 'center'
    }
  },
  {
    element: '[data-tour="filters"]',
    popover: {
      title: '🔍 Filtros',
      description: 'Use os filtros para segmentar os dados por programa, escola ou componente curricular.',
      side: 'bottom',
      align: 'start'
    }
  }
];

// Passos do tour para Gestor - Dashboard
const gestorDashboardSteps: DriveStep[] = [
  {
    element: '[data-tour="sidebar-menu"]',
    popover: {
      title: '📋 Menu Principal',
      description: 'Navegue pelas funcionalidades do sistema. Como Gestor, você tem acesso a todos os dados dos seus programas.',
      side: 'right',
      align: 'start'
    }
  },
  {
    element: '[data-tour="user-profile"]',
    popover: {
      title: '👤 Seu Perfil',
      description: 'Acesse suas informações pessoais e altere sua senha quando necessário.',
      side: 'right',
      align: 'start'
    }
  },
  {
    element: '[data-tour="stat-escolas"]',
    popover: {
      title: '🏫 Suas Escolas',
      description: 'Veja as escolas vinculadas aos seus programas. Clique para ver detalhes.',
      side: 'bottom',
      align: 'start'
    }
  },
  {
    element: '[data-tour="stat-professores"]',
    popover: {
      title: '👩‍🏫 Professores',
      description: 'Acompanhe os professores das escolas dos seus programas.',
      side: 'bottom',
      align: 'start'
    }
  },
  {
    element: '[data-tour="pending-alerts"]',
    popover: {
      title: '⚠️ Ações Pendentes',
      description: 'Monitore as ações que estão atrasadas e precisam de acompanhamento.',
      side: 'top',
      align: 'start'
    }
  },
  {
    element: '[data-tour="charts-section"]',
    popover: {
      title: '📊 Análises',
      description: 'Visualize gráficos e métricas para acompanhar o desempenho do seu programa.',
      side: 'top',
      align: 'center'
    }
  }
];

// Passos do tour para AAP - Dashboard
const aapDashboardSteps: DriveStep[] = [
  {
    element: '[data-tour="sidebar-menu"]',
    popover: {
      title: '📋 Seu Menu',
      description: 'Este é o seu painel de navegação com todas as funcionalidades disponíveis para você.',
      side: 'right',
      align: 'start'
    }
  },
  {
    element: '[data-tour="user-profile"]',
    popover: {
      title: '👤 Seu Perfil',
      description: 'Acesse seu perfil para ver suas informações e alterar sua senha.',
      side: 'right',
      align: 'start'
    }
  },
  {
    element: '[data-tour="stat-escolas"]',
    popover: {
      title: '🏫 Suas Escolas',
      description: 'Veja as escolas que estão sob sua responsabilidade.',
      side: 'bottom',
      align: 'start'
    }
  },
  {
    element: '[data-tour="stat-programacoes"]',
    popover: {
      title: '📅 Programações',
      description: 'Acompanhe suas programações agendadas e futuras.',
      side: 'bottom',
      align: 'start'
    }
  },
  {
    element: '[data-tour="stat-registros"]',
    popover: {
      title: '✅ Registros Realizados',
      description: 'Veja quantas ações você já registrou no sistema.',
      side: 'bottom',
      align: 'start'
    }
  },
  {
    element: '[data-tour="stat-pendentes"]',
    popover: {
      title: '⏳ Pendentes',
      description: 'Monitore suas ações pendentes que precisam ser finalizadas.',
      side: 'bottom',
      align: 'start'
    }
  },
  {
    element: '[data-tour="pending-alerts"]',
    popover: {
      title: '⚠️ Atenção!',
      description: 'Ações com mais de 2 dias de atraso aparecem aqui. Dê prioridade a elas!',
      side: 'top',
      align: 'start'
    }
  },
  {
    element: '[data-tour="quick-actions"]',
    popover: {
      title: '⚡ Ações Rápidas',
      description: 'Use os botões de ação rápida para registrar novas ações ou acessar o calendário.',
      side: 'top',
      align: 'center'
    }
  }
];

// ========================
// TOUR DA PROGRAMAÇÃO
// ========================

const programacaoTourSteps: DriveStep[] = [
  {
    element: '[data-tour="prog-header"]',
    popover: {
      title: '📅 Página de Programação',
      description: 'Aqui você gerencia todas as ações programadas: formações, visitas e acompanhamentos de aula.',
      side: 'bottom',
      align: 'start'
    }
  },
  {
    element: '[data-tour="prog-view-toggle"]',
    popover: {
      title: '🔄 Modos de Visualização',
      description: 'Alterne entre a visualização de calendário e lista para ver suas programações.',
      side: 'bottom',
      align: 'center'
    }
  },
  {
    element: '[data-tour="prog-import-btn"]',
    popover: {
      title: '📤 Importar Programações',
      description: 'Importe múltiplas programações de uma vez através de uma planilha Excel.',
      side: 'bottom',
      align: 'end'
    }
  },
  {
    element: '[data-tour="prog-new-btn"]',
    popover: {
      title: '➕ Nova Ação',
      description: 'Clique aqui para programar uma nova ação: formação, visita ou acompanhamento de aula.',
      side: 'bottom',
      align: 'end'
    }
  },
  {
    element: '[data-tour="prog-filters"]',
    popover: {
      title: '🔍 Filtros',
      description: 'Filtre as programações por programa e tipo de ação para encontrar rapidamente o que procura.',
      side: 'bottom',
      align: 'start'
    }
  },
  {
    element: '[data-tour="prog-calendar"]',
    popover: {
      title: '📆 Calendário',
      description: 'Visualize suas programações no calendário. Clique duas vezes em uma data para criar uma nova ação nesse dia.',
      side: 'top',
      align: 'center'
    }
  },
  {
    element: '[data-tour="prog-navigation"]',
    popover: {
      title: '◀️ ▶️ Navegação',
      description: 'Use as setas para navegar entre os meses e visualizar programações futuras ou passadas.',
      side: 'bottom',
      align: 'center'
    }
  }
];

// ========================
// TOUR DOS REGISTROS
// ========================

const registrosTourSteps: DriveStep[] = [
  {
    element: '[data-tour="reg-header"]',
    popover: {
      title: '📋 Página de Registros',
      description: 'Visualize e gerencie todos os registros de ações realizadas, canceladas ou pendentes.',
      side: 'bottom',
      align: 'start'
    }
  },
  {
    element: '[data-tour="reg-export-btn"]',
    popover: {
      title: '📥 Exportar Dados',
      description: 'Exporte os registros filtrados para uma planilha Excel para análises externas.',
      side: 'bottom',
      align: 'end'
    }
  },
  {
    element: '[data-tour="reg-filters"]',
    popover: {
      title: '🔍 Filtros Avançados',
      description: 'Filtre por tipo de ação, status, programa, período e muito mais para encontrar registros específicos.',
      side: 'bottom',
      align: 'start'
    }
  },
  {
    element: '[data-tour="reg-search"]',
    popover: {
      title: '🔎 Busca',
      description: 'Pesquise registros por nome da escola ou do AAP responsável.',
      side: 'bottom',
      align: 'start'
    }
  },
  {
    element: '[data-tour="reg-table"]',
    popover: {
      title: '📊 Tabela de Registros',
      description: 'Visualize todos os detalhes dos registros. Clique em uma linha para ver mais informações ou editar.',
      side: 'top',
      align: 'center'
    }
  },
  {
    element: '[data-tour="reg-status-filter"]',
    popover: {
      title: '📌 Filtro de Status',
      description: 'Filtre rapidamente por status: realizadas, canceladas, pendentes, etc.',
      side: 'bottom',
      align: 'center'
    }
  }
];

// ========================
// TOUR DOS RELATÓRIOS
// ========================

const relatoriosTourSteps: DriveStep[] = [
  {
    element: '[data-tour="rel-header"]',
    popover: {
      title: '📊 Página de Relatórios',
      description: 'Acompanhe indicadores e métricas do programa com gráficos e estatísticas detalhadas.',
      side: 'bottom',
      align: 'start'
    }
  },
  {
    element: '[data-tour="rel-export-btns"]',
    popover: {
      title: '📥 Exportar Relatórios',
      description: 'Exporte os relatórios em formato PDF para apresentações ou Excel para análises.',
      side: 'bottom',
      align: 'end'
    }
  },
  {
    element: '[data-tour="rel-email-section"]',
    popover: {
      title: '📧 Envio de E-mails',
      description: 'Envie notificações de ações pendentes ou relatórios mensais por e-mail.',
      side: 'bottom',
      align: 'start'
    }
  },
  {
    element: '[data-tour="rel-filters"]',
    popover: {
      title: '🔍 Filtros de Período',
      description: 'Selecione o programa, ano, mês e outros filtros para refinar os dados exibidos.',
      side: 'bottom',
      align: 'start'
    }
  },
  {
    element: '[data-tour="rel-stats"]',
    popover: {
      title: '📈 Estatísticas Gerais',
      description: 'Visualize o resumo de formações, visitas e acompanhamentos previstos vs realizados.',
      side: 'top',
      align: 'center'
    }
  },
  {
    element: '[data-tour="rel-charts"]',
    popover: {
      title: '📊 Gráficos',
      description: 'Analise os dados através de gráficos de barras, pizza e radar para insights visuais.',
      side: 'top',
      align: 'center'
    }
  }
];

// ========================
// TOUR DE EVOLUÇÃO
// ========================

const evolucaoTourSteps: DriveStep[] = [
  {
    element: '[data-tour="evo-header"]',
    popover: {
      title: '📈 Evolução do Professor',
      description: 'Acompanhe a evolução das avaliações de aula de cada professor ao longo do tempo.',
      side: 'bottom',
      align: 'start'
    }
  },
  {
    element: '[data-tour="evo-filters"]',
    popover: {
      title: '🔍 Selecione o Professor',
      description: 'Use os filtros para selecionar AAP, escola e professor que deseja analisar.',
      side: 'bottom',
      align: 'start'
    }
  },
  {
    element: '[data-tour="evo-export-btn"]',
    popover: {
      title: '📄 Exportar PDF',
      description: 'Gere um relatório em PDF com a evolução completa do professor selecionado.',
      side: 'bottom',
      align: 'end'
    }
  },
  {
    element: '[data-tour="evo-chart"]',
    popover: {
      title: '📊 Gráfico de Evolução',
      description: 'Visualize a evolução das notas por dimensão ao longo das avaliações.',
      side: 'top',
      align: 'center'
    }
  },
  {
    element: '[data-tour="evo-matrix"]',
    popover: {
      title: '🎯 Matriz de Avaliações',
      description: 'Veja todas as notas em formato de matriz para comparar dimensões e datas.',
      side: 'top',
      align: 'center'
    }
  },
  {
    element: '[data-tour="evo-observacoes"]',
    popover: {
      title: '📝 Observações',
      description: 'Leia as observações qualitativas registradas em cada avaliação.',
      side: 'top',
      align: 'center'
    }
  }
];

// Configurações de tour por tipo de usuário e página
const dashboardConfigs: Record<TourType, TourConfig> = {
  admin: { steps: adminDashboardSteps, title: 'Tour do Administrador' },
  gestor: { steps: gestorDashboardSteps, title: 'Tour do Gestor' },
  aap: { steps: aapDashboardSteps, title: 'Tour do AAP / Formador' }
};

const pageTourConfigs: Record<PageTourType, TourConfig> = {
  dashboard: { steps: adminDashboardSteps, title: 'Tour do Dashboard' },
  programacao: { steps: programacaoTourSteps, title: 'Tour da Programação' },
  registros: { steps: registrosTourSteps, title: 'Tour dos Registros' },
  relatorios: { steps: relatoriosTourSteps, title: 'Tour dos Relatórios' },
  evolucao: { steps: evolucaoTourSteps, title: 'Tour de Evolução' }
};

const TOUR_STORAGE_KEY = 'tour_completed';

export function useTour() {
  const { profile, isAdmin, isGestor, isAAP } = useAuth();
  const [isTourActive, setIsTourActive] = useState(false);
  const driverRef = useRef<ReturnType<typeof driver> | null>(null);

  const getTourType = useCallback((): TourType | null => {
    if (isAdmin) return 'admin';
    if (isGestor) return 'gestor';
    if (isAAP) return 'aap';
    return null;
  }, [isAdmin, isGestor, isAAP]);

  const hasCompletedTour = useCallback((page?: PageTourType): boolean => {
    const tourType = getTourType();
    if (!tourType || !profile?.id) return true;
    
    const key = page 
      ? `${TOUR_STORAGE_KEY}_${profile.id}_${page}`
      : `${TOUR_STORAGE_KEY}_${profile.id}_${tourType}`;
    const completed = localStorage.getItem(key);
    return completed === 'true';
  }, [getTourType, profile?.id]);

  const markTourAsCompleted = useCallback((page?: PageTourType) => {
    const tourType = getTourType();
    if (tourType && profile?.id) {
      const key = page 
        ? `${TOUR_STORAGE_KEY}_${profile.id}_${page}`
        : `${TOUR_STORAGE_KEY}_${profile.id}_${tourType}`;
      localStorage.setItem(key, 'true');
    }
  }, [getTourType, profile?.id]);

  const resetTour = useCallback((page?: PageTourType) => {
    const tourType = getTourType();
    if (tourType && profile?.id) {
      if (page) {
        localStorage.removeItem(`${TOUR_STORAGE_KEY}_${profile.id}_${page}`);
      } else {
        localStorage.removeItem(`${TOUR_STORAGE_KEY}_${profile.id}_${tourType}`);
        // Also reset all page tours
        Object.keys(pageTourConfigs).forEach(p => {
          localStorage.removeItem(`${TOUR_STORAGE_KEY}_${profile.id}_${p}`);
        });
      }
    }
  }, [getTourType, profile?.id]);

  const cleanupOrphanDom = useCallback(() => {
    // Only remove DOM nodes if we don't have a live instance.
    if (driverRef.current) return;

    const nodes = document.querySelectorAll('.driver-overlay, .driver-popover');
    nodes.forEach((node) => {
      try {
        node.parentNode?.removeChild(node);
      } catch {
        // ignore
      }
    });
    document.body.classList.remove('driver-active');
  }, []);

  const destroyActiveTour = useCallback(() => {
    if (!driverRef.current) return;
    try {
      // Let driver.js clean itself up to avoid DOM conflicts.
      driverRef.current.destroy();
    } catch {
      // If destroy throws for any reason, drop the ref and attempt orphan cleanup.
      driverRef.current = null;
      cleanupOrphanDom();
    }
  }, [cleanupOrphanDom]);

  const startTour = useCallback((page?: PageTourType) => {
    const tourType = getTourType();
    if (!tourType) return;

    // If a tour is already running, destroy it first (safe).
    destroyActiveTour();
    // If a previous crash left overlays behind, clean them.
    cleanupOrphanDom();

    let config: TourConfig;
    
    if (page) {
      config = pageTourConfigs[page];
      // For dashboard, use role-specific steps
      if (page === 'dashboard') {
        config = dashboardConfigs[tourType];
      }
    } else {
      config = dashboardConfigs[tourType];
    }
    
    // Filter steps to only include elements that exist in the DOM
    const availableSteps = config.steps.filter(step => {
      if (!step.element) return true;
      return document.querySelector(step.element as string);
    });

    if (availableSteps.length === 0) {
      console.warn('No tour elements found in the DOM');
      return;
    }

    const driverConfig: Config = {
      showProgress: true,
      showButtons: ['next', 'previous', 'close'],
      nextBtnText: 'Próximo',
      prevBtnText: 'Anterior',
      doneBtnText: 'Concluir',
      progressText: '{{current}} de {{total}}',
      steps: availableSteps,
      allowClose: true,
      stagePadding: 10,
      stageRadius: 8,
      onDestroyStarted: () => {
        setIsTourActive(false);
        markTourAsCompleted(page);
      },
      onDestroyed: () => {
        setIsTourActive(false);
        driverRef.current = null;
        // Extra safety: in case some nodes remain (rare)
        cleanupOrphanDom();
      },
      popoverClass: 'tour-popover',
    };

    const driverInstance = driver(driverConfig);
    driverRef.current = driverInstance;
    setIsTourActive(true);
    
    // Start tour with a small delay to avoid conflicts with other UI elements
    requestAnimationFrame(() => {
      driverInstance.drive();
    });
  }, [cleanupOrphanDom, destroyActiveTour, getTourType, markTourAsCompleted]);

  // Cleanup on unmount (safe)
  useEffect(() => {
    return () => {
      destroyActiveTour();
      cleanupOrphanDom();
    };
  }, [cleanupOrphanDom, destroyActiveTour]);

  return {
    startTour,
    hasCompletedTour,
    resetTour,
    isTourActive,
    tourType: getTourType()
  };
}
