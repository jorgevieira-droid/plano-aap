import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ConsultoriaPedagogicaForm from '@/components/formularios/ConsultoriaPedagogicaForm';
import { Check, X, Eye, Pencil, Trash2, Plus, FileText, Printer, Loader2 } from 'lucide-react';
import { useAcoesByPrograma } from '@/hooks/useAcoesByPrograma';
import { Badge } from '@/components/ui/badge';
import {
  ACAO_TIPOS,
  ACAO_TYPE_INFO,
  ACAO_PERMISSION_MATRIX,
  MAIN_ROLES,
  ROLE_LABELS,
  AcaoPermission,
  AcaoTipo,
} from '@/config/acaoPermissions';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { InstrumentForm } from '@/components/instruments/InstrumentForm';
import { INSTRUMENT_FORM_TYPES } from '@/hooks/useInstrumentFields';
import { RedesFormPreview, REDES_FORM_TYPES } from '@/components/instruments/RedesFormPreview';
import { ScrollArea } from '@/components/ui/scroll-area';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';

const INSTRUMENT_TYPE_SET = new Set<string>(INSTRUMENT_FORM_TYPES.map(t => t.value));

const DEDICATED_FORM_TYPES = new Set<string>(['registro_consultoria_pedagogica']);

function getFormTypeForAcao(tipo: AcaoTipo): string | null {
  if (INSTRUMENT_TYPE_SET.has(tipo)) return tipo;
  if (REDES_FORM_TYPES.has(tipo)) return tipo;
  if (DEDICATED_FORM_TYPES.has(tipo)) return tipo;
  return null;
}

function getFormLabel(formType: string): string {
  const found = INSTRUMENT_FORM_TYPES.find(t => t.value === formType);
  if (found) return found.label;
  const info = ACAO_TYPE_INFO[formType as AcaoTipo];
  if (info) return info.label;
  return formType;
}

const scopeLabels: Record<string, string> = {
  all: 'Todos',
  programa: 'Programa',
  entidade: 'Entidade',
  proprio: 'Próprio',
};

const programaLabels: Record<string, string> = {
  escolas: 'Escolas',
  regionais: 'Regionais',
  redes_municipais: 'Redes Municipais',
};

const programaBadgeColors: Record<string, string> = {
  escolas: 'bg-primary/15 text-primary border-primary/30',
  regionais: 'bg-info/15 text-info border-info/30',
  redes_municipais: 'bg-success/15 text-success border-success/30',
};

function PermissionCell({ perm }: { perm: AcaoPermission }) {
  if (!perm.canView && !perm.canCreate && !perm.canEdit && !perm.canDelete) {
    return (
      <div className="flex items-center justify-center">
        <X className="w-4 h-4 text-muted-foreground/40" />
      </div>
    );
  }

  const icons = [];
  if (perm.canView)   icons.push(<Tooltip key="v"><TooltipTrigger><Eye className="w-3.5 h-3.5 text-info" /></TooltipTrigger><TooltipContent>Visualizar</TooltipContent></Tooltip>);
  if (perm.canCreate) icons.push(<Tooltip key="c"><TooltipTrigger><Plus className="w-3.5 h-3.5 text-success" /></TooltipTrigger><TooltipContent>Criar</TooltipContent></Tooltip>);
  if (perm.canEdit)   icons.push(<Tooltip key="e"><TooltipTrigger><Pencil className="w-3.5 h-3.5 text-warning" /></TooltipTrigger><TooltipContent>Editar</TooltipContent></Tooltip>);
  if (perm.canDelete) icons.push(<Tooltip key="d"><TooltipTrigger><Trash2 className="w-3.5 h-3.5 text-error" /></TooltipTrigger><TooltipContent>Excluir</TooltipContent></Tooltip>);

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="flex items-center gap-1">{icons}</div>
      <span className="text-[10px] text-muted-foreground">{scopeLabels[perm.viewScope]}</span>
    </div>
  );
}

export default function MatrizAcoesPage() {
  const [previewFormType, setPreviewFormType] = useState<string | null>(null);
  const [printingType, setPrintingType] = useState<string | null>(null);
  const { formConfigSettings, isAcaoEnabledForPrograma } = useAcoesByPrograma();
  const { isAdmin, profile } = useAuth();

  const handlePrintBlankForm = useCallback(async (formType: string, label: string) => {
    if (printingType) return;
    setPrintingType(formType);
    
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ]);

      // Create off-screen container
      const container = document.createElement('div');
      container.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;background:white;padding:32px;z-index:-1;';
      document.body.appendChild(container);

      // Render the form component
      const queryClient = new QueryClient();
      const root = createRoot(container);
      
      const FormComponent = () => {
        if (DEDICATED_FORM_TYPES.has(formType)) {
          return (
            <ConsultoriaPedagogicaForm
              registroAcaoId=""
              escolaId=""
              aapId=""
              escolaVoar={false}
              onSuccess={() => {}}
              readOnly
            />
          );
        }
        if (REDES_FORM_TYPES.has(formType)) {
          return <RedesFormPreview formType={formType} />;
        }
        return (
          <InstrumentForm
            formType={formType}
            responses={{}}
            onResponseChange={() => {}}
            readOnly
          />
        );
      };

      root.render(
        <QueryClientProvider client={queryClient}>
          <FormComponent />
        </QueryClientProvider>
      );

      // Wait for render + any async content
      await new Promise(resolve => setTimeout(resolve, 1500));

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      root.unmount();
      document.body.removeChild(container);

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 10;
      const contentWidth = pageWidth - margin * 2;

      // Header
      const headerY = margin;
      try {
        const peImg = new Image();
        peImg.src = '/pe-logo.png';
        await new Promise((res, rej) => { peImg.onload = res; peImg.onerror = rej; });
        pdf.addImage(peImg, 'PNG', margin, headerY, 30, 12);
      } catch {}
      try {
        const bImg = new Image();
        bImg.src = '/logo-bussola-1.png';
        await new Promise((res, rej) => { bImg.onload = res; bImg.onerror = rej; });
        pdf.addImage(bImg, 'PNG', pageWidth - margin - 30, headerY, 30, 12);
      } catch {}

      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text(label, pageWidth / 2, headerY + 8, { align: 'center' });

      pdf.setDrawColor(200);
      pdf.line(margin, headerY + 16, pageWidth - margin, headerY + 16);

      // Blank metadata fields
      let fieldY = headerY + 22;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      pdf.text('Usuário: ', margin, fieldY);
      pdf.line(margin + 20, fieldY + 1, 95, fieldY + 1);
      pdf.text('Data: ', 110, fieldY);
      pdf.line(122, fieldY + 1, pageWidth - margin, fieldY + 1);
      
      fieldY += 8;
      pdf.text('Entidade: ', margin, fieldY);
      pdf.line(margin + 22, fieldY + 1, 95, fieldY + 1);
      pdf.text('Hora: ', 110, fieldY);
      pdf.line(122, fieldY + 1, pageWidth - margin, fieldY + 1);
      
      fieldY += 8;
      pdf.text('Programa: ', margin, fieldY);
      pdf.line(margin + 24, fieldY + 1, 95, fieldY + 1);

      pdf.setDrawColor(200);
      fieldY += 6;
      pdf.line(margin, fieldY, pageWidth - margin, fieldY);

      const startY = fieldY + 4;
      const availableHeight = pageHeight - startY - margin;

      // Add form content
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = contentWidth / (imgWidth / 2); // scale was 2
      const totalImgHeightMm = (imgHeight / 2) * ratio;

      if (totalImgHeightMm <= availableHeight) {
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', margin, startY, contentWidth, totalImgHeightMm);
      } else {
        // Multi-page: slice the canvas
        let remainingHeight = imgHeight;
        let sourceY = 0;
        let isFirstPage = true;

        while (remainingHeight > 0) {
          const currentStartY = isFirstPage ? startY : margin;
          const currentAvailable = isFirstPage ? availableHeight : pageHeight - margin * 2;
          const sliceHeightPx = Math.min(remainingHeight, (currentAvailable / ratio) * 2);

          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = imgWidth;
          pageCanvas.height = sliceHeightPx;
          const ctx = pageCanvas.getContext('2d')!;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, imgWidth, sliceHeightPx);
          ctx.drawImage(canvas, 0, sourceY, imgWidth, sliceHeightPx, 0, 0, imgWidth, sliceHeightPx);

          const sliceHeightMm = (sliceHeightPx / 2) * ratio;
          
          if (!isFirstPage) pdf.addPage();
          pdf.addImage(pageCanvas.toDataURL('image/jpeg', 0.95), 'JPEG', margin, currentStartY, contentWidth, sliceHeightMm);

          sourceY += sliceHeightPx;
          remainingHeight -= sliceHeightPx;
          isFirstPage = false;
        }
      }

      const blobUrl = pdf.output('bloburl');
      window.open(blobUrl as string, '_blank');
      toast.success('PDF gerado com sucesso!');
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      toast.error('Erro ao gerar o PDF. Tente novamente.');
    } finally {
      setPrintingType(null);
    }
  }, [printingType]);

  // Filter action types by user's programs (admin sees all)
  const userProgramas = profile?.programas as string[] | undefined;
  const visibleAcaoTipos = ACAO_TIPOS.filter(t => {
    if (t === 'participa_formacoes') return false;
    if (isAdmin || !userProgramas || userProgramas.length === 0) return true;
    return userProgramas.some(p => isAcaoEnabledForPrograma(t, p as any));
  }).sort((a, b) => ACAO_TYPE_INFO[a].label.localeCompare(ACAO_TYPE_INFO[b].label, 'pt-BR'));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Matriz de Ações × Perfis</h1>
        <p className="text-muted-foreground mt-1">
          Visualização das permissões de cada tipo de ação por perfil do sistema (conforme planilha "Perfis × Filtros × Eventos").
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
        <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5 text-info" /> Visualizar</span>
        <span className="flex items-center gap-1"><Plus className="w-3.5 h-3.5 text-success" /> Criar</span>
        <span className="flex items-center gap-1"><Pencil className="w-3.5 h-3.5 text-warning" /> Editar</span>
        <span className="flex items-center gap-1"><Trash2 className="w-3.5 h-3.5 text-error" /> Excluir</span>
        <span className="flex items-center gap-1"><X className="w-3.5 h-3.5 text-muted-foreground/40" /> Sem acesso</span>
        <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5 text-primary" /> Formulário disponível</span>
      </div>

      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/70">
              <th className="text-left p-3 font-semibold text-foreground min-w-[280px] sticky left-0 bg-muted/70 z-10">
                Ação / Evento
              </th>
              <th className="p-2 text-center font-medium text-foreground min-w-[180px]">
                <span className="text-xs">Programas</span>
              </th>
              <th className="p-2 text-center font-medium text-foreground min-w-[90px]">
                <span className="text-xs">Formulário</span>
              </th>
              {MAIN_ROLES.map(role => (
                <th key={role} className="p-2 text-center font-medium text-foreground min-w-[110px]">
                  <span className="text-xs leading-tight block">{ROLE_LABELS[role]}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleAcaoTipos.map((tipo, idx) => {
              const info = ACAO_TYPE_INFO[tipo];
              const Icon = info.icon;
              const perms = ACAO_PERMISSION_MATRIX[tipo];
              const formType = getFormTypeForAcao(tipo);
              return (
                <tr key={tipo} className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                  <td className={`p-3 font-medium text-foreground sticky left-0 z-10 ${idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}>
                    <span className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-primary shrink-0" />
                      <span className="truncate">{info.label}</span>
                    </span>
                  </td>
                  <td className="p-2 text-center">
                    {(() => {
                      const setting = formConfigSettings.find(fcs => fcs.form_key === tipo);
                      if (!setting || !setting.programas?.length) {
                        return <span className="text-muted-foreground/40 text-xs">—</span>;
                      }
                      return (
                        <div className="flex flex-wrap gap-1 justify-center">
                          {(setting.programas as string[]).map(p => (
                            <Badge
                              key={p}
                              variant="outline"
                              className={`text-[10px] px-1.5 py-0 ${programaBadgeColors[p] || ''}`}
                            >
                              {programaLabels[p] || p}
                            </Badge>
                          ))}
                        </div>
                      );
                    })()}
                  </td>
                  <td className="p-2 text-center">
                    {formType ? (
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs gap-1"
                          onClick={() => setPreviewFormType(formType)}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Visualizar
                        </Button>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              disabled={printingType === formType}
                              onClick={() => handlePrintBlankForm(formType, getFormLabel(formType))}
                            >
                              {printingType === formType ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Printer className="w-3.5 h-3.5" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Imprimir em branco (PDF)</TooltipContent>
                        </Tooltip>
                      </div>
                    ) : (
                      <span className="text-muted-foreground/40 text-xs">—</span>
                    )}
                  </td>
                  {MAIN_ROLES.map(role => (
                    <td key={role} className="p-2 text-center">
                      <PermissionCell perm={perms[role]} />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Form Preview Dialog */}
      <Dialog open={!!previewFormType} onOpenChange={(open) => !open && setPreviewFormType(null)}>
        <DialogContent className="max-w-3xl w-[95vw] h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {previewFormType && getFormLabel(previewFormType)}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 min-h-0 pr-4">
            {previewFormType && (
              DEDICATED_FORM_TYPES.has(previewFormType) ? (
                <ConsultoriaPedagogicaForm
                  registroAcaoId=""
                  escolaId=""
                  aapId=""
                  escolaVoar={false}
                  onSuccess={() => {}}
                  readOnly
                />
              ) : REDES_FORM_TYPES.has(previewFormType) ? (
                <RedesFormPreview formType={previewFormType} />
              ) : (
                <InstrumentForm
                  formType={previewFormType}
                  responses={{}}
                  onResponseChange={() => {}}
                  readOnly
                />
              )
            )}
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewFormType(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
