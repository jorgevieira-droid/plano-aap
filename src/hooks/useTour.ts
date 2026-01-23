import { useState, useCallback, useEffect } from 'react';
import { driver, DriveStep, Config } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useAuth } from '@/contexts/AuthContext';

export type TourType = 'admin' | 'gestor' | 'aap';

interface TourConfig {
  steps: DriveStep[];
  title: string;
}

// Passos do tour para Admin
const adminTourSteps: DriveStep[] = [
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

// Passos do tour para Gestor
const gestorTourSteps: DriveStep[] = [
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

// Passos do tour para AAP
const aapTourSteps: DriveStep[] = [
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

const tourConfigs: Record<TourType, TourConfig> = {
  admin: { steps: adminTourSteps, title: 'Tour do Administrador' },
  gestor: { steps: gestorTourSteps, title: 'Tour do Gestor' },
  aap: { steps: aapTourSteps, title: 'Tour do AAP / Formador' }
};

const TOUR_STORAGE_KEY = 'tour_completed';

export function useTour() {
  const { profile, isAdmin, isGestor, isAAP } = useAuth();
  const [isTourActive, setIsTourActive] = useState(false);

  const getTourType = useCallback((): TourType | null => {
    if (isAdmin) return 'admin';
    if (isGestor) return 'gestor';
    if (isAAP) return 'aap';
    return null;
  }, [isAdmin, isGestor, isAAP]);

  const hasCompletedTour = useCallback((): boolean => {
    const tourType = getTourType();
    if (!tourType || !profile?.id) return true;
    
    const completed = localStorage.getItem(`${TOUR_STORAGE_KEY}_${profile.id}_${tourType}`);
    return completed === 'true';
  }, [getTourType, profile?.id]);

  const markTourAsCompleted = useCallback(() => {
    const tourType = getTourType();
    if (tourType && profile?.id) {
      localStorage.setItem(`${TOUR_STORAGE_KEY}_${profile.id}_${tourType}`, 'true');
    }
  }, [getTourType, profile?.id]);

  const resetTour = useCallback(() => {
    const tourType = getTourType();
    if (tourType && profile?.id) {
      localStorage.removeItem(`${TOUR_STORAGE_KEY}_${profile.id}_${tourType}`);
    }
  }, [getTourType, profile?.id]);

  const startTour = useCallback(() => {
    const tourType = getTourType();
    if (!tourType) return;

    const config = tourConfigs[tourType];
    
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
      onDestroyStarted: () => {
        setIsTourActive(false);
        markTourAsCompleted();
      },
      popoverClass: 'tour-popover',
    };

    const driverInstance = driver(driverConfig);
    setIsTourActive(true);
    driverInstance.drive();
  }, [getTourType, markTourAsCompleted]);

  return {
    startTour,
    hasCompletedTour,
    resetTour,
    isTourActive,
    tourType: getTourType()
  };
}
