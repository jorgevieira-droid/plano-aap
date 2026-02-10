import { useMemo } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, ClipboardList } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

export interface QuestionItem {
  key: string;
  label: string;
  type: string;
  required: boolean;
  enabled: boolean;
}

interface QuestionSelectionStepProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questions: QuestionItem[];
  selectedKeys: string[];
  onSelectedKeysChange: (keys: string[]) => void;
  minOptionalQuestions: number;
  onConfirm: () => void;
}

export function QuestionSelectionStep({
  open,
  onOpenChange,
  questions,
  selectedKeys,
  onSelectedKeysChange,
  minOptionalQuestions,
  onConfirm,
}: QuestionSelectionStepProps) {
  const enabledQuestions = useMemo(() => questions.filter(q => q.enabled), [questions]);
  const requiredQuestions = useMemo(() => enabledQuestions.filter(q => q.required), [enabledQuestions]);
  const optionalQuestions = useMemo(() => enabledQuestions.filter(q => !q.required), [enabledQuestions]);

  const selectedOptionalCount = useMemo(
    () => selectedKeys.filter(k => optionalQuestions.some(q => q.key === k)).length,
    [selectedKeys, optionalQuestions]
  );

  const isValid = selectedOptionalCount >= minOptionalQuestions;

  const handleToggle = (key: string, isRequired: boolean) => {
    if (isRequired) return; // Can't toggle required
    if (selectedKeys.includes(key)) {
      onSelectedKeysChange(selectedKeys.filter(k => k !== key));
    } else {
      onSelectedKeysChange([...selectedKeys, key]);
    }
  };

  const handleSelectAll = () => {
    const allKeys = enabledQuestions.map(q => q.key);
    onSelectedKeysChange(allKeys);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto w-[95vw] max-w-[95vw] sm:w-auto sm:max-w-lg rounded-lg p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList size={20} className="text-primary" />
            Seleção de Questões
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          <p className="text-sm text-muted-foreground">
            Selecione as questões que deseja avaliar neste acompanhamento. 
            Questões obrigatórias já estão pré-selecionadas.
          </p>

          {/* Required Questions */}
          {requiredQuestions.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-destructive" />
                Obrigatórias
              </h4>
              <div className="space-y-2">
                {requiredQuestions.map(q => (
                  <div
                    key={q.key}
                    className="flex items-center gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20"
                  >
                    <Checkbox checked disabled className="opacity-70" />
                    <div className="flex-1">
                      <span className="text-sm font-medium">{q.label}</span>
                    </div>
                    <Badge variant="destructive" className="text-[10px]">Obrigatória</Badge>
                    <Badge variant="secondary" className="text-[10px]">{q.type === 'rating' ? '1-5' : 'Texto'}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Optional Questions */}
          {optionalQuestions.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  Opcionais
                  <span className={`text-xs font-normal ${isValid ? 'text-success' : 'text-destructive'}`}>
                    ({selectedOptionalCount}/{optionalQuestions.length} selecionadas, mínimo: {minOptionalQuestions})
                  </span>
                </h4>
                <Button variant="ghost" size="sm" className="text-xs h-7" onClick={handleSelectAll}>
                  Selecionar todas
                </Button>
              </div>
              <div className="space-y-2">
                {optionalQuestions.map(q => {
                  const isSelected = selectedKeys.includes(q.key);
                  return (
                    <button
                      key={q.key}
                      type="button"
                      onClick={() => handleToggle(q.key, false)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                        isSelected
                          ? 'bg-primary/5 border-primary/30'
                          : 'bg-muted/20 border-border hover:border-muted-foreground/50'
                      }`}
                    >
                      <Checkbox checked={isSelected} className="pointer-events-none" />
                      <div className="flex-1">
                        <span className="text-sm font-medium">{q.label}</span>
                      </div>
                      <Badge variant="outline" className="text-[10px]">Opcional</Badge>
                      <Badge variant="secondary" className="text-[10px]">{q.type === 'rating' ? '1-5' : 'Texto'}</Badge>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Validation message */}
          {!isValid && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
              <AlertCircle size={16} />
              Selecione ao menos {minOptionalQuestions} questões adicionais para continuar.
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button onClick={onConfirm} disabled={!isValid} className="w-full sm:w-auto">
            Iniciar Acompanhamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
