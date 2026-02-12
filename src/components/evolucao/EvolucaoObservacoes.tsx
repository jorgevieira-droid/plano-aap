import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DynamicAvaliacao } from './EvolucaoLineChart';

interface EvolucaoObservacoesProps {
  avaliacoes: DynamicAvaliacao[];
  textFieldLabels?: Record<string, string>;
}

const ITEMS_PER_PAGE = 5;

export function EvolucaoObservacoes({ avaliacoes, textFieldLabels }: EvolucaoObservacoesProps) {
  const [showAll, setShowAll] = useState(false);
  
  // Filter avaliacoes that have at least one non-empty text field
  const observacoesComTexto = avaliacoes.filter(a => 
    Object.values(a.textFields).some(v => v && v.trim().length > 0)
  );
  
  if (observacoesComTexto.length === 0) return null;
  
  const displayedItems = showAll 
    ? observacoesComTexto 
    : observacoesComTexto.slice(0, ITEMS_PER_PAGE);
  
  const hasMore = observacoesComTexto.length > ITEMS_PER_PAGE;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="w-5 h-5 text-primary" />
          Observações
          <span className="text-sm font-normal text-muted-foreground">
            ({observacoesComTexto.length} {observacoesComTexto.length === 1 ? 'registro' : 'registros'})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {displayedItems.map((avaliacao, index) => (
          <div 
            key={avaliacao.id}
            className={cn(
              "border rounded-lg p-4 bg-muted/20 hover:bg-muted/40 transition-colors",
              index !== displayedItems.length - 1 && "mb-4"
            )}
          >
            <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span className="font-medium">{formatDate(avaliacao.data)}</span>
            </div>
            <div className="space-y-2">
              {Object.entries(avaliacao.textFields)
                .filter(([, value]) => value && value.trim().length > 0)
                .map(([key, value]) => (
                  <div key={key}>
                    {textFieldLabels?.[key] && (
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {textFieldLabels[key]}
                      </span>
                    )}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{value}</p>
                  </div>
                ))}
            </div>
          </div>
        ))}
        
        {hasMore && (
          <Button variant="ghost" className="w-full" onClick={() => setShowAll(!showAll)}>
            {showAll ? (
              <><ChevronUp className="w-4 h-4 mr-2" />Ver menos</>
            ) : (
              <><ChevronDown className="w-4 h-4 mr-2" />Ver mais ({observacoesComTexto.length - ITEMS_PER_PAGE} restantes)</>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
