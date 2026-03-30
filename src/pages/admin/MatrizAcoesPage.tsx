import { useState } from 'react';
import { Check, X, Eye, Pencil, Trash2, Plus, FileText } from 'lucide-react';
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

const INSTRUMENT_TYPE_SET = new Set<string>(INSTRUMENT_FORM_TYPES.map(t => t.value));

function getFormTypeForAcao(tipo: AcaoTipo): string | null {
  if (INSTRUMENT_TYPE_SET.has(tipo)) return tipo;
  if (REDES_FORM_TYPES.has(tipo)) return tipo;
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
  const { formConfigSettings } = useAcoesByPrograma();

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
            {ACAO_TIPOS.filter(t => t !== 'participa_formacoes').map((tipo, idx) => {
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
                    {formType ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs gap-1"
                        onClick={() => setPreviewFormType(formType)}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Visualizar
                      </Button>
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
              REDES_FORM_TYPES.has(previewFormType) ? (
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
