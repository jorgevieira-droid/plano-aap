import { useEffect, useMemo, useState } from 'react';
import { Loader2, ClipboardCheck, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { InstrumentForm } from '@/components/instruments/InstrumentForm';
import { useAcoesByPrograma } from '@/hooks/useAcoesByPrograma';
import { INSTRUMENT_FORM_TYPES } from '@/hooks/useInstrumentFields';
import { ACAO_TYPE_INFO, AcaoTipo, getAcaoLabel } from '@/config/acaoPermissions';

const FECHAMENTO_OPTIONS = ['Sim', 'Parcialmente', 'Não'];
const RUBRIC_EXCLUDED = new Set<string>(['monitoramento_acoes_formativas', 'lista_presenca']);
const INSTRUMENT_TYPE_SET = new Set<string>(INSTRUMENT_FORM_TYPES.map((t) => t.value));

interface Props {
  open: boolean;
  registroAcaoId: string;
  escolaId: string;
  escolaNome?: string;
  userId: string;
  registroStatus: string;
  programacaoId?: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 'form' | 'ask-rubric' | 'pick-rubric' | 'fill-rubric';

export default function MonitoramentoRegionaisManageDialog({
  open,
  registroAcaoId,
  escolaId,
  escolaNome,
  userId,
  registroStatus,
  programacaoId,
  onClose,
  onSuccess,
}: Props) {
  const queryClient = useQueryClient();
  const { getAcoesByPrograma } = useAcoesByPrograma();

  const [step, setStep] = useState<Step>('form');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingId, setExistingId] = useState<string | null>(null);

  const [fechamento, setFechamento] = useState('');
  const [encaminhamentos, setEncaminhamentos] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [avancos, setAvancos] = useState('');
  const [dificuldades, setDificuldades] = useState('');

  const [selectedRubric, setSelectedRubric] = useState<string>('');
  const [rubricResponses, setRubricResponses] = useState<Record<string, any>>({});
  const [rubricExistingId, setRubricExistingId] = useState<string | null>(null);

  const rubricOptions = useMemo(() => {
    return getAcoesByPrograma('regionais')
      .filter((tipo) => !RUBRIC_EXCLUDED.has(tipo))
      .filter((tipo) => INSTRUMENT_TYPE_SET.has(tipo))
      .sort((a, b) =>
        (ACAO_TYPE_INFO[a]?.label || a).localeCompare(ACAO_TYPE_INFO[b]?.label || b, 'pt-BR', { sensitivity: 'base' }),
      );
  }, [getAcoesByPrograma]);

  // Reset state on open
  useEffect(() => {
    if (!open) return;
    setStep('form');
    setSelectedRubric('');
    setRubricResponses({});
    setRubricExistingId(null);
    setIsLoading(true);

    (async () => {
      try {
        const { data: existing } = await (supabase as any)
          .from('relatorios_monit_acoes_formativas')
          .select('*')
          .eq('registro_acao_id', registroAcaoId)
          .maybeSingle();

        if (existing) {
          setExistingId(existing.id);
          setFechamento(existing.fechamento || '');
          setEncaminhamentos(existing.encaminhamentos || '');
          setObservacoes(existing.observacoes || '');
          setAvancos(existing.avancos || '');
          setDificuldades(existing.dificuldades || '');
        } else {
          setExistingId(null);
          setFechamento('');
          setEncaminhamentos('');
          setObservacoes('');
          setAvancos('');
          setDificuldades('');
        }
      } catch (err) {
        console.error('Error loading monitoramento data:', err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [open, registroAcaoId]);

  const handleSaveForm = async () => {
    if (!fechamento) {
      toast.error('Informe se foi possível realizar o fechamento');
      return;
    }
    if (!encaminhamentos.trim()) {
      toast.error('Informe os principais encaminhamentos');
      return;
    }
    if (!observacoes.trim()) {
      toast.error('Informe as observações');
      return;
    }
    if (!avancos.trim()) {
      toast.error('Informe os avanços');
      return;
    }
    if (!dificuldades.trim()) {
      toast.error('Informe as dificuldades');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        fechamento,
        encaminhamentos,
        observacoes,
        avancos,
        dificuldades,
        status: 'enviado',
      };

      if (existingId) {
        const { error } = await (supabase as any)
          .from('relatorios_monit_acoes_formativas')
          .update(payload)
          .eq('id', existingId);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from('relatorios_monit_acoes_formativas')
          .insert({ ...payload, registro_acao_id: registroAcaoId });
        if (error) throw error;
      }

      // Update action status to realizada if pending
      if (registroStatus === 'agendada' || registroStatus === 'prevista' || registroStatus === 'reagendada') {
        await supabase
          .from('registros_acao')
          .update({ status: 'realizada' })
          .eq('id', registroAcaoId);
        if (programacaoId) {
          await supabase
            .from('programacoes')
            .update({ status: 'realizada' })
            .eq('id', programacaoId);
        }
        queryClient.invalidateQueries({ queryKey: ['registros_acao'] });
      }

      toast.success('Gerenciamento salvo com sucesso!');
      setStep('ask-rubric');
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao salvar gerenciamento');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePickRubric = async (tipo: string) => {
    setSelectedRubric(tipo);
    // Load existing responses if any
    const { data: existing } = await supabase
      .from('instrument_responses')
      .select('id, responses')
      .eq('registro_acao_id', registroAcaoId)
      .eq('form_type', tipo)
      .maybeSingle();
    setRubricExistingId(existing?.id || null);
    setRubricResponses((existing?.responses as Record<string, any>) || {});
    setStep('fill-rubric');
  };

  const handleSaveRubric = async () => {
    if (!selectedRubric) return;
    setIsSubmitting(true);
    try {
      if (rubricExistingId) {
        const { error } = await supabase
          .from('instrument_responses')
          .update({ responses: rubricResponses })
          .eq('id', rubricExistingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('instrument_responses').insert({
          registro_acao_id: registroAcaoId,
          form_type: selectedRubric,
          escola_id: escolaId,
          aap_id: userId,
          responses: rubricResponses,
        });
        if (error) throw error;
      }
      toast.success('Rubrica salva com sucesso!');
      onSuccess();
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao salvar rubrica');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinish = () => {
    onSuccess();
  };

  return (
    <>
      {/* Etapa 1 — formulário fixo */}
      <Dialog
        open={open && (step === 'form' || step === 'pick-rubric' || step === 'fill-rubric')}
        onOpenChange={(o) => {
          if (!o) onClose();
        }}
      >
        <DialogContent className="max-w-3xl w-[95vw] h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {step === 'form' && 'Gerenciar Monitoramento de Ações Formativas'}
              {step === 'pick-rubric' && 'Selecionar rubrica'}
              {step === 'fill-rubric' && (selectedRubric ? getAcaoLabel(selectedRubric) : 'Rubrica')}
              {escolaNome && (
                <span className="text-sm font-normal text-muted-foreground ml-2">— {escolaNome}</span>
              )}
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="flex-1 min-h-0 pr-4">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="animate-spin" size={24} />
                <span className="ml-2 text-sm text-muted-foreground">Carregando...</span>
              </div>
            ) : step === 'form' ? (
              <div className="space-y-6 py-2">
                <div>
                  <Label className="text-base font-medium">
                    Foi possível realizar o fechamento gerando encaminhamentos? *
                  </Label>
                  <RadioGroup value={fechamento} onValueChange={setFechamento} className="space-y-2 mt-3">
                    {FECHAMENTO_OPTIONS.map((opt) => (
                      <label
                        key={opt}
                        className="flex items-center gap-3 rounded-lg border border-border p-3 text-sm cursor-pointer hover:bg-muted/30 transition-colors"
                      >
                        <RadioGroupItem value={opt} id={`fech-${opt}`} />
                        <Label htmlFor={`fech-${opt}`} className="cursor-pointer">
                          {opt}
                        </Label>
                      </label>
                    ))}
                  </RadioGroup>
                </div>

                <div>
                  <Label className="text-base font-medium">Principais encaminhamentos da ação *</Label>
                  <Textarea
                    value={encaminhamentos}
                    onChange={(e) => setEncaminhamentos(e.target.value)}
                    placeholder="Descreva os principais encaminhamentos..."
                    rows={4}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label className="text-base font-medium">Observações *</Label>
                  <Textarea
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder="Descreva as observações..."
                    rows={4}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label className="text-base font-medium">Avanços *</Label>
                  <Textarea
                    value={avancos}
                    onChange={(e) => setAvancos(e.target.value)}
                    placeholder="Descreva os avanços..."
                    rows={4}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label className="text-base font-medium">Dificuldades *</Label>
                  <Textarea
                    value={dificuldades}
                    onChange={(e) => setDificuldades(e.target.value)}
                    placeholder="Descreva as dificuldades..."
                    rows={4}
                    className="mt-2"
                  />
                </div>
              </div>
            ) : step === 'pick-rubric' ? (
              <div className="space-y-4 py-2">
                <p className="text-sm text-muted-foreground">
                  Selecione a rubrica que deseja preencher para esta ação.
                </p>
                {rubricOptions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma rubrica disponível para o programa Regionais.
                  </p>
                ) : (
                  <Select value={selectedRubric} onValueChange={handlePickRubric}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a rubrica" />
                    </SelectTrigger>
                    <SelectContent>
                      {rubricOptions.map((tipo) => (
                        <SelectItem key={tipo} value={tipo}>
                          {ACAO_TYPE_INFO[tipo as AcaoTipo]?.label || tipo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            ) : step === 'fill-rubric' && selectedRubric ? (
              <div className="py-2">
                <InstrumentForm
                  formType={selectedRubric}
                  responses={rubricResponses}
                  onResponseChange={(key, value) =>
                    setRubricResponses((prev) => ({ ...prev, [key]: value }))
                  }
                />
              </div>
            ) : null}
          </ScrollArea>

          <DialogFooter className="gap-2">
            {step === 'form' && (
              <>
                <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveForm} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                  Salvar e continuar
                </Button>
              </>
            )}
            {step === 'pick-rubric' && (
              <Button variant="outline" onClick={handleFinish}>
                Concluir
              </Button>
            )}
            {step === 'fill-rubric' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep('pick-rubric');
                    setSelectedRubric('');
                  }}
                  disabled={isSubmitting}
                >
                  Voltar
                </Button>
                <Button onClick={handleSaveRubric} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                  Salvar rubrica
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Etapa 2 — pergunta sobre rubrica */}
      <AlertDialog
        open={open && step === 'ask-rubric'}
        onOpenChange={(o) => {
          if (!o) onClose();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ClipboardCheck size={20} className="text-primary" />
              Preencher rubrica?
            </AlertDialogTitle>
            <AlertDialogDescription>
              <span className="block text-center font-medium text-foreground py-2">
                Deseja preencher uma rubrica para esta ação?
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel onClick={handleFinish} className="flex items-center gap-2">
              <X size={16} />
              Não
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => setStep('pick-rubric')}
              className="flex items-center gap-2"
            >
              <Check size={16} />
              Sim, preencher
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
