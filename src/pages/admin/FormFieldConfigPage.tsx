import { useState, useEffect, useMemo } from 'react';
import { useFormFieldConfigAdmin } from '@/hooks/useFormFieldConfig';
import { useInstrumentFields, INSTRUMENT_FORM_TYPES } from '@/hooks/useInstrumentFields';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Settings2, Save, Eye, Loader2, Check } from 'lucide-react';
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
  const queryClient = useQueryClient();
  const [selectedFormType, setSelectedFormType] = useState<string>('observacao_aula');
  const { configByRole, isLoading: isConfigLoading, updateConfig, isUpdating } = useFormFieldConfigAdmin(selectedFormType);
  const { fields: instrumentFields, isLoading: isFieldsLoading } = useInstrumentFields(selectedFormType);
  const [pendingChanges, setPendingChanges] = useState<Record<string, { enabled: boolean; required: boolean }>>({});
  const [previewRole, setPreviewRole] = useState<string>('');
  const [minOptional, setMinOptional] = useState<number>(3);

  // Reset pending changes when form type changes
  useEffect(() => {
    setPendingChanges({});
    setPreviewRole('');
  }, [selectedFormType]);

  // Dynamic field list from instrument_fields table
  const fieldList = useMemo(() => {
    return instrumentFields.map(f => ({
      key: f.field_key,
      label: f.label,
      type: f.field_type,
      scaleRange: f.field_type === 'rating' ? `${f.scale_min ?? 1}-${f.scale_max ?? 4}` : null,
      dimension: f.dimension,
      isRequired: f.is_required,
    }));
  }, [instrumentFields]);

  // Fetch min_optional_questions setting
  const { data: settingsData } = useQuery({
    queryKey: ['form_config_settings_admin', selectedFormType],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('form_config_settings')
        .select('*')
        .eq('form_key', selectedFormType)
        .single();
      if (error) return null;
      return data as { form_key: string; min_optional_questions: number } | null;
    },
  });

  useEffect(() => {
    if (settingsData) {
      setMinOptional(settingsData.min_optional_questions);
    } else {
      setMinOptional(3);
    }
  }, [settingsData]);

  const saveSettingsMutation = useMutation({
    mutationFn: async (minOpt: number) => {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await (supabase as any)
        .from('form_config_settings')
        .upsert({
          form_key: selectedFormType,
          min_optional_questions: minOpt,
          updated_at: new Date().toISOString(),
          updated_by: userData.user?.id,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form_config_settings'] });
      queryClient.invalidateQueries({ queryKey: ['form_config_settings_admin'] });
    },
  });

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
    
    const hasFieldChanges = updates.length > 0;
    const hasSettingsChange = settingsData?.min_optional_questions !== minOptional;
    
    if (!hasFieldChanges && !hasSettingsChange) {
      toast.info('Nenhuma alteração para salvar');
      return;
    }
    try {
      if (hasFieldChanges) {
        await updateConfig(updates);
        setPendingChanges({});
      }
      if (hasSettingsChange) {
        await saveSettingsMutation.mutateAsync(minOptional);
      }
      toast.success('Configurações salvas com sucesso');
    } catch (e) {
      toast.error('Erro ao salvar configurações');
    }
  };

  const hasPending = Object.keys(pendingChanges).length > 0 || settingsData?.min_optional_questions !== minOptional;

  const previewFields = previewRole
    ? fieldList.filter(f => getFieldState(f.key, previewRole).enabled)
    : [];

  const isLoading = isConfigLoading || isFieldsLoading;

  const selectedFormLabel = INSTRUMENT_FORM_TYPES.find(t => t.value === selectedFormType)?.label || selectedFormType;

  // Show min optional only for observacao_aula
  const showMinOptional = selectedFormType === 'observacao_aula';

  // Group fields by dimension for display
  const fieldsByDimension = useMemo(() => {
    const groups: { dimension: string | null; fields: typeof fieldList }[] = [];
    const dimOrder: string[] = [];
    const dimMap: Record<string, typeof fieldList> = {};

    for (const f of fieldList) {
      const dim = f.dimension || '__none__';
      if (!dimMap[dim]) {
        dimMap[dim] = [];
        dimOrder.push(dim);
      }
      dimMap[dim].push(f);
    }

    for (const dim of dimOrder) {
      groups.push({ dimension: dim === '__none__' ? null : dim, fields: dimMap[dim] });
    }
    return groups;
  }, [fieldList]);

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
            Configurar Formulários
          </h1>
          <p className="page-subtitle">Ative ou desative campos por perfil funcional para cada instrumento pedagógico</p>
        </div>
        <Button onClick={handleSave} disabled={!hasPending || isUpdating || saveSettingsMutation.isPending} className="gap-2">
          {(isUpdating || saveSettingsMutation.isPending) ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
          Salvar Alterações
        </Button>
      </div>

      {/* Form Type Selector */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <label className="text-sm font-medium whitespace-nowrap">Instrumento:</label>
          <Select value={selectedFormType} onValueChange={setSelectedFormType}>
            <SelectTrigger className="w-full sm:w-[400px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INSTRUMENT_FORM_TYPES.map(t => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge variant="outline" className="text-xs whitespace-nowrap">
            {fieldList.length} campos
          </Badge>
        </div>
      </div>

      {/* Min Optional Questions Config (only for observacao_aula) */}
      {showMinOptional && (
        <div className="card p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <label className="text-sm font-medium whitespace-nowrap">
              Mínimo de questões opcionais na pré-seleção:
            </label>
            <Input
              type="number"
              min={0}
              max={10}
              value={minOptional}
              onChange={(e) => setMinOptional(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-20"
            />
            <span className="text-xs text-muted-foreground">
              O respondente deve selecionar pelo menos este número de questões opcionais antes de iniciar o acompanhamento.
            </span>
          </div>
        </div>
      )}

      {/* Matrix Table */}
      {fieldList.length === 0 ? (
        <div className="card p-8 text-center text-muted-foreground">
          Nenhum campo cadastrado para este instrumento.
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 font-medium min-w-[250px]">Campo</th>
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
              {fieldsByDimension.map(group => (
                <>
                  {group.dimension && (
                    <tr key={`dim-${group.dimension}`}>
                      <td colSpan={CONFIGURABLE_ROLES.length + 1} className="p-3 bg-muted/50 font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                        {group.dimension}
                      </td>
                    </tr>
                  )}
                  {group.fields.map(field => (
                    <tr key={field.key} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{field.label}</span>
                          <Badge variant="secondary" className="text-[10px]">
                            {field.type === 'rating' ? field.scaleRange : field.type === 'text' ? 'Texto' : field.type}
                          </Badge>
                          {field.isRequired && (
                            <Badge variant="destructive" className="text-[10px]">Obrig.</Badge>
                          )}
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
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Preview Section */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Eye className="text-primary" size={20} />
          Preview – {selectedFormLabel}
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
                      <Badge variant="secondary" className="text-xs">
                        {f.type === 'rating' ? `Rating ${f.scaleRange}` : 'Texto'}
                      </Badge>
                    </div>
                    {state.required && (
                      <Badge variant="destructive" className="text-xs">Obrigatório</Badge>
                    )}
                  </div>
                );
              })
            )}
            <p className="text-xs text-muted-foreground mt-2">
              {previewFields.length} de {fieldList.length} campos visíveis
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
