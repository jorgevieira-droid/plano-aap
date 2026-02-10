import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScaleLabel } from '@/hooks/useInstrumentFields';

interface RubricAccordionProps {
  fieldKey: string;
  scaleLabels: ScaleLabel[];
}

export function RubricAccordion({ fieldKey, scaleLabels }: RubricAccordionProps) {
  const hasDescriptions = scaleLabels.some(s => s.description);
  if (!hasDescriptions) return null;

  return (
    <Accordion type="single" collapsible className="mt-1">
      <AccordionItem value={fieldKey} className="border-none">
        <AccordionTrigger className="py-1 text-xs text-muted-foreground hover:no-underline">
          Ver descrição das rubricas
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2 text-xs">
            {scaleLabels.map(s => (
              <div key={s.value} className="p-2 rounded bg-muted/40">
                <span className="font-semibold">{s.value} – {s.label}: </span>
                <span className="text-muted-foreground">{s.description || '—'}</span>
              </div>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
