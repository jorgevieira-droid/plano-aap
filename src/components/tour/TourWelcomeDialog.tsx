import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTour } from '@/hooks/useTour';
import { GraduationCap, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function TourWelcomeDialog() {
  const { startTour, hasCompletedTour, tourType } = useTour();
  const { profile, mustChangePassword } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Show dialog after a small delay to ensure DOM is ready
    // Don't show if user must change password
    const timer = setTimeout(() => {
      if (tourType && profile && !hasCompletedTour() && !mustChangePassword) {
        setOpen(true);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [tourType, profile, hasCompletedTour, mustChangePassword]);

  const handleStartTour = () => {
    setOpen(false);
    // Small delay to ensure dialog is closed before tour starts
    setTimeout(() => {
      startTour();
    }, 300);
  };

  const handleSkip = () => {
    setOpen(false);
    // Mark as completed to not show again
    localStorage.setItem(`tour_completed_${profile?.id}_${tourType}`, 'true');
  };

  const getRoleWelcome = () => {
    switch (tourType) {
      case 'admin':
        return {
          title: 'Bem-vindo, Administrador!',
          description: 'Como administrador, você tem acesso completo ao sistema. Vamos fazer um tour para conhecer todas as funcionalidades disponíveis?'
        };
      case 'gestor':
        return {
          title: 'Bem-vindo, Gestor!',
          description: 'Como gestor, você pode acompanhar todos os dados dos seus programas. Quer conhecer as principais funcionalidades?'
        };
      case 'aap':
        return {
          title: 'Bem-vindo, AAP / Formador!',
          description: 'Este é o seu painel de acompanhamento. Vamos fazer um tour rápido para você conhecer as ferramentas disponíveis?'
        };
      default:
        return {
          title: 'Bem-vindo!',
          description: 'Vamos fazer um tour para conhecer o sistema?'
        };
    }
  };

  const welcomeContent = getRoleWelcome();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <GraduationCap className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-xl">
            <span className="flex items-center justify-center gap-2">
              {welcomeContent.title}
              <Sparkles className="h-5 w-5 text-warning" />
            </span>
          </DialogTitle>
          <DialogDescription className="text-center pt-2">
            {welcomeContent.description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-center pt-4">
          <Button variant="outline" onClick={handleSkip}>
            Pular Tour
          </Button>
          <Button onClick={handleStartTour} className="gap-2">
            <Sparkles className="h-4 w-4" />
            Iniciar Tour
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
