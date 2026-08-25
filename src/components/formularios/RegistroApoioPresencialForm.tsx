import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import RegistroApoioPresencialContent from './RegistroApoioPresencialContent';

export interface ApoioCadastroData {
  componente?: string | null;
  etapa?: string | null;
  segmento?: string | null;
  anoSerie?: string | null;
  turma?: string | null;
  turmaVoar?: string | null;
  escolaVoar?: boolean | null;
  professorId?: string | null;
  professorNome?: string | null;
  participantes?: string[] | null;
  participantesOutros?: string | null;
  obsPlanejada?: boolean | null;
  focos?: string[] | null;
  devolutiva?: string | null;
}

export interface RegistroApoioPresencialFormProps {
  registroAcaoId: string;
  escolaId: string;
  aapId: string;
  cadastro?: ApoioCadastroData;
  onSuccess?: () => void;
  readOnly?: boolean;
}

const FORM_TYPE = 'registro_apoio_presencial';

export default function RegistroApoioPresencialForm({
  registroAcaoId,
  escolaId,
  aapId,
  cadastro,
  onSuccess,
  readOnly = false,
}: RegistroApoioPresencialFormProps) {
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!registroAcaoId) return;
    (supabase as any)
      .from('instrument_responses')
      .select('responses')
      .eq('registro_acao_id', registroAcaoId)
      .eq('form_type', FORM_TYPE)
      .maybeSingle()
      .then(({ data }: any) => {
        if (data?.responses) setResponses(data.responses as Record<string, any>);
      });
  }, [registroAcaoId]);

  const handleChange = (key: string, value: any) =>
    setResponses((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!registroAcaoId || !escolaId || !aapId) return;

    if (!responses.evidencias_observacao || String(responses.evidencias_observacao).trim() === '') {

      toast.error('Registre as evidências da observação de aula.');
      return;
    }
    if (!responses.rubrica_1_key || responses.rubrica_1_nota === undefined || responses.rubrica_1_nota === null) {
      toast.error('Selecione e pontue a rubrica de observação.');
      return;
    }

    setSaving(true);
    try {
      const fullResponses = {
        ...responses,
        _componente: cadastro?.componente ?? null,
        _segmento: cadastro?.segmento ?? cadastro?.etapa ?? null,
        _ano_serie: cadastro?.anoSerie ?? null,
        _turma: cadastro?.turma ?? null,
        _professor_nome: cadastro?.professorNome ?? null,
        _obs_planejada: cadastro?.obsPlanejada ?? null,
      };

      const { data: existing } = await (supabase as any)
        .from('instrument_responses')
        .select('id')
        .eq('registro_acao_id', registroAcaoId)
        .eq('form_type', FORM_TYPE)
        .maybeSingle();

      if (existing) {
        const { error } = await (supabase as any)
          .from('instrument_responses')
          .update({
            responses: fullResponses,
            professor_id: cadastro?.professorId || undefined,
          })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from('instrument_responses').insert({
          registro_acao_id: registroAcaoId,
          form_type: FORM_TYPE,
          escola_id: escolaId,
          aap_id: aapId,
          professor_id: cadastro?.professorId || undefined,
          responses: fullResponses,
        });
        if (error) throw error;
      }

      toast.success('Registro de Apoio Presencial salvo com sucesso!');
      onSuccess?.();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Erro ao salvar formulário.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {cadastro && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">1. Dados do Cadastro</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
            <div><span className="text-muted-foreground">Professor: </span><span className="font-medium">{cadastro.professorNome || '—'}</span></div>
            <div><span className="text-muted-foreground">Segmento: </span><span className="font-medium">{cadastro.segmento || cadastro.etapa || '—'}</span></div>
            <div><span className="text-muted-foreground">Componente: </span><span className="font-medium">{cadastro.componente || '—'}</span></div>
            <div><span className="text-muted-foreground">Ano-Série: </span><span className="font-medium">{cadastro.anoSerie || '—'}</span></div>
            <div><span className="text-muted-foreground">Turma: </span><span className="font-medium">{cadastro.turma || '—'}</span></div>
            <div><span className="text-muted-foreground">Observação planejada: </span><span className="font-medium">{cadastro.obsPlanejada == null ? '—' : cadastro.obsPlanejada ? 'Sim' : 'Não'}</span></div>
          </CardContent>
        </Card>
      )}

      <RegistroApoioPresencialContent
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
