import { useState } from 'react';
import { useFormFieldConfigAdmin, OBSERVACAO_AULA_FIELDS } from '@/hooks/useFormFieldConfig';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Settings2, Save, Eye, Loader2, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { AppRole } from '@/contexts/AuthContext';

const CONFIGURABLE_ROLES: { role: AppRole; label: string; short: string }[] = [
  { role: 'admin', label: 'Administrador', short: 'N1' },
  { role: 'gestor', label: 'Gestor', short: 'N2' },
  { role: 'n3_coordenador_programa', label: 'Coord. Programa', short: 'N3' },
  { role: 'n4_1_cped', label: 'CPed', short: 'N4.1' },
  { role: 'n4_2_gpi', label: 'GPI', short: 'N4.2' },
  { role: 'n5_formador', label: 'Formador', short: 'N5' },
  { role: 'n6_coord_pedagogico', label: 'Coord. Pedagógico', short: 'N6' },
  { role: 'n7_professor', label: 'Professor', short: 'N7' },
  { role: 'n8_equipe_tecnica', label: 'Equipe Técnica', short: 'N8' },
];

export default function FormFieldConfigPage() {
  const { configByRole, isLoading, updateConfig, isUpdating } = useFormFieldConfigAdmin('observacao_aula');
  const [pendingChanges, setPendingChanges] = useState<Record<string, { enabled: boolean; required: boolean }>>({});
  const [previewRole, setPreviewRole] = useState<string>('');

  const getKey = (fieldKey: string, role: string) => `${fieldKey}::${role}`;

  const getFieldState = (fieldKey: string, role: string) => {
    const key = getKey(fieldKey, role);
    if (pendingChanges[key]) return pendingChanges[key];
    return configByRole[role]?.[fieldKey] ?? { enabled: true, required: false };
  };

  const toggleEnabled = (fieldKey: string, role: string) => {
    const current = getFieldState(fieldKey, role);
    const next = { ...current, enabled: !current.enabled };
    if (!next.enabled) next.required = false;
    setPendingChanges(prev => ({ ...prev, [getKey(fieldKey, role)]: next }));
  };

  const toggleRequired = (fieldKey: string, role: string) => {
    const current = getFieldState(fieldKey, role);
    if (!current.enabled) return;
    setPendingChanges(prev => ({ ...prev, [getKey(fieldKey, role)]: { ...current, required: !current.required } }));
  };

  const handleSave = async () => {
    const updates = Object.entries(pendingChanges).map(([key, val]) => {
      const [field_key, role] = key.split('::');
      return { field_key, role, enabled: val.enabled, required: val.required };
    });
    if (updates.length === 0) {
      toast.info('Nenhuma alteração para salvar');
      return;
    }
    try {
      await updateConfig(updates);
      setPendingChanges({});
      toast.success(`${updates.length} configuração(ões) salva(s)`);
    } catch (e) {
      toast.error('Erro ao salvar configurações');
    }
  };

  const hasPending = Object.keys(pendingChanges).length > 0;

  const previewFields = previewRole
    ? OBSERVACAO_AULA_FIELDS.filter(f => getFieldState(f.key, previewRole).enabled)
    : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-header flex items-center gap-2">
            <Settings2 className="text-primary" size={24} />
            Configurar Formulário – Observação de Aula
          </h1>
          <p className="page-subtitle">Ative ou desative campos por perfil funcional</p>
        </div>
        <Button onClick={handleSave} disabled={!hasPending || isUpdating} className="gap-2">
          {isUpdating ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
          Salvar Alterações {hasPending && `(${Object.keys(pendingChanges).length})`}
        </Button>
      </div>

      {/* Matrix Table */}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-3 font-medium min-w-[200px]">Campo</th>
              {CONFIGURABLE_ROLES.map(r => (
                <th key={r.role} className="text-center p-3 font-medium min-w-[80px]">
                  <div className="flex flex-col items-center gap-1">
                    <Badge variant="outline" className="text-xs">{r.short}</Badge>
                    <span className="text-xs text-muted-foreground hidden lg:block">{r.label}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {OBSERVACAO_AULA_FIELDS.map(field => (
              <tr key={field.key} className="border-b border-border hover:bg-muted/30 transition-colors">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{field.label}</span>
                    <Badge variant="secondary" className="text-xs">{field.type === 'rating' ? '1-5' : 'Texto'}</Badge>
                  </div>
                </td>
                {CONFIGURABLE_ROLES.map(r => {
                  const state = getFieldState(field.key, r.role);
                  const isPending = !!pendingChanges[getKey(field.key, r.role)];
                  return (
                    <td key={r.role} className={`p-3 text-center ${isPending ? 'bg-primary/5' : ''}`}>
                      <div className="flex flex-col items-center gap-1">
                        <Switch
                          checked={state.enabled}
                          onCheckedChange={() => toggleEnabled(field.key, r.role)}
                        />
                        {state.enabled && (
                          <button
                            onClick={() => toggleRequired(field.key, r.role)}
                            className={`text-[10px] px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                              state.required
                                ? 'bg-destructive/15 text-destructive font-medium'
                                : 'bg-muted text-muted-foreground hover:bg-muted-foreground/20'
                            }`}
                          >
                            {state.required ? 'Obrig.' : 'Opcional'}
                          </button>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Preview Section */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Eye className="text-primary" size={20} />
          Preview do Formulário por Perfil
        </h2>
        <Select value={previewRole} onValueChange={setPreviewRole}>
          <SelectTrigger className="w-full sm:w-[300px] mb-4">
            <SelectValue placeholder="Selecione um perfil para visualizar" />
          </SelectTrigger>
          <SelectContent>
            {CONFIGURABLE_ROLES.map(r => (
              <SelectItem key={r.role} value={r.role}>{r.short} - {r.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {previewRole && (
          <div className="border border-border rounded-lg p-4 space-y-3">
            {previewFields.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Nenhum campo habilitado para este perfil</p>
            ) : (
              previewFields.map(f => {
                const state = getFieldState(f.key, previewRole);
                return (
                  <div key={f.key} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2">
                      <Check size={16} className="text-success" />
                      <span className="font-medium">{f.label}</span>
                      <Badge variant="secondary" className="text-xs">{f.type === 'rating' ? 'Rating 1-5' : 'Texto'}</Badge>
                    </div>
                    {state.required && (
                      <Badge variant="destructive" className="text-xs">Obrigatório</Badge>
                    )}
                  </div>
                );
              })
            )}
            <p className="text-xs text-muted-foreground mt-2">
              {previewFields.length} de {OBSERVACAO_AULA_FIELDS.length} campos visíveis
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
