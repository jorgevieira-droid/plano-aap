import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import ConsultoriaPedagogicaFormLegacy from './ConsultoriaPedagogicaFormLegacy';
import { FormacaoCoordenadorContent } from './OlharParceiroContents';

export interface ConsultoriaPedagogicaFormProps {
  registroAcaoId: string;
  escolaId: string;
  aapId: string;
  escolaVoar?: boolean;
  onSuccess?: () => void;
  readOnly?: boolean;
}

const FORM_TYPE = 'registro_consultoria_pedagogica';

export default function ConsultoriaPedagogicaForm({
  registroAcaoId,
  escolaId,
  aapId,
  escolaVoar,
  onSuccess,
  readOnly = false,
}: ConsultoriaPedagogicaFormProps) {
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [isLegacy, setIsLegacy] = useState(false);
  const [loading, setLoading] = useState(!!registroAcaoId);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!registroAcaoId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const [{ data: novo }, { data: legado }] = await Promise.all([
        (supabase as any)
          .from('instrument_responses')
          .select('responses')
          .eq('registro_acao_id', registroAcaoId)
          .eq('form_type', FORM_TYPE)
          .maybeSingle(),
        (supabase as any)
          .from('consultoria_pedagogica_respostas')
          .select('id')
          .eq('registro_acao_id', registroAcaoId)
          .limit(1)
          .maybeSingle(),
      ]);
      if (cancelled) return;
      if (novo?.responses) setResponses(novo.responses as Record<string, any>);
      setIsLegacy(!novo && !!legado);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [registroAcaoId]);

  const handleChange = (key: string, value: any) =>
    setResponses((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!registroAcaoId || !escolaId || !aapId) return;

    setSaving(true);
    try {
      const { data: existing } = await (supabase as any)
        .from('instrument_responses')
        .select('id')
        .eq('registro_acao_id', registroAcaoId)
        .eq('form_type', FORM_TYPE)
        .maybeSingle();

      if (existing) {
        const { error } = await (supabase as any)
          .from('instrument_responses')
          .update({ responses })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from('instrument_responses').insert({
          registro_acao_id: registroAcaoId,
          form_type: FORM_TYPE,
          escola_id: escolaId,
          aap_id: aapId,
          responses,
        });
        if (error) throw error;
      }
      toast.success('Registro de Formação do Coordenador salvo com sucesso!');
      onSuccess?.();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Erro ao salvar formulário.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isLegacy) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
          Este registro foi preenchido no modelo anterior do instrumento e é exibido apenas para
          consulta.
        </div>
        <ConsultoriaPedagogicaFormLegacy
          registroAcaoId={registroAcaoId}
          escolaId={escolaId}
          aapId={aapId}
          escolaVoar={escolaVoar}
          readOnly
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FormacaoCoordenadorContent
        responses={responses}
        onChange={handleChange}
        readOnly={readOnly}
      />
      {!readOnly && registroAcaoId && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Registro
          </Button>
        </div>
      )}
    </div>
  );
}
