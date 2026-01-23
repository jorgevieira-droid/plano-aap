import { HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTour } from '@/hooks/useTour';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function TourButton() {
  const { startTour, tourType } = useTour();

  if (!tourType) return null;

  const getTourLabel = () => {
    switch (tourType) {
      case 'admin':
        return 'Tour do Administrador';
      case 'gestor':
        return 'Tour do Gestor';
      case 'aap':
        return 'Tour do AAP';
      default:
        return 'Tour Guiado';
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={startTour}
          className="fixed bottom-4 right-4 z-50 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 hover:scale-105 transition-all"
          aria-label={getTourLabel()}
        >
          <HelpCircle className="h-6 w-6" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="left">
        <p>{getTourLabel()}</p>
      </TooltipContent>
    </Tooltip>
  );
}
