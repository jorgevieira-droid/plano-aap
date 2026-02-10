import { ScaleLabel } from '@/hooks/useInstrumentFields';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface RatingScaleProps {
  min: number;
  max: number;
  value: number | undefined;
  onChange: (value: number) => void;
  scaleLabels?: ScaleLabel[] | null;
  readOnly?: boolean;
}

export function RatingScale({ min, max, value, onChange, scaleLabels, readOnly }: RatingScaleProps) {
  const values = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  const getLabel = (v: number) => scaleLabels?.find(s => s.value === v);

  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-2">
        {values.map(v => {
          const label = getLabel(v);
          const isSelected = value === v;

          const button = (
            <button
              key={v}
              type="button"
              disabled={readOnly}
              onClick={() => onChange(v)}
              className={`flex-1 min-w-[60px] py-2 px-1 rounded-lg border-2 text-xs font-medium transition-all text-center ${
                isSelected
                  ? 'border-primary bg-primary/15 text-primary'
                  : 'border-border hover:border-muted-foreground disabled:hover:border-border'
              } ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
            >
              <div className="font-bold text-sm">{v}</div>
              {label && <div className="truncate mt-0.5">{label.label}</div>}
            </button>
          );

          if (label?.description) {
            return (
              <Tooltip key={v}>
                <TooltipTrigger asChild>{button}</TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs text-xs">
                  <p className="font-semibold">{label.label}</p>
                  <p className="mt-1 text-muted-foreground">{label.description}</p>
                </TooltipContent>
              </Tooltip>
            );
          }

          return button;
        })}
      </div>
    </TooltipProvider>
  );
}
