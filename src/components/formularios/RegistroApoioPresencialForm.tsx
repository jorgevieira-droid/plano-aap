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

    const preenchido = (v: any) => v !== null && v !== undefined && String(v).trim() !== '';

    const obrigatorios: { ok: boolean; msg: string }[] = [
      { ok: preenchido(responses.turma_voar), msg: 'Informe se é Turma do VOAR.' },
      {
        ok: responses.alunos_presentes !== null && responses.alunos_presentes !== undefined && responses.alunos_presentes !== '',
        msg: 'Informe a quantidade de alunos presentes.',
      },
      {
        ok: preenchido(responses.diferenca_horario),
        msg: 'Informe a diferença entre o horário previsto e o real de início da aula.',
      },
      {
        ok: Array.isArray(responses.outros_observadores) && responses.outros_observadores.length > 0,
        msg: 'Selecione ao menos um item em "Outros observadores".',
      },
      { ok: preenchido(responses.devolutiva_realizada), msg: 'Informe se a devolutiva foi realizada.' },
      {
        ok: responses.devolutiva_realizada !== 'Sim' || preenchido(responses.data_devolutiva),
        msg: 'Informe a data da devolutiva.',
      },
      {
        ok: responses.devolutiva_realizada !== 'Sim' || preenchido(responses.dobradinha),
        msg: 'Informe se houve dobradinha.',
      },
      {
        ok: responses.devolutiva_realizada !== 'Não' || preenchido(responses.motivo_nao_devolutiva),
        msg: 'Informe o motivo da não realização da devolutiva.',
      },
      {
        ok: preenchido(responses.evidencias_observacao),
        msg: 'Registre as evidências da observação de aula.',
      },
      {
        ok: preenchido(responses.devolutiva_temas ?? responses.foco_escolhido_professor),
        msg: 'Informe os temas abordados na devolutiva.',
      },
      {
        ok: preenchido(responses.devolutiva_encaminhamentos ?? responses.encaminhamentos_professor),
        msg: 'Informe os encaminhamentos combinados com o Professor.',
      },
      {
        ok: preenchido(responses.devolutiva_participacao ?? responses.subsidios_compartilhados),
        msg: 'Informe a participação e engajamento do Professor na devolutiva.',
      },
      {
        ok: preenchido(responses.observou_praticas),
        msg: 'Informe se você observou práticas essenciais.',
      },
    ];

    const pendencia = obrigatorios.find((o) => !o.ok);
    if (pendencia) {
      toast.error(pendencia.msg);
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

      toast.success('Apoio Presencial salvo com sucesso!');
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
            <div><span className="text-muted-foreground">Observação e devolutiva combinadas previamente com o professor: </span><span className="font-medium">{cadastro.obsPlanejada == null ? '—' : cadastro.obsPlanejada ? 'Sim' : 'Não'}</span></div>
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
