import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface DimensionBlockProps {
  title: string;
  children: React.ReactNode;
}

export function DimensionBlock({ title, children }: DimensionBlockProps) {
  const [open, setOpen] = useState(true);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="border border-border rounded-lg overflow-hidden">
      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted/40 hover:bg-muted/60 transition-colors text-left">
        <h4 className="font-semibold text-sm">{title}</h4>
        <ChevronDown size={16} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="p-4 space-y-5">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
